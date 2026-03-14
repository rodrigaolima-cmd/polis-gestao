

## Problema

O estado inicial de `useContracts` é `useState<ContractRow[]>(mockContracts)` — dados de teste. Quando o usuário navega para o dashboard, esses dados mock aparecem por um instante antes da query ao banco retornar os dados reais.

## Solução

Inicializar o hook com array vazio e `loading=true`, e mostrar um skeleton/loading no dashboard enquanto os dados reais carregam. Assim, nunca se vê dados antigos.

### Alterações:

**1. `src/hooks/useContracts.ts`**
- Trocar `useState<ContractRow[]>(mockContracts)` por `useState<ContractRow[]>([])`.
- Trocar `useState(false)` do loading por `useState(true)` (já começa carregando).
- No fallback de erro em `loadFromDatabase`, manter `mockContracts` como fallback mas só se o banco não tiver dados.

**2. `src/components/dashboard/Dashboard.tsx`**
- Mostrar um estado de carregamento (spinner ou skeleton) enquanto `loading === true` e `contracts.length === 0`, em vez de renderizar KPIs e gráficos com dados vazios/mock.

Isso elimina o flash de dados antigos em qualquer navegação.

