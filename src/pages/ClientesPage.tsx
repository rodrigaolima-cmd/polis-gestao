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
import { AppLayout } from "@/components/layout/AppLayout";
import { Plus, Search, Eye, Pencil, FileText } from "lucide-react";
import { normalizeForSearch, fixMojibake } from "@/utils/textUtils";
import { usePersistentModal } from "@/hooks/usePersistentModal";

interface ClientRow {
  id: string;
  codigo_cliente: number | null;
  nome_cliente: string;
  nome_fantasia: string;
  tipo_ug: string;
  regiao: string;
  consultor: string;
  status_cliente: string;
  observacoes_cliente: string;
  cnpj: string;
  email: string;
  celular: string;
  modules_count: number;
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
  const [reportOpen, setReportOpen] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const clientForm = usePersistentModal("clientes:client-form");
  const [editingClient, setEditingClient] = useState<ClientRow | null>(() => {
    // Restore editing client from persistence if modal was open
    if (clientForm.isOpen && clientForm.entityId) {
      return null; // Will be resolved after clients load
    }
    return null;
  });

  const loadClients = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const { data: clientsData, error } = await supabase
        .from("clients")
        .select("*")
        .order("nome_cliente");

      if (error) throw error;

      const { data: modulesData } = await supabase
        .from("client_modules")
        .select("client_id, ativo_no_cliente");

      const moduleCounts = new Map<string, number>();
      (modulesData || []).forEach((m: any) => {
        if (m.ativo_no_cliente) {
          moduleCounts.set(m.client_id, (moduleCounts.get(m.client_id) || 0) + 1);
        }
      });

      const result: ClientRow[] = (clientsData || []).map((c: any) => ({
        id: c.id,
        codigo_cliente: c.codigo_cliente ?? null,
        nome_cliente: fixMojibake(c.nome_cliente),
        nome_fantasia: fixMojibake(c.nome_fantasia || ""),
        tipo_ug: fixMojibake(c.tipo_ug || ""),
        regiao: fixMojibake(c.regiao || ""),
        consultor: fixMojibake(c.consultor || ""),
        status_cliente: c.status_cliente || "Ativo",
        observacoes_cliente: fixMojibake(c.observacoes_cliente || ""),
        cnpj: c.cnpj || "",
        email: c.email || "",
        celular: c.celular || "",
        modules_count: moduleCounts.get(c.id) || 0,
      }));

      setClients(result);

