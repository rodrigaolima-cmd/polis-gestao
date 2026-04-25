import { AlertOctagon, AlertTriangle } from "lucide-react";
import { OperationalLeaks } from "@/hooks/useContracts";
import { formatCurrency } from "@/utils/contractUtils";
import { cn } from "@/lib/utils";

interface OperationalLeakAlertProps {
  leaks: OperationalLeaks;
  onClick: () => void;
  isFiltered?: boolean;
}

export function OperationalLeakAlert({ leaks, onClick, isFiltered = false }: OperationalLeakAlertProps) {
  const semFatCount = leaks.semFaturamento.length;
  const semOpCount = leaks.semOperacao.length;
  const valorRisco = leaks.semFaturamento.reduce((s, c) => s + c.valorEmRisco, 0);

  if (semFatCount === 0 && semOpCount === 0) return null;

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden animate-fade-in">
      <div className="px-4 py-2.5 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertOctagon className="h-4 w-4 text-danger" />
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
            Vazamento Operacional — Dinheiro na Mesa Silencioso
          </span>
          {isFiltered && (
            <span className="text-[10px] uppercase tracking-wider text-warning font-semibold ml-1">
              · filtrado
            </span>
          )}
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Clique para ver detalhes</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/50">
        <LeakBlock
          variant="danger"
          icon={AlertOctagon}
          title="Sem faturamento ativo"
          subtitle="Módulo ativo, mas não está sendo cobrado"
          count={semFatCount}
          extra={valorRisco > 0 ? `${formatCurrency(valorRisco)} em risco` : undefined}
          responsavel="Financeiro"
          onClick={onClick}
        />
        <LeakBlock
          variant="warning"
          icon={AlertTriangle}
          title="Sem operação ativa"
          subtitle="Cliente Ativo sem nenhum módulo ativo"
          count={semOpCount}
          responsavel="Comercial / Operações"
          onClick={onClick}
        />
      </div>
    </div>
  );
}

function LeakBlock({
  variant,
  icon: Icon,
  title,
  subtitle,
  count,
  extra,
  responsavel,
  onClick,
}: {
  variant: "danger" | "warning";
  icon: typeof AlertOctagon;
  title: string;
  subtitle: string;
  count: number;
  extra?: string;
  responsavel: string;
  onClick: () => void;
}) {
  const borderColor = variant === "danger" ? "border-l-danger" : "border-l-warning";
  const iconColor = variant === "danger" ? "text-danger" : "text-warning";
  const countColor = variant === "danger" ? "text-danger" : "text-warning";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 border-l-4 transition-colors hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        borderColor,
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("mt-0.5", iconColor)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">{title}</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              · responsável: {responsavel}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          <div className="mt-2 flex items-baseline gap-3 flex-wrap">
            <span className={cn("text-2xl font-bold mono leading-none", countColor)}>{count}</span>
            <span className="text-xs text-muted-foreground">{count === 1 ? "cliente" : "clientes"}</span>
            {extra && (
              <span className="text-xs font-medium text-danger">· {extra}</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
