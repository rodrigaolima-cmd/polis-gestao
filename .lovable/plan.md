
Objetivo: eliminar de vez o comportamento “clica em Entrar → espera ~10s → volta para /login”, sem depender de timeout cego.

Diagnóstico atualizado (com base no código atual + logs):
- O backend está autenticando corretamente (login 200 com token).
- O perfil no banco existe e está ativo.
- O problema está no estado de autenticação no frontend (inicialização/concorrência), não na credencial.
- Do I know what the issue is? Sim: o estado global de auth está sendo sobrescrito/invalidado por corrida de bootstrap e/ou falha transitória na leitura de perfil, e o app volta para /login sem estabilizar a sessão.

Plano de correção (implementação):
1) Reforçar o pipeline de auth no `AuthContext` para estado determinístico
- Arquivo: `src/contexts/AuthContext.tsx`
- Ajustes:
  - Unificar aplicação de sessão em uma função única `applyAuthSession(session, source)` com `requestId` (última atualização vence).
  - Sempre iniciar leitura de usuário com:
    - `loading=true`
    - `profileLoaded=false`
    - antes de consultar `profiles/user_roles`.
  - Evitar corrida entre bootstrap e eventos de auth:
    - manter listener não-async;
    - processar fora do callback (`setTimeout(..., 0)`);
    - impedir que retorno “stale” (ex.: sessão null antiga) sobrescreva sessão recém-logada.
  - Adicionar retry curto (ex.: 2–3 tentativas) para leitura de `profiles` em erro transitório.
  - Expor `refreshAuth()` e `authError` no contexto para recuperação manual sem loop.

2) Tornar `ProtectedRoute` resiliente e sem logout prematuro
- Arquivo: `src/components/ProtectedRoute.tsx`
- Ajustes:
  - Spinner só enquanto estado realmente pendente (`loading` ou `user && !profileLoaded`).
  - Se `user` existe mas `profile` não carregou após tentativas:
    - não redirecionar silenciosamente para `/login`;
    - exibir mensagem clara com ação “Tentar novamente” (`refreshAuth`) e “Sair”.
  - Manter regra de conta inativa com mensagem e `signOut` controlado.

3) Ajustar `LoginPage` para confirmação real de sessão
- Arquivo: `src/pages/LoginPage.tsx`
- Ajustes:
  - Após `signInWithPassword` sem erro, manter botão em estado de envio até a confirmação do contexto (`user + profileLoaded`).
  - Evitar múltiplas tentativas sequenciais enquanto a confirmação está pendente.
  - Exibir erro orientativo se sessão foi criada, mas perfil não estabilizou no tempo esperado (sem loop).

4) Amarrar tipos do hook de auth
- Arquivo: `src/hooks/useAuth.ts`
- Ajustes:
  - Continuar como consumer do contexto, incluindo os novos campos (`refreshAuth`, `authError`) para uso no route guard e login.

Detalhes técnicos:
- Não haverá mudança de banco nesta rodada.
- Foco total em estabilização de estado no cliente e eliminação de corrida.
- Fluxo desejado:
```text
signIn OK
  -> evento auth (não-async)
  -> applyAuthSession (requestId atual)
  -> fetch profile/role (com retry curto)
  -> profileLoaded=true, loading=false
  -> login redireciona para /
```

Validação pós-implementação (rápida e objetiva):
1. Login com usuário ativo: entra no `/` sem retornar ao `/login`.
2. Refresh já logado: continua autenticado.
3. Logout e login em sequência: sem espera longa nem loop.
4. Usuário inativo: mensagem correta + saída.
5. Usuário sem perfil: erro claro (sem bounce silencioso).
6. Confirmar no Preview e no link publicado para descartar interferência de sessão do navegador.