      // Restore editing client if modal was persisted open
      if (clientForm.isOpen && clientForm.entityId) {
        const found = result.find(c => c.id === clientForm.entityId);
        if (found) setEditingClient(found);
      }
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
      if (search) {
        const term = normalizeForSearch(search);
        const fields = [c.nome_cliente, c.nome_fantasia, c.cnpj, c.email].map(normalizeForSearch);
        if (!fields.some(f => f.includes(term))) return false;
      }
      if (filterRegiao && c.regiao !== filterRegiao) return false;
      if (filterConsultor && c.consultor !== filterConsultor) return false;
      if (filterUG && c.tipo_ug !== filterUG) return false;
      if (filterStatus && c.status_cliente !== filterStatus) return false;
      return true;
    });
  }, [clients, search, filterRegiao, filterConsultor, filterUG, filterStatus]);

  const handleEdit = (client: ClientRow) => {
    setEditingClient(client);
    clientForm.open("client-form", client.id);
  };

  const handleNew = () => {
    setEditingClient(null);
    clientForm.open("client-form", null);
  };

  const handleFormClose = () => {
    clientForm.close();
    setEditingClient(null);
  };

  const handleFormSaved = () => {
    loadClients();
  };

  const headerActions = (
    <>
      <Button variant="outline" size="sm" className="gap-2 text-xs hidden sm:flex" onClick={() => setReportOpen(true)}>
        <FileText className="h-3.5 w-3.5" /> Relatório
      </Button>
      <Button size="sm" className="gap-2 text-xs" onClick={handleNew}>
        <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Novo Cliente</span><span className="sm:hidden">Novo</span>
      </Button>
    </>
  );

  return (
    <AppLayout title="Clientes" subtitle="Cadastro de Clientes" headerActions={headerActions}>
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 sm:gap-3 items-end">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Buscar por nome, fantasia, CNPJ, e-mail..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-xs" />
          </div>
          <Select value={filterRegiao || "all"} onValueChange={(v) => setFilterRegiao(v === "all" ? "" : v)}>
            <SelectTrigger className="h-9 w-[130px] sm:w-[150px] text-xs"><SelectValue placeholder="Região" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Regiões</SelectItem>
              {regioes.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterConsultor || "all"} onValueChange={(v) => setFilterConsultor(v === "all" ? "" : v)}>
            <SelectTrigger className="h-9 w-[130px] sm:w-[150px] text-xs"><SelectValue placeholder="Consultor" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Consultores</SelectItem>
              {consultores.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterUG || "all"} onValueChange={(v) => setFilterUG(v === "all" ? "" : v)}>
            <SelectTrigger className="h-9 w-[130px] sm:w-[150px] text-xs"><SelectValue placeholder="Tipo UG" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Tipos</SelectItem>
              {ugTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus || "all"} onValueChange={(v) => setFilterStatus(v === "all" ? "" : v)}>
            <SelectTrigger className="h-9 w-[110px] sm:w-[120px] text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Ativo">Ativo</SelectItem>
              <SelectItem value="Inativo">Inativo</SelectItem>
              <SelectItem value="Prospect">Prospect</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border/30">
                <TableHead className="text-xs text-center w-[70px]">Código</TableHead>
                <TableHead className="text-xs">Cliente</TableHead>
                <TableHead className="text-xs hidden lg:table-cell">Nome Fantasia</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Tipo UG</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Região</TableHead>
                <TableHead className="text-xs hidden lg:table-cell">Consultor</TableHead>
                <TableHead className="text-xs hidden xl:table-cell">CNPJ</TableHead>
                <TableHead className="text-xs hidden xl:table-cell">E-mail</TableHead>
                <TableHead className="text-xs hidden xl:table-cell">Celular</TableHead>
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
                filtered.map((c) => (
                  <TableRow key={c.id} className="border-border/20 hover:bg-muted/30 cursor-pointer" onClick={() => navigate(`/clientes/${c.id}`)}>
                    <TableCell className="text-xs text-center text-muted-foreground">{c.codigo_cliente ?? "—"}</TableCell>
                    <TableCell className="text-xs font-medium">{c.nome_cliente}</TableCell>
                    <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">{c.nome_fantasia || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground hidden md:table-cell">{c.tipo_ug || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground hidden md:table-cell">{c.regiao || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">{c.consultor || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground hidden xl:table-cell">{c.cnpj || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground hidden xl:table-cell">{c.email || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground hidden xl:table-cell">{c.celular || "—"}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={`text-[10px] ${c.status_cliente === "Ativo" ? "bg-success/10 text-success border-success/30" : c.status_cliente === "Prospect" ? "bg-info/10 text-info border-info/30" : "bg-muted text-muted-foreground"}`}>
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
                ))
              )}
            </TableBody>
          </Table>
          </div>
          {!loading && (
            <div className="px-4 py-2 border-t border-border/30 text-xs text-muted-foreground">
              {filtered.length} cliente(s) encontrado(s) • {filtered.reduce((s, c) => s + c.modules_count, 0)} módulo(s)
            </div>
          )}
        </div>
      </div>

      <ClienteForm
        open={clientForm.isOpen}
        onOpenChange={(v) => { if (!v) handleFormClose(); }}
        cliente={editingClient}
        onSaved={handleFormSaved}
        persistKey="clientes:client-form"
      />

      <ClientesReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        filteredClientIds={filtered.map(c => c.id)}
      />
    </AppLayout>
  );
}
