import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Menu, LayoutDashboard, Users, Upload, Settings, LogOut, Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

interface MobileMenuProps {
  onImport?: () => void;
}

export function MobileMenu({ onImport }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const go = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  const items = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/", onClick: () => go("/") },
    { label: "Clientes", icon: Users, path: "/clientes", onClick: () => go("/clientes") },
    ...(onImport ? [{ label: "Importar", icon: Upload, path: "", onClick: () => { onImport(); setOpen(false); } }] : []),
    ...(isAdmin ? [{ label: "Configurações", icon: Settings, path: "/configuracoes", onClick: () => go("/configuracoes") }] : []),
  ];

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="p-4 border-b border-border/50">
            <h2 className="font-bold text-lg tracking-tight">Polis Gestão</h2>
            <p className="text-xs text-muted-foreground">Gestão de Contratos</p>
          </div>
          <nav className="p-2 space-y-1">
            {items.map((item) => (
              <button
                key={item.label}
                onClick={item.onClick}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  location.pathname === item.path
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
            <button
              onClick={() => { toggleTheme(); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-muted transition-colors mt-4"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
            </button>
            <button
              onClick={() => { signOut(); setOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
