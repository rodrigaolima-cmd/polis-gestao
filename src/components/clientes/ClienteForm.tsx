import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarIcon, Copy } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { usePersistentFormDraft } from "@/hooks/usePersistentFormDraft";


interface ClienteData {
  id?: string;
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

interface ClienteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente?: Partial<ClienteData> | null;
  onSaved: () => void;
  persistKey?: string;
}



const UF_LIST = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"
];

const EMPTY_FORM: ClienteData = {
  nome_cliente: "", nome_fantasia: "", tipo_ug: "", regiao: "", consultor: "",
  status_cliente: "Ativo", observacoes_cliente: "", codigo_bling: "", cliente_desde: "",
  cnpj: "", municipio: "", uf: "", responsavel_principal: "", cargo_responsavel: "",
  fone: "", celular: "", email: "", email_nfse: "",
};

// Masks
function maskCNPJ(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function maskFone(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 10);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `${d.slice(0, 2)}-${d.slice(2)}`;
  return `${d.slice(0, 2)}-${d.slice(2, 6)} ${d.slice(6)}`;
}

function maskCelular(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `${d.slice(0, 2)}-${d.slice(2)}`;
  return `${d.slice(0, 2)}-${d.slice(2, 7)} ${d.slice(7)}`;
}

function isValidEmail(v: string): boolean {
  if (!v) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function isValidCNPJ(v: string): boolean {
  if (!v) return true;
  return v.replace(/\D/g, "").length === 14;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/50 pb-1 pt-2">
      {children}
    </h3>
  );
}

