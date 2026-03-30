

## Problema

O projeto foi remixado (copiado). O schema do banco foi copiado, mas os **usuários de autenticação não**. O usuário `rodrigo.lima@polisgestao.com.br` não existe no sistema de autenticação deste projeto, por isso todas as tentativas de login retornam "Invalid login credentials".

## Solução

### 1. Criar o usuário admin via edge function

Usar a edge function `admin-create-user` existente **não funciona** aqui porque ela exige um caller autenticado como admin — e não temos nenhum usuário.

**Criar uma edge function temporária `bootstrap-admin`** que usa o service role key para:
- Criar o usuário `rodrigo.lima@polisgestao.com.br` com senha `Mudar123@` e `email_confirm: true`
- Criar o profile com `is_active: true`, `force_password_change: true`
- Atribuir role `admin`

### 2. Executar a edge function uma vez

Chamar a function via curl para criar o usuário.

### 3. Remover a edge function temporária

Deletar `bootstrap-admin` após uso — ela é um risco de segurança se mantida.

### Resultado

- Usuário `rodrigo.lima@polisgestao.com.br` criado como admin ativo
- Senha temporária: `Mudar123@`
- Será solicitada troca de senha no primeiro acesso
- Sem necessidade de email de confirmação (confirmado automaticamente)

### Arquivos afetados
- 1 edge function temporária criada e depois removida: `supabase/functions/bootstrap-admin/index.ts`

