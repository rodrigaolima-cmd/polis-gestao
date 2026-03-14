
Objetivo: parar o loop “Entrar → spinner ~10s → volta para /login” com a menor intervenção possível.

Diagnóstico (com base em logs/replay):
- O login no backend está funcionando (POST /token = 200, token emitido).
- O replay mostra spinner por ~10s e retorno ao login, exatamente o timeout do `useAuth`.
- Isso indica condição de corrida no client: navegação para `/` acontece antes da sessão estar estabilizada no estado global, e o `ProtectedRoute` cai no fallback de timeout.

Plano de implementação (rápido e direto):

1) Ajustar o fluxo do `LoginPage` para navegar só quando sessão estiver confirmada
- Arquivo: `src/pages/LoginPage.tsx`
- Remover navegação imediata após `signInWithPassword`.
- Em vez disso, escutar `onAuthStateChange` (evento `SIGNED_IN`) e só então `navigate("/")`.
- Resultado: evita entrar no `ProtectedRoute` com sessão ainda “meio carregada”.

2) Tornar o `useAuth` determinístico (sem depender do timeout cego)
- Arquivo: `src/hooks/useAuth.ts`
- Registrar `onAuthStateChange` antes da leitura inicial de sessão.
- Processar sessão com callback não-async + delegação (`setTimeout/queueMicrotask`), mantendo anti-deadlock.
- Em `applySession`, garantir `setLoading(false)` em `finally` (não apenas no caminho `isInitial`).
- Tratar `getSession()` com `catch` + finalização garantida.
- Manter timeout apenas como “última rede” (curto), nunca como fluxo principal.

3) Endurecer o `ProtectedRoute` para não mascarar falha de inicialização
- Arquivo: `src/components/ProtectedRoute.tsx`
- Manter spinner somente enquanto estado realmente pendente: `loading || (user && !profileLoaded)`.
- Se sessão existe e `profile` não veio após carga concluída: mensagem clara + `signOut` controlado (sem loop de efeito).
- Preservar regra de conta inativa.

4) Validação rápida pós-correção (para não gastar mais créditos)
- Teste 1: login com usuário ativo → deve entrar no `/` sem voltar ao `/login`.
- Teste 2: refresh já logado → permanece autenticado.
- Teste 3: logout e novo login em sequência → sem spinner de 10s.
- Teste 4: usuário sem perfil/inativo → mensagem correta e retorno ao login (sem loop).

Detalhes técnicos:
- Arquivos a modificar:
  - `src/pages/LoginPage.tsx`
  - `src/hooks/useAuth.ts`
  - `src/components/ProtectedRoute.tsx`
- Banco de dados: nenhuma alteração necessária nesta rodada.
- Ganho esperado: eliminar corrida de sessão + remover dependência do timeout como mecanismo principal de autenticação.
