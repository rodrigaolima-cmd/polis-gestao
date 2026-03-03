import { ClientSummary } from "@/types/contract";
import { formatCurrency } from "@/utils/contractUtils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

const COLORS = [
  "hsl(210, 100%, 56%)", "hsl(152, 69%, 45%)", "hsl(38, 92%, 50%)",
  "hsl(280, 67%, 60%)", "hsl(0, 72%, 51%)", "hsl(190, 80%, 50%)",
  "hsl(330, 70%, 55%)", "hsl(160, 60%, 40%)",
];

const tooltipStyle = {
  backgroundColor: "hsl(220, 22%, 14%)",
  border: "1px solid hsl(220, 18%, 22%)",
  borderRadius: "8px",
  color: "hsl(210, 20%, 92%)",
  fontSize: "12px",
};

interface ChartsProps {
  clients: ClientSummary[];
  billingByProduct: { product: string; billed: number }[];
  contractsByStatus: { status: string; count: number }[];
  distributionByUG: { ugType: string; count: number }[];
  expirationTimeline: { month: string; count: number }[];
  onStatusClick?: (status: string) => void;
  onClientClick?: (clientName: string) => void;
  onProductClick?: (product: string) => void;
  onUGClick?: (ugType: string) => void;
  onMonthClick?: (month: string) => void;
  onTop10Report?: () => void;
  onContractedVsBilledReport?: () => void;
  onProductReport?: () => void;
  onUGReport?: () => void;
  onStatusReport?: () => void;
  onTimelineReport?: () => void;
}

export function DashboardCharts({
  clients, billingByProduct, contractsByStatus, distributionByUG, expirationTimeline,
  onStatusClick, onClientClick, onProductClick, onUGClick, onMonthClick,
  onTop10Report, onContractedVsBilledReport, onProductReport, onUGReport, onStatusReport, onTimelineReport,
}: ChartsProps) {
  const top10 = [...clients].sort((a, b) => b.totalBilled - a.totalBilled).slice(0, 10);

  const contractedVsBilled = [...clients]
    .sort((a, b) => b.totalContracted - a.totalContracted)
    .slice(0, 10)
    .map((c) => ({
      name: c.clientName.length > 20 ? c.clientName.substring(0, 18) + "…" : c.clientName,
      fullName: c.clientName,
      contratado: c.totalContracted,
      faturado: c.totalBilled,
    }));

  const top10Data = top10.map((c) => ({
    name: c.clientName.length > 20 ? c.clientName.substring(0, 18) + "…" : c.clientName,
    fullName: c.clientName,
    faturado: c.totalBilled,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <ChartCard title="Faturamento por Cliente (Top 10)" onReport={onTop10Report}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={top10Data} layout="vertical" margin={{ left: 10, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 18%, 22%)" />
            <XAxis type="number" tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} stroke="hsl(215, 15%, 55%)" fontSize={11} />
            <YAxis type="category" dataKey="name" width={140} stroke="hsl(215, 15%, 55%)" fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
            <Bar dataKey="faturado" fill="hsl(152, 69%, 45%)" radius={[0, 4, 4, 0]} cursor="pointer" onClick={(data: any) => onClientClick?.(data?.fullName)} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Contratado vs Faturado" onReport={onContractedVsBilledReport}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={contractedVsBilled} layout="vertical" margin={{ left: 10, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 18%, 22%)" />
            <XAxis type="number" tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} stroke="hsl(215, 15%, 55%)" fontSize={11} />
            <YAxis type="category" dataKey="name" width={140} stroke="hsl(215, 15%, 55%)" fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
            <Bar dataKey="contratado" fill="hsl(210, 100%, 56%)" radius={[0, 4, 4, 0]} name="Contratado" cursor="pointer" onClick={(data: any) => onClientClick?.(data?.fullName)} />
            <Bar dataKey="faturado" fill="hsl(152, 69%, 45%)" radius={[0, 4, 4, 0]} name="Faturado" cursor="pointer" onClick={(data: any) => onClientClick?.(data?.fullName)} />
            <Legend />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Faturamento por Produto" onReport={onProductReport}>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={billingByProduct}
              dataKey="billed"
              nameKey="product"
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={50}
              paddingAngle={3}
              label={({ product, percent }) => `${product} (${(percent * 100).toFixed(0)}%)`}
              labelLine={{ stroke: "hsl(215, 15%, 55%)" }}
              fontSize={11}
              cursor="pointer"
              onClick={(data: any) => onProductClick?.(data?.product)}
            >
              {billingByProduct.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Distribuição por Tipo de UG" onReport={onUGReport}>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={distributionByUG}
              dataKey="count"
              nameKey="ugType"
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={50}
              paddingAngle={3}
              label={({ ugType, count }) => `${ugType} (${count})`}
              labelLine={{ stroke: "hsl(215, 15%, 55%)" }}
              fontSize={11}
              cursor="pointer"
              onClick={(data: any) => onUGClick?.(data?.ugType)}
            >
              {distributionByUG.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Contratos por Status" onReport={onStatusReport}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={contractsByStatus} margin={{ left: 10, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 18%, 22%)" />
            <XAxis dataKey="status" stroke="hsl(215, 15%, 55%)" fontSize={11} />
            <YAxis stroke="hsl(215, 15%, 55%)" fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="count" name="Contratos" radius={[4, 4, 0, 0]} cursor="pointer" onClick={(data: any) => onStatusClick?.(data?.status)}>
              {contractsByStatus.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.status === "Ativo" ? "hsl(152, 69%, 45%)"
                    : entry.status === "Vencido" ? "hsl(0, 72%, 51%)"
                    : entry.status === "Suspenso" ? "hsl(38, 92%, 50%)"
                    : COLORS[i % COLORS.length]
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Linha do Tempo de Vencimentos" onReport={onTimelineReport}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={expirationTimeline} margin={{ left: 10, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 18%, 22%)" />
            <XAxis dataKey="month" stroke="hsl(215, 15%, 55%)" fontSize={11} />
            <YAxis stroke="hsl(215, 15%, 55%)" fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line
              type="monotone"
              dataKey="count"
              stroke="hsl(210, 100%, 56%)"
              strokeWidth={2}
              dot={{ fill: "hsl(210, 100%, 56%)", r: 4 }}
              activeDot={{ r: 6, cursor: "pointer", onClick: (_: any, payload: any) => onMonthClick?.(payload?.payload?.month) }}
              name="Vencimentos"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children, onReport }: { title: string; children: React.ReactNode; onReport?: () => void }) {
  return (
    <div className="glass-card rounded-xl p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {onReport && (
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onReport} title="Relatório da seção">
            <Printer className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      {children}
    </div>
  );
}
