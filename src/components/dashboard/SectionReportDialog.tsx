import { ClientSummary, ContractRow } from "@/types/contract";
import { formatCurrency, formatPercent, formatDate, getExpirationStatus } from "@/utils/contractUtils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import polisLogo from "@/assets/Logo_Polis_Hub.png";

export type SectionReportType =
  | "top10"
  | "contractedVsBilled"
  | "ranking"
  | "critical"
  | "byProduct"
  | "byUG"
  | "byStatus"
  | "timeline"
  | "expired"
  | "expiring30"
  | "expiring90"
  | "general"
  | "dinheiroNaMesaDetalhado"
  | "byConsultor"
  | "byRegiao"
  | "byConsultorDetalhado"
  | "byModulos"
  | "operationalLeak";

interface SectionReportDialogProps {
  reportType: SectionReportType;
  clients: ClientSummary[];
  contracts: ContractRow[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TITLES: Record<SectionReportType, string> = {
  top10: "Relatório — Faturamento por Cliente (Top 10)",
  contractedVsBilled: "Relatório — Contratado vs Faturado",
  ranking: "Relatório — Ranking Dinheiro Não Faturado",
  critical: "Relatório — Contratos Críticos",
  byProduct: "Relatório — Faturamento por Produto",
  byUG: "Relatório — Distribuição por Tipo de UG",
  byStatus: "Relatório — Contratos por Status",
  timeline: "Relatório — Linha do Tempo de Vencimentos",
  expired: "Relatório — Contratos Vencidos",
  expiring30: "Relatório — Contratos a Vencer em 30 Dias",
  expiring90: "Relatório — Contratos a Vencer em 90 Dias",
  general: "Relatório Geral de Contratos",
  dinheiroNaMesaDetalhado: "Dinheiro na Mesa — Detalhado por Sistema",
  byConsultor: "Relatório — Dinheiro na Mesa por Consultor",
  byRegiao: "Relatório — Dinheiro na Mesa por Região",
  byConsultorDetalhado: "Relatório Detalhado — Dashboard por Consultor",
  byModulos: "Relatório — Módulos por Cliente",
};

export function SectionReportDialog({ reportType, clients, contracts, open, onOpenChange }: SectionReportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto print-report">
        <DialogHeader className="flex flex-row items-center justify-between print:mb-4">
          <DialogTitle className="text-lg">{TITLES[reportType]}</DialogTitle>
          <div className="flex items-center gap-3">
            <img src={polisLogo} alt="Polis Hub" className="h-10 w-auto hidden print:block" />
            <Button variant="outline" size="sm" className="gap-2 print:hidden" onClick={() => window.print()}>
              <Printer className="h-3.5 w-3.5" /> Exportar PDF
            </Button>
          </div>
        </DialogHeader>
        <div className="print:block">
          {reportType === "top10" && <Top10Report clients={clients} />}
          {reportType === "contractedVsBilled" && <ContractedVsBilledReport clients={clients} />}
          {reportType === "ranking" && <RankingReport clients={clients} />}
          {reportType === "critical" && <CriticalReport clients={clients} />}
          {reportType === "byProduct" && <ByProductReport contracts={contracts} />}
          {reportType === "byUG" && <ByUGReport contracts={contracts} />}
          {reportType === "byStatus" && <ByStatusReport contracts={contracts} />}
          {reportType === "timeline" && <TimelineReport contracts={contracts} />}
          {reportType === "expired" && <ExpirationReport clients={clients} type="expired" />}
          {reportType === "expiring30" && <ExpirationReport clients={clients} type="expiring30" />}
          {reportType === "expiring90" && <ExpirationReport clients={clients} type="expiring90" />}
          {reportType === "general" && <GeneralReport clients={clients} />}
          {reportType === "dinheiroNaMesaDetalhado" && <DinheiroNaMesaDetalhadoReport contracts={contracts} />}
          {reportType === "byConsultor" && <ByRankingReport clients={clients} rankingKey="consultor" label="Consultor" />}
          {reportType === "byRegiao" && <ByRankingReport clients={clients} rankingKey="regiao" label="Região" />}
          {reportType === "byConsultorDetalhado" && <ByConsultorDetalhadoReport contracts={contracts} />}
          {reportType === "byModulos" && <ByModulosReport clients={clients} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Top10Report({ clients }: { clients: ClientSummary[] }) {
  const sorted = [...clients].sort((a, b) => b.totalBilled - a.totalBilled || a.clientName.localeCompare(b.clientName, 'pt-BR')).slice(0, 10);
  const totC = sorted.reduce((s, c) => s + c.totalContracted, 0);
  const totB = sorted.reduce((s, c) => s + c.totalBilled, 0);
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border/50">
          <TableHead className="text-xs">Cliente</TableHead>
          <TableHead className="text-xs">Tipo UG</TableHead>
          <TableHead className="text-xs text-right">Contratado</TableHead>
          <TableHead className="text-xs text-right">Faturado</TableHead>
          <TableHead className="text-xs text-right">Diferença</TableHead>
          <TableHead className="text-xs text-right">% Faturado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((c) => (
          <TableRow key={c.clientName} className="border-border/30">
            <TableCell className="text-sm font-medium">{c.clientName}</TableCell>
            <TableCell className="text-xs">{c.ugType}</TableCell>
            <TableCell className="text-xs text-right mono">{formatCurrency(c.totalContracted)}</TableCell>
            <TableCell className="text-xs text-right mono text-success">{formatCurrency(c.totalBilled)}</TableCell>
            <TableCell className="text-xs text-right mono text-danger">{formatCurrency(c.difference)}</TableCell>
            <TableCell className="text-xs text-right mono">{formatPercent(c.billedPercentage)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow className="bg-muted/50 font-bold">
          <TableCell colSpan={2} className="text-sm">Total</TableCell>
          <TableCell className="text-xs text-right mono">{formatCurrency(totC)}</TableCell>
          <TableCell className="text-xs text-right mono">{formatCurrency(totB)}</TableCell>
          <TableCell className="text-xs text-right mono">{formatCurrency(totC - totB)}</TableCell>
          <TableCell className="text-xs text-right mono">{totC > 0 ? formatPercent((totB / totC) * 100) : "—"}</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

function ContractedVsBilledReport({ clients }: { clients: ClientSummary[] }) {
  const sorted = [...clients].sort((a, b) => a.clientName.localeCompare(b.clientName, 'pt-BR'));
  const totC = sorted.reduce((s, c) => s + c.totalContracted, 0);
  const totB = sorted.reduce((s, c) => s + c.totalBilled, 0);
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border/50">
          <TableHead className="text-xs">Cliente</TableHead>
          <TableHead className="text-xs">Tipo UG</TableHead>
          <TableHead className="text-xs text-right">Contratado</TableHead>
          <TableHead className="text-xs text-right">Faturado</TableHead>
          <TableHead className="text-xs text-right">Diferença</TableHead>
          <TableHead className="text-xs text-right">% Faturado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((c) => (
          <TableRow key={c.clientName} className="border-border/30">
            <TableCell className="text-sm font-medium">{c.clientName}</TableCell>
            <TableCell className="text-xs">{c.ugType}</TableCell>
            <TableCell className="text-xs text-right mono">{formatCurrency(c.totalContracted)}</TableCell>
            <TableCell className="text-xs text-right mono text-success">{formatCurrency(c.totalBilled)}</TableCell>
            <TableCell className="text-xs text-right mono text-danger">{formatCurrency(c.difference)}</TableCell>
            <TableCell className="text-xs text-right mono">{formatPercent(c.billedPercentage)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow className="bg-muted/50 font-bold">
          <TableCell colSpan={2} className="text-sm">Total</TableCell>
          <TableCell className="text-xs text-right mono">{formatCurrency(totC)}</TableCell>
          <TableCell className="text-xs text-right mono">{formatCurrency(totB)}</TableCell>
          <TableCell className="text-xs text-right mono">{formatCurrency(totC - totB)}</TableCell>
          <TableCell className="text-xs text-right mono">{totC > 0 ? formatPercent((totB / totC) * 100) : "—"}</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

function RankingReport({ clients }: { clients: ClientSummary[] }) {
  const ranking = [...clients].filter((c) => c.difference > 0).sort((a, b) => b.difference - a.difference || a.clientName.localeCompare(b.clientName, 'pt-BR'));
  const totC = ranking.reduce((s, c) => s + c.totalContracted, 0);
  const totB = ranking.reduce((s, c) => s + c.totalBilled, 0);
  const totP = ranking.reduce((s, c) => s + c.difference, 0);
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border/50">
          <TableHead className="text-xs">#</TableHead>
          <TableHead className="text-xs">Cliente</TableHead>
          <TableHead className="text-xs">Tipo UG</TableHead>
          <TableHead className="text-xs text-right">Contratado</TableHead>
          <TableHead className="text-xs text-right">Faturado</TableHead>
          <TableHead className="text-xs text-right">Pendente</TableHead>
          <TableHead className="text-xs text-right">% Pendente</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ranking.map((c, i) => (
          <TableRow key={c.clientName} className="border-border/30">
            <TableCell className="text-xs mono">{i + 1}</TableCell>
            <TableCell className="text-sm font-medium">{c.clientName}</TableCell>
            <TableCell className="text-xs">{c.ugType}</TableCell>
            <TableCell className="text-xs text-right mono">{formatCurrency(c.totalContracted)}</TableCell>
            <TableCell className="text-xs text-right mono text-success">{formatCurrency(c.totalBilled)}</TableCell>
            <TableCell className="text-xs text-right mono font-bold text-danger">{formatCurrency(c.difference)}</TableCell>
            <TableCell className="text-xs text-right mono">{c.totalContracted > 0 ? formatPercent((c.difference / c.totalContracted) * 100) : "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow className="bg-muted/50 font-bold">
          <TableCell colSpan={3} className="text-sm">Total ({ranking.length} clientes)</TableCell>
          <TableCell className="text-xs text-right mono">{formatCurrency(totC)}</TableCell>
          <TableCell className="text-xs text-right mono">{formatCurrency(totB)}</TableCell>
          <TableCell className="text-xs text-right mono">{formatCurrency(totP)}</TableCell>
          <TableCell className="text-xs text-right mono">{totC > 0 ? formatPercent((totP / totC) * 100) : "—"}</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

function CriticalReport({ clients }: { clients: ClientSummary[] }) {
  const critical = [...clients].filter((c) => c.daysToExpire <= 90).sort((a, b) => a.daysToExpire - b.daysToExpire || a.clientName.localeCompare(b.clientName, 'pt-BR'));
  const totC = critical.reduce((s, c) => s + c.totalContracted, 0);
  const totB = critical.reduce((s, c) => s + c.totalBilled, 0);
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border/50">
          <TableHead className="text-xs">Cliente</TableHead>
          <TableHead className="text-xs">Produtos</TableHead>
          <TableHead className="text-xs text-right">Contratado</TableHead>
          <TableHead className="text-xs text-right">Faturado</TableHead>
          <TableHead className="text-xs text-center">Dias p/ Vencimento</TableHead>
          <TableHead className="text-xs text-center">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {critical.map((c) => {
          const expStatus = getExpirationStatus(c.daysToExpire);
          return (
            <TableRow key={c.clientName} className="border-border/30">
              <TableCell className="text-sm font-medium">{c.clientName}</TableCell>
              <TableCell className="text-xs">{c.products.join(", ")}</TableCell>
              <TableCell className="text-xs text-right mono">{formatCurrency(c.totalContracted)}</TableCell>
              <TableCell className="text-xs text-right mono text-success">{formatCurrency(c.totalBilled)}</TableCell>
              <TableCell className="text-xs text-center mono">
                <span className={expStatus === "expired" || expStatus === "critical" ? "text-danger font-bold" : "text-warning font-bold"}>
                  {c.daysToExpire < 0 ? `${Math.abs(c.daysToExpire)}d atrás` : `${c.daysToExpire}d`}
                </span>
              </TableCell>
              <TableCell className="text-xs text-center capitalize">{expStatus === "expired" ? "Vencido" : expStatus === "critical" ? "Crítico" : "Atenção"}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
      <TableFooter>
        <TableRow className="bg-muted/50 font-bold">
          <TableCell colSpan={2} className="text-sm">Total ({critical.length} contratos)</TableCell>
          <TableCell className="text-xs text-right mono">{formatCurrency(totC)}</TableCell>
          <TableCell className="text-xs text-right mono">{formatCurrency(totB)}</TableCell>
          <TableCell colSpan={2}></TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

function ByProductReport({ contracts }: { contracts: ContractRow[] }) {
  const map = new Map<string, { contracted: number; billed: number }>();
  contracts.forEach((c) => {
    const existing = map.get(c.product) || { contracted: 0, billed: 0 };
    existing.contracted += c.contractedValue;
    existing.billed += c.billedValue;
    map.set(c.product, existing);
  });
  const products = Array.from(map.entries())
    .map(([product, v]) => ({ product, ...v, difference: v.contracted - v.billed }))
    .sort((a, b) => a.product.localeCompare(b.product, 'pt-BR'));
  const totC = products.reduce((s, p) => s + p.contracted, 0);
  const totB = products.reduce((s, p) => s + p.billed, 0);

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border/50">
          <TableHead className="text-xs">Produto</TableHead>
          <TableHead className="text-xs text-right">Contratado</TableHead>
          <TableHead className="text-xs text-right">Faturado</TableHead>
          <TableHead className="text-xs text-right">Diferença</TableHead>
          <TableHead className="text-xs text-right">% do Total Contratado</TableHead>
          <TableHead className="text-xs text-right">% do Total Faturado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((p) => (
          <TableRow key={p.product} className="border-border/30">
            <TableCell className="text-sm font-medium">{p.product}</TableCell>
            <TableCell className="text-xs text-right mono">{formatCurrency(p.contracted)}</TableCell>
            <TableCell className="text-xs text-right mono text-success">{formatCurrency(p.billed)}</TableCell>
            <TableCell className="text-xs text-right mono text-danger">{formatCurrency(p.difference)}</TableCell>
            <TableCell className="text-xs text-right mono">{totC > 0 ? formatPercent((p.contracted / totC) * 100) : "—"}</TableCell>
            <TableCell className="text-xs text-right mono">{totB > 0 ? formatPercent((p.billed / totB) * 100) : "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow className="bg-muted/50 font-bold">
          <TableCell className="text-sm">Total</TableCell>
          <TableCell className="text-xs text-right mono">{formatCurrency(totC)}</TableCell>
          <TableCell className="text-xs text-right mono">{formatCurrency(totB)}</TableCell>
          <TableCell className="text-xs text-right mono">{formatCurrency(totC - totB)}</TableCell>
          <TableCell className="text-xs text-right mono">100%</TableCell>
          <TableCell className="text-xs text-right mono">100%</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

function ByUGReport({ contracts }: { contracts: ContractRow[] }) {
  const map = new Map<string, { count: number; contracted: number; billed: number }>();
  contracts.forEach((c) => {
    const existing = map.get(c.ugType) || { count: 0, contracted: 0, billed: 0 };
    existing.count++;
    existing.contracted += c.contractedValue;
    existing.billed += c.billedValue;
    map.set(c.ugType, existing);
  });
  const ugs = Array.from(map.entries())
    .map(([ugType, v]) => ({ ugType, ...v, unbilled: v.contracted - v.billed }))
    .sort((a, b) => a.ugType.localeCompare(b.ugType, 'pt-BR'));
  const totC = ugs.reduce((s, u) => s + u.contracted, 0);
  const totU = ugs.reduce((s, u) => s + u.unbilled, 0);
  const totCount = ugs.reduce((s, u) => s + u.count, 0);

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border/50">
          <TableHead className="text-xs">Tipo UG</TableHead>
          <TableHead className="text-xs text-right">Qtd Contratos</TableHead>
          <TableHead className="text-xs text-right">Contratado</TableHead>
          <TableHead className="text-xs text-right">Não Faturado</TableHead>
          <TableHead className="text-xs text-right">% do Total Contratado</TableHead>
          <TableHead className="text-xs text-right">% do Total Não Faturado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ugs.map((u) => (
          <TableRow key={u.ugType} className="border-border/30">
            <TableCell className="text-sm font-medium">{u.ugType}</TableCell>
            <TableCell className="text-xs text-right mono">{u.count}</TableCell>
            <TableCell className="text-xs text-right mono">{formatCurrency(u.contracted)}</TableCell>
            <TableCell className="text-xs text-right mono text-danger">{formatCurrency(u.unbilled)}</TableCell>
            <TableCell className="text-xs text-right mono">{totC > 0 ? formatPercent((u.contracted / totC) * 100) : "—"}</TableCell>
            <TableCell className="text-xs text-right mono">{totU > 0 ? formatPercent((u.unbilled / totU) * 100) : "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow className="bg-muted/50 font-bold">
          <TableCell className="text-sm">Total</TableCell>
          <TableCell className="text-xs text-right mono">{totCount}</TableCell>
          <TableCell className="text-xs text-right mono">{formatCurrency(totC)}</TableCell>
          <TableCell className="text-xs text-right mono">{formatCurrency(totU)}</TableCell>
          <TableCell className="text-xs text-right mono">100%</TableCell>
          <TableCell className="text-xs text-right mono">100%</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

function ByStatusReport({ contracts }: { contracts: ContractRow[] }) {
  const map = new Map<string, { count: number; contracted: number; billed: number }>();
  contracts.forEach((c) => {
    const existing = map.get(c.contractStatus) || { count: 0, contracted: 0, billed: 0 };
    existing.count++;
    existing.contracted += c.contractedValue;
    existing.billed += c.billedValue;
    map.set(c.contractStatus, existing);
  });
  const statuses = Array.from(map.entries())
    .map(([status, v]) => ({ status, ...v }))
    .sort((a, b) => a.status.localeCompare(b.status, 'pt-BR'));
  const totCount = statuses.reduce((s, st) => s + st.count, 0);
  const totC = statuses.reduce((s, st) => s + st.contracted, 0);
  const totB = statuses.reduce((s, st) => s + st.billed, 0);

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border/50">
          <TableHead className="text-xs">Status</TableHead>
          <TableHead className="text-xs text-right">Qtd</TableHead>
          <TableHead className="text-xs text-right">Contratado</TableHead>
          <TableHead className="text-xs text-right">Faturado</TableHead>
          <TableHead className="text-xs text-right">% do Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {statuses.map((st) => (
          <TableRow key={st.status} className="border-border/30">
            <TableCell className="text-sm font-medium">{st.status}</TableCell>
            <TableCell className="text-xs text-right mono">{st.count}</TableCell>
            <TableCell className="text-xs text-right mono">{formatCurrency(st.contracted)}</TableCell>
            <TableCell className="text-xs text-right mono text-success">{formatCurrency(st.billed)}</TableCell>
            <TableCell className="text-xs text-right mono">{totCount > 0 ? formatPercent((st.count / totCount) * 100) : "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow className="bg-muted/50 font-bold">
          <TableCell className="text-sm">Total</TableCell>
          <TableCell className="text-xs text-right mono">{totCount}</TableCell>
          <TableCell className="text-xs text-right mono">{formatCurrency(totC)}</TableCell>
          <TableCell className="text-xs text-right mono">{formatCurrency(totB)}</TableCell>
          <TableCell className="text-xs text-right mono">100%</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

function TimelineReport({ contracts }: { contracts: ContractRow[] }) {
  const map = new Map<string, { count: number; contracted: number }>();
  contracts.forEach((c) => {
    const month = c.expirationDate.substring(0, 7);
    const existing = map.get(month) || { count: 0, contracted: 0 };
    existing.count++;
    existing.contracted += c.contractedValue;
    map.set(month, existing);
  });
  const months = Array.from(map.entries())
    .map(([month, v]) => ({ month, ...v }))
    .sort((a, b) => a.month.localeCompare(b.month));
  const totCount = months.reduce((s, m) => s + m.count, 0);
  const totC = months.reduce((s, m) => s + m.contracted, 0);

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border/50">
          <TableHead className="text-xs">Mês</TableHead>
          <TableHead className="text-xs text-right">Qtd Vencimentos</TableHead>
          <TableHead className="text-xs text-right">Valor Contratado</TableHead>
          <TableHead className="text-xs text-right">% do Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {months.map((m) => (
          <TableRow key={m.month} className="border-border/30">
            <TableCell className="text-sm font-medium">{m.month}</TableCell>
            <TableCell className="text-xs text-right mono">{m.count}</TableCell>
            <TableCell className="text-xs text-right mono">{formatCurrency(m.contracted)}</TableCell>
            <TableCell className="text-xs text-right mono">{totCount > 0 ? formatPercent((m.count / totCount) * 100) : "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow className="bg-muted/50 font-bold">
          <TableCell className="text-sm">Total</TableCell>
          <TableCell className="text-xs text-right mono">{totCount}</TableCell>
          <TableCell className="text-xs text-right mono">{formatCurrency(totC)}</TableCell>
          <TableCell className="text-xs text-right mono">100%</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

function ExpirationReport({ clients, type }: { clients: ClientSummary[]; type: "expired" | "expiring30" | "expiring90" }) {
  const filtered = [...clients].filter((c) => {
    if (type === "expired") return c.daysToExpire < 0;
    if (type === "expiring30") return c.daysToExpire >= 0 && c.daysToExpire <= 30;
    return c.daysToExpire >= 0 && c.daysToExpire <= 90;
  }).sort((a, b) => a.clientName.localeCompare(b.clientName, 'pt-BR'));

  const totC = filtered.reduce((s, c) => s + c.totalContracted, 0);
  const totB = filtered.reduce((s, c) => s + c.totalBilled, 0);

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border/50">
          <TableHead className="text-xs">Cliente</TableHead>
          <TableHead className="text-xs">Tipo UG</TableHead>
          <TableHead className="text-xs">Produtos</TableHead>
          <TableHead className="text-xs text-right">Contratado</TableHead>
          <TableHead className="text-xs text-right">Faturado</TableHead>
          <TableHead className="text-xs text-center">Dias p/ Vencimento</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filtered.map((c) => {
          const expStatus = getExpirationStatus(c.daysToExpire);
          return (
            <TableRow key={c.clientName} className="border-border/30">
              <TableCell className="text-sm font-medium">{c.clientName}</TableCell>
              <TableCell className="text-xs">{c.ugType}</TableCell>
              <TableCell className="text-xs">{c.products.join(", ")}</TableCell>
              <TableCell className="text-xs text-right mono">{formatCurrency(c.totalContracted)}</TableCell>
              <TableCell className="text-xs text-right mono text-success">{formatCurrency(c.totalBilled)}</TableCell>
              <TableCell className="text-xs text-center mono">
                <span className={expStatus === "expired" || expStatus === "critical" ? "text-danger font-bold" : "text-warning font-bold"}>
                  {c.daysToExpire < 0 ? `${Math.abs(c.daysToExpire)}d atrás` : `${c.daysToExpire}d`}
                </span>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
      <TableFooter>
        <TableRow className="bg-muted/50 font-bold">
          <TableCell colSpan={3} className="text-sm">Total ({filtered.length} contratos)</TableCell>
          <TableCell className="text-xs text-right mono">{formatCurrency(totC)}</TableCell>
          <TableCell className="text-xs text-right mono">{formatCurrency(totB)}</TableCell>
          <TableCell></TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

function GeneralReport({ clients }: { clients: ClientSummary[] }) {
  const sorted = [...clients].sort((a, b) => a.clientName.localeCompare(b.clientName, 'pt-BR'));
  const totC = sorted.reduce((s, c) => s + c.totalContracted, 0);
  const totB = sorted.reduce((s, c) => s + c.totalBilled, 0);
  const totD = sorted.reduce((s, c) => s + c.difference, 0);

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border/50">
          <TableHead className="text-xs">Cliente</TableHead>
          <TableHead className="text-xs">Tipo UG</TableHead>
          <TableHead className="text-xs">Região</TableHead>
          <TableHead className="text-xs">Consultor</TableHead>
          <TableHead className="text-xs text-right">Contratado</TableHead>
          <TableHead className="text-xs text-right">Faturado</TableHead>
          <TableHead className="text-xs text-right">Diferença</TableHead>
          <TableHead className="text-xs text-center">Vencimento</TableHead>
          <TableHead className="text-xs text-center">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((c) => (
          <TableRow key={c.clientName} className="border-border/30">
            <TableCell className="text-sm font-medium">{c.clientName}</TableCell>
            <TableCell className="text-xs">{c.ugType}</TableCell>
            <TableCell className="text-xs">
              {c.regiao || "—"}
              {c.regiaoConflict && <span className="ml-1 text-warning text-[10px]">⚠ Revisar</span>}
            </TableCell>
            <TableCell className="text-xs">
              {c.consultor || "—"}
              {c.consultorConflict && <span className="ml-1 text-warning text-[10px]">⚠ Revisar</span>}
            </TableCell>
            <TableCell className="text-xs text-right mono">{formatCurrency(c.totalContracted)}</TableCell>
            <TableCell className="text-xs text-right mono text-success">{formatCurrency(c.totalBilled)}</TableCell>
            <TableCell className="text-xs text-right mono text-danger">{formatCurrency(c.difference)}</TableCell>
            <TableCell className="text-xs text-center mono">{formatDate(c.nextExpiration)}</TableCell>
            <TableCell className="text-xs text-center capitalize">{c.status}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow className="bg-muted/50 font-bold">
          <TableCell colSpan={4} className="text-sm">Total ({sorted.length} clientes)</TableCell>
          <TableCell className="text-xs text-right mono">{formatCurrency(totC)}</TableCell>
          <TableCell className="text-xs text-right mono">{formatCurrency(totB)}</TableCell>
          <TableCell className="text-xs text-right mono">{formatCurrency(totD)}</TableCell>
          <TableCell colSpan={2}></TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

function ByRankingReport({ clients, rankingKey, label }: { clients: ClientSummary[]; rankingKey: "consultor" | "regiao"; label: string }) {
  const map = new Map<string, { pendencia: number; clientNames: Set<string> }>();
  clients.forEach((c) => {
    const val = c[rankingKey]?.trim();
    if (!val) return;
    const existing = map.get(val) || { pendencia: 0, clientNames: new Set<string>() };
    if (c.difference > 0) existing.pendencia += c.difference;
    existing.clientNames.add(c.clientName);
    map.set(val, existing);
  });
  const rows = Array.from(map.entries())
    .map(([name, v]) => ({ name, pendencia: v.pendencia, clientCount: v.clientNames.size }))
    .filter((r) => r.pendencia > 0)
    .sort((a, b) => b.pendencia - a.pendencia || a.name.localeCompare(b.name, "pt-BR"));

  const totPendencia = rows.reduce((s, r) => s + r.pendencia, 0);
  const totClients = rows.reduce((s, r) => s + r.clientCount, 0);

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border/50">
          <TableHead className="text-xs">{label}</TableHead>
          <TableHead className="text-xs text-right">Total Pendência</TableHead>
          <TableHead className="text-xs text-right">Nº Clientes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.name} className="border-border/30">
            <TableCell className="text-sm font-medium">{r.name}</TableCell>
            <TableCell className="text-xs text-right mono text-danger font-bold">{formatCurrency(r.pendencia)}</TableCell>
            <TableCell className="text-xs text-right mono">{r.clientCount}</TableCell>
          </TableRow>
        ))}
        {rows.length === 0 && (
          <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground text-sm py-6">Sem dados</TableCell></TableRow>
        )}
      </TableBody>
      <TableFooter>
        <TableRow className="bg-muted/50 font-bold">
          <TableCell className="text-sm">Total ({rows.length})</TableCell>
          <TableCell className="text-xs text-right mono">{formatCurrency(totPendencia)}</TableCell>
          <TableCell className="text-xs text-right mono">{totClients}</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

function DinheiroNaMesaDetalhadoReport({ contracts }: { contracts: ContractRow[] }) {
  const pending = contracts.filter((c) => c.contractedValue > c.billedValue);

  // Group by client
  const grouped = new Map<string, ContractRow[]>();
  pending.forEach((c) => {
    const existing = grouped.get(c.clientName) || [];
    existing.push(c);
    grouped.set(c.clientName, existing);
  });

  const sortedClients = Array.from(grouped.entries()).sort((a, b) =>
    a[0].localeCompare(b[0], "pt-BR")
  );

  const grandContracted = pending.reduce((s, c) => s + c.contractedValue, 0);
  const grandBilled = pending.reduce((s, c) => s + c.billedValue, 0);
  const grandPendencia = pending.reduce((s, c) => s + Math.max(c.contractedValue - c.billedValue, 0), 0);

  return (
    <div className="space-y-1">
      <Table>
        <TableHeader>
          <TableRow className="border-border/50">
            <TableHead className="text-xs">Produto</TableHead>
            <TableHead className="text-xs">Tipo UG</TableHead>
            <TableHead className="text-xs">Região</TableHead>
            <TableHead className="text-xs">Consultor</TableHead>
            <TableHead className="text-xs text-right">Contratado</TableHead>
            <TableHead className="text-xs text-right">Faturado</TableHead>
            <TableHead className="text-xs text-right">Pendência</TableHead>
            <TableHead className="text-xs text-center">Vencimento</TableHead>
            <TableHead className="text-xs text-center">Status</TableHead>
            <TableHead className="text-xs">OBS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedClients.map(([clientName, rows]) => {
            const sortedRows = [...rows].sort((a, b) => a.product.localeCompare(b.product, "pt-BR"));
            const subContracted = rows.reduce((s, r) => s + r.contractedValue, 0);
            const subBilled = rows.reduce((s, r) => s + r.billedValue, 0);
            const subPendencia = rows.reduce((s, r) => s + Math.max(r.contractedValue - r.billedValue, 0), 0);

            return (
              <>
                <TableRow key={`header-${clientName}`} className="bg-muted/30 border-border/50">
                  <TableCell colSpan={10} className="text-sm font-bold py-2">{clientName}</TableCell>
                </TableRow>
                {sortedRows.map((r) => (
                  <TableRow key={r.id} className="border-border/30">
                    <TableCell className="text-xs pl-6">{r.product}</TableCell>
                    <TableCell className="text-xs">{r.ugType}</TableCell>
                    <TableCell className="text-xs">{r.regiao || "—"}</TableCell>
                    <TableCell className="text-xs">{r.consultor || "—"}</TableCell>
                    <TableCell className="text-xs text-right mono">{formatCurrency(r.contractedValue)}</TableCell>
                    <TableCell className="text-xs text-right mono text-success">{formatCurrency(r.billedValue)}</TableCell>
                    <TableCell className="text-xs text-right mono text-danger font-bold">{formatCurrency(Math.max(r.contractedValue - r.billedValue, 0))}</TableCell>
                    <TableCell className="text-xs text-center mono">{formatDate(r.expirationDate)}</TableCell>
                    <TableCell className="text-xs text-center capitalize">{r.contractStatus}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{r.observations || "—"}</TableCell>
                  </TableRow>
                ))}
                <TableRow key={`sub-${clientName}`} className="border-border/50 bg-muted/10">
                  <TableCell colSpan={4} className="text-xs font-semibold text-right">Subtotal {clientName}</TableCell>
                  <TableCell className="text-xs text-right mono font-semibold">{formatCurrency(subContracted)}</TableCell>
                  <TableCell className="text-xs text-right mono font-semibold">{formatCurrency(subBilled)}</TableCell>
                  <TableCell className="text-xs text-right mono font-semibold text-danger">{formatCurrency(subPendencia)}</TableCell>
                  <TableCell colSpan={3}></TableCell>
                </TableRow>
              </>
            );
          })}
        </TableBody>
        <TableFooter>
          <TableRow className="bg-muted/50 font-bold">
            <TableCell colSpan={4} className="text-sm">Total ({sortedClients.length} clientes com pendência)</TableCell>
            <TableCell className="text-xs text-right mono">{formatCurrency(grandContracted)}</TableCell>
            <TableCell className="text-xs text-right mono">{formatCurrency(grandBilled)}</TableCell>
            <TableCell className="text-xs text-right mono">{formatCurrency(grandPendencia)}</TableCell>
            <TableCell colSpan={3}></TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}

function ByConsultorDetalhadoReport({ contracts }: { contracts: ContractRow[] }) {
  // Group by consultor, then by client
  const consultorMap = new Map<string, ContractRow[]>();
  contracts.forEach((c) => {
    const key = c.consultor || "(Sem Consultor)";
    if (!consultorMap.has(key)) consultorMap.set(key, []);
    consultorMap.get(key)!.push(c);
  });
  const consultores = Array.from(consultorMap.entries()).sort((a, b) => a[0].localeCompare(b[0], "pt-BR"));
  const grandTotC = contracts.reduce((s, c) => s + c.contractedValue, 0);
  const grandTotB = contracts.reduce((s, c) => s + c.billedValue, 0);

  return (
    <div className="space-y-6">
      {consultores.map(([consultor, rows]) => {
        const clientMap = new Map<string, ContractRow[]>();
        rows.forEach((r) => {
          if (!clientMap.has(r.clientName)) clientMap.set(r.clientName, []);
          clientMap.get(r.clientName)!.push(r);
        });
        const clientEntries = Array.from(clientMap.entries()).sort((a, b) => a[0].localeCompare(b[0], "pt-BR"));
        const subTotC = rows.reduce((s, r) => s + r.contractedValue, 0);
        const subTotB = rows.reduce((s, r) => s + r.billedValue, 0);

        return (
          <div key={consultor}>
            <h3 className="text-sm font-bold mb-2 px-1">🧑‍💼 {consultor} ({clientEntries.length} clientes)</h3>
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead className="text-xs">Cliente</TableHead>
                  <TableHead className="text-xs">Produto</TableHead>
                  <TableHead className="text-xs">Tipo UG</TableHead>
                  <TableHead className="text-xs text-right">Contratado</TableHead>
                  <TableHead className="text-xs text-right">Faturado</TableHead>
                  <TableHead className="text-xs text-right">Pendência</TableHead>
                  <TableHead className="text-xs text-center">Vencimento</TableHead>
                  <TableHead className="text-xs text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientEntries.map(([clientName, cRows]) =>
                  cRows.map((r, i) => (
                    <TableRow key={r.id} className="border-border/30">
                      <TableCell className="text-xs font-medium">{i === 0 ? clientName : ""}</TableCell>
                      <TableCell className="text-xs">{r.product}</TableCell>
                      <TableCell className="text-xs">{r.ugType}</TableCell>
                      <TableCell className="text-xs text-right mono">{formatCurrency(r.contractedValue)}</TableCell>
                      <TableCell className="text-xs text-right mono text-success">{formatCurrency(r.billedValue)}</TableCell>
                      <TableCell className="text-xs text-right mono text-danger">{formatCurrency(r.contractedValue - r.billedValue)}</TableCell>
                      <TableCell className="text-xs text-center mono">{formatDate(r.expirationDate)}</TableCell>
                      <TableCell className="text-xs text-center">{r.contractStatus}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              <TableFooter>
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell colSpan={3} className="text-xs">Subtotal — {consultor}</TableCell>
                  <TableCell className="text-xs text-right mono">{formatCurrency(subTotC)}</TableCell>
                  <TableCell className="text-xs text-right mono">{formatCurrency(subTotB)}</TableCell>
                  <TableCell className="text-xs text-right mono">{formatCurrency(subTotC - subTotB)}</TableCell>
                  <TableCell colSpan={2} />
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        );
      })}
      <div className="border-t-2 border-border pt-3 px-1 flex justify-between text-sm font-bold">
        <span>Total Geral ({consultores.length} consultores)</span>
        <span className="space-x-4">
          <span>Contratado: {formatCurrency(grandTotC)}</span>
          <span>Faturado: {formatCurrency(grandTotB)}</span>
          <span className="text-danger">Pendência: {formatCurrency(grandTotC - grandTotB)}</span>
        </span>
      </div>
    </div>
  );
}

function ByModulosReport({ clients }: { clients: ClientSummary[] }) {
  const sorted = [...clients].sort((a, b) => b.productCount - a.productCount || a.clientName.localeCompare(b.clientName, 'pt-BR'));
  const totalMods = sorted.reduce((s, c) => s + c.productCount, 0);
  const totC = sorted.reduce((s, c) => s + c.totalContracted, 0);
  const totB = sorted.reduce((s, c) => s + c.totalBilled, 0);

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border/50">
          <TableHead className="text-xs">Cliente</TableHead>
          <TableHead className="text-xs">Tipo UG</TableHead>
          <TableHead className="text-xs text-center">Módulos</TableHead>
          <TableHead className="text-xs">Produtos</TableHead>
          <TableHead className="text-xs text-right">Contratado</TableHead>
          <TableHead className="text-xs text-right">Faturado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((c) => (
          <TableRow key={c.clientName} className="border-border/30">
            <TableCell className="text-sm font-medium">{c.clientName}</TableCell>
            <TableCell className="text-xs">{c.ugType}</TableCell>
            <TableCell className="text-xs text-center mono font-bold">{c.productCount}</TableCell>
            <TableCell className="text-xs">{c.products.join(", ")}</TableCell>
            <TableCell className="text-xs text-right mono">{formatCurrency(c.totalContracted)}</TableCell>
            <TableCell className="text-xs text-right mono text-success">{formatCurrency(c.totalBilled)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow className="bg-muted/50 font-bold">
          <TableCell colSpan={2} className="text-sm">Total ({sorted.length} clientes)</TableCell>
          <TableCell className="text-xs text-center mono">{totalMods}</TableCell>
          <TableCell></TableCell>
          <TableCell className="text-xs text-right mono">{formatCurrency(totC)}</TableCell>
          <TableCell className="text-xs text-right mono">{formatCurrency(totB)}</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
