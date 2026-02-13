import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "default" | "success" | "danger" | "warning" | "info";
  animationDelay?: number;
}

const variantStyles = {
  default: "border-border/50",
  success: "border-success/30",
  danger: "border-danger/30",
  warning: "border-warning/30",
  info: "border-info/30",
};

const iconBgStyles = {
  default: "bg-muted",
  success: "bg-success/15",
  danger: "bg-danger/15",
  warning: "bg-warning/15",
  info: "bg-info/15",
};

const iconColorStyles = {
  default: "text-foreground",
  success: "text-success",
  danger: "text-danger",
  warning: "text-warning",
  info: "text-info",
};

export function KPICard({ title, value, subtitle, icon: Icon, variant = "default", animationDelay = 0 }: KPICardProps) {
  return (
    <div
      className={`glass-card rounded-xl p-5 ${variantStyles[variant]} animate-fade-in`}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1 min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight mono">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={`rounded-lg p-2.5 ${iconBgStyles[variant]} shrink-0 ml-3`}>
          <Icon className={`h-5 w-5 ${iconColorStyles[variant]}`} />
        </div>
      </div>
    </div>
  );
}
