import { useState, useEffect, useCallback } from "react";
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
import { AppLayout } from "@/components/layout/AppLayout";
import { Pencil, Plus, MoreVertical, CheckCircle, XCircle, Trash2, Copy } from "lucide-react";
import { formatCurrency, formatDate, getDaysToExpire, getExpirationStatus } from "@/utils/contractUtils";
import { toast } from "sonner";

interface ClientData {
  id: string;
  codigo_cliente: number | null;
  nome_cliente: string;
  nome_fantasia: string;
  tipo_ug: string;
  regiao: string;
  consultor: string;
  status_cliente: string;
  observacoes_cliente: string;
  codigo_bling: string;
  cliente_desde: string;
  cnpj: string;
  municipio: string;
  uf: string;
  responsavel_principal: string;
  cargo_responsavel: string;
  fone: string;
  celular: string;
  email: string;
  email_nfse: string;
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

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  );
}

export default function ClienteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<ClientData | null>(null);
  const [modules, setModules] = useState<ClientModuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editClientOpen, setEditClientOpen] = useState(false);
  const [moduleFormOpen, setModuleFormOpen] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [copyDatesOpen, setCopyDatesOpen] = useState(false);
  const [multiModuleFormOpen, setMultiModuleFormOpen] = useState(false);

  const mapModules = (modulesData: any[]): ClientModuleRow[] => {
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
    return mapped;
  };

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
      setClient({
        id: clientData.id,
        codigo_cliente: clientData.codigo_cliente ?? null,
        nome_cliente: clientData.nome_cliente,
        nome_fantasia: clientData.nome_fantasia || "",
        tipo_ug: clientData.tipo_ug || "",
        regiao: clientData.regiao || "",
        consultor: clientData.consultor || "",
        status_cliente: clientData.status_cliente || "Ativo",
        observacoes_cliente: clientData.observacoes_cliente || "",
        codigo_bling: clientData.codigo_bling || "",
        cliente_desde: clientData.cliente_desde || "",
        cnpj: clientData.cnpj || "",
        municipio: clientData.municipio || "",
        uf: clientData.uf || "",
        responsavel_principal: clientData.responsavel_principal || "",
        cargo_responsavel: clientData.cargo_responsavel || "",
        fone: clientData.fone || "",
        celular: clientData.celular || "",
        email: clientData.email || "",
        email_nfse: clientData.email_nfse || "",
      });

      const { data: modulesData, error: modulesError } = await supabase
        .from("client_modules")
        .select("*, modules(nome_modulo)")
        .eq("client_id", id);

      if (modulesError) throw modulesError;
      setModules(mapModules(modulesData || []));
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar dados do cliente");
    } finally {
      setLoading(false);
    }
  };

  const reloadModules = useCallback(async () => {
    if (!id) return;
    try {
      const { data: modulesData, error: modulesError } = await supabase
        .from("client_modules")
        .select("*, modules(nome_modulo)")
        .eq("client_id", id);

      if (modulesError) throw modulesError;
      setModules(mapModules(modulesData || []));
    } catch (err) {
      console.error(err);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [id]);

  const toggleActive = async (mod: ClientModuleRow) => {
    if (mod.ativo_no_cliente) {
      await supabase.from("client_modules").update({
        ativo_no_cliente: false,
        faturado_flag: false,
        valor_faturado: 0,
        status_contrato: "Inativo",
      }).eq("id", mod.id);
      toast.success("Módulo inativado");
    } else {
      await supabase.from("client_modules").update({
        ativo_no_cliente: true,
        status_contrato: "Ativo",
      }).eq("id", mod.id);
      toast.success("Módulo ativado");
    }
    reloadModules();
  };

  const deleteModule = async (mod: ClientModuleRow) => {
    if (!confirm(`Excluir vínculo do módulo "${mod.nome_modulo}"?`)) return;
    await supabase.from("client_modules").delete().eq("id", mod.id);
    toast.success("Vínculo excluído");
    reloadModules();
  };

  const handleEditModule = (mod: ClientModuleRow) => {
    setEditingModuleId(mod.id);
    setModuleFormOpen(true);
  };

  const handleAddModule = () => {
    setEditingModuleId(null);
    setModuleFormOpen(true);
  };

  const handleModuleFormOpenChange = (open: boolean) => {
    setModuleFormOpen(open);
  };

  if (loading) {
    return (
      <AppLayout title="Carregando...">
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </div>
      </AppLayout>
    );
  }

  if (!client) {
    return (
      <AppLayout title="Cliente não encontrado">
        <div className="flex flex-col items-center justify-center gap-4 min-h-[60vh]">
          <p className="text-muted-foreground">Cliente não encontrado</p>
          <Button variant="outline" onClick={() => navigate("/clientes")}>Voltar</Button>
        </div>
      </AppLayout>
    );
  }

  const totalContratado = modules.reduce((s, m) => s + m.valor_contratado, 0);
  const totalFaturado = modules.reduce((s, m) => s + m.valor_faturado, 0);
  const totalDiff = totalContratado - totalFaturado;

  const clientTitle = `${client.codigo_cliente ? `#${client.codigo_cliente} — ` : ""}${client.nome_cliente}`;

  const headerActions = (
    <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={() => setEditClientOpen(true)}>
      <Pencil className="h-3.5 w-3.5" /> Editar Cliente
    </Button>
  );

  const formatClienteDesde = (d: string) => {
    if (!d) return "—";
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  };

  return (
    <AppLayout title={clientTitle} subtitle="Detalhes do Cliente" headerActions={headerActions}>
      <div className="space-y-6">
        {/* Client Info - Dados Principais */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-5 space-y-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dados Principais</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <InfoItem label="Nome Fantasia" value={client.nome_fantasia} />
            <InfoItem label="Tipo UG" value={client.tipo_ug} />
            <InfoItem label="Região" value={client.regiao} />
            <InfoItem label="Consultor" value={client.consultor} />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Status</p>
              <Badge variant="outline" className={`text-[10px] mt-0.5 ${client.status_cliente === "Ativo" ? "bg-success/10 text-success border-success/30" : client.status_cliente === "Prospect" ? "bg-info/10 text-info border-info/30" : "bg-muted text-muted-foreground"}`}>
                {client.status_cliente}
              </Badge>
            </div>
            <InfoItem label="Código Bling" value={client.codigo_bling} />
            <InfoItem label="Cliente desde" value={formatClienteDesde(client.cliente_desde)} />
          </div>
        </div>

        {/* Dados Cadastrais */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-5 space-y-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dados Cadastrais / Fiscais</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <InfoItem label="CNPJ" value={client.cnpj} />
            <InfoItem label="Município" value={client.municipio} />
            <InfoItem label="UF" value={client.uf} />
            <InfoItem label="Responsável Principal" value={client.responsavel_principal} />
            <InfoItem label="Cargo do Responsável" value={client.cargo_responsavel} />
          </div>
        </div>

        {/* Contato */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-5 space-y-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contato</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <InfoItem label="Fone" value={client.fone} />
            <InfoItem label="Celular" value={client.celular} />
            <InfoItem label="E-mail" value={client.email} />
            <InfoItem label="E-mail NFSe" value={client.email_nfse} />
          </div>
        </div>

        {/* Observações */}
        {client.observacoes_cliente && (
          <div className="bg-card border border-border rounded-xl shadow-sm p-5 space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Observações</h3>
            <p className="text-sm">{client.observacoes_cliente}</p>
          </div>
        )}

        {/* Modules */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border/30 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Módulos do Cliente</h2>
            <div className="flex items-center gap-2">
              {modules.length >= 2 && (
                <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={() => setCopyDatesOpen(true)}>
                  <Copy className="h-3.5 w-3.5" /> Aplicar datas para todos
                </Button>
              )}
              <Button size="sm" className="gap-2 text-xs" onClick={() => setMultiModuleFormOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Adicionar Módulos
              </Button>
            </div>
          </div>
          <Table>
            <TableHeader className="bg-muted/50">
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
                    <TableRow key={m.id} className={`border-border/20 cursor-pointer hover:bg-muted/50 transition-colors ${!m.ativo_no_cliente ? "opacity-50" : ""}`} onClick={() => handleEditModule(m)}>
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
                        <Badge variant="outline" className={`text-[10px] ${m.status_contrato === "Ativo" ? "bg-success/10 text-success border-success/30" : m.status_contrato === "Inativo" ? "bg-muted text-muted-foreground" : "bg-info/10 text-info border-info/30"}`}>{m.status_contrato}</Badge>
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
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
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
      </div>

      <ClienteForm
        open={editClientOpen}
        onOpenChange={setEditClientOpen}
        cliente={client}
        onSaved={loadData}
      />

      {id && (
        <ClienteModuloForm
          key={editingModuleId || 'new'}
          open={moduleFormOpen}
          onOpenChange={handleModuleFormOpenChange}
          clientId={id}
          existingModuleId={editingModuleId}
          initialData={editingModuleId ? modules.find(m => m.id === editingModuleId) || null : null}
          onSaved={reloadModules}
        />
      )}

      {id && (
        <ClienteMultiModuloForm
          open={multiModuleFormOpen}
          onOpenChange={setMultiModuleFormOpen}
          clientId={id}
          onSaved={reloadModules}
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
          onSaved={reloadModules}
        />
      )}
    </AppLayout>
  );
}
