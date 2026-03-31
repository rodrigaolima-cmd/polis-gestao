import { LucideIcon } from "lucide-react";
import { LineChart, Line, Area, AreaChart, ResponsiveContainer } from "recharts";

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "default" | "success" | "danger" | "warning" | "info";
  animationDelay?: number;
  onClick?: () => void;
  sparklineData?: number[];
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

const sparklineColors: Record<string, string> = {
  default: "hsl(var(--foreground))",
  success: "hsl(var(--success))",
  danger: "hsl(var(--danger))",
  warning: "hsl(var(--warning))",
  info: "hsl(var(--info))",
};

export function KPICard({ title, value, subtitle, icon: Icon, variant = "default", animationDelay = 0, onClick, sparklineData }: KPICardProps) {
  const chartData = sparklineData?.map((v, i) => ({ v }));
  const color = sparklineColors[variant];

  return (
    <div
      className={`glass-card rounded-xl p-5 ${variantStyles[variant]} animate-fade-in ${onClick ? 'cursor-pointer hover:scale-[1.02] transition-transform' : ''}`}
      style={{ animationDelay: `${animationDelay}ms` }}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1 min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="text-sm sm:text-base xl:text-lg font-bold tracking-tight mono">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={`rounded-lg p-2.5 ${iconBgStyles[variant]} shrink-0 ml-3`}>
          <Icon className={`h-5 w-5 ${iconColorStyles[variant]}`} />
        </div>
      </div>
      {chartData && chartData.length > 1 && (
        <div className="mt-3 -mx-1">
          <ResponsiveContainer width="100%" height={28}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`spark-${variant}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={color}
                strokeWidth={1.5}
                fill={`url(#spark-${variant})`}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
