import { LucideIcon } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "default" | "success" | "danger" | "warning" | "info";
  size?: "lg" | "sm";
  animationDelay?: number;
  onClick?: () => void;
  sparklineData?: number[];
}

const borderColors = {
  default: "border-l-primary",
  success: "border-l-success",
  danger: "border-l-danger",
  warning: "border-l-warning",
  info: "border-l-info",
};

const iconBgStyles = {
  default: "bg-primary/10",
  success: "bg-success/10",
  danger: "bg-danger/10",
  warning: "bg-warning/10",
  info: "bg-info/10",
};

const iconColorStyles = {
  default: "text-primary",
  success: "text-success",
  danger: "text-danger",
  warning: "text-warning",
  info: "text-info",
};

const sparklineColors: Record<string, string> = {
  default: "hsl(var(--primary))",
  success: "hsl(var(--success))",
  danger: "hsl(var(--danger))",
  warning: "hsl(var(--warning))",
  info: "hsl(var(--info))",
};

export function KPICard({ title, value, subtitle, icon: Icon, variant = "default", size = "sm", animationDelay = 0, onClick, sparklineData }: KPICardProps) {
  const chartData = sparklineData?.map((v) => ({ v }));
  const color = sparklineColors[variant];
  const isLarge = size === "lg";

  return (
    <div
      className={`bg-card rounded-xl border border-border/50 shadow-sm border-l-4 ${borderColors[variant]} ${isLarge ? 'p-5 min-h-[150px]' : 'p-4'} animate-fade-in ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      style={{ animationDelay: `${animationDelay}ms` }}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <p className={`font-medium uppercase tracking-wider text-muted-foreground ${isLarge ? 'text-xs sm:text-sm' : 'text-xs'}`}>{title}</p>
          <p
            className={`font-bold tracking-tight mono leading-tight ${isLarge ? 'font-semibold' : ''}`}
            style={{
              fontSize: isLarge
                ? 'clamp(1.1rem, 2.2vw, 1.75rem)'
                : value.length > 14 ? '0.75rem' : value.length > 8 ? '0.85rem' : '1rem',
              wordBreak: 'keep-all',
              overflowWrap: 'normal',
              whiteSpace: 'normal',
            }}
          >
            {value}
          </p>
          {subtitle && <p className={`text-muted-foreground ${isLarge ? 'text-xs sm:text-sm' : 'text-xs'}`}>{subtitle}</p>}
        </div>
        <div className={`rounded-full ${isLarge ? 'p-2.5' : 'p-2'} ${iconBgStyles[variant]} shrink-0 ml-2`}>
          <Icon className={`${isLarge ? 'h-5 w-5' : 'h-4 w-4'} ${iconColorStyles[variant]}`} />
        </div>
      </div>
      {chartData && chartData.length > 1 && (
        <div className={`${isLarge ? 'mt-4' : 'mt-3'} -mx-1`}>
          <ResponsiveContainer width="100%" height={isLarge ? 36 : 28}>
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
