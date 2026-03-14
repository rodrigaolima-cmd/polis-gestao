
Diagnóstico confirmado (com base em código + logs + replay):
- O login no backend está OK (200 e token válido).
- O usuário tem `profile` ativo e `role=admin` no banco.
- O loop “/login -> entrar -> volta /login após ~5s” indica falha na inicialização de sessão no client.
- Causa mais provável no código atual: `onAuthStateChange` está com callback `async` e faz chamadas Supabase dentro do callback (`await fetchProfile(...)`). Isso pode travar/hangar chamadas seguintes do client (deadlock conhecido), e o app cai no timeout de 5s, mantendo `user=null` e redirecionando para `/login`.

Plano de correção (focado em resolver agora, com mínimo retrabalho):

1) Reescrever a inicialização de auth no `useAuth` para fluxo determinístico
- Arquivo: `src/hooks/useAuth.ts`
- Mudanças:
  - Remover padrão atual com `initialized` + callback `async`.
  - Criar função interna `applySession(session)` que:
    - seta `user`
    - busca profile/role (fora do callback do listener)
    - encerra `loading` sempre em `finally`.
  - Fazer bootstrap com `supabase.auth.getSession()` ao montar.
  - Registrar `onAuthStateChange` com callback **não async** e delegar processamento via `setTimeout(..., 0)` (ou `queueMicrotask`) para evitar deadlock.
  - Remover timeout “cego” de 5s como lógica principal (se mantiver, deixar apenas como última rede de segurança, sem dirigir fluxo de auth).

2) Corrigir leitura de erro nas queries de profile/role
- Arquivo: `src/hooks/useAuth.ts`
- Mudanças:
  - Hoje usa `try/catch`, mas Supabase retorna erro em `{ error }` (nem sempre lança exceção).
  - Ajustar `fetchProfile` para tratar explicitamente `{ data, error }`:
    - se `error`, logar e setar estado coerente
    - setar `profileLoaded=true` em `finally`.
  - Isso evita estado “carregando”/estado inconsistente quando a query falha semanticamente.

3) Tornar o `ProtectedRoute` explícito para “sessão ok, perfil ausente/inacessível”
- Arquivo: `src/components/ProtectedRoute.tsx`
- Mudanças:
  - Manter spinner só para estado realmente pendente: `loading` ou `(user && !profileLoaded)`.
  - Se `user` existe e `profileLoaded=true` mas `profile` é `null`, não deixar parecer “login inválido”:
    - exibir mensagem clara (ex.: perfil não encontrado/sem acesso)
    - executar `signOut()` e redirecionar para `/login`.
  - Mantém regra atual de conta inativa (`is_active=false`) com mensagem apropriada.

4) Melhorar UX do Login para sessão já existente
- Arquivo: `src/pages/LoginPage.tsx`
- Mudanças:
  - No mount, se já houver sessão válida, redirecionar para `/`.
  - Evita usuário autenticado ficar preso visualmente na tela de login em cenários de corrida.

Arquivos que serão alterados:
- `src/hooks/useAuth.ts` (principal)
- `src/components/ProtectedRoute.tsx`
- `src/pages/LoginPage.tsx`

Sem mudanças de banco nesta rodada:
- Não precisa migration agora; dados do usuário testado estão corretos no backend.

Validação rápida após implementar:
1. Abrir `/login`, autenticar com usuário ativo: deve entrar no `/` sem voltar ao login.
2. Recarregar página já logado: deve permanecer autenticado.
3. Testar usuário inativo: deve receber mensagem e voltar ao login.
4. Testar caso sem profile: deve mostrar erro claro (não loop silencioso).

Objetivo: eliminar o loop imediatamente e reduzir novas tentativas (economizar seus créditos) com um fluxo de auth robusto e previsível.
