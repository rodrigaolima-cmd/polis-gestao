

## Plano: Ordenação por valor decrescente nos gráficos/relatórios + Limpar seleção no Dashboard por Consultor

### 1. Ordenar dados por valor decrescente

**`src/utils/contractUtils.ts`**
- `getBillingByProduct`: alterar `.sort()` de alfabético para `b.billed - a.billed` (maior faturado primeiro)
- `getDistributionByUG`: alterar `.sort()` de alfabético para `b.count - a.count` (maior quantidade primeiro)

### 2. Ordenar relatórios PDF por valor decrescente

**`src/components/dashboard/SectionReportDialog.tsx`**
- `ByProductReport` (linha 271): alterar sort de `a.product.localeCompare(...)` para `b.billed - a.billed` (maior faturado primeiro)
- `ByUGReport` (linha 324): alterar sort de `a.ugType.localeCompare(...)` para `b.contracted - a.contracted` (maior contratado primeiro)

### 3. Limpar seleção no Dashboard por Consultor

**`src/components/dashboard/ConsultorDashboard.tsx`**
- Adicionar botão "Limpar" (ícone `X` ou `RotateCcw`) ao lado do `<Select>`, visível quando `selected` não é vazio
- Ao clicar, executar `setSelected("")` para resetar a seleção

