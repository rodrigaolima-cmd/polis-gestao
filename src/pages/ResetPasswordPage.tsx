import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, refreshAuth } = useAuth();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  const isForceChange = (location.state as any)?.forceChange === true;

  useEffect(() => {
    if (isForceChange) {
      setIsRecovery(true);
      return;
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "PASSWORD_RECOVERY") {
          setIsRecovery(true);
        }
      }
    );

    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    return () => subscription.unsubscribe();
  }, [isForceChange]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }

    // Clear force_password_change flag if applicable
    if (isForceChange && user) {
      await supabase.from("profiles").update({ force_password_change: false }).eq("id", user.id);
      await refreshAuth();
    }

    setLoading(false);
    toast.success("Senha redefinida com sucesso!");
    navigate("/", { replace: true });
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md border-border/50 bg-card/80 backdrop-blur-xl">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Link inválido ou expirado.</p>
            <Button className="mt-4" onClick={() => navigate("/login")}>
              Ir para login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-border/50 bg-card/80 backdrop-blur-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {isForceChange ? "Alterar Senha" : "Redefinir Senha"}
          </CardTitle>
          <CardDescription>
            {isForceChange ? "Você precisa definir uma nova senha para continuar." : "Digite sua nova senha"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input
                id="newPassword"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              <KeyRound className="h-4 w-4" />
              {isForceChange ? "Alterar Senha" : "Redefinir Senha"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
