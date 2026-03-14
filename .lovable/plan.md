
Objetivo: parar definitivamente o loop “login → spinner ~10-15s → volta para /login” com uma correção única e robusta (sem depender de timeout cego).

Diagnóstico consolidado:
- O backend autentica corretamente (login 200, token emitido em todas as tentativas).
- O frontend está caindo no `Auth safety timeout reached`, então o estado de auth não estabiliza antes do fallback.
- O problema é de inicialização/concorrência no client: fluxo de sessão ainda vulnerável a corrida/trava e queda para redirect.
- Do I know what the issue is? Sim: o estado de autenticação está sendo resolvido de forma frágil no cliente e, quando a resolução falha/atrasa, o `ProtectedRoute` redireciona para `/login`.

Plano de implementação (enxuto, alto impacto):

1) Centralizar auth em uma fonte única (eliminar múltiplas inicializações concorrentes)
- Criar um `AuthProvider` global para inicializar sessão uma única vez.
- Converter `useAuth` em consumer desse contexto (sem criar listeners independentes em cada uso).
- Arquivos:
  - novo `src/contexts/AuthContext.tsx`
  - ajustar `src/hooks/useAuth.ts`
  - envolver app no provider em `src/App.tsx`

2) Reescrever pipeline de sessão para ser determinístico e sem “drop” de eventos
- Remover o bloqueio por `processingRef` (que pode descartar atualizações válidas).
- Usar controle por `requestId` (“último evento vence”) para evitar concorrência sem travar.
- Tratar profile/role com `Promise.allSettled` + checagem explícita de erro.
- Garantir finalização de estado em todos os caminhos (`loading=false`, `profileLoaded=true`).
- Manter listener `onAuthStateChange` não-async + delegação fora do callback.

3) Substituir timeout cego por fallback técnico controlado
- Tirar lógica de timeout que hoje dirige fluxo.
- Em vez disso: watchdog curto só para diagnóstico/fallback, sem redirect automático.
- Se a sessão não puder ser resolvida, expor estado de erro de inicialização (não loopar de volta ao login silenciosamente).

4) Ajustar `ProtectedRoute` para nunca mascarar erro como “deslogado”
- Continuar spinner apenas em estado realmente pendente.
- Se houver falha de init/auth, mostrar tela clara de erro de sessão (com ação de recarregar/sair), em vez de bounce para `/login`.
- Manter regras de segurança:
  - sem `user` autenticado => `/login`
  - usuário inativo => mensagem + signOut controlado
  - profile ausente => mensagem + signOut controlado

5) Ajustar `LoginPage` para navegação confirmada e estável
- Navegar após `signInWithPassword` bem-sucedido (usando retorno da chamada), mantendo listener apenas como suporte.
- Evitar depender exclusivamente do evento `SIGNED_IN` para transição de rota.
- Evitar dupla navegação e corridas durante unmount.

Arquivos afetados:
- `src/contexts/AuthContext.tsx` (novo)
- `src/hooks/useAuth.ts`
- `src/App.tsx`
- `src/components/ProtectedRoute.tsx`
- `src/pages/LoginPage.tsx`

Banco de dados:
- Nenhuma migration necessária nesta rodada (perfil/role do usuário já estão corretos no backend).

Validação pós-implementação:
1. Login com usuário ativo/admin entra no `/` sem retorno ao `/login`.
2. Recarregar já logado mantém sessão.
3. Usuário inativo recebe mensagem correta e sai.
4. Perfil ausente mostra erro claro e não entra em loop.
