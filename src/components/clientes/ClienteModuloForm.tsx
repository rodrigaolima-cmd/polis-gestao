import { useState, useEffect, useRef } from "react";
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

export interface InitialModuleData {
  id: string;
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
  existingModuleId?: string | null;
  initialData?: Record<string, any> | null;
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

function dataToForm(data: any): ClientModuleData {
  return {
    id: data.id,
    modulo_id: data.modulo_id,
    valor_contratado: Number(data.valor_contratado) || 0,
    valor_faturado: Number(data.valor_faturado) || 0,
    data_assinatura: data.data_assinatura || "",
    vencimento_contrato: data.vencimento_contrato || "",
    faturado_flag: data.faturado_flag ?? false,
    status_contrato: data.status_contrato || "Ativo",
    observacoes: data.observacoes || "",
    ativo_no_cliente: data.ativo_no_cliente ?? true,
  };
}

export function ClienteModuloForm({ open, onOpenChange, clientId, existingModuleId, initialData, onSaved }: ClienteModuloFormProps) {
  const [modules, setModules] = useState<ModuleOption[]>([]);
  const [form, setForm] = useState<ClientModuleData>(initialData ? dataToForm(initialData) : { ...defaultForm });
  const [newModuleName, setNewModuleName] = useState("");
  const [saving, setSaving] = useState(false);
  const valorContratadoRef = useRef<HTMLInputElement>(null);

  const isEditing = !!existingModuleId;

  // On mount (key changes per module), fetch data
  useEffect(() => {
    if (!open) return;

    setNewModuleName("");

    // Fetch module options
    supabase.from("modules").select("id, nome_modulo").order("nome_modulo").then(({ data }) => {
      if (data) setModules(data);
    });

    if (existingModuleId) {
      supabase
        .from("client_modules")
        .select("*")
        .eq("id", existingModuleId)
        .single()
        .then(({ data, error }) => {
          if (error || !data) {
            toast.error("Erro ao carregar dados do módulo");
            setForm({ ...defaultForm });
          } else {
            setForm(dataToForm(data));
          }
        });
    } else {
      setForm({ ...defaultForm });
    }
  }, [open, existingModuleId]);

  // Auto-focus valor_contratado when editing
  useEffect(() => {
    if (open && isEditing) {
      const timer = setTimeout(() => {
        valorContratadoRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [open, isEditing]);

  const doSave = async (closeAfter: boolean) => {
    let moduleId = form.modulo_id;

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

      if (existingModuleId) {
        const { error } = await supabase.from("client_modules").update(payload).eq("id", existingModuleId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("client_modules").insert(payload);
        if (error) throw error;
      }

      toast.success("✓ Alterações salvas");
      onSaved();

      if (closeAfter) {
        onOpenChange(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && (e.target as HTMLElement).tagName !== "TEXTAREA") {
      e.preventDefault();
      doSave(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Módulo" : "Adicionar Módulo"}</DialogTitle>
          <DialogDescription>Configure o vínculo do módulo com o cliente.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4" onKeyDown={handleKeyDown}>
          {!isEditing && (
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
              <CurrencyInput ref={valorContratadoRef} value={form.valor_contratado} onChange={(v) => setForm({ ...form, valor_contratado: v })} className="h-9 text-xs" />
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
            {isEditing && (
              <Button variant="outline" size="sm" onClick={() => doSave(false)} disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            )}
            <Button size="sm" onClick={() => doSave(true)} disabled={saving}>
              {saving ? "Salvando..." : isEditing ? "Salvar e fechar" : "Salvar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
