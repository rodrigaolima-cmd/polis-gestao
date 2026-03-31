import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink,
  PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Package, FileText, ChevronUp, ChevronDown, Power, PowerOff, Download, Tag } from "lucide-react";
import { ModuloCatalogoReport } from "./ModuloCatalogoReport";
import { normalizeForSearch } from "@/utils/textUtils";
import { useIsMobile } from "@/hooks/use-mobile";

interface Module {
  id: string;
  nome_modulo: string;
  categoria_modulo: string | null;
  descricao: string | null;
  status_modulo: string | null;
  created_at: string;
}

type SortCol = "nome" | "categoria" | "status" | "created_at";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 20;

export default function ModuloCatalogo() {
  const isMobile = useIsMobile();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("Todas");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editModule, setEditModule] = useState<Module | null>(null);
  const [formName, setFormName] = useState("");
  const [formCategoria, setFormCategoria] = useState("");
  const [formDescricao, setFormDescricao] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortCol, setSortCol] = useState<SortCol>("nome");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);

  // Bulk action states
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [inactivateConfirmId, setInactivateConfirmId] = useState<string | null>(null);
  const [bulkCategoryOpen, setBulkCategoryOpen] = useState(false);
  const [bulkCategoryValue, setBulkCategoryValue] = useState("");

  const fetchModules = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("modules")
      .select("id, nome_modulo, categoria_modulo, descricao, status_modulo, created_at")
      .order("nome_modulo");
    setModules(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  // Dynamic categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    modules.forEach((m) => {
      if (m.categoria_modulo) cats.add(m.categoria_modulo);
    });
    return Array.from(cats).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [modules]);

  // Filter + search
  const filtered = useMemo(() => {
    let result = modules;
    if (filterCategoria !== "Todas") {
      result = result.filter((m) => m.categoria_modulo === filterCategoria);
    }
    if (search.trim()) {
      const q = normalizeForSearch(search);
      result = result.filter(
        (m) =>
          normalizeForSearch(m.nome_modulo).includes(q) ||
          normalizeForSearch(m.categoria_modulo ?? "").includes(q)
      );
    }
    return result;
  }, [modules, filterCategoria, search]);

  // Sort
  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortCol) {
        case "nome":
          cmp = a.nome_modulo.localeCompare(b.nome_modulo, "pt-BR");
          break;
        case "categoria":
          cmp = (a.categoria_modulo ?? "").localeCompare(b.categoria_modulo ?? "", "pt-BR");
          break;
        case "status":
          cmp = (a.status_modulo ?? "").localeCompare(b.status_modulo ?? "");
          break;
        case "created_at":
          cmp = a.created_at.localeCompare(b.created_at);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortCol, sortDir]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.length > PAGE_SIZE ? sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : sorted;

  useEffect(() => {
    setPage(1);
  }, [search, filterCategoria, sortCol, sortDir]);

  // Selection helpers
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allFilteredSelected = filtered.length > 0 && filtered.every((m) => selectedIds.has(m.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((m) => m.id)));
    }
  };

  // Sort toggle
  const handleSort = (col: SortCol) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ col }: { col: SortCol }) => {
    if (sortCol !== col) return null;
    return sortDir === "asc" ? <ChevronUp className="h-3 w-3 inline ml-1" /> : <ChevronDown className="h-3 w-3 inline ml-1" />;
  };

  // Form handlers
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
      if (error) {
        toast.error("Erro ao atualizar: " + error.message);
      } else {
        toast.success("Módulo atualizado");
        setModules((prev) =>
          prev.map((m) =>
            m.id === editModule.id
              ? { ...m, nome_modulo: formName.trim(), categoria_modulo: formCategoria.trim(), descricao: formDescricao.trim() }
              : m
          )
        );
      }
    } else {
      const { data, error } = await supabase.from("modules").insert({
        nome_modulo: formName.trim(),
        categoria_modulo: formCategoria.trim(),
        descricao: formDescricao.trim(),
        status_modulo: "Ativo",
      }).select();
      if (error) toast.error("Erro ao criar: " + error.message);
      else {
        toast.success("Módulo criado");
        if (data) setModules((prev) => [...prev, ...data]);
      }
    }

    setSaving(false);
    setDialogOpen(false);
  };

  const toggleStatus = async (m: Module) => {
    if (m.status_modulo === "Ativo") {
      setInactivateConfirmId(m.id);
      return;
    }
    await doToggle(m, "Ativo");
  };

  const doToggle = async (m: Module, newStatus: string) => {
    const { error } = await supabase
      .from("modules")
      .update({ status_modulo: newStatus })
      .eq("id", m.id);
    if (error) toast.error("Erro: " + error.message);
    else {
      toast.success(`Módulo ${newStatus === "Ativo" ? "ativado" : "inativado"}`);
      setModules((prev) => prev.map((x) => (x.id === m.id ? { ...x, status_modulo: newStatus } : x)));
    }
  };

  const confirmInactivate = async () => {
    const m = modules.find((x) => x.id === inactivateConfirmId);
    if (m) await doToggle(m, "Inativo");
    setInactivateConfirmId(null);
  };

  const handleDelete = async (id: string) => {
    const { count } = await supabase
      .from("client_modules")
      .select("id", { count: "exact", head: true })
      .eq("modulo_id", id);

    if (count && count > 0) {
      toast.error(`Não é possível excluir: módulo vinculado a ${count} cliente(s).`);
      setDeleteConfirm(null);
      return;
    }

    const { error } = await supabase.from("modules").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir: " + error.message);
    else {
      toast.success("Módulo excluído");
      setModules((prev) => prev.filter((m) => m.id !== id));
      setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    }
    setDeleteConfirm(null);
  };

  // Bulk actions
  const selectedModules = modules.filter((m) => selectedIds.has(m.id));

  const bulkActivate = async () => {
    const ids = selectedModules.filter((m) => m.status_modulo !== "Ativo").map((m) => m.id);
    if (ids.length === 0) { toast.info("Todos já estão ativos"); return; }
    const { error } = await supabase.from("modules").update({ status_modulo: "Ativo" }).in("id", ids);
    if (error) toast.error("Erro: " + error.message);
    else {
      toast.success(`${ids.length} módulo(s) ativado(s)`);
      setModules((prev) => prev.map((m) => (ids.includes(m.id) ? { ...m, status_modulo: "Ativo" } : m)));
      setSelectedIds(new Set());
    }
  };

  const bulkInactivate = async () => {
    const ids = selectedModules.filter((m) => m.status_modulo === "Ativo").map((m) => m.id);
    if (ids.length === 0) { toast.info("Todos já estão inativos"); return; }
    const { error } = await supabase.from("modules").update({ status_modulo: "Inativo" }).in("id", ids);
    if (error) toast.error("Erro: " + error.message);
    else {
      toast.success(`${ids.length} módulo(s) inativado(s)`);
      setModules((prev) => prev.map((m) => (ids.includes(m.id) ? { ...m, status_modulo: "Inativo" } : m)));
      setSelectedIds(new Set());
    }
  };

  const bulkDelete = async () => {
    const ids = Array.from(selectedIds);
    // Check links
    const { count } = await supabase
      .from("client_modules")
      .select("id", { count: "exact", head: true })
      .in("modulo_id", ids);
    if (count && count > 0) {
      toast.error(`Não é possível excluir: ${count} vínculo(s) com clientes encontrado(s). Inative ao invés.`);
      setBulkDeleteOpen(false);
      return;
    }
    const { error } = await supabase.from("modules").delete().in("id", ids);
    if (error) toast.error("Erro: " + error.message);
    else {
      toast.success(`${ids.length} módulo(s) excluído(s)`);
      setModules((prev) => prev.filter((m) => !selectedIds.has(m.id)));
      setSelectedIds(new Set());
    }
    setBulkDeleteOpen(false);
  };

  const bulkChangeCategory = async () => {
    if (!bulkCategoryValue.trim()) { toast.error("Informe a categoria"); return; }
    const ids = Array.from(selectedIds);
    const { error } = await supabase.from("modules").update({ categoria_modulo: bulkCategoryValue.trim() }).in("id", ids);
    if (error) toast.error("Erro: " + error.message);
    else {
      toast.success(`Categoria atualizada para ${ids.length} módulo(s)`);
      setModules((prev) => prev.map((m) => (selectedIds.has(m.id) ? { ...m, categoria_modulo: bulkCategoryValue.trim() } : m)));
      setSelectedIds(new Set());
    }
    setBulkCategoryOpen(false);
    setBulkCategoryValue("");
  };

  const StatusBadge = ({ status }: { status: string | null }) => {
    const s = status ?? "Ativo";
    return s === "Ativo" ? (
      <Badge className="bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20">{s}</Badge>
    ) : (
      <Badge variant="secondary">{s}</Badge>
    );
  };

  // Mobile card
  const MobileCard = ({ m }: { m: Module }) => (
    <div
      className={`border rounded-lg p-3 space-y-2 cursor-pointer transition-colors hover:bg-muted/50 ${selectedIds.has(m.id) ? "bg-muted/30" : ""}`}
      onClick={() => openEdit(m)}
    >
      <div className="flex items-center gap-2">
        <Checkbox
          checked={selectedIds.has(m.id)}
          onCheckedChange={() => toggleSelect(m.id)}
          onClick={(e) => e.stopPropagation()}
        />
        <span className="font-medium text-sm flex-1">{m.nome_modulo}</span>
        <StatusBadge status={m.status_modulo} />
      </div>
      <div className="text-xs text-muted-foreground">{m.categoria_modulo || "Sem categoria"}</div>
      <div className="flex items-center gap-2 justify-end">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEdit(m); }}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Switch
          checked={m.status_modulo === "Ativo"}
          onCheckedChange={() => toggleStatus(m)}
          onClick={(e) => e.stopPropagation()}
        />
        <Button
          variant="ghost" size="icon" className="h-7 w-7 text-destructive"
          onClick={(e) => { e.stopPropagation(); handleDelete(m.id); }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5" /> Catálogo de Módulos
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" className="gap-2" onClick={() => setReportOpen(true)}>
              <FileText className="h-4 w-4" /> Relatório
            </Button>
            <Select value={filterCategoria} onValueChange={setFilterCategoria}>
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas">Todas</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar módulo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-[180px] h-9"
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
                    <Input value={formCategoria} onChange={(e) => setFormCategoria(e.target.value)} placeholder="Ex: GSP" />
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

        {/* Bulk actions toolbar */}
        {selectedIds.size > 0 && (
          <div className="px-6 pb-2 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">{selectedIds.size} selecionado(s)</span>
            <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={bulkActivate}>
              <Power className="h-3 w-3" /> Ativar
            </Button>
            <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={bulkInactivate}>
              <PowerOff className="h-3 w-3" /> Inativar
            </Button>
            <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={() => setBulkDeleteOpen(true)}>
              <Trash2 className="h-3 w-3" /> Excluir
            </Button>
            <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={() => setBulkCategoryOpen(true)}>
              <Tag className="h-3 w-3" /> Alterar categoria
            </Button>
            <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={() => setReportOpen(true)}>
              <Download className="h-3 w-3" /> Exportar PDF
            </Button>
          </div>
        )}

        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : modules.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <p className="text-muted-foreground">Nenhum módulo cadastrado.</p>
              <Button onClick={openCreate} className="gap-2">
                <Plus className="h-4 w-4" /> Criar novo módulo
              </Button>
            </div>
          ) : isMobile ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 pb-2">
                <Checkbox checked={allFilteredSelected} onCheckedChange={toggleSelectAll} />
                <span className="text-xs text-muted-foreground">Selecionar todos</span>
              </div>
              {paginated.map((m) => (
                <MobileCard key={m.id} m={m} />
              ))}
              {filtered.length === 0 && (
                <p className="text-center text-muted-foreground py-8">Nenhum módulo encontrado</p>
              )}
            </div>
          ) : (
            <div className="relative w-full overflow-auto max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox checked={allFilteredSelected} onCheckedChange={toggleSelectAll} />
                    </TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => handleSort("nome")}>
                      Nome <SortIcon col="nome" />
                    </TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => handleSort("categoria")}>
                      Categoria <SortIcon col="categoria" />
                    </TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => handleSort("status")}>
                      Status <SortIcon col="status" />
                    </TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => handleSort("created_at")}>
                      Criação <SortIcon col="created_at" />
                    </TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((m) => (
                    <TableRow
                      key={m.id}
                      className={`cursor-pointer transition-colors ${selectedIds.has(m.id) ? "bg-muted/30" : ""}`}
                      onClick={() => openEdit(m)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={selectedIds.has(m.id)} onCheckedChange={() => toggleSelect(m.id)} />
                      </TableCell>
                      <TableCell className="font-medium">{m.nome_modulo}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{m.categoria_modulo || "—"}</TableCell>
                      <TableCell><StatusBadge status={m.status_modulo} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(m.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(m)} title="Editar">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Switch
                            checked={m.status_modulo === "Ativo"}
                            onCheckedChange={() => toggleStatus(m)}
                          />
                          {deleteConfirm === m.id ? (
                            <div className="flex items-center gap-1">
                              <Button variant="destructive" size="sm" onClick={() => handleDelete(m.id)}>Confirmar</Button>
                              <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
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
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Nenhum módulo encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <PaginationItem key={p}>
                    <PaginationLink isActive={p === page} onClick={() => setPage(p)} className="cursor-pointer">
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}

          <p className="text-xs text-muted-foreground mt-2">{modules.length} módulos cadastrados</p>
        </CardContent>
      </Card>

      {/* Report dialog — pass selected if any, otherwise all */}
      <ModuloCatalogoReport
        modules={selectedIds.size > 0 ? selectedModules : modules}
        open={reportOpen}
        onOpenChange={setReportOpen}
      />

      {/* Inactivate confirmation */}
      <AlertDialog open={!!inactivateConfirmId} onOpenChange={(o) => !o && setInactivateConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deseja inativar este módulo?</AlertDialogTitle>
            <AlertDialogDescription>O módulo ficará inativo mas não será excluído.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmInactivate}>Inativar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete confirmation */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão dos módulos selecionados?</AlertDialogTitle>
            <AlertDialogDescription>{selectedIds.size} módulo(s) serão excluídos permanentemente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={bulkDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk category dialog */}
      <Dialog open={bulkCategoryOpen} onOpenChange={setBulkCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar categoria ({selectedIds.size} módulos)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nova categoria</Label>
              <Input value={bulkCategoryValue} onChange={(e) => setBulkCategoryValue(e.target.value)} placeholder="Ex: GSP" />
            </div>
            <Button className="w-full" onClick={bulkChangeCategory}>Aplicar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
