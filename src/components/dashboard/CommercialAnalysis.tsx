import { ClientSummary } from "@/types/contract";
import { formatCurrency } from "@/utils/contractUtils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Briefcase, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CommercialAnalysisProps {
  clients: ClientSummary[];
  onConsultorReport?: () => void;
  onRegiaoReport?: () => void;
}

interface RankingRow {
  label: string;
  pendencia: number;
  clientCount: number;
}

function buildRanking(clients: ClientSummary[], key: "consultor" | "regiao"): RankingRow[] {
  const map = new Map<string, { pendencia: number; clientNames: Set<string> }>();
  clients.forEach((c) => {
    const val = c[key]?.trim();
    if (!val) return;
    const existing = map.get(val) || { pendencia: 0, clientNames: new Set<string>() };
    if (c.difference > 0) {
      existing.pendencia += c.difference;
    }
    existing.clientNames.add(c.clientName);
    map.set(val, existing);
  });
  return Array.from(map.entries())
    .map(([label, v]) => ({ label, pendencia: v.pendencia, clientCount: v.clientNames.size }))
    .filter((r) => r.pendencia > 0)
    .sort((a, b) => b.pendencia - a.pendencia || a.label.localeCompare(b.label, "pt-BR"));
}

export function CommercialAnalysis({ clients, onConsultorReport, onRegiaoReport }: CommercialAnalysisProps) {
  const byConsultor = buildRanking(clients, "consultor");
  const byRegiao = buildRanking(clients, "regiao");

  if (byConsultor.length === 0 && byRegiao.length === 0) return null;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2">
        <Briefcase className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Análises Comerciais</h2>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Por Consultor */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dinheiro na Mesa por Consultor</h3>
            {onConsultorReport && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onConsultorReport} title="Relatório">
                <Printer className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            )}
          </div>
          <div className="overflow-auto max-h-[300px]">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-xs text-muted-foreground">Consultor</TableHead>
                  <TableHead className="text-xs text-muted-foreground text-right">Total Pendência</TableHead>
                  <TableHead className="text-xs text-muted-foreground text-right">Nº Clientes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byConsultor.map((r) => (
                  <TableRow key={r.label} className="border-border/30">
                    <TableCell className="text-sm font-medium">{r.label}</TableCell>
                    <TableCell className="text-xs text-right mono text-danger font-bold">{formatCurrency(r.pendencia)}</TableCell>
                    <TableCell className="text-xs text-right mono">{r.clientCount}</TableCell>
                  </TableRow>
                ))}
                {byConsultor.length === 0 && (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground text-sm py-6">Sem dados</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Por Região */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dinheiro na Mesa por Região</h3>
            {onRegiaoReport && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRegiaoReport} title="Relatório">
                <Printer className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            )}
          </div>
          <div className="overflow-auto max-h-[300px]">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-xs text-muted-foreground">Região</TableHead>
                  <TableHead className="text-xs text-muted-foreground text-right">Total Pendência</TableHead>
                  <TableHead className="text-xs text-muted-foreground text-right">Nº Clientes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byRegiao.map((r) => (
                  <TableRow key={r.label} className="border-border/30">
                    <TableCell className="text-sm font-medium">{r.label}</TableCell>
                    <TableCell className="text-xs text-right mono text-danger font-bold">{formatCurrency(r.pendencia)}</TableCell>
                    <TableCell className="text-xs text-right mono">{r.clientCount}</TableCell>
                  </TableRow>
                ))}
                {byRegiao.length === 0 && (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground text-sm py-6">Sem dados</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
