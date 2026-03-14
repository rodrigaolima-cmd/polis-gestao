
Objetivo: parar o travamento no login (spinner infinito) e eliminar o retorno para /login após autenticação bem-sucedida.

Diagnóstico (com base no replay + logs + rede):
- O login (`/auth/v1/token`) retorna 200 com token válido.
- O `AuthContext` entra em `applyAuthSession` (log visto), mas não conclui o fluxo.
- Não há chamadas de rede para `profiles`/`user_roles` após o login.
- Do I know what the issue is? Sim: o bootstrap de sessão está ficando preso em chamadas do client durante a hidratação de perfil/role (comportamento compatível com travamento intermitente do client auth lock), então `profileLoaded` não fecha e o fluxo não finaliza.

Plano de implementação (cirúrgico):

1) Tornar o pós-login independente de `getSession()` pendente
- Arquivo: `src/pages/LoginPage.tsx`
- Trocar o fluxo para usar o `data.session` retornado por `signInWithPassword` imediatamente.
- Chamar um novo método do contexto (ex.: `hydrateFromSession(session)`) em vez de depender de `refreshAuth()` após login.
- Colocar `setSubmitting(false)` em `finally` para nunca deixar botão preso.

2) Hidratação de perfil/role sem depender de `supabase.from(...)` no bootstrap crítico
- Arquivo: `src/contexts/AuthContext.tsx`
- Criar função de leitura de perfil/role via `fetch` REST com `Authorization: Bearer <access_token>` + `apikey`, usando:
  - `/rest/v1/profiles?...`
  - `/rest/v1/user_roles?...`
- Usar `AbortController` + timeout (ex.: 6–8s) para impedir await infinito.
- Manter `requestId` (“última atualização vence”) para evitar sobrescrita por resposta antiga.
- Garantir finalização de estado em todos os caminhos (`loading=false`, `profileLoaded=true`), inclusive timeout/erro.

3) Preservar fallback de recuperação sem loop
- Arquivo: `src/components/ProtectedRoute.tsx`
- Manter comportamento atual de erro claro quando `user` existe e `profile` falha.
- Ajustar `refreshAuth` para também usar timeout/finalização garantida (sem spinner eterno).
- Nunca redirecionar silenciosamente para `/login` em erro de hidratação.

4) Ajuste de contrato do hook/contexto
- Arquivo: `src/hooks/useAuth.ts` (se necessário por tipagem exposta)
- Expor o novo método `hydrateFromSession` e manter `refreshAuth` para retry manual.

Arquivos previstos:
- `src/contexts/AuthContext.tsx`
- `src/pages/LoginPage.tsx`
- `src/components/ProtectedRoute.tsx` (ajuste pequeno)
- `src/hooks/useAuth.ts` (tipos/export)

Validação pós-fix:
1. Login em Preview: entra no `/` sem spinner infinito.
2. Login no Published: mesmo comportamento (sem bounce para `/login`).
3. Recarregar já logado: sessão continua e perfil carrega.
4. Em falha de perfil, mostrar tela de erro com “Tentar novamente”/“Sair” (sem loop).
5. Verificar no Network que `profiles` e `user_roles` são chamados após login.
