import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  full_name: string;
  is_active: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const applySession = useCallback(async (session: Session | null, isInitial: boolean) => {
    const currentUser = session?.user ?? null;
    setUser(currentUser);

    if (!currentUser) {
      setProfile(null);
      setRole(null);
      setProfileLoaded(true);
      if (isInitial) setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, is_active")
        .eq("id", currentUser.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error.message);
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (e) {
      console.error("Exception fetching profile:", e);
      setProfile(null);
    }

    try {
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (roleError) {
        console.error("Error fetching role:", roleError.message);
        setRole(null);
      } else {
        setRole(roleData?.role ?? null);
      }
    } catch (e) {
      console.error("Exception fetching role:", e);
      setRole(null);
    }

    setProfileLoaded(true);
    if (isInitial) setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;

    // 1. Bootstrap with getSession
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        applySession(session, true);
      }
    });

    // 2. Listen for changes with NON-ASYNC callback to avoid deadlock
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // Delegate async work outside the callback
        setTimeout(() => {
          if (mounted) {
            applySession(session, false);
          }
        }, 0);
      }
    );

    // 3. Safety timeout (10s)
    const timeout = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 10000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [applySession]);

  const signOut = useCallback(async () => {
    setProfileLoaded(false);
    await supabase.auth.signOut();
  }, []);

  const isAdmin = role === "admin";
  const isActive = profile?.is_active ?? false;

  return { user, profile, loading, profileLoaded, signOut, isAdmin, isActive, role };
}
