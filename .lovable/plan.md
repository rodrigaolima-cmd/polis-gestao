

## Adicionar campo Email ao modal Editar Usuário

### Desafio técnico

O email está armazenado na tabela `auth.users` (gerenciada pelo sistema de autenticação), que **não é acessível** diretamente pelo client-side SDK. A tabela `profiles` não tem coluna `email`. Precisamos de uma abordagem em duas partes.

### Abordagem

#### 1. Nova Edge Function: `admin-list-users`
Criar uma edge function que usa `service_role_key` para listar emails dos usuários via `supabase.auth.admin.listUsers()`. Retorna um map `{ user_id: email }`. Apenas admins autorizados podem chamar.

#### 2. Nova Edge Function: `admin-update-email`
Criar uma edge function que usa `supabase.auth.admin.updateUserById()` para alterar o email de um usuário. Validações:
- Verificar que o chamador é admin
- Validar formato do email
- Verificar duplicidade chamando `admin.listUsers()` e checando se outro user já tem o email
- Se o usuário editado é o logado, o frontend mostra confirmação antes de chamar

#### 3. `ConfiguracoesPage.tsx` — mudanças

**fetchUsers**: Após buscar profiles e roles, chamar `admin-list-users` para obter emails e incluir no array `users`.

**Estado do edit modal**: Adicionar `editEmail` state.

**openEditUser**: Setar `editEmail` com o email do usuário.

**handleSaveEdit**: Se `editEmail` mudou, chamar `admin-update-email`. Se o usuário editado é o logado (`editUser.id === currentUser.id`), mostrar `confirm("Alterar o email pode impactar o acesso ao sistema. Deseja continuar?")` antes de prosseguir.

**Modal UI**: Adicionar campo Email (type="email", required) entre "Nome Completo" e "Data de cadastro".

### Arquivos afetados
- `supabase/functions/admin-list-users/index.ts` — **novo** — listar emails
- `supabase/functions/admin-update-email/index.ts` — **novo** — atualizar email
- `src/pages/ConfiguracoesPage.tsx` — campo email no modal, fetch emails, save email

### O que NÃO muda
- Layout geral, botões, permissões, login flow
- Schema do banco (sem migrations)
- Outros módulos

