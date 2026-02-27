

## Plano: Remover Exportar CSV + Adicionar Relatórios por Consultor e Região

### 1. `src/components/dashboard/Dashboard.tsx`
- Remover o `<Button>` "Exportar" (CSV) do header (linhas 154-156)
- Remover `handleExport` function (linhas 77-93)
- Remover `FileSpreadsheet` do import lucide-react
- Passar `onConsultorReport` e `onRegiaoReport` para `CommercialAnalysis`:
  ```
  <CommercialAnalysis
    clients={clients}
    onConsultorReport={() => setSectionReport("byConsultor")}
    onRegiaoReport={() => setSectionReport("byRegiao")}
  />
  ```

### 2. `src/components/dashboard/CommercialAnalysis.tsx`
- Adicionar props `onConsultorReport` e `onRegiaoReport` (callbacks opcionais)
- Importar `Button` e `Printer` icon
- Adicionar botão Printer no header de cada card (ao lado do título h3), mesmo padrão dos DashboardCharts

### 3. `src/components/dashboard/SectionReportDialog.tsx`
- Adicionar `"byConsultor"` e `"byRegiao"` ao `SectionReportType`
- Adicionar títulos no `TITLES`:
  - `byConsultor: "Relatório — Dinheiro na Mesa por Consultor"`
  - `byRegiao: "Relatório — Dinheiro na Mesa por Região"`
- Criar `ByConsultorReport` e `ByRegiaoReport` (reutilizam lógica `buildRanking` do CommercialAnalysis):
  - Tabela: Label | Total Pendência | Nº Clientes
  - Rodapé totalizador: soma pendência, soma clientes
- Renderizar na switch de reportType

