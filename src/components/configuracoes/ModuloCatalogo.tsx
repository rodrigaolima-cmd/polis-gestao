import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Package, FileText } from "lucide-react";
import { ModuloCatalogoReport } from "./ModuloCatalogoReport";
import { normalizeForSearch } from "@/utils/textUtils";

interface Module {
  id: string;
  nome_modulo: string;
  categoria_modulo: string | null;
  descricao: string | null;
  status_modulo: string | null;
}

export default function ModuloCatalogo() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editModule, setEditModule] = useState<Module | null>(null);
  const [formName, setFormName] = useState("");
  const [formCategoria, setFormCategoria] = useState("");
  const [formDescricao, setFormDescricao] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  const fetchModules = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("modules")
      .select("id, nome_modulo, categoria_modulo, descricao, status_modulo")
      .order("nome_modulo");
    setModules(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  const filtered = modules.filter((m) =>
    normalizeForSearch(m.nome_modulo).includes(normalizeForSearch(search)) ||
    normalizeForSearch(m.categoria_modulo ?? "").includes(normalizeForSearch(search))
  );

  const openCreate = () => {
    setEditModule(null);
    setFormName("");
    setFormCategoria("");
    setFormDescricao("");
    setDialogOpen(true);
  };

  const openEdit = (m: Module) => {
    setEditModule(m);
    setFormName(m.nome_modulo);
    setFormCategoria(m.categoria_modulo ?? "");
    setFormDescricao(m.descricao ?? "");
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Nome do módulo é obrigatório");
      return;
    }
    setSaving(true);

    if (editModule) {
      const { error } = await supabase
        .from("modules")
        .update({
          nome_modulo: formName.trim(),
          categoria_modulo: formCategoria.trim(),
          descricao: formDescricao.trim(),
        })
        .eq("id", editModule.id);
      if (error) toast.error("Erro ao atualizar: " + error.message);
      else toast.success("Módulo atualizado");
    } else {
      const { error } = await supabase.from("modules").insert({
        nome_modulo: formName.trim(),
        categoria_modulo: formCategoria.trim(),
        descricao: formDescricao.trim(),
        status_modulo: "Ativo",
      });
      if (error) toast.error("Erro ao criar: " + error.message);
      else toast.success("Módulo criado");
    }

    setSaving(false);
    setDialogOpen(false);
    fetchModules();
  };

  const toggleStatus = async (m: Module) => {
    const newStatus = m.status_modulo === "Ativo" ? "Inativo" : "Ativo";
    const { error } = await supabase
      .from("modules")
      .update({ status_modulo: newStatus })
      .eq("id", m.id);
    if (error) toast.error("Erro: " + error.message);
    else {
      toast.success(`Módulo ${newStatus === "Ativo" ? "ativado" : "inativado"}`);
      fetchModules();
    }
  };

  const handleDelete = async (id: string) => {
    // Check if linked to any client
    const { count } = await supabase
      .from("client_modules")
      .select("id", { count: "exact", head: true })
      .eq("modulo_id", id);

    if (count && count > 0) {
      toast.error(`Não é possível excluir: módulo vinculado a ${count} cliente(s). Inative-o ao invés.`);
      setDeleteConfirm(null);
      return;
    }

    const { error } = await supabase.from("modules").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir: " + error.message);
    else {
      toast.success("Módulo excluído");
      fetchModules();
    }
    setDeleteConfirm(null);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
        <CardTitle className="text-lg flex items-center gap-2">
          <Package className="h-5 w-5" /> Catálogo de Módulos
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="gap-2" onClick={() => setReportOpen(true)}>
            <FileText className="h-4 w-4" /> Relatório
          </Button>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar módulo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-[200px]"
            />
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2" onClick={openCreate}>
                <Plus className="h-4 w-4" /> Novo Módulo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editModule ? "Editar Módulo" : "Novo Módulo"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome do Módulo</Label>
                  <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ex: GSP - Farmácia" required />
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Input value={formCategoria} onChange={(e) => setFormCategoria(e.target.value)} placeholder="Ex: GSP - Saúde" />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input value={formDescricao} onChange={(e) => setFormDescricao(e.target.value)} placeholder="Descrição opcional" />
                </div>
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? "Salvando..." : editModule ? "Salvar Alterações" : "Criar Módulo"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="relative w-full overflow-auto max-h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.nome_modulo}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{m.categoria_modulo || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={m.status_modulo === "Ativo" ? "default" : "destructive"}>
                        {m.status_modulo ?? "Ativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(m)} title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Switch
                          checked={m.status_modulo === "Ativo"}
                          onCheckedChange={() => toggleStatus(m)}
                          title={m.status_modulo === "Ativo" ? "Inativar" : "Ativar"}
                        />
                        {deleteConfirm === m.id ? (
                          <div className="flex items-center gap-1">
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(m.id)}>
                              Confirmar
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(null)}>
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteConfirm(m.id)} title="Excluir">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Nenhum módulo encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-2">{modules.length} módulos cadastrados</p>
      </CardContent>
    </Card>
  );
}
