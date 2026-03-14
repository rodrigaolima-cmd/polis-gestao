

## Plano: Dashboard por Consultor com Relatório Detalhado e Exportação PDF

### 1. Novo componente `src/components/dashboard/ConsultorDashboard.tsx`

Seção dedicada inserida no Dashboard principal (após CommercialAnalysis), com:

- **Header**: Título "Dashboard por Consultor" com ícone `UserCheck`
- **Seletor de consultor**: Dropdown `<Select>` listando todos os consultores disponíveis nos `clients`
- **KPIs do consultor selecionado** (grid 4 colunas):
  - Total Contratado, Total Faturado, Pendência (Dinheiro na Mesa), Nº Clientes
- **Tabela de clientes do consultor**: Lista os clientes do consultor selecionado com colunas: Cliente, Tipo UG, Contratado, Faturado, Diferença, % Faturado, Vencimento, Status
- **Rodapé totalizador**
- **Botão relatório** (ícone Printer) que abre o `SectionReportDialog` com tipo `"byConsultorDetalhado"`

### 2. `src/components/dashboard/SectionReportDialog.tsx`

- Adicionar `"byConsultorDetalhado"` ao `SectionReportType`
- Adicionar título: `byConsultorDetalhado: "Relatório Detalhado — Dashboard por Consultor"`
- Novo componente `ByConsultorDetalhadoReport`:
  - Recebe `clients` e `contracts`
  - Agrupa contratos por consultor, depois por cliente dentro de cada consultor
  - Para cada consultor: header com nome, subtabela com todos os contratos (Produto, Tipo UG, Contratado, Faturado, Pendência, Vencimento, Status)
  - Subtotal por consultor
  - Rodapé totalizador geral
  - Exportação PDF via `window.print()` (mesmo padrão dos outros relatórios)

### 3. `src/components/dashboard/Dashboard.tsx`

- Importar `ConsultorDashboard`
- Inserir `<ConsultorDashboard>` entre `CommercialAnalysis` e `ActionTables`
- Passar props: `clients`, `contracts: filteredContracts`, callback `onReport={() => setSectionReport("byConsultorDetalhado")}`

### Detalhes técnicos

- O `ConsultorDashboard` usa `useMemo` para filtrar clientes pelo consultor selecionado
- A lista de consultores é extraída de `clients` com `new Set`, filtrando vazios
- O relatório detalhado reutiliza o padrão visual existente (Table, TableFooter, formatCurrency, etc.)
- A exportação PDF usa o mesmo mecanismo `window.print()` + classe `.print-report` já implementado

