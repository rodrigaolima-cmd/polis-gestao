
Objetivo: eliminar o travamento da importação em “Iniciando... 0%” após logout/login, sem depender de chamadas que podem ficar penduradas.

Diagnóstico confirmado:
- O modal entra em modo de importação, mas não sai de “Iniciando...”.
- O primeiro `onProgress` real só acontece depois de `await supabase.auth.getSession()` em `useContracts`.
- Se essa chamada trava, nada avança e o usuário fica preso no spinner.
- Do I know what the issue is? Sim: há um deadlock/intermitência no lock de auth do client no caminho de importação, e o bloqueio está no preflight de sessão.

Plano de implementação (enxuto e cirúrgico):

1) Remover o ponto de bloqueio da importação
- Arquivo: `src/hooks/useContracts.ts`
- Remover `await supabase.auth.getSession()` do início do `importToDatabase`.
- Atualizar progresso imediatamente antes da primeira chamada remota (ex.: “Preparando importação...”) para não parecer congelado.

2) Tornar as operações de dados independentes do lock de auth
- Arquivo: `src/hooks/useContracts.ts`
- Usar cliente de dados “lock-free” (token já resolvido no contexto, sem depender de `getSession()` no import).
- Aplicar esse cliente em `loadFromDatabase` e `importToDatabase` para evitar novo travamento no dashboard e no import.

3) Expor token atual no contexto de autenticação
- Arquivo: `src/contexts/AuthContext.tsx`
- Guardar `accessToken` durante hidratação da sessão.
- Limpar no `signOut`.
- Expor no contrato do contexto para consumo no hook de contratos.

4) Hardening contra spinner infinito
- Arquivos: `src/hooks/useContracts.ts`, `src/components/dashboard/ImportDialog.tsx`
- Criar wrapper com timeout por operação crítica (select/insert/update/delete).
- Em timeout/erro, retornar falha controlada com mensagem clara e encerrar estado `importing` (sem travar modal).

5) Limpeza de logs de diagnóstico após estabilizar
- Arquivo: `src/contexts/AuthContext.tsx`
- Reduzir logs verbosos para apenas erros úteis.

Detalhes técnicos:
- Sem mudança de banco de dados nesta rodada.
- Mudanças só em frontend/hidratação de sessão e fluxo de import.
- Arquivos previstos:
  - `src/hooks/useContracts.ts` (principal)
  - `src/contexts/AuthContext.tsx`
  - `src/hooks/useAuth.ts` (se tipagem do contexto mudar)
  - `src/components/dashboard/ImportDialog.tsx` (ajuste de UX de falha/timeout)

Validação pós-implementação:
1. Logout → login → importar: progresso sai de “Iniciando...” e avança.
2. Import com ~120 linhas: finaliza com sucesso ou falha explícita (nunca spinner infinito).
3. Recarregar página logado: dados carregam normalmente.
4. Repetir import na mesma sessão: comportamento consistente.
5. Teste end-to-end no Preview e no Published.