export function ClienteForm({ open, onOpenChange, cliente, onSaved, persistKey }: ClienteFormProps) {
  const draftKey = persistKey || "client-form-default";
  const draft = usePersistentFormDraft(draftKey);

  const [form, setForm] = useState<ClienteData>(() => {
    // Try to restore from draft first
    const saved = draft.getDraft();
    if (saved) return saved as ClienteData;
    if (cliente) return { ...EMPTY_FORM, ...cliente } as ClienteData;
    return { ...EMPTY_FORM };
  });
  const [saving, setSaving] = useState(false);
  const [regioes, setRegioes] = useState<string[]>([]);
  const [consultores, setConsultores] = useState<string[]>([]);
  const [regiaoManual, setRegiaoManual] = useState(false);
  const [consultorManual, setConsultorManual] = useState(false);
  const [ugTypes, setUgTypes] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!open) return;
    const loadOptions = async () => {
      const [clientsRes, ugRes] = await Promise.all([
        supabase.from("clients").select("regiao, consultor"),
        supabase.from("ug_types").select("nome").order("nome"),
      ]);
      if (clientsRes.data) {
        const r = [...new Set(clientsRes.data.map((d: any) => (d.regiao || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
        const c = [...new Set(clientsRes.data.map((d: any) => (d.consultor || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
        setRegioes(r);
        setConsultores(c);
      }
      setUgTypes(ugRes.data?.map((d: any) => d.nome) || []);
    };
    loadOptions();
  }, [open]);

  // Initialize form: restore draft OR use initial data. Only on first open or when entity changes.
  useEffect(() => {
    if (!open) {
      setInitialized(false);
      return;
    }
    if (initialized) return;

    const saved = draft.getDraft();
    if (saved) {
      setForm(saved as ClienteData);
    } else if (cliente) {
      setForm({ ...EMPTY_FORM, ...cliente } as ClienteData);
    } else {
      setForm({ ...EMPTY_FORM });
    }
    setRegiaoManual(false);
    setConsultorManual(false);
    setInitialized(true);
  }, [open, cliente, initialized]);

  // Persist draft on every form change
  useEffect(() => {
    if (open && initialized) {
      draft.saveDraft(form as any);
    }
  }, [form, open, initialized]);

  const handleSave = async () => {
    if (!form.nome_cliente.trim()) {
      toast.error("Nome do cliente é obrigatório");
      return;
    }
    if (form.cnpj && !isValidCNPJ(form.cnpj)) {
      toast.error("CNPJ deve ter 14 dígitos");
      return;
    }
    if (form.email && !isValidEmail(form.email)) {
      toast.error("E-mail principal inválido");
      return;
    }
    if (form.email_nfse && !isValidEmail(form.email_nfse)) {
      toast.error("E-mail NFSe inválido");
      return;
    }

    const isInactivating = form.status_cliente === "Inativo" && cliente?.status_cliente !== "Inativo";

    const payload = {
      nome_cliente: form.nome_cliente.trim(),
      nome_fantasia: form.nome_fantasia.trim(),
      tipo_ug: form.tipo_ug.toUpperCase(),
      regiao: form.regiao,
      consultor: form.consultor,
      status_cliente: form.status_cliente,
      observacoes_cliente: form.observacoes_cliente,
      codigo_bling: form.codigo_bling.trim(),
      cliente_desde: form.cliente_desde || null,
      cnpj: form.cnpj,
      municipio: form.municipio.trim(),
      uf: form.uf,
      responsavel_principal: form.responsavel_principal.trim(),
      cargo_responsavel: form.cargo_responsavel.trim(),
      fone: form.fone,
      celular: form.celular,
      email: form.email.trim(),
      email_nfse: form.email_nfse.trim(),
    };

    setSaving(true);
    try {
      if (cliente?.id) {
        const { error } = await supabase.from("clients").update(payload).eq("id", cliente.id);
        if (error) throw error;

        if (isInactivating) {
          const shouldCascade = confirm(
            "Deseja inativar todos os módulos deste cliente?\n\nIsso irá:\n• Marcar todos como inativos\n• Zerar valor faturado\n• Desmarcar faturado\n• Alterar status para Inativo"
          );
          if (shouldCascade) {
            await supabase.from("client_modules").update({
              ativo_no_cliente: false,
              faturado_flag: false,
              valor_faturado: 0,
              status_contrato: "Inativo",
            }).eq("client_id", cliente.id);
          }
        }
        toast.success("Cliente atualizado");
      } else {
        const { error } = await supabase.from("clients").insert(payload);
        if (error) throw error;
        toast.success("Cliente criado");
      }
      draft.clearDraft();
      onSaved();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar cliente");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    draft.clearDraft();
    onOpenChange(false);
  };

  const regiaoInList = regioes.includes(form.regiao);
  const consultorInList = consultores.includes(form.consultor);

  const clienteDesdeDate = form.cliente_desde ? new Date(form.cliente_desde + "T00:00:00") : undefined;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) return; onOpenChange(v); }}>
      <DialogContent className="max-w-2xl bg-card border-border max-h-[90vh] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0">
          <DialogTitle>{cliente?.id ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          <DialogDescription>Preencha os dados do cliente.</DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6">
          <div className="space-y-4">
            {/* === DADOS PRINCIPAIS === */}
            <SectionTitle>Dados Principais</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">Nome do Cliente *</Label>
                <Input value={form.nome_cliente} onChange={(e) => setForm({ ...form, nome_cliente: e.target.value })} placeholder="Nome do cliente" className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Nome Fantasia</Label>
                <Input value={form.nome_fantasia} onChange={(e) => setForm({ ...form, nome_fantasia: e.target.value })} placeholder="Nome fantasia" className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tipo de UG</Label>
                <Select value={ugTypes.includes(form.tipo_ug) ? form.tipo_ug : "none"} onValueChange={(v) => setForm({ ...form, tipo_ug: v === "none" ? "" : v })}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Selecionar —</SelectItem>
                    {ugTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {/* Região */}
              <div className="space-y-1.5">
                <Label className="text-xs">Região</Label>
                {regiaoManual || regioes.length === 0 ? (
                  <div className="flex gap-1">
                    <Input value={form.regiao} onChange={(e) => setForm({ ...form, regiao: e.target.value })} placeholder="Digitar região" className="h-9 text-xs" />
                    {regioes.length > 0 && (
                      <Button type="button" variant="ghost" size="sm" className="h-9 text-[10px] px-2 shrink-0" onClick={() => setRegiaoManual(false)}>Lista</Button>
                    )}
                  </div>
                ) : (
                  <Select value={regiaoInList ? form.regiao : (form.regiao ? "__custom__" : "none")} onValueChange={(v) => { if (v === "__other__") setRegiaoManual(true); else if (v === "none") setForm({ ...form, regiao: "" }); else setForm({ ...form, regiao: v }); }}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecionar região" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Selecionar —</SelectItem>
                      {!regiaoInList && form.regiao && <SelectItem value="__custom__">{form.regiao}</SelectItem>}
                      {regioes.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      <SelectItem value="__other__">Outro...</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              {/* Consultor */}
              <div className="space-y-1.5">
                <Label className="text-xs">Consultor</Label>
                {consultorManual || consultores.length === 0 ? (
                  <div className="flex gap-1">
                    <Input value={form.consultor} onChange={(e) => setForm({ ...form, consultor: e.target.value })} placeholder="Digitar consultor" className="h-9 text-xs" />
                    {consultores.length > 0 && (
                      <Button type="button" variant="ghost" size="sm" className="h-9 text-[10px] px-2 shrink-0" onClick={() => setConsultorManual(false)}>Lista</Button>
                    )}
                  </div>
                ) : (
                  <Select value={consultorInList ? form.consultor : (form.consultor ? "__custom__" : "none")} onValueChange={(v) => { if (v === "__other__") setConsultorManual(true); else if (v === "none") setForm({ ...form, consultor: "" }); else setForm({ ...form, consultor: v }); }}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecionar consultor" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Selecionar —</SelectItem>
                      {!consultorInList && form.consultor && <SelectItem value="__custom__">{form.consultor}</SelectItem>}
                      {consultores.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      <SelectItem value="__other__">Outro...</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={form.status_cliente} onValueChange={(v) => setForm({ ...form, status_cliente: v })}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                    <SelectItem value="Prospect">Prospect</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Código Bling</Label>
                <Input value={form.codigo_bling} onChange={(e) => setForm({ ...form, codigo_bling: e.target.value })} placeholder="Código no Bling" className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Cliente desde</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("h-9 w-full justify-start text-left text-xs font-normal", !clienteDesdeDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                      {clienteDesdeDate ? format(clienteDesdeDate, "dd/MM/yyyy") : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={clienteDesdeDate}
                      onSelect={(d) => setForm({ ...form, cliente_desde: d ? format(d, "yyyy-MM-dd") : "" })}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* === DADOS CADASTRAIS / FISCAIS === */}
            <SectionTitle>Dados Cadastrais / Fiscais</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">CNPJ</Label>
                <Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: maskCNPJ(e.target.value) })} placeholder="XX.XXX.XXX/XXXX-XX" className="h-9 text-xs" maxLength={18} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Município</Label>
                <Input value={form.municipio} onChange={(e) => setForm({ ...form, municipio: e.target.value })} placeholder="Município" className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">UF</Label>
                <Select value={form.uf || "none"} onValueChange={(v) => setForm({ ...form, uf: v === "none" ? "" : v })}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Selecionar —</SelectItem>
                    {UF_LIST.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Responsável Principal</Label>
                <Input value={form.responsavel_principal} onChange={(e) => setForm({ ...form, responsavel_principal: e.target.value })} placeholder="Nome do responsável" className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Cargo do Responsável</Label>
                <Input value={form.cargo_responsavel} onChange={(e) => setForm({ ...form, cargo_responsavel: e.target.value })} placeholder="Cargo" className="h-9 text-xs" />
              </div>
            </div>

            {/* === CONTATO === */}
            <SectionTitle>Contato</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Fone</Label>
                <Input value={form.fone} onChange={(e) => setForm({ ...form, fone: maskFone(e.target.value) })} placeholder="XX-XXXX XXXX" className="h-9 text-xs" maxLength={12} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Celular</Label>
                <Input value={form.celular} onChange={(e) => setForm({ ...form, celular: maskCelular(e.target.value) })} placeholder="XX-XXXXX XXXX" className="h-9 text-xs" maxLength={13} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">E-mail</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">E-mail para envio NFSe</Label>
                <div className="flex gap-1">
                  <Input type="email" value={form.email_nfse} onChange={(e) => setForm({ ...form, email_nfse: e.target.value })} placeholder="email@nfse.com" className="h-9 text-xs" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9 text-[10px] px-2 shrink-0 gap-1"
                    onClick={() => { if (form.email) { setForm({ ...form, email_nfse: form.email }); toast.info("E-mail principal copiado"); } else { toast.warning("Preencha o e-mail principal primeiro"); } }}
                    title="Copiar e-mail principal"
                  >
                    <Copy className="h-3 w-3" /> Copiar
                  </Button>
                </div>
              </div>
            </div>

            {/* === OBSERVAÇÕES === */}
            <SectionTitle>Observações</SectionTitle>
            <div className="space-y-1.5">
              <Textarea value={form.observacoes_cliente} onChange={(e) => setForm({ ...form, observacoes_cliente: e.target.value })} rows={2} placeholder="Observações sobre o cliente" />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 pb-1">
              <Button variant="outline" size="sm" onClick={handleCancel}>Cancelar</Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
