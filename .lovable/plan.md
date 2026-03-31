

## Corrigir usuário ausente na lista

### Causa raiz

A função `handle_new_user()` existe no banco mas **não há trigger** vinculando-a à tabela `auth.users`. Quando Tatiane foi criada via `admin-create-user`, o Supabase Auth inseriu em `auth.users`, mas nenhum trigger disparou para criar o registro em `profiles`. Sem profile, ela não aparece na lista.

O update na linha 103-106 do `admin-create-user` (`update profiles ... eq id`) silenciosamente não atualiza nada porque o registro não existe.

### Mudanças

#### 1. Migration: Criar trigger + backfill (SQL)

```sql
-- Criar o trigger que estava faltando
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill: criar profiles para users que existem em auth.users mas não em profiles
INSERT INTO public.profiles (id, full_name, is_active)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'full_name', ''), false
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;
```

#### 2. Edge function `admin-create-user/index.ts` — hardening

Alterar o fluxo pós-criação: em vez de apenas `update`, usar `upsert` para garantir que o profile exista mesmo se o trigger falhar:

```ts
// Linha ~103: trocar update por upsert
await supabaseAdmin
  .from("profiles")
  .upsert({
    id: newUser.user.id,
    full_name: full_name,
    is_active: true,
    force_password_change: forcePwChange,
  });
```

### Resultado esperado

- Tatiane aparecerá na lista imediatamente após o backfill
- Futuros usuários criados terão profile garantido (trigger + upsert como fallback)
- Nenhuma mudança de layout ou lógica de autenticação

### Arquivos afetados
- Nova migration SQL (trigger + backfill)
- `supabase/functions/admin-create-user/index.ts` — upsert em vez de update

