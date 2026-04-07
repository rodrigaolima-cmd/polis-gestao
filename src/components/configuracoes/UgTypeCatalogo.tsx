import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface UgType {
  id: string;
  nome: string;
  created_at: string;
}

export default function UgTypeCatalogo() {
  const [types, setTypes] = useState<UgType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<UgType | null>(null);
  const [nome, setNome] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchTypes = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("ug_types").select("*").order("nome");
    setTypes((data as UgType[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  const openCreate = () => {
    setEditItem(null);
    setNome("");
    setDialogOpen(true);
  };

  const openEdit = (item: UgType) => {
    setEditItem(item);
    setNome(item.nome);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const trimmed = nome.trim().toUpperCase();
    if (!trimmed) {
      toast.error("Nome é obrigatório");
      return;
    }

    setSaving(true);
    try {
      if (editItem) {
        const oldName = editItem.nome;
        const { error } = await supabase
          .from("ug_types")
          .update({ nome: trimmed })
          .eq("id", editItem.id);
        if (error) throw error;

        // Cascade update clients
        if (oldName !== trimmed) {
          await supabase
            .from("clients")
            .update({ tipo_ug: trimmed })
            .eq("tipo_ug", oldName);
        }
        toast.success("Tipo de UG atualizado");
      } else {
        const { error } = await supabase
          .from("ug_types")
          .insert({ nome: trimmed });
        if (error) {
          if (error.code === "23505") {
            toast.error("Este tipo já existe");
          } else {
            throw error;
          }
          setSaving(false);
          return;
        }
        toast.success("Tipo de UG criado");
      }
      setDialogOpen(false);
      fetchTypes();
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Tipos de UG</CardTitle>
          <Button size="sm" className="gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Adicionar</span>
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Nome</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {types.map((t) => (
                    <TableRow
                      key={t.id}
                      className="cursor-pointer hover:bg-muted/30"
                      onClick={() => openEdit(t)}
                    >
                      <TableCell className="font-medium">{t.nome}</TableCell>
                    </TableRow>
                  ))}
                  {types.length === 0 && (
                    <TableRow>
                      <TableCell className="text-center text-muted-foreground py-8">
                        Nenhum tipo de UG cadastrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? "Editar Tipo de UG" : "Novo Tipo de UG"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value.toUpperCase())}
                placeholder="Ex: PREFEITURA"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
