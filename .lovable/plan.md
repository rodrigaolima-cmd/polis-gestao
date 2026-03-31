

## Bugfix — Novo Usuário modal

### Problemas identificados

1. **Modal "Novo Usuário" não reseta campos** — os states `newEmail`, `newFullName`, `newPassword` são limpos após criar, mas não ao abrir o dialog. Se o user fechou sem criar, os valores anteriores permanecem. Além disso, não há campo Perfil nem checkbox de troca de senha.

2. **Faltam campos**: Perfil (Admin/Usuário) e "Solicitar troca de senha no primeiro acesso" no modal de criação.

3. **Edge function `admin-create-user`** sempre atribui role `"user"` — precisa aceitar o role escolhido e o flag `force_password_change`.

### Mudanças

#### 1. `src/pages/ConfiguracoesPage.tsx`

- Adicionar states `newRole` (default `"user"`) e `newForcePassword` (default `false`)
- No `onOpenChange` do Dialog de criação: quando `open = true`, resetar todos os campos (`newFullName=""`, `newEmail=""`, `newPassword=""`, `newRole="user"`, `newForcePassword=false`)
- Adicionar ao form:
  - Campo **Perfil** (Select: Admin / Usuário) — entre Email e Senha
  - Checkbox **"Solicitar troca de senha no primeiro acesso"** — após Senha
- Em `handleCreateUser`: enviar `role` e `force_password_change` no body da edge function

#### 2. `supabase/functions/admin-create-user/index.ts`

- Aceitar campos opcionais `role` (default `"user"`) e `force_password_change` (default `false`)
- Usar o `role` recebido no insert de `user_roles` (validando que é `"admin"` ou `"user"`)
- Após criar o profile, fazer update de `force_password_change` no profile

### Arquivos afetados
- `src/pages/ConfiguracoesPage.tsx`
- `supabase/functions/admin-create-user/index.ts`

### O que NÃO muda
- Layout, autenticação, edit modal (já funciona), dashboard

