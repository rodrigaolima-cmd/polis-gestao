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

const UG_TYPES = ["Prefeitura", "Câmara", "Autarquia", "Consórcio", "Fundo", "Instituto", "SAAE", "RPPS"];

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

  useEffect(() => {
    if (cliente) {
      setForm(cliente);
    } else {
      setForm({
        nome_cliente: "",
        tipo_ug: "",
        regiao: "",
        consultor: "",
        status_cliente: "Ativo",
        observacoes_cliente: "",
      });
    }
  }, [cliente, open]);

  const handleSave = async () => {
    if (!form.nome_cliente.trim()) {
      toast.error("Nome do cliente é obrigatório");
      return;
    }
    setSaving(true);
    try {
      if (cliente?.id) {
        const { error } = await supabase.from("clients").update({
          nome_cliente: form.nome_cliente.trim(),
          tipo_ug: form.tipo_ug,
          regiao: form.regiao,
          consultor: form.consultor,
          status_cliente: form.status_cliente,
          observacoes_cliente: form.observacoes_cliente,
        }).eq("id", cliente.id);
        if (error) throw error;
        toast.success("Cliente atualizado");
      } else {
        const { error } = await supabase.from("clients").insert({
          nome_cliente: form.nome_cliente.trim(),
          tipo_ug: form.tipo_ug,
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
            <div className="space-y-1.5">
              <Label className="text-xs">Região</Label>
              <Input value={form.regiao} onChange={(e) => setForm({ ...form, regiao: e.target.value })} placeholder="Ex: Norte de Minas" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Consultor</Label>
              <Input value={form.consultor} onChange={(e) => setForm({ ...form, consultor: e.target.value })} placeholder="Nome do consultor" />
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
