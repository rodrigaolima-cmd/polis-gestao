import { ClientSummary } from "@/types/contract";
import { formatCurrency, getExpirationStatus } from "@/utils/contractUtils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, AlertTriangle, Clock, CheckCircle, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActionTablesProps {
  clients: ClientSummary[];
  onClientClick?: (clientName: string) => void;
  onRankingReport?: () => void;
  onCriticalReport?: () => void;
}

export function ActionTables({ clients, onClientClick, onRankingReport, onCriticalReport }: ActionTablesProps) {
  const ranking = [...clients]
    .filter((c) => c.difference > 0)
    .sort((a, b) => b.difference - a.difference || a.clientName.localeCompare(b.clientName, 'pt-BR'));

  const critical = [...clients]
    .filter((c) => c.daysToExpire <= 90)
    .sort((a, b) => a.daysToExpire - b.daysToExpire || a.clientName.localeCompare(b.clientName, 'pt-BR'));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      {/* Ranking não faturado */}
      <div className="bg-card border border-border rounded-xl shadow-sm p-5 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ArrowDown className="h-4 w-4 text-danger" />
            <h3 className="text-sm font-semibold">Ranking – Dinheiro Não Faturado</h3>
          </div>
          {onRankingReport && (
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onRankingReport} title="Relatório da seção">
              <Printer className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <div className="overflow-auto max-h-[400px]">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-xs text-muted-foreground">#</TableHead>
                <TableHead className="text-xs text-muted-foreground">Cliente</TableHead>
                <TableHead className="text-xs text-muted-foreground text-right">Contratado</TableHead>
                <TableHead className="text-xs text-muted-foreground text-right">Faturado</TableHead>
                <TableHead className="text-xs text-muted-foreground text-right">Pendente</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranking.map((c, i) => (
                <TableRow key={c.clientName} className="border-border/30 cursor-pointer hover:bg-muted/70 transition-colors" onClick={() => onClientClick?.(c.clientName)}>
                  <TableCell className="text-xs text-muted-foreground mono">{i + 1}</TableCell>
                  <TableCell className="text-sm font-medium">{c.clientName}</TableCell>
                  <TableCell className="text-xs text-right mono">{formatCurrency(c.totalContracted)}</TableCell>
                  <TableCell className="text-xs text-right mono text-success">{formatCurrency(c.totalBilled)}</TableCell>
                  <TableCell className="text-xs text-right mono font-bold text-danger">{formatCurrency(c.difference)}</TableCell>
                </TableRow>
              ))}
              {ranking.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground text-sm py-8">Nenhum registro encontrado</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Contratos Críticos */}
      <div className="bg-card border border-border rounded-xl shadow-sm p-5 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <h3 className="text-sm font-semibold">Contratos Críticos</h3>
          </div>
          {onCriticalReport && (
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onCriticalReport} title="Relatório da seção">
              <Printer className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <div className="overflow-auto max-h-[400px]">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-xs text-muted-foreground">Cliente</TableHead>
                <TableHead className="text-xs text-muted-foreground">Produtos</TableHead>
                <TableHead className="text-xs text-muted-foreground text-right">Valor</TableHead>
                <TableHead className="text-xs text-muted-foreground text-center">Dias</TableHead>
                <TableHead className="text-xs text-muted-foreground text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {critical.map((c) => {
                const expStatus = getExpirationStatus(c.daysToExpire);
                return (
                  <TableRow key={c.clientName} className="border-border/30 cursor-pointer hover:bg-muted/70 transition-colors" onClick={() => onClientClick?.(c.clientName)}>
                    <TableCell className="text-sm font-medium">{c.clientName}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{c.products.join(", ")}</TableCell>
                    <TableCell className="text-xs text-right mono">{formatCurrency(c.totalContracted)}</TableCell>
                    <TableCell className="text-center">
                      <span className={`text-xs font-bold mono ${
                        expStatus === "expired" ? "text-danger"
                        : expStatus === "critical" ? "text-danger"
                        : "text-warning"
                      }`}>
                        {c.daysToExpire < 0 ? `${Math.abs(c.daysToExpire)}d atrás` : `${c.daysToExpire}d`}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={expStatus} />
                    </TableCell>
                  </TableRow>
                );
              })}
              {critical.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground text-sm py-8">Nenhum contrato crítico</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: "expired" | "critical" | "warning" | "ok" }) {
  if (status === "expired") {
    return <Badge variant="destructive" className="text-[10px] gap-1"><Clock className="h-3 w-3" />Vencido</Badge>;
  }
  if (status === "critical") {
    return <Badge className="text-[10px] gap-1 bg-danger/20 text-danger border-danger/30 hover:bg-danger/30"><AlertTriangle className="h-3 w-3" />Crítico</Badge>;
  }
  if (status === "warning") {
    return <Badge className="text-[10px] gap-1 bg-warning/20 text-warning border-warning/30 hover:bg-warning/30"><AlertTriangle className="h-3 w-3" />Atenção</Badge>;
  }
  return <Badge className="text-[10px] gap-1 bg-success/20 text-success border-success/30 hover:bg-success/30"><CheckCircle className="h-3 w-3" />OK</Badge>;
}
