import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  full_name: string;
  is_active: boolean;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  role: string | null;
  loading: boolean;
  profileLoaded: boolean;
  isAdmin: boolean;
  isActive: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoaded, setProfileLoaded] = useState(false);
  
  // "Last write wins" pattern — avoids stale concurrent fetches
  const requestIdRef = useRef(0);

  const fetchUserData = useCallback(async (currentUser: User | null) => {
    const thisRequest = ++requestIdRef.current;

    if (!currentUser) {
      // Only apply if still the latest request
      if (thisRequest === requestIdRef.current) {
        setUser(null);
        setProfile(null);
        setRole(null);
        setProfileLoaded(true);
        setLoading(false);
      }
      return;
    }

    setUser(currentUser);

    try {
      const [profileResult, roleResult] = await Promise.allSettled([
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

      // Abort if a newer request has been issued
      if (thisRequest !== requestIdRef.current) return;

      if (profileResult.status === "fulfilled" && !profileResult.value.error) {
        setProfile(profileResult.value.data);
      } else {
        console.error("Profile fetch failed:", profileResult.status === "fulfilled" ? profileResult.value.error?.message : profileResult.reason);
        setProfile(null);
      }

      if (roleResult.status === "fulfilled" && !roleResult.value.error) {
        setRole(roleResult.value.data?.role ?? null);
      } else {
        console.error("Role fetch failed:", roleResult.status === "fulfilled" ? roleResult.value.error?.message : roleResult.reason);
        setRole(null);
      }
    } catch (e) {
      if (thisRequest !== requestIdRef.current) return;
      console.error("Exception fetching user data:", e);
      setProfile(null);
      setRole(null);
    } finally {
      if (thisRequest === requestIdRef.current) {
        setProfileLoaded(true);
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // 1. Register listener FIRST (sync callback, delegate async work)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        // Delegate to avoid Supabase internal deadlock
        setTimeout(() => {
          if (mounted) fetchUserData(session?.user ?? null);
        }, 0);
      }
    );

    // 2. Bootstrap with getSession
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (mounted) fetchUserData(session?.user ?? null);
      })
      .catch((err) => {
        console.error("getSession failed:", err);
        if (mounted) {
          setLoading(false);
          setProfileLoaded(true);
        }
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  const handleSignOut = useCallback(async () => {
    requestIdRef.current++; // Invalidate any in-flight fetches
    setUser(null);
    setProfile(null);
    setRole(null);
    setProfileLoaded(false);
    await supabase.auth.signOut();
  }, []);

  const isAdmin = role === "admin";
  const isActive = profile?.is_active ?? false;

  return (
    <AuthContext.Provider
      value={{ user, profile, role, loading, profileLoaded, isAdmin, isActive, signOut: handleSignOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}
