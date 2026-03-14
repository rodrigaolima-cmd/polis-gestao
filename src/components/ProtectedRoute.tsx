import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { toast } from "sonner";

export function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode; requireAdmin?: boolean }) {
  const { user, profile, loading, profileLoaded, isActive, isAdmin, signOut } = useAuth();

  useEffect(() => {
    if (!loading && profileLoaded && user && profile && !isActive) {
      toast.error("Conta inativa. Contate o administrador.");
      signOut();
    }
  }, [loading, profileLoaded, user, profile, isActive, signOut]);

  useEffect(() => {
    if (!loading && profileLoaded && user && !profile) {
      toast.error("Perfil não encontrado. Contate o administrador.");
      signOut();
    }
  }, [loading, profileLoaded, user, profile, signOut]);

  if (loading || (user && !profileLoaded)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || !isActive) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
