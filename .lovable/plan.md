## Objetivo

Reduzir o tempo de carga das telas (Dashboard, Clientes, Configurações) de ~3–5s para <1s **sem alterar layout, estilos ou regras de negócio**, e eliminar o "Carregando..." ao trocar de rota.

## Escopo (o que muda)

Apenas a **camada de dados** (`useContracts.ts` + novos hooks de query). Componentes visuais ficam intactos — eles continuam consumindo `contracts`, `operationalLeaks`, `loading` etc. exatamente como hoje.

## Etapas

### 1. Cache global com React Query
- `@tanstack/react-query` já está instalado. Envolver o `App` com `QueryClientProvider` (se ainda não estiver) com `staleTime: 5 min` e `gcTime: 30 min`.
- Migrar `loadFromDatabase` e `loadOperationalLeaks` para `useQuery` com chaves estáveis (`["contracts", scope, includeInactive]` e `["operational-leaks"]`).
- **Resultado:** ao navegar Dashboard → Clientes → Configurações → Dashboard, os dados vêm do cache instantaneamente. O "Carregando..." só aparece na primeira visita da sessão.

### 2. Reduzir colunas e payload
- Trocar `select("*, clients!inner(*), modules(*)")` por um select enxuto com apenas os campos usados na UI (≈10 colunas em vez de ~30).
- Mesma otimização em `loadOperationalLeaks` (já é mais enxuto, mas tirar `observacoes_cliente` da listagem inicial — só carregar sob demanda no detalhe).
- **Resultado esperado:** payload ~60% menor, parse JSON mais rápido no navegador.

### 3. Unificar as duas cargas
Hoje `loadFromDatabase` e `loadOperationalLeaks` leem praticamente o mesmo dataset em paralelo. Vamos:
- Manter **uma única query** que traz `client_modules` + dados mínimos de `clients` e `modules`.
- Derivar `operationalLeaks` (semFaturamento, semOperacao, naoImplantado) **em memória** via `useMemo` a partir do mesmo dataset.
- **Resultado:** metade das requisições ao banco.

### 4. Paralelizar paginação
Quando o dataset passa de 1.000 linhas, hoje as páginas são buscadas sequencialmente. Vamos:
- Fazer 1 chamada `HEAD` com `count: 'exact'` para descobrir o total.
- Disparar todas as páginas em `Promise.all`.
- **Resultado:** N páginas em paralelo em vez de N round-trips em série.

### 5. Prefetch no login
- Após o login bem-sucedido, disparar `queryClient.prefetchQuery(["contracts", ...])` em background.
- Quando o usuário chega no Dashboard, os dados já estão prontos.

## Fora de escopo (ficam para depois, se necessário)
- Criar VIEW/RPC no Postgres com agregados pré-calculados — só vale a pena se os passos 1–4 não forem suficientes.
- Virtualização de tabelas (react-virtual) — só se a tela de Clientes ainda travar com muitos registros após o cache.
- Realtime/invalidação fina — manteremos invalidação manual (após criar/editar/excluir, chamamos `queryClient.invalidateQueries`).

## Detalhes técnicos

**Arquivos afetados:**
- `src/hooks/useContracts.ts` — refatorado para usar `useQuery` internamente, mantendo a **mesma API pública** (`contracts`, `loading`, `operationalLeaks`, `importToDatabase`, `loadFromDatabase`, `setClientStatusScope`, etc.). Nenhum componente precisa ser alterado.
- `src/App.tsx` ou `src/main.tsx` — garantir `QueryClientProvider` no topo com defaults adequados.
- `src/contexts/AuthContext.tsx` — adicionar `prefetchQuery` após login (passo 5, opcional).

**Invalidações que precisam continuar funcionando:**
- Após `importToDatabase`, criar/editar cliente, criar/editar módulo, excluir → `invalidateQueries(["contracts"])` e `invalidateQueries(["operational-leaks"])`.

**Garantias:**
- Nenhuma mudança em layout, cores, componentes ou regras de cálculo.
- Mesma API do `useContracts` — zero alteração nos componentes consumidores.
- Fallback para `mockContracts` mantido em caso de erro.

## Ordem de implementação

1. Configurar `QueryClient` global (se necessário) + migrar `loadFromDatabase` para `useQuery`.
2. Migrar `loadOperationalLeaks` ou já unificá-lo (passo 3) na mesma rodada.
3. Reduzir colunas no select.
4. Adicionar invalidações nos pontos de mutação.
5. (Opcional) Paralelizar paginação se ainda houver dataset grande.
6. (Opcional) Prefetch no login.

## Resultado esperado

- **Primeira carga:** de ~3–5s para ~800ms–1.5s (menos colunas + 1 query em vez de 2).
- **Trocar de rota:** instantâneo (cache).
- **Após editar/importar:** recarrega automaticamente apenas o que foi invalidado.
