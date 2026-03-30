

## Plano: KPI de Módulos no Dashboard + Somatório na tabela de Clientes

### 1. Novo KPI Card "Total Módulos" no Dashboard

**Edição: `src/components/dashboard/Dashboard.tsx`**

- Calcular `totalModulos` somando `productCount` de cada client no array `clients` (já filtrado)
- Adicionar novo KPI card na grid, com ícone `Layers` ou `Package`, variant "info"
- Tornar clicável — ao clicar, abre `SectionReportDialog` com novo tipo `"byModulos"`
- Ajustar grid para 9 colunas ou reorganizar os 8+1 existentes (manter `xl:grid-cols-9` ou usar wrap)

### 2. Novo tipo de relatório "byModulos" no SectionReportDialog

**Edição: `src/components/dashboard/SectionReportDialog.tsx`**

- Adicionar `"byModulos"` ao tipo `SectionReportType`
- Renderizar tabela: Cliente | Qtd Módulos | Produtos | Contratado | Faturado
- Ordenar por quantidade de módulos (decrescente)
- Totalizador no footer com soma de módulos

### 3. Somatório de módulos na tabela de Clientes

**Edição: `src/pages/ClientesPage.tsx`**

- Calcular `totalModulos = filtered.reduce((s, c) => s + c.modules_count, 0)` 
- Exibir no footer da tabela, ao lado do texto "X cliente(s) encontrado(s)": `• Y módulo(s)`
- Sensível ao filtro aplicado (usa `filtered`, não `clients`)

### Arquivos afetados
- 3 arquivos editados: `Dashboard.tsx`, `SectionReportDialog.tsx`, `ClientesPage.tsx`
- Sem alterações no banco, layout geral ou lógica de dados

