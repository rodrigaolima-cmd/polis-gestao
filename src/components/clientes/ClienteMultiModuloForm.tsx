import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CopyCheck, Copy } from "lucide-react";

interface ModuleOption {
  id: string;
  nome_modulo: string;
}

interface SelectedModuleValues {
  valor_contratado: number;
  valor_faturado: number;
}

interface ClienteMultiModuloFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  onSaved: () => void;
}

export function ClienteMultiModuloForm({ open, onOpenChange, clientId, onSaved }: ClienteMultiModuloFormProps) {
  const [allModules, setAllModules] = useState<ModuleOption[]>([]);
  const [existingModuleIds, setExistingModuleIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [moduleValues, setModuleValues] = useState<Record<string, SelectedModuleValues>>({});
  const [saving, setSaving] = useState(false);

  // Shared fields
  const [dataAssinatura, setDataAssinatura] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [statusContrato, setStatusContrato] = useState("Ativo");
  const [faturadoFlag, setFaturadoFlag] = useState(false);
  const [observacoes, setObservacoes] = useState("");
  const [ativoNoCliente, setAtivoNoCliente] = useState(true);

  // Bulk value helpers
  const [bulkContratado, setBulkContratado] = useState("");
  const [bulkFaturado, setBulkFaturado] = useState("");

  useEffect(() => {
    if (!open) return;
    // Reset
    setSelectedIds(new Set());
    setModuleValues({});
    setDataAssinatura("");
    setVencimento("");
    setStatusContrato("Ativo");
    setFaturadoFlag(false);
    setObservacoes("");
    setAtivoNoCliente(true);
    setBulkContratado("");
    setBulkFaturado("");

    // Load catalog + existing
    Promise.all([
      supabase.from("modules").select("id, nome_modulo").order("nome_modulo"),
      supabase.from("client_modules").select("modulo_id").eq("client_id", clientId),
    ]).then(([catalogRes, existingRes]) => {
      setAllModules(catalogRes.data || []);
      setExistingModuleIds(new Set((existingRes.data || []).map((r: any) => r.modulo_id)));
    });
  }, [open, clientId]);

  const toggleModule = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        if (!moduleValues[id]) {
          setModuleValues((v) => ({ ...v, [id]: { valor_contratado: 0, valor_faturado: 0 } }));
        }
      }
      return next;
    });
  };

  const updateValue = (id: string, field: keyof SelectedModuleValues, val: number) => {
    setModuleValues((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: val },
    }));
  };

  const applyBulkContratado = () => {
    const val = parseFloat(bulkContratado) || 0;
    setModuleValues((prev) => {
      const next = { ...prev };
      selectedIds.forEach((id) => {
        next[id] = { ...(next[id] || { valor_contratado: 0, valor_faturado: 0 }), valor_contratado: val };
      });
      return next;
    });
  };

  const applyBulkFaturado = () => {
    const val = parseFloat(bulkFaturado) || 0;
    setModuleValues((prev) => {
      const next = { ...prev };
      selectedIds.forEach((id) => {
        next[id] = { ...(next[id] || { valor_contratado: 0, valor_faturado: 0 }), valor_faturado: val };
      });
      return next;
    });
  };

  const copyContratadoToFaturado = () => {
    setModuleValues((prev) => {
      const next = { ...prev };
      selectedIds.forEach((id) => {
        if (next[id]) {
          next[id] = { ...next[id], valor_faturado: next[id].valor_contratado };
        }
      });
      return next;
    });
    toast.info("Valores contratados copiados para faturados");
  };

  const selectedModules = useMemo(
    () => allModules.filter((m) => selectedIds.has(m.id)),
    [allModules, selectedIds]
  );

  const handleSave = async () => {
    if (selectedIds.size === 0) {
      toast.error("Selecione ao menos um módulo");
      return;
    }

    // Filter out already linked
    const toInsert = Array.from(selectedIds).filter((id) => !existingModuleIds.has(id));
    const skipped = selectedIds.size - toInsert.length;

    if (toInsert.length === 0) {
      toast.warning("Todos os módulos selecionados já estão vinculados");
      return;
    }

    if (skipped > 0) {
      toast.warning(`${skipped} módulo(s) já vinculado(s) serão ignorados`);
    }

    setSaving(true);
    try {
      const payloads = toInsert.map((modId) => ({
        client_id: clientId,
        modulo_id: modId,
        valor_contratado: moduleValues[modId]?.valor_contratado || 0,
        valor_faturado: moduleValues[modId]?.valor_faturado || 0,
        data_assinatura: dataAssinatura || null,
        vencimento_contrato: vencimento || null,
        status_contrato: statusContrato,
        faturado_flag: faturadoFlag,
        observacoes,
        ativo_no_cliente: ativoNoCliente,
      }));

      const { error } = await supabase.from("client_modules").insert(payloads);
      if (error) throw error;

      toast.success(`${toInsert.length} módulo(s) adicionado(s)`);
      onSaved();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar módulos");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Vários Sistemas</DialogTitle>
          <DialogDescription>Selecione os módulos e preencha os dados do contrato.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Module selection */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Selecionar Módulos</Label>
            <div className="border border-border/50 rounded-lg p-3 max-h-40 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-2">
              {allModules.map((m) => {
                const isLinked = existingModuleIds.has(m.id);
                return (
                  <label
                    key={m.id}
                    className={`flex items-center gap-2 text-xs rounded px-2 py-1.5 cursor-pointer hover:bg-muted/50 ${isLinked ? "opacity-40 cursor-not-allowed" : ""}`}
                  >
                    <Checkbox
                      checked={selectedIds.has(m.id)}
                      onCheckedChange={() => !isLinked && toggleModule(m.id)}
                      disabled={isLinked}
                    />
                    <span>{m.nome_modulo}</span>
                    {isLinked && <Badge variant="secondary" className="text-[9px] ml-auto">Vinculado</Badge>}
                  </label>
                );
              })}
              {allModules.length === 0 && <p className="text-xs text-muted-foreground col-span-3">Nenhum módulo cadastrado</p>}
            </div>
          </div>

          {/* Shared fields */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold">Dados comuns para todos os sistemas</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px]">Data de Assinatura</Label>
                <Input type="date" value={dataAssinatura} onChange={(e) => setDataAssinatura(e.target.value)} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Vencimento</Label>
                <Input type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Status</Label>
                <Select value={statusContrato} onValueChange={setStatusContrato}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                    <SelectItem value="Cancelado">Cancelado</SelectItem>
                    <SelectItem value="Suspenso">Suspenso</SelectItem>
                    <SelectItem value="Vencido">Vencido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-2">
                <Switch checked={faturadoFlag} onCheckedChange={setFaturadoFlag} />
                <Label className="text-xs">Faturado?</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={ativoNoCliente} onCheckedChange={setAtivoNoCliente} />
                <Label className="text-xs">Ativo no cliente</Label>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Observações</Label>
              <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2} className="text-xs" />
            </div>
          </div>

          {/* Individual values table */}
          {selectedModules.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Valores por Módulo ({selectedModules.length})</Label>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Input
                  type="number"
                  placeholder="Valor Contratado"
                  value={bulkContratado}
                  onChange={(e) => setBulkContratado(e.target.value)}
                  className="h-7 text-xs w-36"
                />
                <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={applyBulkContratado}>
                  <CopyCheck className="h-3 w-3" /> Aplicar a todos
                </Button>
                <Input
                  type="number"
                  placeholder="Valor Faturado"
                  value={bulkFaturado}
                  onChange={(e) => setBulkFaturado(e.target.value)}
                  className="h-7 text-xs w-36"
                />
                <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={applyBulkFaturado}>
                  <CopyCheck className="h-3 w-3" /> Aplicar a todos
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={copyContratadoToFaturado}>
                  <Copy className="h-3 w-3" /> Copiar contratado → faturado
                </Button>
              </div>
              <div className="border border-border/50 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/30">
                      <TableHead className="text-[10px]">Módulo</TableHead>
                      <TableHead className="text-[10px] text-right">Valor Contratado</TableHead>
                      <TableHead className="text-[10px] text-right">Valor Faturado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedModules.map((m) => (
                      <TableRow key={m.id} className="border-border/20">
                        <TableCell className="text-xs font-medium">{m.nome_modulo}</TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={moduleValues[m.id]?.valor_contratado ?? 0}
                            onChange={(e) => updateValue(m.id, "valor_contratado", parseFloat(e.target.value) || 0)}
                            className="h-7 text-xs w-28 ml-auto"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={moduleValues[m.id]?.valor_faturado ?? 0}
                            onChange={(e) => updateValue(m.id, "valor_faturado", parseFloat(e.target.value) || 0)}
                            className="h-7 text-xs w-28 ml-auto"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleSave} disabled={saving || selectedIds.size === 0}>
              {saving ? "Salvando..." : `Adicionar ${selectedIds.size} módulo(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
