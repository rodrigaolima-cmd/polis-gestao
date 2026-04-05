import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Shield } from "lucide-react";
import { MobileMenu } from "@/components/MobileMenu";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  headerActions?: ReactNode;
  onImport?: () => void;
}

export function AppLayout({ children, title, subtitle, headerActions, onImport }: AppLayoutProps) {
  const { profile, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Top header bar */}
          <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
            <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                {/* Mobile menu */}
                <MobileMenu onImport={onImport} />
                {/* Desktop sidebar trigger */}
                <SidebarTrigger className="hidden md:flex h-8 w-8" />
                <div className="min-w-0">
                  {title && (
                    <h1 className="text-base sm:text-lg font-bold tracking-tight truncate">{title}</h1>
                  )}
                  {subtitle && (
                    <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {headerActions}

                <Button variant="outline" size="icon" className="h-8 w-8 sm:h-auto sm:w-auto sm:gap-1.5 sm:text-xs sm:px-3 sm:py-1.5" onClick={toggleTheme}>
                  {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                  <span className="hidden lg:inline">{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
                </Button>

                {profile?.full_name && (
                  <div className="hidden md:flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {profile.full_name}
                    </span>
                    {isAdmin && (
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        <Shield className="h-2.5 w-2.5" /> Admin
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
