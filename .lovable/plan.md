

# Controle de Acesso por Aprovação de Admin

## Abordagem Recomendada

Como serão poucos usuários, a melhor abordagem é:
- **Remover a opção de cadastro público** (signup) da tela de login
- **Apenas o admin cadastra usuários** via uma tela de configurações dentro do sistema
- O admin cria o usuário com nome, email e senha, e define se está ativo ou não

Isso é mais seguro e simples do que permitir auto-cadastro com aprovação posterior.

## Mudanças

### 1. Banco de Dados

**Adicionar coluna `is_active` na tabela `profiles`** (default `false`):
- Novos usuários começam inativos
- Admin ativa/desativa pelo painel

**Criar tabela `user_roles`** com enum `app_role` (`admin`, `user`):
- Controla quem é admin
- Função `has_role()` para verificar permissões sem recursão RLS

**Ajustar RLS de `profiles`**:
- Admins podem ler e atualizar todos os perfis
- Usuários comuns só leem o próprio

**Criar função `admin_create_user`** (edge function):
- Recebe nome, email, senha
- Cria usuário via Supabase Admin API (service role)
- Apenas admins podem chamar

### 2. Tela de Login (`LoginPage.tsx`)

- **Remover opção de signup** — só login e "esqueci senha"
- Após login, verificar se `profiles.is_active = true`
- Se inativo, mostrar mensagem "Conta inativa. Contate o administrador." e fazer logout

### 3. `ProtectedRoute.tsx`

- Verificar `is_active` do perfil além da autenticação
- Redirecionar usuários inativos para login com mensagem

### 4. Hook `useAuth.ts`

- Incluir `is_active` no fetch do perfil
- Expor campo `isActive` para os componentes

### 5. Nova Página: Configurações (`/configuracoes`)

- Menu lateral ou botão no header para acessar
- **Aba "Usuários"**: lista todos os perfis com nome, email, status (ativo/inativo), role
- Ações do admin: ativar/desativar usuário, criar novo usuário
- **Formulário "Novo Usuário"**: nome, email, senha — chama edge function

### 6. Edge Function `admin-create-user`

- Recebe `{ email, password, full_name }` via POST
- Verifica se o chamador é admin (via JWT + `has_role`)
- Cria usuário com `supabase.auth.admin.createUser()`
- Define `is_active = true` automaticamente (admin criou, já ativa)

### 7. Dashboard — Navegação

- Adicionar link "Configurações" no header (visível só para admins)
- Rota `/configuracoes` protegida + verificação de role admin

## Arquivos Afetados

| Ação | Arquivo |
|------|---------|
| Migração | `profiles` — adicionar `is_active`, ajustar RLS |
| Migração | `user_roles` + enum + função `has_role()` |
| Criar | `supabase/functions/admin-create-user/index.ts` |
| Criar | `src/pages/ConfiguracoesPage.tsx` |
| Modificar | `src/pages/LoginPage.tsx` — remover signup, checar ativo |
| Modificar | `src/hooks/useAuth.ts` — incluir `is_active` |
| Modificar | `src/components/ProtectedRoute.tsx` — checar ativo |
| Modificar | `src/components/dashboard/Dashboard.tsx` — link configurações |
| Modificar | `src/App.tsx` — rota `/configuracoes` |

