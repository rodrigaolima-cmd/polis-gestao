import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LogIn, KeyRound, Shield, BarChart3, Users } from "lucide-react";
import polisLogo from "@/assets/Logo_Polis_Hub.png";

type Mode = "login" | "forgot";

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, isActive, loading, profileLoaded, hydrateFromSession } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigatedRef = useRef(false);

  useEffect(() => {
    if (!loading && profileLoaded && user && isActive && !navigatedRef.current) {
      navigatedRef.current = true;
      navigate("/", { replace: true });
    }
  }, [loading, profileLoaded, user, isActive, navigate]);

  const handleLogin = async () => {
    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
        return;
      }
      if (data.session) {
        await hydrateFromSession(data.session);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast.error("Informe seu e-mail");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("E-mail de recuperação enviado! Verifique sua caixa de entrada.");
      setMode("login");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") handleLogin();
    else handleForgotPassword();
  };

  const titles: Record<Mode, string> = {
    login: "Entrar",
    forgot: "Recuperar Senha",
  };

  const descriptions: Record<Mode, string> = {
    login: "Acesse o painel de gestão de contratos",
    forgot: "Informe seu e-mail para redefinir a senha",
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — institutional */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0F1D2F] text-white flex-col justify-between p-12">
        <div>
          <img src={polisLogo} alt="Polis Hub" className="h-20 w-auto" />
          <p className="text-white/60 text-sm mt-2">Plataforma Integrada de Gestão Operacional</p>
        </div>

        <div className="space-y-8">
          <p className="text-lg text-white/80 leading-relaxed max-w-md">
            Sistema completo para gestão de contratos, módulos e acompanhamento financeiro da sua organização.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-white/70">
              <div className="rounded-lg bg-white/10 p-2">
                <BarChart3 className="h-5 w-5" />
              </div>
              <span className="text-sm">Dashboard financeiro em tempo real</span>
            </div>
            <div className="flex items-center gap-3 text-white/70">
              <div className="rounded-lg bg-white/10 p-2">
                <Users className="h-5 w-5" />
              </div>
              <span className="text-sm">Gestão completa de clientes e módulos</span>
            </div>
            <div className="flex items-center gap-3 text-white/70">
              <div className="rounded-lg bg-white/10 p-2">
                <Shield className="h-5 w-5" />
              </div>
              <span className="text-sm">Controle de acesso e auditoria</span>
            </div>
          </div>
        </div>

        <div className="text-white/40 text-xs space-y-1">
          <p>© 2026 Polis Gestão. Todos os direitos reservados.</p>
          <p>Pólis Hub v1.0 - Beta | Ambiente: Produção</p>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center bg-background px-6">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile-only branding */}
          <div className="lg:hidden text-center space-y-1">
            <img src={polisLogo} alt="Polis Hub" className="h-12 w-auto mx-auto" />
            <p className="text-muted-foreground text-sm">Plataforma Integrada de Gestão Operacional</p>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">{titles[mode]}</h2>
            <p className="text-muted-foreground text-sm">{descriptions[mode]}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">E-mail corporativo</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="h-11"
              />
            </div>
            {mode === "login" && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="h-11"
                />
              </div>
            )}
            <Button type="submit" className="w-full h-11 gap-2 font-medium" disabled={submitting}>
              {submitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
              ) : mode === "login" ? (
                <LogIn className="h-4 w-4" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}
              {titles[mode]}
            </Button>
          </form>

          <div className="text-center text-sm">
            {mode === "login" ? (
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Esqueci minha senha
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-primary hover:underline font-medium"
              >
                Voltar ao login
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
