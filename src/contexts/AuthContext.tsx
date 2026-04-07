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
  const profileRef = useRef<Profile | null>(null);
  const userRef = useRef<User | null>(null);
  const roleRef = useRef<string | null>(null);
  const accessTokenRef = useRef<string | null>(null);
  const manualSignOutRef = useRef(false);

  // Keep refs in sync
  useEffect(() => {
    userRef.current = user;
    profileRef.current = profile;
    roleRef.current = role;
    accessTokenRef.current = accessToken;
  }, [user, profile, role, accessToken]);

  const clearAuthState = useCallback(() => {
    userRef.current = null;
    profileRef.current = null;
    roleRef.current = null;
    accessTokenRef.current = null;
    setUser(null);
    setProfile(null);
    setRole(null);
    setAccessToken(null);
    setProfileLoaded(true);
    setLoading(false);
    setAuthError(null);
  }, []);

  const hydrateUser = useCallback(async (currentUser: User | null, token: string | null, isRefresh = false) => {
    const thisRequest = ++requestIdRef.current;
    console.log("[Auth] hydrateUser requestId:", thisRequest, "user:", currentUser?.id ?? "null", "isRefresh:", isRefresh);
    setAuthError(null);

    if (!currentUser || !token) {
      if (thisRequest === requestIdRef.current) {
        clearAuthState();
      }
      return;
    }

    // If this is a token refresh and we already have profile data, just update token — don't re-fetch
    if (isRefresh && profileRef.current) {
      console.log("[Auth] Token refresh — keeping existing profile, updating token only");
      userRef.current = currentUser;
      accessTokenRef.current = token;
      setUser(currentUser);
      setAccessToken(token);
      return;
    }

    userRef.current = currentUser;
    accessTokenRef.current = token;
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
      manualSignOutRef.current = false;
      profileRef.current = profileData;
      roleRef.current = roleData;
      setProfile(profileData);
      setRole(roleData);
      if (!profileData) {
        setAuthError("Não foi possível carregar o perfil. Tente novamente.");
      }
    } catch (e: any) {
      clearTimeout(timeout);
      if (thisRequest !== requestIdRef.current) return;
      console.error("[Auth] Hydration error:", e?.name === "AbortError" ? "timeout" : e);
      profileRef.current = null;
      roleRef.current = null;
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

        if (
          _event === "SIGNED_OUT" &&
          !manualSignOutRef.current &&
          (userRef.current || profileRef.current || accessTokenRef.current)
        ) {
          console.log("[Auth] Ignoring non-manual SIGNED_OUT while session snapshot exists");
          setLoading(false);
          setProfileLoaded(true);
          setAuthError(null);

          setTimeout(async () => {
            if (!mounted) return;
            const { data: { session: currentSession } } = await supabase.auth.getSession();

            if (!mounted) return;

            if (currentSession?.user && currentSession.access_token) {
              console.log("[Auth] Restoring session after transient SIGNED_OUT");
              void hydrateUser(currentSession.user, currentSession.access_token, true);
              return;
            }

            console.log("[Auth] Preserving current auth snapshot after transient SIGNED_OUT");
            setUser(userRef.current);
            setProfile(profileRef.current);
            setRole(roleRef.current);
            setAccessToken(accessTokenRef.current);
            setLoading(false);
            setProfileLoaded(true);
          }, 0);
          return;
        }

        if (_event === "SIGNED_OUT") {
          manualSignOutRef.current = false;
        }

        const isRefresh = _event === "TOKEN_REFRESHED";
        // Use setTimeout to avoid Supabase internal deadlock
        setTimeout(() => {
          if (mounted) hydrateUser(session?.user ?? null, session?.access_token ?? null, isRefresh);
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

  useEffect(() => {
    const reconcileVisibleSession = () => {
      if (document.visibilityState === "hidden" || !userRef.current || manualSignOutRef.current) {
        return;
      }

      void supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user && session.access_token) {
          void hydrateUser(session.user, session.access_token, true);
        }
      });
    };

    window.addEventListener("focus", reconcileVisibleSession);
    document.addEventListener("visibilitychange", reconcileVisibleSession);

    return () => {
      window.removeEventListener("focus", reconcileVisibleSession);
      document.removeEventListener("visibilitychange", reconcileVisibleSession);
    };
  }, [hydrateUser]);

  const handleSignOut = useCallback(async () => {
    requestIdRef.current++;
    manualSignOutRef.current = true;
    setLoading(true);
    setAuthError(null);
    try {
      await supabase.auth.signOut();
    } finally {
      clearAuthState();
      manualSignOutRef.current = false;
    }
  }, [clearAuthState]);

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
