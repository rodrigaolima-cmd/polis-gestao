
## Objetivo
1. Garantir que ambas as listas do card "Vazamento Operacional" fiquem em ordem alfabética estrita (pt-BR).
2. Fazer o card e o relatório responderem aos filtros aplicados no `FiltersBar` (consultor, região, tipo UG, cliente, busca textual), permitindo isolar vazamentos por consultor/região.

## Arquivos a editar (3)

### 1. `src/hooks/useContracts.ts`
- Em `loadOperationalLeaks()`, substituir o sort de `semFaturamento` para usar exclusivamente `localeCompare("pt-BR", { sensitivity: "base" })` por `clientName` (remover `b.valorEmRisco - a.valorEmRisco` como critério primário).
- `semOperacao` já é alfabético — manter.

### 2. `src/components/dashboard/Dashboard.tsx`
- Novo `useMemo` `filteredOperationalLeaks` aplicando os filtros relevantes (`consultor`, `regiao`, `ugType`, `client`, `search` via `normalizeForSearch`) sobre `operationalLeaks.semFaturamento` e `operationalLeaks.semOperacao`.
- NÃO aplicar filtros temporais (`signatureYear`, `expirationYear`, `expireInDays`, `onlyWithDifference`) — vazamento é fotografia atual.
- Passar `filteredOperationalLeaks` para `OperationalLeakAlert` e `SectionReportDialog` no lugar do dataset cru.
- Calcular `isLeakFiltered` baseado nos filtros que afetam vazamento e passar ao card.

### 3. `src/components/dashboard/OperationalLeakAlert.tsx`
- Nova prop opcional `isFiltered?: boolean`.
- Quando `true`, renderizar badge discreto "· filtrado" no header (ao lado de "Clique para ver detalhes"), em uppercase tracking-wider muted-foreground.
- Manter regra: card escondido se ambas contagens = 0 (vale para subset filtrado também).

## O que NÃO muda
- Critérios de detecção de vazamento.
- Toggle "Incluir clientes sem operação ativa".
- Layout, cores, KPIs, sidebar, demais componentes.
- Estrutura interna do `SectionReportDialog` (recebe dados já filtrados).

## Resultado esperado
- Listas A→Z estáveis nas duas seções.
- Filtrar consultor "X" no hero → card e relatório mostram apenas vazamentos de "X" (ou some se zero).
- Badge "filtrado" evita interpretar o número como total da empresa.
