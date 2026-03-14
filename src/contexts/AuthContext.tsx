import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

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
  authError: string | null;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

async function fetchProfileWithRetry(userId: string, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, is_active")
      .eq("id", userId)
      .single();
    if (!error && data) return { data, error: null };
    if (i < retries) await new Promise(r => setTimeout(r, 500 * (i + 1)));
  }
  return { data: null, error: "Profile fetch failed after retries" };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const requestIdRef = useRef(0);

  const applyAuthSession = useCallback(async (currentUser: User | null) => {
    const thisRequest = ++requestIdRef.current;
    setAuthError(null);

    if (!currentUser) {
      if (thisRequest === requestIdRef.current) {
        setUser(null);
        setProfile(null);
        setRole(null);
        setProfileLoaded(true);
        setLoading(false);
      }
      return;
    }

    // Set user immediately, mark loading
    setUser(currentUser);
    setLoading(true);
    setProfileLoaded(false);

    try {
      const [profileResult, roleResult] = await Promise.allSettled([
        fetchProfileWithRetry(currentUser.id),
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", currentUser.id)
          .maybeSingle(),
      ]);

      if (thisRequest !== requestIdRef.current) return;

      let profileData: Profile | null = null;
      let roleData: string | null = null;
      let error: string | null = null;

      if (profileResult.status === "fulfilled" && profileResult.value.data) {
        profileData = profileResult.value.data as Profile;
      } else {
        const reason = profileResult.status === "fulfilled"
          ? profileResult.value.error
          : String(profileResult.reason);
        console.error("Profile fetch failed:", reason);
        error = "Não foi possível carregar o perfil. Tente novamente.";
      }

      if (roleResult.status === "fulfilled" && !roleResult.value.error) {
        roleData = roleResult.value.data?.role ?? null;
      } else {
        console.error("Role fetch failed:", roleResult.status === "fulfilled" ? roleResult.value.error?.message : roleResult.reason);
      }

      setProfile(profileData);
      setRole(roleData);
      setAuthError(error);
    } catch (e) {
      if (thisRequest !== requestIdRef.current) return;
      console.error("Exception fetching user data:", e);
      setProfile(null);
      setRole(null);
      setAuthError("Erro ao carregar dados do usuário.");
    } finally {
      if (thisRequest === requestIdRef.current) {
        setProfileLoaded(true);
        setLoading(false);
      }
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    await applyAuthSession(session?.user ?? null);
  }, [applyAuthSession]);

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        setTimeout(() => {
          if (mounted) applyAuthSession(session?.user ?? null);
        }, 0);
      }
    );

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (mounted) applyAuthSession(session?.user ?? null);
      })
      .catch((err) => {
        console.error("getSession failed:", err);
        if (mounted) {
          setLoading(false);
          setProfileLoaded(true);
          setAuthError("Falha ao inicializar sessão.");
        }
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [applyAuthSession]);

  const handleSignOut = useCallback(async () => {
    requestIdRef.current++;
    setUser(null);
    setProfile(null);
    setRole(null);
    setProfileLoaded(false);
    setAuthError(null);
    await supabase.auth.signOut();
  }, []);

  const isAdmin = role === "admin";
  const isActive = profile?.is_active ?? false;

  return (
    <AuthContext.Provider
      value={{ user, profile, role, loading, profileLoaded, isAdmin, isActive, authError, signOut: handleSignOut, refreshAuth }}
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
