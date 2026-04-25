import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { normalizeForSearch } from "@/utils/textUtils";
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
import { AppLayout } from "@/components/layout/AppLayout";
import {
  DollarSign, TrendingUp, AlertTriangle,
  CalendarX, Clock, AlertCircle, Upload,
  Target, FileText, Users, Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { OperationalLeakAlert } from "@/components/dashboard/OperationalLeakAlert";

interface ReportConfig {
  title: string;
  contracts: ContractRow[];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile, signOut, isAdmin } = useAuth();
  const { logAction } = useAuditLog();
  const { contracts, setContracts, dataSource, importToDatabase, resetToMock, loading, operationalLeaks, includeInactiveOperation, setIncludeInactiveOperation } = useContracts();
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

  const ticketMedio = clients.length > 0 ? totalContracted / clients.length : 0;
  const totalModulos = clients.reduce((s, c) => s + c.productCount, 0);

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

  const headerActions = (
    <>
      <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={() => setImportOpen(true)}>
        <Upload className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Importar</span>
      </Button>
      {dataSource === "database" && (
        <Button variant="ghost" size="sm" className="gap-2 text-xs text-muted-foreground" onClick={handleResetToMock}>
          Dados demo
        </Button>
      )}
    </>
  );

  return (
    <AppLayout
      title="Dashboard"
      subtitle={dataSource === "database" ? `Dados do banco (${contracts.length} contratos)` : "Painel Executivo"}
      headerActions={headerActions}
      onImport={() => setImportOpen(true)}
    >
      {loading && contracts.length === 0 ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Carregando dados...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <FiltersBar
            filters={filters}
            contracts={contracts}
            onFilterChange={setFilters}
            onReset={() => setFilters(defaultFilters)}
            includeInactiveOperation={includeInactiveOperation}
            onIncludeInactiveOperationChange={setIncludeInactiveOperation}
          />

          {/* Financial KPIs - Row 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KPICard size="lg" title="Total Contratado" value={formatCurrency(totalContracted)} icon={DollarSign} variant="info" animationDelay={0} sparklineData={sparkContracted} onClick={() => setSectionReport("contractedVsBilled")} />
            <KPICard size="lg" title="Total Faturado" value={formatCurrency(totalBilled)} icon={TrendingUp} variant="success" animationDelay={50} sparklineData={sparkBilled} onClick={() => setSectionReport("contractedVsBilled")} />
            <KPICard size="lg" title="Não Faturado" value={formatCurrency(totalUnbilled)} subtitle="Dinheiro na mesa" icon={AlertTriangle} variant="danger" animationDelay={100} sparklineData={sparkUnbilled} onClick={() => setSectionReport("dinheiroNaMesaDetalhado")} />
            <KPICard size="lg" title="Ticket Médio" value={formatCurrency(ticketMedio)} subtitle="Por cliente" icon={Target} variant="info" animationDelay={150} />
          </div>

          {/* Operational KPIs - Row 2 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
            <KPICard title="Vencidos" value={String(expiredCount)} icon={CalendarX} variant="danger" animationDelay={200} onClick={() => setSectionReport("expired")} sparklineData={sparkExpired} />
            <KPICard title="Vencer 90 dias" value={String(expiring90)} icon={Clock} variant="warning" animationDelay={250} onClick={() => setSectionReport("expiring90")} />
            <KPICard title="Vencer 30 dias" value={String(expiring30)} icon={AlertCircle} variant="danger" animationDelay={300} onClick={() => setSectionReport("expiring30")} />
            <KPICard title="Total Módulos" value={String(totalModulos)} subtitle={`${clients.length} clientes`} icon={Layers} variant="info" animationDelay={350} onClick={() => setSectionReport("byModulos")} />
            <KPICard title="Relatório Geral" value={String(clients.length)} subtitle="Clientes" icon={FileText} variant="info" animationDelay={400} onClick={() => setSectionReport("general")} />
          </div>

          <OperationalLeakAlert leaks={operationalLeaks} onClick={() => setSectionReport("operationalLeak")} />

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
        </div>
      )}

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
        operationalLeaks={operationalLeaks}
        open={sectionReport !== null}
        onOpenChange={(open) => { if (!open) setSectionReport(null); }}
      />
    </AppLayout>
  );
}
