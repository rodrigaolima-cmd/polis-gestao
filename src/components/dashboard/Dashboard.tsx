import { useState, useMemo } from "react";
import { mockContracts } from "@/data/mockContracts";
import { ContractRow, DashboardFilters } from "@/types/contract";
import { StatusReportDialog } from "@/components/dashboard/StatusReportDialog";
import {
  applyFilters, consolidateByClient, defaultFilters,
  formatCurrency, formatPercent, getExpirationStatus,
  getBillingByProduct, getContractsByStatus, getDistributionByUG, getExpirationTimeline,
} from "@/utils/contractUtils";
import { KPICard } from "@/components/dashboard/KPICard";
import { FiltersBar } from "@/components/dashboard/FiltersBar";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { ActionTables } from "@/components/dashboard/ActionTables";
import { ImportDialog } from "@/components/dashboard/ImportDialog";
import {
  DollarSign, TrendingUp, AlertTriangle, BarChart3,
  CalendarX, Clock, AlertCircle, FileSpreadsheet, Printer, Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters);
  const [contracts, setContracts] = useState<ContractRow[]>(mockContracts);
  const [importOpen, setImportOpen] = useState(false);
  const [dataSource, setDataSource] = useState<"mock" | "imported">("mock");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [statusReportOpen, setStatusReportOpen] = useState(false);

  const filteredContracts = useMemo(() => applyFilters(contracts, filters), [contracts, filters]);
  const clients = useMemo(() => consolidateByClient(filteredContracts), [filteredContracts]);

  // KPIs
  const totalContracted = clients.reduce((s, c) => s + c.totalContracted, 0);
  const totalBilled = clients.reduce((s, c) => s + c.totalBilled, 0);
  const totalUnbilled = totalContracted - totalBilled;
  const avgBilledPct = clients.length > 0
    ? clients.reduce((s, c) => s + c.billedPercentage, 0) / clients.length : 0;
  const expiredCount = clients.filter((c) => getExpirationStatus(c.daysToExpire) === "expired").length;
  const expiring90 = clients.filter((c) => c.daysToExpire >= 0 && c.daysToExpire <= 90).length;
  const expiring30 = clients.filter((c) => c.daysToExpire >= 0 && c.daysToExpire <= 30).length;

  // Chart data
  const billingByProduct = useMemo(() => getBillingByProduct(filteredContracts), [filteredContracts]);
  const contractsByStatus = useMemo(() => getContractsByStatus(filteredContracts), [filteredContracts]);
  const distributionByUG = useMemo(() => getDistributionByUG(filteredContracts), [filteredContracts]);
  const expirationTimeline = useMemo(() => getExpirationTimeline(filteredContracts), [filteredContracts]);

  const handleImport = (data: ContractRow[]) => {
    setContracts(data);
    setDataSource("imported");
    setFilters(defaultFilters);
  };

  const handleResetToMock = () => {
    setContracts(mockContracts);
    setDataSource("mock");
    setFilters(defaultFilters);
  };

  const handleExport = () => {
    const headers = ["Cliente", "Tipo UG", "Total Contratado", "Total Faturado", "Diferença", "% Faturado", "Produtos", "Próx. Vencimento"];
    const rows = clients.map((c) => [
      c.clientName, c.ugType,
      c.totalContracted, c.totalBilled, c.difference,
      c.billedPercentage.toFixed(1) + "%",
      c.products.join("; "), c.nextExpiration,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contratos_polis.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Gestão de Contratos</h1>
            <p className="text-xs text-muted-foreground">
              Polis Gestão • Painel Executivo
              {dataSource === "imported" && (
                <span className="ml-2 text-success">• Dados importados ({contracts.length} registros)</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="default" size="sm" className="gap-2 text-xs" onClick={() => setImportOpen(true)}>
              <Upload className="h-3.5 w-3.5" /> Importar
            </Button>
            {dataSource === "imported" && (
              <Button variant="ghost" size="sm" className="gap-2 text-xs text-muted-foreground" onClick={handleResetToMock}>
                Dados demo
              </Button>
            )}
            <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={handleExport}>
              <FileSpreadsheet className="h-3.5 w-3.5" /> Exportar
            </Button>
            <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={() => window.print()}>
              <Printer className="h-3.5 w-3.5" /> Imprimir
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        <FiltersBar
          filters={filters}
          contracts={contracts}
          onFilterChange={setFilters}
          onReset={() => setFilters(defaultFilters)}
        />

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <KPICard title="Total Contratado" value={formatCurrency(totalContracted)} icon={DollarSign} variant="info" animationDelay={0} />
          <KPICard title="Total Faturado" value={formatCurrency(totalBilled)} icon={TrendingUp} variant="success" animationDelay={50} />
          <KPICard title="Não Faturado" value={formatCurrency(totalUnbilled)} subtitle="Dinheiro na mesa" icon={AlertTriangle} variant="danger" animationDelay={100} />
          <KPICard title="% Médio Faturado" value={formatPercent(avgBilledPct)} icon={BarChart3} variant="info" animationDelay={150} />
          <KPICard title="Vencidos" value={String(expiredCount)} icon={CalendarX} variant="danger" animationDelay={200} />
          <KPICard title="Vencer 90 dias" value={String(expiring90)} icon={Clock} variant="warning" animationDelay={250} />
          <KPICard title="Vencer 30 dias" value={String(expiring30)} icon={AlertCircle} variant="danger" animationDelay={300} />
        </div>

        <DashboardCharts
          clients={clients}
          billingByProduct={billingByProduct}
          contractsByStatus={contractsByStatus}
          distributionByUG={distributionByUG}
          expirationTimeline={expirationTimeline}
          onStatusClick={(status) => {
            setSelectedStatus(status);
            setStatusReportOpen(true);
          }}
        />

        <ActionTables clients={clients} />
      </main>

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} onImport={handleImport} />
      <StatusReportDialog
        status={selectedStatus}
        contracts={filteredContracts.filter((c) => c.contractStatus === selectedStatus)}
        open={statusReportOpen}
        onOpenChange={setStatusReportOpen}
      />
    </div>
  );
}
