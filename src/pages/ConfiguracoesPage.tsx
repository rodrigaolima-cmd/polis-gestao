import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, UserPlus, Shield, User as UserIcon, Wrench } from "lucide-react";
import ModuloCatalogo from "@/components/configuracoes/ModuloCatalogo";
import { MobileMenu } from "@/components/MobileMenu";

interface UserProfile {
  id: string;
  full_name: string;
  is_active: boolean;
  email?: string;
  role?: string;
  created_at?: string;
  force_password_change?: boolean;
}

export default function ConfiguracoesPage() {
  const navigate = useNavigate();
  const { isAdmin, user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [creating, setCreating] = useState(false);
  const [fixingEncoding, setFixingEncoding] = useState(false);

  // Edit user dialog
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("user");
  const [editForcePassword, setEditForcePassword] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, is_active, created_at, force_password_change");

    if (!profiles) {
      setLoading(false);
      return;
    }

    const [rolesRes, emailsRes] = await Promise.all([
      supabase.from("user_roles").select("user_id, role"),
      supabase.functions.invoke("admin-list-users"),
    ]);

    const roleMap = new Map(rolesRes.data?.map((r) => [r.user_id, r.role]) ?? []);
    const emailMap: Record<string, string> = emailsRes.data?.emails ?? {};

    const mapped: UserProfile[] = profiles.map((p) => ({
      ...p,
      role: roleMap.get(p.id) ?? "user",
      email: emailMap[p.id] ?? "",
      force_password_change: p.force_password_change ?? false,
    }));

    setUsers(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleActive = async (userId: string, currentActive: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: !currentActive })
      .eq("id", userId);

    if (error) {
      toast.error("Erro ao atualizar status: " + error.message);
    } else {
      toast.success(`Usuário ${!currentActive ? "ativado" : "desativado"}`);
      fetchUsers();
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword || !newFullName) {
      toast.error("Preencha todos os campos");
      return;
    }
    setCreating(true);

    const res = await supabase.functions.invoke("admin-create-user", {
      body: { email: newEmail, password: newPassword, full_name: newFullName },
    });

    setCreating(false);

    if (res.error || res.data?.error) {
      toast.error(res.data?.error || res.error?.message || "Erro ao criar usuário");
      return;
    }

    toast.success("Usuário criado com sucesso!");
    setDialogOpen(false);
    setNewEmail("");
    setNewPassword("");
    setNewFullName("");
    fetchUsers();
  };

  const handleFixEncoding = async () => {
    setFixingEncoding(true);
    try {
      const res = await supabase.functions.invoke("fix-encoding");
      if (res.error || res.data?.error) {
        toast.error(res.data?.error || res.error?.message || "Erro ao corrigir encoding");
      } else {
        toast.success(`Correção concluída: ${res.data?.fixed ?? 0} registros corrigidos`);
      }
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    } finally {
      setFixingEncoding(false);
    }
  };

  const openEditUser = (u: UserProfile) => {
    setEditUser(u);
    setEditName(u.full_name);
    setEditEmail(u.email || "");
    setEditRole(u.role || "user");
    setEditForcePassword(u.force_password_change || false);
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    if (!editName.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (!editEmail.trim()) {
      toast.error("Email é obrigatório");
      return;
    }

    // Check if editing own email
    const emailChanged = editEmail.trim().toLowerCase() !== (editUser.email || "").toLowerCase();
    if (emailChanged && currentUser && editUser.id === currentUser.id) {
      const confirmed = window.confirm(
        "Alterar o email pode impactar o acesso ao sistema. Deseja continuar?"
      );
      if (!confirmed) return;
    }

    setSavingEdit(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: editName.trim(),
          force_password_change: editForcePassword,
        })
        .eq("id", editUser.id);
      if (profileError) throw profileError;

      // Update role
      const currentRole = editUser.role || "user";
      if (editRole !== currentRole) {
        await supabase.from("user_roles").delete().eq("user_id", editUser.id);
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({ user_id: editUser.id, role: editRole as any });
        if (roleError) throw roleError;
      }

      // Update email if changed
      if (emailChanged) {
        const res = await supabase.functions.invoke("admin-update-email", {
          body: { user_id: editUser.id, new_email: editEmail.trim() },
        });
        if (res.error || res.data?.error) {
          throw new Error(res.data?.error || res.error?.message || "Erro ao atualizar email");
        }
      }

      toast.success("Usuário atualizado");
      setEditUser(null);
      fetchUsers();
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Acesso restrito a administradores.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <MobileMenu />
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="hidden md:flex">
              <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
            </Button>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight">Configurações</h1>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Gerenciar Usuários</CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <UserPlus className="h-4 w-4" /> <span className="hidden sm:inline">Novo Usuário</span><span className="sm:hidden">Novo</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Novo Usuário</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome Completo</Label>
                    <Input value={newFullName} onChange={(e) => setNewFullName(e.target.value)} placeholder="Nome completo" required />
                  </div>
                  <div className="space-y-2">
                    <Label>E-mail</Label>
                    <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@exemplo.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Senha</Label>
                    <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required minLength={6} />
                  </div>
                  <Button type="submit" className="w-full" disabled={creating}>
                    {creating ? "Criando..." : "Criar Usuário"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Perfil</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow
                        key={u.id}
                        className="cursor-pointer hover:bg-muted/30"
                        onClick={() => openEditUser(u)}
                      >
                        <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={u.role === "admin" ? "default" : "secondary"} className="gap-1">
                            {u.role === "admin" ? <Shield className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />}
                            {u.role === "admin" ? "Admin" : "Usuário"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.is_active ? "default" : "destructive"}>
                            {u.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <span className="text-xs text-muted-foreground">
                              {u.is_active ? "Desativar" : "Ativar"}
                            </span>
                            <Switch
                              checked={u.is_active}
                              onCheckedChange={() => toggleActive(u.id, u.is_active)}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {users.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          Nenhum usuário encontrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit user dialog */}
        <Dialog open={editUser !== null} onOpenChange={(open) => { if (!open) setEditUser(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Nome" />
              </div>
              {editUser?.created_at && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Data de cadastro</Label>
                  <p className="text-sm">{new Date(editUser.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label>Perfil</Label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">Usuário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={editForcePassword}
                  onCheckedChange={(v) => setEditForcePassword(!!v)}
                  id="forcePassword"
                />
                <Label htmlFor="forcePassword" className="text-sm cursor-pointer">
                  Solicitar troca de senha no primeiro acesso
                </Label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setEditUser(null)}>Cancelar</Button>
                <Button size="sm" onClick={handleSaveEdit} disabled={savingEdit}>
                  {savingEdit ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Qualidade de Dados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Corrige problemas de encoding (acentos quebrados) nos registros existentes de clientes, módulos e contratos.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleFixEncoding}
              disabled={fixingEncoding}
            >
              <Wrench className="h-4 w-4" />
              {fixingEncoding ? "Corrigindo..." : "Corrigir encoding dos dados"}
            </Button>
          </CardContent>
        </Card>

        <ModuloCatalogo />
      </main>
    </div>
  );
}
