import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode; requireAdmin?: boolean }) {
  const { user, profile, loading, profileLoaded, isActive, isAdmin, authError, signOut, refreshAuth } = useAuth();
  const hasSignedOut = useRef(false);
  const location = useLocation();

  // Handle inactive account
  useEffect(() => {
    if (!loading && profileLoaded && user && profile && !isActive && !hasSignedOut.current) {
      hasSignedOut.current = true;
      toast.error("Conta inativa. Contate o administrador.");
      signOut();
    }
  }, [loading, profileLoaded, user, profile, isActive, signOut]);

  // Still loading
  if (loading || (user && !profileLoaded)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // User exists but profile failed to load — show error with retry, don't loop to /login
  if (user && profileLoaded && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-xl font-semibold text-foreground">Erro ao carregar perfil</h2>
          <p className="text-muted-foreground text-sm">
            {authError || "Não foi possível carregar seus dados. Isso pode ser temporário."}
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={refreshAuth} variant="default">Tentar novamente</Button>
            <Button onClick={signOut} variant="outline">Sair</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !isActive) {
    return <Navigate to="/login" replace />;
  }

  // Force password change redirect
  if (profile?.force_password_change && location.pathname !== "/reset-password") {
    return <Navigate to="/reset-password" state={{ forceChange: true }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
