import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

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
  const initialized = useRef(false);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, is_active")
        .eq("id", userId)
        .single();
      setProfile(data);
    } catch (e) {
      console.error("Error fetching profile:", e);
      setProfile(null);
    }

    try {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();
      setRole(roleData?.role ?? null);
    } catch (e) {
      console.error("Error fetching role:", e);
      setRole(null);
    }

    setProfileLoaded(true);
  }, []);

  useEffect(() => {
    // 1. Registrar listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (initialized.current) {
          setUser(session?.user ?? null);
          if (session?.user) {
            await fetchProfile(session.user.id);
          } else {
            setProfile(null);
            setRole(null);
            setProfileLoaded(true);
          }
          return;
        }
        initialized.current = true;
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setRole(null);
          setProfileLoaded(true);
        }
        setLoading(false);
      }
    );

    // 2. Fallback: getSession() caso onAuthStateChange não dispare
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!initialized.current) {
        initialized.current = true;
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setRole(null);
          setProfileLoaded(true);
        }
        setLoading(false);
      }
    });

    // 3. Timeout de segurança absoluto (5s)
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const isAdmin = role === "admin";
  const isActive = profile?.is_active ?? false;

  return { user, profile, loading, signOut, isAdmin, isActive, role };
}
