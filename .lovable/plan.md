

## Etapa 3 — Padronizar tabelas, cards e badges no padrão Polis Hub

### Objetivo
Substituir `glass-card` por cards sólidos (`bg-card border rounded-xl shadow-sm`) e padronizar badges de status em todos os componentes. Sem alterar lógica funcional.

### Mudanças

#### 1. Substituir `glass-card` por card sólido
Todos os usos de `glass-card` serão trocados por `bg-card border border-border rounded-xl shadow-sm`.

Arquivos afetados:
- `src/pages/ClientesPage.tsx` (linha 185) — tabela de clientes
- `src/pages/ClienteDetailPage.tsx` (linhas 194, 220) — info card + tabela de módulos
- `src/components/dashboard/ActionTables.tsx` (linhas 27, 69) — ranking e contratos críticos
- `src/components/dashboard/CommercialAnalysis.tsx` (linhas 51, 86) — análises comerciais
- `src/components/dashboard/FiltersBar.tsx` (linha 43) — barra de filtros

#### 2. Padronizar badges de status
Criar um padrão visual consistente para badges em todas as páginas:

- **Ativo**: `bg-success/10 text-success border-success/30`
- **Inativo**: `bg-muted text-muted-foreground`
- **Prospect**: `bg-info/10 text-info border-info/30`
- **Vencido/Crítico**: mantém padrão já existente no `StatusBadge` de `ActionTables`

Aplicar em:
- `ClientesPage.tsx` (linha 241) — badge de status do cliente
- `ClienteDetailPage.tsx` (linha 209) — badge de status do cliente
- `ClienteDetailPage.tsx` (linha 272) — badge de status do módulo

#### 3. Padronizar headers de tabela
Adicionar `bg-muted/50` ao `TableHeader` para consistência visual com Polis Hub:
- `ClientesPage.tsx`
- `ClienteDetailPage.tsx`
- `ActionTables.tsx`
- `CommercialAnalysis.tsx`
- `ConsultorDashboard.tsx`
- `ConfiguracoesPage.tsx`

#### 4. Remover `glass-card` do CSS
Remover a utility class `.glass-card` de `src/index.css` (linha 114) já que não será mais usada.

### Arquivos afetados (8)
1. `src/pages/ClientesPage.tsx`
2. `src/pages/ClienteDetailPage.tsx`
3. `src/pages/ConfiguracoesPage.tsx`
4. `src/components/dashboard/ActionTables.tsx`
5. `src/components/dashboard/CommercialAnalysis.tsx`
6. `src/components/dashboard/FiltersBar.tsx`
7. `src/components/dashboard/ConsultorDashboard.tsx`
8. `src/index.css`

### O que NÃO muda
- Cálculos, validações, lógica de negócio
- Estrutura de dados, RLS, edge functions
- KPI cards (já redesenhados na Etapa 2)
- Login page (já redesenhado na Etapa 2)
- Layout sidebar/header (já implementado na Etapa 1)

