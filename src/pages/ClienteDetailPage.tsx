import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ClienteForm } from "@/components/clientes/ClienteForm";
import { ClienteModuloForm } from "@/components/clientes/ClienteModuloForm";
import { ClienteMultiModuloForm } from "@/components/clientes/ClienteMultiModuloForm";
import { CopyDatesDialog } from "@/components/clientes/CopyDatesDialog";
import { ArrowLeft, Pencil, Plus, MoreVertical, CheckCircle, XCircle, Trash2, Copy, ListPlus } from "lucide-react";
import { formatCurrency, formatDate, getDaysToExpire, getExpirationStatus } from "@/utils/contractUtils";
import { toast } from "sonner";

interface ClientData {
  id: string;
  nome_cliente: string;
  tipo_ug: string;
  regiao: string;
  consultor: string;
  status_cliente: string;
  observacoes_cliente: string;
}

interface ClientModuleRow {
  id: string;
  modulo_id: string;
  nome_modulo: string;
  valor_contratado: number;
  valor_faturado: number;
  data_assinatura: string;
  vencimento_contrato: string;
  faturado_flag: boolean;
  status_contrato: string;
  observacoes: string;
  ativo_no_cliente: boolean;
}

export default function ClienteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<ClientData | null>(null);
  const [modules, setModules] = useState<ClientModuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editClientOpen, setEditClientOpen] = useState(false);
  const [moduleFormOpen, setModuleFormOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<ClientModuleRow | null>(null);
  const [copyDatesOpen, setCopyDatesOpen] = useState(false);
  const [multiModuleFormOpen, setMultiModuleFormOpen] = useState(false);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .single();

      if (clientError) throw clientError;
      setClient(clientData);

      const { data: modulesData, error: modulesError } = await supabase
        .from("client_modules")
        .select("*, modules(nome_modulo)")
        .eq("client_id", id)
        .order("created_at", { ascending: false });

      if (modulesError) throw modulesError;

      const mapped = (modulesData || []).map((m: any) => ({
          id: m.id,
          modulo_id: m.modulo_id,
          nome_modulo: m.modules?.nome_modulo || "",
          valor_contratado: Number(m.valor_contratado) || 0,
          valor_faturado: Number(m.valor_faturado) || 0,
          data_assinatura: m.data_assinatura || "",
          vencimento_contrato: m.vencimento_contrato || "",
          faturado_flag: m.faturado_flag,
          status_contrato: m.status_contrato || "",
          observacoes: m.observacoes || "",
          ativo_no_cliente: m.ativo_no_cliente,
        }));
      mapped.sort((a, b) => a.nome_modulo.localeCompare(b.nome_modulo, "pt-BR"));
      setModules(mapped);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar dados do cliente");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [id]);

  const toggleActive = async (mod: ClientModuleRow) => {
    await supabase.from("client_modules").update({ ativo_no_cliente: !mod.ativo_no_cliente }).eq("id", mod.id);
    toast.success(mod.ativo_no_cliente ? "Módulo inativado" : "Módulo ativado");
    loadData();
  };

  const deleteModule = async (mod: ClientModuleRow) => {
    if (!confirm(`Excluir vínculo do módulo "${mod.nome_modulo}"?`)) return;
    await supabase.from("client_modules").delete().eq("id", mod.id);
    toast.success("Vínculo excluído");
    loadData();
  };

  const handleEditModule = (mod: ClientModuleRow) => {
    setEditingModule(mod);
    setModuleFormOpen(true);
  };

  const handleAddModule = () => {
    setEditingModule(null);
    setModuleFormOpen(true);
  };

  const handleModuleFormOpenChange = (open: boolean) => {
    setModuleFormOpen(open);
    if (!open) setEditingModule(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Carregando...</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Cliente não encontrado</p>
        <Button variant="outline" onClick={() => navigate("/clientes")}>Voltar</Button>
      </div>
    );
  }

  const totalContratado = modules.reduce((s, m) => s + m.valor_contratado, 0);
  const totalFaturado = modules.reduce((s, m) => s + m.valor_faturado, 0);
  const totalDiff = totalContratado - totalFaturado;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/clientes")} className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{client.nome_cliente}</h1>
              <p className="text-xs text-muted-foreground">Detalhes do Cliente</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={() => setEditClientOpen(true)}>
            <Pencil className="h-3.5 w-3.5" /> Editar Cliente
          </Button>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        {/* Client Info */}
        <div className="glass-card rounded-xl p-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tipo UG</p>
            <p className="text-sm font-medium">{client.tipo_ug || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Região</p>
            <p className="text-sm font-medium">{client.regiao || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Consultor</p>
            <p className="text-sm font-medium">{client.consultor || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Status</p>
            <Badge variant={client.status_cliente === "Ativo" ? "default" : "secondary"} className="text-[10px] mt-0.5">
              {client.status_cliente}
            </Badge>
          </div>
          <div className="col-span-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Observações</p>
            <p className="text-sm">{client.observacoes_cliente || "—"}</p>
          </div>
        </div>

        {/* Modules */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border/30 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Módulos do Cliente</h2>
            <div className="flex items-center gap-2">
              {modules.length >= 2 && (
                <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={() => setCopyDatesOpen(true)}>
                  <Copy className="h-3.5 w-3.5" /> Aplicar datas para todos
                </Button>
              )}
              <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={() => setMultiModuleFormOpen(true)}>
                <ListPlus className="h-3.5 w-3.5" /> Adicionar Vários
              </Button>
              <Button size="sm" className="gap-2 text-xs" onClick={handleAddModule}>
                <Plus className="h-3.5 w-3.5" /> Adicionar Módulo
              </Button>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-border/30">
                <TableHead className="text-xs">Módulo</TableHead>
                <TableHead className="text-xs text-right">Contratado</TableHead>
                <TableHead className="text-xs text-right">Faturado</TableHead>
                <TableHead className="text-xs text-right">Diferença</TableHead>
                <TableHead className="text-xs">Assinatura</TableHead>
                <TableHead className="text-xs">Vencimento</TableHead>
                <TableHead className="text-xs text-center">Status</TableHead>
                <TableHead className="text-xs text-center">Ativo</TableHead>
                <TableHead className="text-xs text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modules.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center text-xs text-muted-foreground py-8">Nenhum módulo vinculado</TableCell></TableRow>
              ) : (
                modules.map((m) => {
                  const diff = m.valor_contratado - m.valor_faturado;
                  const days = m.vencimento_contrato ? getDaysToExpire(m.vencimento_contrato) : null;
                  const expStatus = days !== null ? getExpirationStatus(days) : null;

                  return (
                    <TableRow key={m.id} className={`border-border/20 ${!m.ativo_no_cliente ? "opacity-50" : ""}`}>
                      <TableCell className="text-xs font-medium">{m.nome_modulo}</TableCell>
                      <TableCell className="text-xs text-right mono">{formatCurrency(m.valor_contratado)}</TableCell>
                      <TableCell className="text-xs text-right mono">{formatCurrency(m.valor_faturado)}</TableCell>
                      <TableCell className={`text-xs text-right mono ${diff > 0 ? "text-warning" : diff < 0 ? "text-danger" : ""}`}>
                        {formatCurrency(diff)}
                      </TableCell>
                      <TableCell className="text-xs">{formatDate(m.data_assinatura)}</TableCell>
                      <TableCell className="text-xs">
                        <span className={expStatus === "expired" ? "text-danger" : expStatus === "critical" ? "text-danger" : expStatus === "warning" ? "text-warning" : ""}>
                          {formatDate(m.vencimento_contrato)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="text-[10px]">{m.status_contrato}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {m.ativo_no_cliente ? (
                          <CheckCircle className="h-4 w-4 text-success mx-auto" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => toggleActive(m)}>
                              {m.ativo_no_cliente ? "Inativar módulo" : "Ativar módulo"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditModule(m)}>Editar contrato</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteModule(m)}>
                              <Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir vínculo
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
            {modules.length > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell className="text-xs font-semibold">Total ({modules.length} módulos)</TableCell>
                  <TableCell className="text-xs text-right mono font-semibold">{formatCurrency(totalContratado)}</TableCell>
                  <TableCell className="text-xs text-right mono font-semibold">{formatCurrency(totalFaturado)}</TableCell>
                  <TableCell className={`text-xs text-right mono font-semibold ${totalDiff > 0 ? "text-warning" : totalDiff < 0 ? "text-danger" : ""}`}>
                    {formatCurrency(totalDiff)}
                  </TableCell>
                  <TableCell colSpan={5} />
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </div>
      </main>

      <ClienteForm
        open={editClientOpen}
        onOpenChange={setEditClientOpen}
        cliente={client}
        onSaved={loadData}
      />

      {id && (
        <ClienteModuloForm
          key={editingModule?.id ?? "new"}
          open={moduleFormOpen}
          onOpenChange={handleModuleFormOpenChange}
          clientId={id}
          existingModule={editingModule}
          onSaved={loadData}
        />
      )}

      {id && (
        <ClienteMultiModuloForm
          open={multiModuleFormOpen}
          onOpenChange={setMultiModuleFormOpen}
          clientId={id}
          onSaved={loadData}
        />
      )}

      {id && (
        <CopyDatesDialog
          open={copyDatesOpen}
          onOpenChange={setCopyDatesOpen}
          clientId={id}
          moduleCount={modules.length}
          initialAssinatura={modules[0]?.data_assinatura || ""}
          initialVencimento={modules[0]?.vencimento_contrato || ""}
          onSaved={loadData}
        />
      )}
    </div>
  );
}
