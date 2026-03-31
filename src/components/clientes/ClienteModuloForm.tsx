import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { CurrencyInput } from "@/components/ui/currency-input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ModuleOption {
  id: string;
  nome_modulo: string;
}

interface ClientModuleData {
  id?: string;
  modulo_id: string;
  valor_contratado: number;
  valor_faturado: number;
  data_assinatura: string;
  vencimento_contrato: string;
  faturado_flag: boolean;
  status_contrato: string;
  observacoes: string;
  ativo_no_cliente: boolean;
}

interface ClienteModuloFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  existingModule?: ClientModuleData | null;
  onSaved: () => void;
}

const defaultForm: ClientModuleData = {
  modulo_id: "",
  valor_contratado: 0,
  valor_faturado: 0,
  data_assinatura: "",
  vencimento_contrato: "",
  faturado_flag: false,
  status_contrato: "Ativo",
  observacoes: "",
  ativo_no_cliente: true,
};

export function ClienteModuloForm({ open, onOpenChange, clientId, existingModule, onSaved }: ClienteModuloFormProps) {
  const [modules, setModules] = useState<ModuleOption[]>([]);
  const initialForm = existingModule
    ? {
        ...defaultForm,
        ...existingModule,
        valor_contratado: existingModule.valor_contratado ?? 0,
        valor_faturado: existingModule.valor_faturado ?? 0,
        observacoes: existingModule.observacoes ?? "",
        status_contrato: existingModule.status_contrato ?? "Ativo",
        data_assinatura: existingModule.data_assinatura ?? "",
        vencimento_contrato: existingModule.vencimento_contrato ?? "",
      }
    : { ...defaultForm };

  const [form, setForm] = useState<ClientModuleData>(initialForm);
  const [newModuleName, setNewModuleName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      supabase.from("modules").select("id, nome_modulo").order("nome_modulo").then(({ data }) => {
        if (data) setModules(data);
      });
    }
  }, [open]);

  const handleSave = async () => {
    let moduleId = form.modulo_id;

    // Create new module if needed
    if (!moduleId && newModuleName.trim()) {
      const { data, error } = await supabase
        .from("modules")
        .insert({ nome_modulo: newModuleName.trim() })
        .select("id")
        .single();
      if (error) {
        toast.error("Erro ao criar módulo");
        return;
      }
      moduleId = data.id;
    }

    if (!moduleId) {
      toast.error("Selecione ou crie um módulo");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        client_id: clientId,
        modulo_id: moduleId,
        valor_contratado: form.valor_contratado,
        valor_faturado: form.valor_faturado,
        data_assinatura: form.data_assinatura || null,
        vencimento_contrato: form.vencimento_contrato || null,
        faturado_flag: form.faturado_flag,
        status_contrato: form.status_contrato,
        observacoes: form.observacoes,
        ativo_no_cliente: form.ativo_no_cliente,
      };

      if (existingModule?.id) {
        const { error } = await supabase.from("client_modules").update(payload).eq("id", existingModule.id);
        if (error) throw error;
        toast.success("Módulo atualizado");
      } else {
        const { error } = await supabase.from("client_modules").insert(payload);
        if (error) throw error;
        toast.success("Módulo adicionado ao cliente");
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existingModule?.id ? "Editar Módulo" : "Adicionar Módulo"}</DialogTitle>
          <DialogDescription>Configure o vínculo do módulo com o cliente.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {!existingModule?.id && (
            <div className="space-y-1.5">
              <Label className="text-xs">Módulo *</Label>
              <Select value={form.modulo_id || "none"} onValueChange={(v) => setForm({ ...form, modulo_id: v === "none" ? "" : v })}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecionar módulo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Selecionar existente —</SelectItem>
                  {modules.map((m) => <SelectItem key={m.id} value={m.id}>{m.nome_modulo}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">Ou crie um novo:</p>
              <Input value={newModuleName} onChange={(e) => setNewModuleName(e.target.value)} placeholder="Nome do novo módulo" className="h-8 text-xs" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Valor Contratado</Label>
              <CurrencyInput value={form.valor_contratado} onChange={(v) => setForm({ ...form, valor_contratado: v })} className="h-9 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Valor Faturado</Label>
              <CurrencyInput value={form.valor_faturado} onChange={(v) => setForm({ ...form, valor_faturado: v })} className="h-9 text-xs" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Data de Assinatura</Label>
              <Input type="date" value={form.data_assinatura} onChange={(e) => setForm({ ...form, data_assinatura: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Vencimento</Label>
              <Input type="date" value={form.vencimento_contrato} onChange={(e) => setForm({ ...form, vencimento_contrato: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Status do Contrato</Label>
              <Select value={form.status_contrato} onValueChange={(v) => setForm({ ...form, status_contrato: v })}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                  <SelectItem value="Suspenso">Suspenso</SelectItem>
                  <SelectItem value="Vencido">Vencido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 flex flex-col justify-end">
              <div className="flex items-center gap-2">
                <Switch checked={form.faturado_flag} onCheckedChange={(v) => setForm({ ...form, faturado_flag: v })} />
                <Label className="text-xs">Faturado?</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.ativo_no_cliente} onCheckedChange={(v) => setForm({ ...form, ativo_no_cliente: v })} />
                <Label className="text-xs">Ativo no cliente</Label>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Observações</Label>
            <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={2} />
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
