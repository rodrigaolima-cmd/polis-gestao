import { useState, useEffect, useCallback, useRef } from "react";
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
  const processingRef = useRef(false);

  const applySession = useCallback(async (session: Session | null) => {
    // Prevent concurrent processing
    if (processingRef.current) return;
    processingRef.current = true;

    const currentUser = session?.user ?? null;
    setUser(currentUser);

    if (!currentUser) {
      setProfile(null);
      setRole(null);
      setProfileLoaded(true);
      setLoading(false);
      processingRef.current = false;
      return;
    }

    try {
      const [profileResult, roleResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, is_active")
          .eq("id", currentUser.id)
          .single(),
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", currentUser.id)
          .maybeSingle(),
      ]);

      if (profileResult.error) {
        console.error("Error fetching profile:", profileResult.error.message);
        setProfile(null);
      } else {
        setProfile(profileResult.data);
      }

      if (roleResult.error) {
        console.error("Error fetching role:", roleResult.error.message);
        setRole(null);
      } else {
        setRole(roleResult.data?.role ?? null);
      }
    } catch (e) {
      console.error("Exception in applySession:", e);
      setProfile(null);
      setRole(null);
    } finally {
      setProfileLoaded(true);
      setLoading(false);
      processingRef.current = false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // 1. Register listener FIRST (non-async callback to avoid deadlock)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        // Delegate async work outside the synchronous callback
        setTimeout(() => {
          if (mounted) applySession(session);
        }, 0);
      }
    );

    // 2. Then bootstrap with getSession
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (mounted) applySession(session);
      })
      .catch((err) => {
        console.error("getSession failed:", err);
        if (mounted) {
          setLoading(false);
          setProfileLoaded(true);
        }
      });

    // 3. Safety net timeout (only as last resort)
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn("Auth safety timeout reached");
        setLoading(false);
        setProfileLoaded(true);
      }
    }, 15000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [applySession]);

  const signOut = useCallback(async () => {
    processingRef.current = false;
    setProfile(null);
    setRole(null);
    setProfileLoaded(false);
    await supabase.auth.signOut();
  }, []);

  const isAdmin = role === "admin";
  const isActive = profile?.is_active ?? false;

  return { user, profile, loading, profileLoaded, signOut, isAdmin, isActive, role };
}
