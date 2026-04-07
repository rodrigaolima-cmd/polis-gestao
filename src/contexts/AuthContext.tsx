import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  full_name: string;
  is_active: boolean;
  force_password_change: boolean;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  role: string | null;
  accessToken: string | null;
  loading: boolean;
  profileLoaded: boolean;
  isAdmin: boolean;
  isActive: boolean;
  authError: string | null;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  hydrateFromSession: (session: Session) => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Direct REST fetch - bypasses supabase client internal locks
async function fetchProfileREST(userId: string, accessToken: string, signal: AbortSignal): Promise<Profile | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=id,full_name,is_active,force_password_change`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: SUPABASE_ANON_KEY,
        Accept: "application/json",
      },
      signal,
    }
  );
  if (!res.ok) {
    console.error("[Auth] REST profile fetch failed:", res.status);
    return null;
  }
  const rows = await res.json();
  return rows?.[0] ?? null;
}

async function fetchRoleREST(userId: string, accessToken: string, signal: AbortSignal): Promise<string | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/user_roles?user_id=eq.${userId}&select=role`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: SUPABASE_ANON_KEY,
        Accept: "application/json",
      },
      signal,
    }
  );
  if (!res.ok) {
    console.error("[Auth] REST role fetch failed:", res.status);
    return null;
  }
  const rows = await res.json();
  return rows?.[0]?.role ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const requestIdRef = useRef(0);

  const hydrateUser = useCallback(async (currentUser: User | null, token: string | null, isRefresh = false) => {
    const thisRequest = ++requestIdRef.current;
    console.log("[Auth] hydrateUser requestId:", thisRequest, "user:", currentUser?.id ?? "null", "isRefresh:", isRefresh);
    setAuthError(null);

    if (!currentUser || !token) {
      if (thisRequest === requestIdRef.current) {
        setUser(null);
        setProfile(null);
        setRole(null);
        setAccessToken(null);
        setProfileLoaded(true);
        setLoading(false);
      }
      return;
    }

    // If this is a token refresh and we already have profile data, just update token — don't re-fetch
    if (isRefresh && profile) {
      console.log("[Auth] Token refresh — keeping existing profile, updating token only");
      setUser(currentUser);
      setAccessToken(token);
      return;
    }

    setUser(currentUser);
    setAccessToken(token);
    setLoading(true);
    setProfileLoaded(false);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    try {
      const [profileData, roleData] = await Promise.all([
        fetchProfileREST(currentUser.id, token, controller.signal),
        fetchRoleREST(currentUser.id, token, controller.signal),
      ]);

      clearTimeout(timeout);

      if (thisRequest !== requestIdRef.current) {
        console.log("[Auth] Stale request", thisRequest);
        return;
      }

      console.log("[Auth] Hydrated - profile:", !!profileData, "role:", roleData, "active:", profileData?.is_active);
      setProfile(profileData);
      setRole(roleData);
      if (!profileData) {
        setAuthError("Não foi possível carregar o perfil. Tente novamente.");
      }
    } catch (e: any) {
      clearTimeout(timeout);
      if (thisRequest !== requestIdRef.current) return;
      console.error("[Auth] Hydration error:", e?.name === "AbortError" ? "timeout" : e);
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

  const hydrateFromSession = useCallback(async (session: Session) => {
    console.log("[Auth] hydrateFromSession called");
    await hydrateUser(session.user, session.access_token);
  }, [hydrateUser]);

  const refreshAuth = useCallback(async () => {
    console.log("[Auth] refreshAuth called");
    const { data: { session } } = await supabase.auth.getSession();
    await hydrateUser(session?.user ?? null, session?.access_token ?? null);
  }, [hydrateUser]);

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        console.log("[Auth] onAuthStateChange event:", _event);
        // Use setTimeout to avoid Supabase internal deadlock
        setTimeout(() => {
          if (mounted) hydrateUser(session?.user ?? null, session?.access_token ?? null);
        }, 0);
      }
    );

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (mounted) hydrateUser(session?.user ?? null, session?.access_token ?? null);
      })
      .catch((err) => {
        console.error("[Auth] getSession failed:", err);
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
  }, [hydrateUser]);

  const handleSignOut = useCallback(async () => {
    requestIdRef.current++;
    setUser(null);
    setProfile(null);
    setRole(null);
    setAccessToken(null);
    setProfileLoaded(false);
    setAuthError(null);
    await supabase.auth.signOut();
  }, []);

  const isAdmin = role === "admin";
  const isActive = profile?.is_active ?? false;

  return (
    <AuthContext.Provider
      value={{ user, profile, role, accessToken, loading, profileLoaded, isAdmin, isActive, authError, signOut: handleSignOut, refreshAuth, hydrateFromSession }}
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
