import { useMemo, useState } from "react";
import { ClientSummary, ContractRow } from "@/types/contract";
import { formatCurrency, formatPercent, formatDate, getExpirationStatus } from "@/utils/contractUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { UserCheck, DollarSign, TrendingUp, AlertTriangle, Users, FileText } from "lucide-react";

interface ConsultorDashboardProps {
  clients: ClientSummary[];
  contracts: ContractRow[];
  onReport: () => void;
}

export function ConsultorDashboard({ clients, contracts, onReport }: ConsultorDashboardProps) {
  const consultores = useMemo(() => {
    const set = new Set<string>();
    clients.forEach((c) => {
      if (c.consultor && c.consultor.trim()) set.add(c.consultor);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [clients]);

  const [selected, setSelected] = useState<string>("");

  const filteredClients = useMemo(
    () => (selected ? clients.filter((c) => c.consultor === selected) : []),
    [clients, selected]
  );

  const totalContracted = filteredClients.reduce((s, c) => s + c.totalContracted, 0);
  const totalBilled = filteredClients.reduce((s, c) => s + c.totalBilled, 0);
  const pendencia = totalContracted - totalBilled;

  if (consultores.length === 0) return null;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Dashboard por Consultor</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger className="w-[220px] h-8 text-xs">
                <SelectValue placeholder="Selecione um consultor" />
              </SelectTrigger>
              <SelectContent>
                {consultores.map((c) => (
                  <SelectItem key={c} value={c} className="text-xs">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={onReport}>
              <FileText className="h-3.5 w-3.5" /> Relatório
            </Button>
          </div>
        </div>
      </CardHeader>

      {selected && (
        <CardContent className="space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MiniKPI icon={DollarSign} label="Total Contratado" value={formatCurrency(totalContracted)} />
            <MiniKPI icon={TrendingUp} label="Total Faturado" value={formatCurrency(totalBilled)} />
            <MiniKPI icon={AlertTriangle} label="Pendência" value={formatCurrency(pendencia)} variant="danger" />
            <MiniKPI icon={Users} label="Nº Clientes" value={String(filteredClients.length)} />
          </div>

          {/* Table */}
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border/50">
                <TableHead className="text-xs">Cliente</TableHead>
                <TableHead className="text-xs">Tipo UG</TableHead>
                <TableHead className="text-xs text-right">Contratado</TableHead>
                <TableHead className="text-xs text-right">Faturado</TableHead>
                <TableHead className="text-xs text-right">Diferença</TableHead>
                <TableHead className="text-xs text-right">% Faturado</TableHead>
                <TableHead className="text-xs text-center">Vencimento</TableHead>
                <TableHead className="text-xs text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients
                .sort((a, b) => a.clientName.localeCompare(b.clientName, "pt-BR"))
                .map((c) => {
                  const expStatus = getExpirationStatus(c.daysToExpire);
                  return (
                    <TableRow key={c.clientName} className="border-border/30">
                      <TableCell className="text-sm font-medium">{c.clientName}</TableCell>
                      <TableCell className="text-xs">{c.ugType}</TableCell>
                      <TableCell className="text-xs text-right mono">{formatCurrency(c.totalContracted)}</TableCell>
                      <TableCell className="text-xs text-right mono text-success">{formatCurrency(c.totalBilled)}</TableCell>
                      <TableCell className="text-xs text-right mono text-danger">{formatCurrency(c.difference)}</TableCell>
                      <TableCell className="text-xs text-right mono">{formatPercent(c.billedPercentage)}</TableCell>
                      <TableCell className="text-xs text-center mono">{formatDate(c.nextExpiration)}</TableCell>
                      <TableCell className="text-xs text-center capitalize">
                        <span className={expStatus === "expired" ? "text-danger font-bold" : expStatus === "critical" ? "text-warning font-bold" : ""}>
                          {expStatus === "expired" ? "Vencido" : expStatus === "critical" ? "Crítico" : expStatus === "warning" ? "Atenção" : "OK"}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
            <TableFooter>
              <TableRow className="bg-muted/50 font-bold">
                <TableCell colSpan={2} className="text-sm">Total ({filteredClients.length} clientes)</TableCell>
                <TableCell className="text-xs text-right mono">{formatCurrency(totalContracted)}</TableCell>
                <TableCell className="text-xs text-right mono">{formatCurrency(totalBilled)}</TableCell>
                <TableCell className="text-xs text-right mono">{formatCurrency(pendencia)}</TableCell>
                <TableCell className="text-xs text-right mono">{totalContracted > 0 ? formatPercent((totalBilled / totalContracted) * 100) : "—"}</TableCell>
                <TableCell colSpan={2} />
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      )}
    </Card>
  );
}

function MiniKPI({ icon: Icon, label, value, variant }: { icon: React.ElementType; label: string; value: string; variant?: "danger" }) {
  return (
    <div className="rounded-lg border border-border/50 bg-card p-3 space-y-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-lg font-bold mono ${variant === "danger" ? "text-danger" : ""}`}>{value}</p>
    </div>
  );
}
