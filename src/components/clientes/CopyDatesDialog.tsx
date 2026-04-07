import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CopyDatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  moduleCount: number;
  initialAssinatura?: string;
  initialVencimento?: string;
  onSaved: () => void;
}

export function CopyDatesDialog({
  open,
  onOpenChange,
  clientId,
  moduleCount,
  initialAssinatura = "",
  initialVencimento = "",
  onSaved,
}: CopyDatesDialogProps) {
  const [assinatura, setAssinatura] = useState(initialAssinatura);
  const [vencimento, setVencimento] = useState(initialVencimento);
  const [copyAssinatura, setCopyAssinatura] = useState(true);
  const [copyVencimento, setCopyVencimento] = useState(true);
  const [saving, setSaving] = useState(false);

  // Reset when dialog opens
  const handleOpenChange = (v: boolean) => {
    if (v) {
      setAssinatura(initialAssinatura);
      setVencimento(initialVencimento);
      setCopyAssinatura(true);
      setCopyVencimento(true);
    }
    onOpenChange(v);
  };

  const handleApply = async () => {
    if (!copyAssinatura && !copyVencimento) {
      toast.error("Selecione pelo menos uma data para copiar");
      return;
    }

    const confirmed = confirm(
      `Isto substituirá as datas de ${moduleCount} módulos. Continuar?`
    );
    if (!confirmed) return;

    setSaving(true);
    try {
      const updateData: { data_assinatura?: string | null; vencimento_contrato?: string | null } = {};
      if (copyAssinatura) updateData.data_assinatura = assinatura || null;
      if (copyVencimento) updateData.vencimento_contrato = vencimento || null;

      const { error } = await supabase
        .from("client_modules")
        .update(updateData)
        .eq("client_id", clientId);

      if (error) throw error;

      toast.success("Datas aplicadas a todos os módulos");
      onSaved();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao aplicar datas");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) return; handleOpenChange(v); }}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle>Aplicar datas para todos os sistemas</DialogTitle>
          <DialogDescription>
            Copie as datas selecionadas para todos os {moduleCount} módulos deste cliente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="copy-assinatura"
              checked={copyAssinatura}
              onCheckedChange={(v) => setCopyAssinatura(!!v)}
              className="mt-1"
            />
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="copy-assinatura" className="text-xs">Data de Assinatura</Label>
              <Input
                type="date"
                value={assinatura}
                onChange={(e) => setAssinatura(e.target.value)}
                disabled={!copyAssinatura}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="copy-vencimento"
              checked={copyVencimento}
              onCheckedChange={(v) => setCopyVencimento(!!v)}
              className="mt-1"
            />
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="copy-vencimento" className="text-xs">Vencimento</Label>
              <Input
                type="date"
                value={vencimento}
                onChange={(e) => setVencimento(e.target.value)}
                disabled={!copyVencimento}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleApply} disabled={saving}>
              {saving ? "Aplicando..." : "Aplicar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
