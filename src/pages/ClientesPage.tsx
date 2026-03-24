import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ClienteForm } from "@/components/clientes/ClienteForm";
import { ClientesReportDialog } from "@/components/clientes/ClientesReportDialog";
import { Users, Plus, Search, Eye, Pencil, ArrowLeft, FileText } from "lucide-react";
import { formatCurrency, formatDate, getDaysToExpire, getExpirationStatus } from "@/utils/contractUtils";
import { normalizeForSearch, fixMojibake } from "@/utils/textUtils";

interface ClientRow {
  id: string;
  nome_cliente: string;
  tipo_ug: string;
  regiao: string;
  consultor: string;
  status_cliente: string;
  observacoes_cliente: string;
  modules_count: number;
  total_contratado: number;
  total_faturado: number;
  proximo_vencimento: string | null;
}

export default function ClientesPage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRegiao, setFilterRegiao] = useState("");
  const [filterConsultor, setFilterConsultor] = useState("");
  const [filterUG, setFilterUG] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientRow | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const loadClients = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const { data: clientsData, error } = await supabase
        .from("clients")
        .select("*")
        .order("nome_cliente");

      if (error) throw error;

      // Get aggregated module data for each client
      const { data: modulesData } = await supabase
        .from("client_modules")
        .select("client_id, valor_contratado, valor_faturado, vencimento_contrato, ativo_no_cliente");

      const modulesByClient = new Map<string, typeof modulesData>();
      (modulesData || []).forEach((m: any) => {
        const existing = modulesByClient.get(m.client_id) || [];
        existing.push(m);
        modulesByClient.set(m.client_id, existing);
      });

      const result: ClientRow[] = (clientsData || []).map((c: any) => {
        const mods = modulesByClient.get(c.id) || [];
        const activeMods = mods.filter((m: any) => m.ativo_no_cliente);
        const totalContratado = mods.reduce((s: number, m: any) => s + (Number(m.valor_contratado) || 0), 0);
        const totalFaturado = mods.reduce((s: number, m: any) => {
          // Módulos inativos não contam como faturado
          if (m.ativo_no_cliente === false) return s;
          return s + (Number(m.valor_faturado) || 0);
        }, 0);
        const vencimentos = mods
          .map((m: any) => m.vencimento_contrato)
          .filter(Boolean)
          .sort();

        return {
          id: c.id,
          nome_cliente: fixMojibake(c.nome_cliente),
          tipo_ug: fixMojibake(c.tipo_ug || ""),
          regiao: fixMojibake(c.regiao || ""),
          consultor: fixMojibake(c.consultor || ""),
          status_cliente: c.status_cliente || "Ativo",
          observacoes_cliente: fixMojibake(c.observacoes_cliente || ""),
          modules_count: activeMods.length,
          total_contratado: totalContratado,
          total_faturado: totalFaturado,
          proximo_vencimento: vencimentos[0] || null,
        };
      });

      setClients(result);
    } catch (err) {
      console.error("Erro ao carregar clientes:", err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadClients(); }, []);

  const regioes = useMemo(() => [...new Set(clients.map(c => c.regiao).filter(Boolean))].sort(), [clients]);
  const consultores = useMemo(() => [...new Set(clients.map(c => c.consultor).filter(Boolean))].sort(), [clients]);
  const ugTypes = useMemo(() => [...new Set(clients.map(c => c.tipo_ug).filter(Boolean))].sort(), [clients]);

  const filtered = useMemo(() => {
    return clients.filter(c => {
      if (search && !normalizeForSearch(c.nome_cliente).includes(normalizeForSearch(search))) return false;
      if (filterRegiao && c.regiao !== filterRegiao) return false;
      if (filterConsultor && c.consultor !== filterConsultor) return false;
      if (filterUG && c.tipo_ug !== filterUG) return false;
      if (filterStatus && c.status_cliente !== filterStatus) return false;
      return true;
    });
  }, [clients, search, filterRegiao, filterConsultor, filterUG, filterStatus]);

  const handleEdit = (client: ClientRow) => {
    setEditingClient(client);
    setFormOpen(true);
  };

  const handleNew = () => {
    setEditingClient(null);
    setFormOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" /> Clientes
              </h1>
              <p className="text-xs text-muted-foreground">Polis Gestão • Cadastro de Clientes</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={() => setReportOpen(true)}>
              <FileText className="h-3.5 w-3.5" /> Relatório Completo
            </Button>
            <Button size="sm" className="gap-2 text-xs" onClick={handleNew}>
              <Plus className="h-3.5 w-3.5" /> Novo Cliente
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Buscar por nome..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-xs" />
          </div>
          <Select value={filterRegiao || "all"} onValueChange={(v) => setFilterRegiao(v === "all" ? "" : v)}>
            <SelectTrigger className="h-9 w-[150px] text-xs"><SelectValue placeholder="Região" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Regiões</SelectItem>
              {regioes.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterConsultor || "all"} onValueChange={(v) => setFilterConsultor(v === "all" ? "" : v)}>
            <SelectTrigger className="h-9 w-[150px] text-xs"><SelectValue placeholder="Consultor" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Consultores</SelectItem>
              {consultores.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterUG || "all"} onValueChange={(v) => setFilterUG(v === "all" ? "" : v)}>
            <SelectTrigger className="h-9 w-[150px] text-xs"><SelectValue placeholder="Tipo UG" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Tipos</SelectItem>
              {ugTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus || "all"} onValueChange={(v) => setFilterStatus(v === "all" ? "" : v)}>
            <SelectTrigger className="h-9 w-[120px] text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Ativo">Ativo</SelectItem>
              <SelectItem value="Inativo">Inativo</SelectItem>
              <SelectItem value="Prospect">Prospect</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="glass-card rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border/30">
                <TableHead className="text-xs">Cliente</TableHead>
                <TableHead className="text-xs">Tipo UG</TableHead>
                <TableHead className="text-xs">Região</TableHead>
                <TableHead className="text-xs">Consultor</TableHead>
                <TableHead className="text-xs text-center">Módulos</TableHead>
                <TableHead className="text-xs text-right">Contratado</TableHead>
                <TableHead className="text-xs text-right">Faturado</TableHead>
                <TableHead className="text-xs text-right">Diferença</TableHead>
                <TableHead className="text-xs">Vencimento</TableHead>
                <TableHead className="text-xs text-center">Status</TableHead>
                <TableHead className="text-xs text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={11} className="text-center text-xs text-muted-foreground py-8">Carregando...</TableCell></TableRow>
              ) : loadError ? (
                <TableRow><TableCell colSpan={11} className="text-center py-8">
                  <p className="text-xs text-destructive mb-2">Erro ao carregar dados</p>
                  <Button variant="outline" size="sm" onClick={loadClients} className="text-xs">Tentar novamente</Button>
                </TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={11} className="text-center text-xs text-muted-foreground py-8">Nenhum cliente encontrado</TableCell></TableRow>
              ) : (
                filtered.map((c) => {
                  const diff = c.total_contratado - c.total_faturado;
                  const days = c.proximo_vencimento ? getDaysToExpire(c.proximo_vencimento) : null;
                  const expStatus = days !== null ? getExpirationStatus(days) : null;

                  return (
                    <TableRow key={c.id} className="border-border/20 hover:bg-muted/30 cursor-pointer" onClick={() => navigate(`/clientes/${c.id}`)}>
                      <TableCell className="text-xs font-medium">{c.nome_cliente}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{c.tipo_ug}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{c.regiao}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{c.consultor}</TableCell>
                      <TableCell className="text-xs text-center">{c.modules_count}</TableCell>
                      <TableCell className="text-xs text-right mono">{formatCurrency(c.total_contratado)}</TableCell>
                      <TableCell className="text-xs text-right mono">{formatCurrency(c.total_faturado)}</TableCell>
                      <TableCell className={`text-xs text-right mono ${diff > 0 ? "text-warning" : diff < 0 ? "text-danger" : ""}`}>
                        {formatCurrency(diff)}
                      </TableCell>
                      <TableCell className="text-xs">
                        {c.proximo_vencimento ? (
                          <span className={expStatus === "expired" ? "text-danger" : expStatus === "critical" ? "text-danger" : expStatus === "warning" ? "text-warning" : ""}>
                            {formatDate(c.proximo_vencimento)}
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={c.status_cliente === "Ativo" ? "default" : "secondary"} className="text-[10px]">
                          {c.status_cliente}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/clientes/${c.id}`)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(c)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          {!loading && (
            <div className="px-4 py-2 border-t border-border/30 text-xs text-muted-foreground">
              {filtered.length} cliente(s) encontrado(s)
            </div>
          )}
        </div>
      </main>

      <ClienteForm
        open={formOpen}
        onOpenChange={setFormOpen}
        cliente={editingClient}
        onSaved={loadClients}
      />

      <ClientesReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        filteredClientIds={filtered.map(c => c.id)}
      />
    </div>
  );
}
