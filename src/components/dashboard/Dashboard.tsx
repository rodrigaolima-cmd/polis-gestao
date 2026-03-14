import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ContractRow, DashboardFilters } from "@/types/contract";
import { useContracts } from "@/hooks/useContracts";
import { useAuth } from "@/hooks/useAuth";
import { useAuditLog } from "@/hooks/useAuditLog";
import { ChartReportDialog } from "@/components/dashboard/ChartReportDialog";
import { SectionReportDialog, SectionReportType } from "@/components/dashboard/SectionReportDialog";
import {
  applyFilters, consolidateByClient, defaultFilters,
  formatCurrency, formatPercent, getExpirationStatus,
  getBillingByProduct, getContractsByStatus, getDistributionByUG, getExpirationTimeline,
  isActiveStatus, getMonthlyTrend,
} from "@/utils/contractUtils";
import { KPICard } from "@/components/dashboard/KPICard";
import { FiltersBar } from "@/components/dashboard/FiltersBar";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { ActionTables } from "@/components/dashboard/ActionTables";
import { CommercialAnalysis } from "@/components/dashboard/CommercialAnalysis";
import { ImportDialog } from "@/components/dashboard/ImportDialog";
import { ConsultorDashboard } from "@/components/dashboard/ConsultorDashboard";
import {
  DollarSign, TrendingUp, AlertTriangle,
  CalendarX, Clock, AlertCircle, Upload,
  Target, FileText, Users, LogOut, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReportConfig {
  title: string;
  contracts: ContractRow[];
}

// Dashboard component
export default function Dashboard() {
  const navigate = useNavigate();
  const { profile, signOut, isAdmin } = useAuth();
  const { logAction } = useAuditLog();
  const { contracts, setContracts, dataSource, importToDatabase, resetToMock, loading } = useContracts();
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters);
  const [importOpen, setImportOpen] = useState(false);
  const [reportConfig, setReportConfig] = useState<ReportConfig | null>(null);
  const [sectionReport, setSectionReport] = useState<SectionReportType | null>(null);

  const filteredContracts = useMemo(() => applyFilters(contracts, filters), [contracts, filters]);
  const clients = useMemo(() => consolidateByClient(filteredContracts), [filteredContracts]);

  // KPIs
  const totalContracted = clients.reduce((s, c) => s + c.totalContracted, 0);
  const totalBilled = clients.reduce((s, c) => s + c.totalBilled, 0);
  const totalUnbilled = totalContracted - totalBilled;
  const expiredCount = clients.filter((c) => getExpirationStatus(c.daysToExpire) === "expired").length;
  const expiring90 = clients.filter((c) => c.daysToExpire >= 0 && c.daysToExpire <= 90).length;
  const expiring30 = clients.filter((c) => c.daysToExpire >= 0 && c.daysToExpire <= 30).length;

  // New KPIs
  const ticketMedio = clients.length > 0 ? totalContracted / clients.length : 0;

  // Sparkline trends
  const sparkContracted = useMemo(() => getMonthlyTrend(filteredContracts, "contractedValue"), [filteredContracts]);
  const sparkBilled = useMemo(() => getMonthlyTrend(filteredContracts, "billedValue"), [filteredContracts]);
  const sparkUnbilled = useMemo(() => getMonthlyTrend(filteredContracts, "unbilled"), [filteredContracts]);
  const sparkExpired = useMemo(() => getMonthlyTrend(filteredContracts, "expiredCount"), [filteredContracts]);
  

  // Chart data
  const billingByProduct = useMemo(() => getBillingByProduct(filteredContracts), [filteredContracts]);
  const contractsByStatus = useMemo(() => getContractsByStatus(filteredContracts), [filteredContracts]);
  const distributionByUG = useMemo(() => getDistributionByUG(filteredContracts), [filteredContracts]);
  const expirationTimeline = useMemo(() => getExpirationTimeline(filteredContracts), [filteredContracts]);

  const handleImport = (data: ContractRow[]) => {
    setContracts(data);
    setFilters(defaultFilters);
    logAction("Importação de planilha", "contracts", undefined, { count: data.length });
  };

  const handleResetToMock = () => {
    resetToMock();
    setFilters(defaultFilters);
  };


  // Report click handlers (individual item)
  const handleStatusClick = (status: string) => {
    setReportConfig({
      title: `Relatório — Contratos ${status}`,
      contracts: filteredContracts.filter((c) => c.contractStatus === status),
    });
  };

  const handleClientClick = (clientName: string) => {
    setReportConfig({
      title: `Relatório — Cliente: ${clientName}`,
      contracts: filteredContracts.filter((c) => c.clientName === clientName),
    });
  };

  const handleProductClick = (product: string) => {
    setReportConfig({
      title: `Relatório — Produto: ${product}`,
      contracts: filteredContracts.filter((c) => c.product === product),
    });
  };

  const handleUGClick = (ugType: string) => {
    setReportConfig({
      title: `Relatório — Tipo UG: ${ugType}`,
      contracts: filteredContracts.filter((c) => c.ugType === ugType),
    });
  };

  const handleMonthClick = (month: string) => {
    setReportConfig({
      title: `Relatório — Vencimentos: ${month}`,
      contracts: filteredContracts.filter((c) => c.expirationDate.substring(0, 7) === month),
    });
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
              {dataSource === "database" && (
                <span className="ml-2 text-success">• Dados do banco ({contracts.length} registros)</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {profile?.full_name && (
              <span className="text-sm text-muted-foreground hidden sm:inline">
                Olá, <span className="font-medium text-foreground">{profile.full_name}</span>
              </span>
            )}
            <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={() => navigate("/clientes")}>
              <Users className="h-3.5 w-3.5" /> Clientes
            </Button>
            <Button variant="default" size="sm" className="gap-2 text-xs" onClick={() => setImportOpen(true)}>
              <Upload className="h-3.5 w-3.5" /> Importar
            </Button>
            {dataSource === "database" && (
              <Button variant="ghost" size="sm" className="gap-2 text-xs text-muted-foreground" onClick={handleResetToMock}>
                Dados demo
              </Button>
            )}
            <Button variant="ghost" size="sm" className="gap-2 text-xs text-muted-foreground" onClick={signOut}>
              <LogOut className="h-3.5 w-3.5" /> Sair
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

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-4">
          <KPICard title="Total Contratado" value={formatCurrency(totalContracted)} icon={DollarSign} variant="info" animationDelay={0} sparklineData={sparkContracted} />
          <KPICard title="Total Faturado" value={formatCurrency(totalBilled)} icon={TrendingUp} variant="success" animationDelay={50} sparklineData={sparkBilled} />
          <KPICard title="Não Faturado" value={formatCurrency(totalUnbilled)} subtitle="Dinheiro na mesa" icon={AlertTriangle} variant="danger" animationDelay={100} sparklineData={sparkUnbilled} onClick={() => setSectionReport("dinheiroNaMesaDetalhado")} />
          <KPICard title="Vencidos" value={String(expiredCount)} icon={CalendarX} variant="danger" animationDelay={150} onClick={() => setSectionReport("expired")} sparklineData={sparkExpired} />
          <KPICard title="Vencer 90 dias" value={String(expiring90)} icon={Clock} variant="warning" animationDelay={200} onClick={() => setSectionReport("expiring90")} />
          <KPICard title="Vencer 30 dias" value={String(expiring30)} icon={AlertCircle} variant="danger" animationDelay={250} onClick={() => setSectionReport("expiring30")} />
          <KPICard title="Ticket Médio" value={formatCurrency(ticketMedio)} subtitle="Por cliente" icon={Target} variant="info" animationDelay={300} />
          <KPICard title="Relatório Geral" value={String(clients.length)} subtitle="Clientes" icon={FileText} variant="info" animationDelay={350} onClick={() => setSectionReport("general")} />
        </div>

        <DashboardCharts
          clients={clients}
          billingByProduct={billingByProduct}
          contractsByStatus={contractsByStatus}
          distributionByUG={distributionByUG}
          expirationTimeline={expirationTimeline}
          onStatusClick={handleStatusClick}
          onClientClick={handleClientClick}
          onProductClick={handleProductClick}
          onUGClick={handleUGClick}
          onMonthClick={handleMonthClick}
          onTop10Report={() => setSectionReport("top10")}
          onContractedVsBilledReport={() => setSectionReport("contractedVsBilled")}
          onProductReport={() => setSectionReport("byProduct")}
          onUGReport={() => setSectionReport("byUG")}
          onStatusReport={() => setSectionReport("byStatus")}
          onTimelineReport={() => setSectionReport("timeline")}
        />

        <CommercialAnalysis
          clients={clients}
          onConsultorReport={() => setSectionReport("byConsultor")}
          onRegiaoReport={() => setSectionReport("byRegiao")}
        />

        <ConsultorDashboard
          clients={clients}
          contracts={filteredContracts}
          onReport={() => setSectionReport("byConsultorDetalhado")}
        />

        <ActionTables
          clients={clients}
          onClientClick={handleClientClick}
          onRankingReport={() => setSectionReport("ranking")}
          onCriticalReport={() => setSectionReport("critical")}
        />
      </main>

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} onImport={handleImport} onImportToDatabase={importToDatabase} />
      <ChartReportDialog
        title={reportConfig?.title ?? ""}
        contracts={reportConfig?.contracts ?? []}
        open={reportConfig !== null}
        onOpenChange={(open) => { if (!open) setReportConfig(null); }}
      />
      <SectionReportDialog
        reportType={sectionReport ?? "top10"}
        clients={clients}
        contracts={filteredContracts}
        open={sectionReport !== null}
        onOpenChange={(open) => { if (!open) setSectionReport(null); }}
      />
    </div>
  );
}
