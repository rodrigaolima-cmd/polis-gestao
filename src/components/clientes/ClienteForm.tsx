import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ClienteData {
  id?: string;
  nome_cliente: string;
  tipo_ug: string;
  regiao: string;
  consultor: string;
  status_cliente: string;
  observacoes_cliente: string;
}

interface ClienteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente?: ClienteData | null;
  onSaved: () => void;
}

const UG_TYPES = ["PREFEITURA", "CÂMARA", "AUTARQUIA", "CONSÓRCIO", "FUNDO", "INSTITUTO", "SAAE", "RPPS"];

export function ClienteForm({ open, onOpenChange, cliente, onSaved }: ClienteFormProps) {
  const [form, setForm] = useState<ClienteData>({
    nome_cliente: "",
    tipo_ug: "",
    regiao: "",
    consultor: "",
    status_cliente: "Ativo",
    observacoes_cliente: "",
  });
  const [saving, setSaving] = useState(false);
  const [regioes, setRegioes] = useState<string[]>([]);
  const [consultores, setConsultores] = useState<string[]>([]);
  const [regiaoManual, setRegiaoManual] = useState(false);
  const [consultorManual, setConsultorManual] = useState(false);

  useEffect(() => {
    if (!open) return;
    const loadOptions = async () => {
      const { data } = await supabase.from("clients").select("regiao, consultor");
      if (data) {
        const r = [...new Set(data.map((d: any) => (d.regiao || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
        const c = [...new Set(data.map((d: any) => (d.consultor || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
        setRegioes(r);
        setConsultores(c);
      }
    };
    loadOptions();
  }, [open]);

  useEffect(() => {
    if (cliente) {
      setForm(cliente);
      setRegiaoManual(false);
      setConsultorManual(false);
    } else {
      setForm({
        nome_cliente: "",
        tipo_ug: "",
        regiao: "",
        consultor: "",
        status_cliente: "Ativo",
        observacoes_cliente: "",
      });
      setRegiaoManual(false);
      setConsultorManual(false);
    }
  }, [cliente, open]);

  const handleSave = async () => {
    if (!form.nome_cliente.trim()) {
      toast.error("Nome do cliente é obrigatório");
      return;
    }

    // Check if changing to Inativo from another status
    const isInactivating = form.status_cliente === "Inativo" && cliente?.status_cliente !== "Inativo";

    setSaving(true);
    try {
      if (cliente?.id) {
        const { error } = await supabase.from("clients").update({
          nome_cliente: form.nome_cliente.trim(),
          tipo_ug: form.tipo_ug.toUpperCase(),
          regiao: form.regiao,
          consultor: form.consultor,
          status_cliente: form.status_cliente,
          observacoes_cliente: form.observacoes_cliente,
        }).eq("id", cliente.id);
        if (error) throw error;

        // Cascade inactivation of all modules
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
        const { error } = await supabase.from("clients").insert({
          nome_cliente: form.nome_cliente.trim(),
          tipo_ug: form.tipo_ug.toUpperCase(),
          regiao: form.regiao,
          consultor: form.consultor,
          status_cliente: form.status_cliente,
          observacoes_cliente: form.observacoes_cliente,
        });
        if (error) throw error;
        toast.success("Cliente criado");
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar cliente");
    } finally {
      setSaving(false);
    }
  };

  // Check if current value is in the list, if not show it as selected anyway
  const regiaoInList = regioes.includes(form.regiao);
  const consultorInList = consultores.includes(form.consultor);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle>{cliente?.id ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          <DialogDescription>Preencha os dados do cliente.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Nome do Cliente *</Label>
            <Input value={form.nome_cliente} onChange={(e) => setForm({ ...form, nome_cliente: e.target.value })} placeholder="Nome do cliente" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo de UG</Label>
              <Select value={form.tipo_ug || "none"} onValueChange={(v) => setForm({ ...form, tipo_ug: v === "none" ? "" : v })}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Selecionar —</SelectItem>
                  {UG_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
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
          </div>
          <div className="grid grid-cols-2 gap-3">
            {/* Região */}
            <div className="space-y-1.5">
              <Label className="text-xs">Região</Label>
              {regiaoManual || regioes.length === 0 ? (
                <div className="flex gap-1">
                  <Input
                    value={form.regiao}
                    onChange={(e) => setForm({ ...form, regiao: e.target.value })}
                    placeholder="Digitar região"
                    className="h-9 text-xs"
                  />
                  {regioes.length > 0 && (
                    <Button type="button" variant="ghost" size="sm" className="h-9 text-[10px] px-2 shrink-0" onClick={() => setRegiaoManual(false)}>
                      Lista
                    </Button>
                  )}
                </div>
              ) : (
                <Select
                  value={regiaoInList ? form.regiao : (form.regiao ? "__custom__" : "none")}
                  onValueChange={(v) => {
                    if (v === "__other__") {
                      setRegiaoManual(true);
                    } else if (v === "none") {
                      setForm({ ...form, regiao: "" });
                    } else {
                      setForm({ ...form, regiao: v });
                    }
                  }}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Selecionar região" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Selecionar —</SelectItem>
                    {!regiaoInList && form.regiao && (
                      <SelectItem value="__custom__">{form.regiao}</SelectItem>
                    )}
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
                  <Input
                    value={form.consultor}
                    onChange={(e) => setForm({ ...form, consultor: e.target.value })}
                    placeholder="Digitar consultor"
                    className="h-9 text-xs"
                  />
                  {consultores.length > 0 && (
                    <Button type="button" variant="ghost" size="sm" className="h-9 text-[10px] px-2 shrink-0" onClick={() => setConsultorManual(false)}>
                      Lista
                    </Button>
                  )}
                </div>
              ) : (
                <Select
                  value={consultorInList ? form.consultor : (form.consultor ? "__custom__" : "none")}
                  onValueChange={(v) => {
                    if (v === "__other__") {
                      setConsultorManual(true);
                    } else if (v === "none") {
                      setForm({ ...form, consultor: "" });
                    } else {
                      setForm({ ...form, consultor: v });
                    }
                  }}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Selecionar consultor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Selecionar —</SelectItem>
                    {!consultorInList && form.consultor && (
                      <SelectItem value="__custom__">{form.consultor}</SelectItem>
                    )}
                    {consultores.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    <SelectItem value="__other__">Outro...</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Observações</Label>
            <Textarea value={form.observacoes_cliente} onChange={(e) => setForm({ ...form, observacoes_cliente: e.target.value })} rows={2} placeholder="Observações sobre o cliente" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
