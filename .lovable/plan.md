

# Autenticação, Log de Alterações e Nome do Usuário

## Resumo

Adicionar login/senha com "esqueci senha", log de auditoria de alterações, e exibir o nome do usuário logado no header do dashboard.

## 1. Banco de Dados (3 migrações)

### Tabela `profiles`
```sql
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
```

Trigger para criar perfil automaticamente no signup:
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Tabela `audit_logs`
```sql
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can insert logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated users can read logs" ON public.audit_logs FOR SELECT TO authenticated USING (true);
```

## 2. Páginas e Componentes

### `src/pages/LoginPage.tsx`
- Formulário de login (email + senha)
- Link "Esqueci minha senha" que abre formulário de reset
- Link para cadastro (signup com nome, email, senha)
- Usa `supabase.auth.signInWithPassword`, `supabase.auth.signUp` (com `full_name` em `raw_user_meta_data`), `supabase.auth.resetPasswordForEmail`

### `src/pages/ResetPasswordPage.tsx`
- Rota `/reset-password`
- Detecta `type=recovery` na URL
- Formulário para definir nova senha via `supabase.auth.updateUser({ password })`

### `src/hooks/useAuth.ts`
- Hook com `onAuthStateChange` + `getSession`
- Retorna `user`, `profile`, `loading`, `signOut`
- Carrega perfil do usuário da tabela `profiles`

### `src/hooks/useAuditLog.ts`
- Hook que expõe `logAction(action, entityType, entityId, details)` 
- Insere na tabela `audit_logs` com user_id e email do usuário logado

## 3. Alterações em Arquivos Existentes

### `src/App.tsx`
- Adicionar rotas `/login` e `/reset-password`
- Criar componente `ProtectedRoute` que redireciona para `/login` se não autenticado
- Proteger rotas `/`, `/clientes`, `/clientes/:id`

### `src/components/dashboard/Dashboard.tsx`
- Receber o nome do usuário via props ou hook `useAuth`
- Exibir nome e botão "Sair" no header
- Integrar `useAuditLog` nas ações de importação

### `src/components/dashboard/ImportDialog.tsx`
- Registrar log ao concluir importação

### Páginas de clientes
- Registrar logs ao criar/editar/excluir clientes e módulos

## 4. Fluxo do Usuário

1. Acessa o app -> redireciona para `/login`
2. Faz login ou cadastro (com nome completo)
3. Entra no dashboard -> header mostra "Olá, [Nome]" + botão Sair
4. Todas as ações relevantes (importar, editar cliente, etc.) ficam registradas em `audit_logs`

## Arquivos Afetados

| Ação | Arquivo |
|------|---------|
| Criar | `src/pages/LoginPage.tsx` |
| Criar | `src/pages/ResetPasswordPage.tsx` |
| Criar | `src/hooks/useAuth.ts` |
| Criar | `src/hooks/useAuditLog.ts` |
| Criar | `src/components/ProtectedRoute.tsx` |
| Modificar | `src/App.tsx` — rotas + proteção |
| Modificar | `src/components/dashboard/Dashboard.tsx` — nome do usuário no header |
| Modificar | `src/components/dashboard/ImportDialog.tsx` — log de importação |
| Migração | Tabelas `profiles` e `audit_logs` + trigger |

