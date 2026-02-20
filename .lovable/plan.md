

## Plano Consolidado: Todas as Correcoes Pendentes

### 1. KPI "Contratos Ativos" mostrando 0

**Arquivo**: `Dashboard.tsx`
- Trocar comparacao case-sensitive `c.contractStatus === "Ativo"` para `c.contractStatus.trim().toLowerCase() === "ativo"`

### 2. KPIs de vencimento clicaveis com relatorio

**Arquivo**: `KPICard.tsx`
- Adicionar prop `onClick?: () => void`
- Quando presente, aplicar `cursor-pointer` e efeito hover

**Arquivo**: `SectionReportDialog.tsx`
- Adicionar 3 novos tipos de relatorio: `"expired"`, `"expiring30"`, `"expiring90"`
- Cada um filtra clientes pelo criterio de dias e mostra tabela com totalizadores
- Ordenacao alfabetica por nome do cliente

**Arquivo**: `Dashboard.tsx`
- Adicionar handlers onClick nos KPIs "Vencidos", "Vencer 30d" e "Vencer 90d"
- Cada um abre o SectionReportDialog com o tipo correspondente

### 3. Ordenacao alfabetica (itens ainda pendentes)

**Arquivo**: `SectionReportDialog.tsx`
- `ContractedVsBilledReport` (linha 106): trocar sort por valor para sort alfabetico primario
  - De: `.sort((a, b) => b.totalContracted - a.totalContracted || ...)`
  - Para: `.sort((a, b) => a.clientName.localeCompare(b.clientName, 'pt-BR'))`
- `ByProductReport` (linha 247): trocar sort por valor para sort alfabetico
  - De: `.sort((a, b) => b.contracted - a.contracted)`
  - Para: `.sort((a, b) => a.product.localeCompare(b.product, 'pt-BR'))`
- `ByUGReport` (linha 300): trocar sort por valor para sort alfabetico
  - De: `.sort((a, b) => b.contracted - a.contracted)`
  - Para: `.sort((a, b) => a.ugType.localeCompare(b.ugType, 'pt-BR'))`

**Arquivo**: `contractUtils.ts`
- `getBillingByProduct` (linha 120): trocar `.sort((a, b) => b.billed - a.billed)` para `.sort((a, b) => a.product.localeCompare(b.product, 'pt-BR'))`
- `getContractsByStatus` (linha 129): adicionar `.sort((a, b) => a.status.localeCompare(b.status, 'pt-BR'))`
- `getDistributionByUG` (linha 138): adicionar `.sort((a, b) => a.ugType.localeCompare(b.ugType, 'pt-BR'))`

### Resumo de Arquivos Alterados

| Arquivo | Alteracoes |
|---------|-----------|
| `KPICard.tsx` | Nova prop onClick, cursor-pointer e hover |
| `Dashboard.tsx` | Fix case-insensitive "Ativo"; 3 handlers onClick para KPIs de vencimento |
| `SectionReportDialog.tsx` | 3 novos tipos de relatorio; sort alfabetico primario em ContractedVsBilled, ByProduct e ByUG |
| `contractUtils.ts` | Sort alfabetico em getBillingByProduct, getContractsByStatus, getDistributionByUG |

