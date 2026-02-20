

## Relatorio Geral de Contratos

### O que sera feito

Um novo KPI card "Relatorio Geral" sera adicionado ao dashboard. Ao clicar, abrira um relatorio completo com todos os clientes, ordenados alfabeticamente, mostrando: Cliente, Tipo UG, Valor Contratado, Valor Faturado, Diferenca (Dinheiro na Mesa), Vencimento do Contrato e Status. O rodape totaliza quantidade de contratos e valores financeiros. Exportacao PDF via botao "Exportar PDF" (window.print).

### Alteracoes por Arquivo

**1. `src/components/dashboard/SectionReportDialog.tsx`**
- Adicionar `"general"` ao tipo `SectionReportType`
- Adicionar titulo `"Relatorio Geral de Contratos"` no mapa `TITLES`
- Renderizar `GeneralReport` quando `reportType === "general"`
- Novo componente `GeneralReport`:
  - Recebe `clients: ClientSummary[]`
  - Ordena alfabeticamente por `clientName.localeCompare('pt-BR')`
  - Colunas: Cliente, Tipo UG, Contratado, Faturado, Diferenca, Vencimento, Status
  - Vencimento formatado com `formatDate(nextExpiration)`
  - Rodape com: Total (N clientes), soma contratado, soma faturado, soma diferenca

**2. `src/components/dashboard/Dashboard.tsx`**
- Importar `FileText` do lucide-react
- Adicionar novo KPI card na grid:
  ```
  <KPICard title="Relatorio Geral" value={String(clients.length)} 
    subtitle="Clientes" icon={FileText} variant="info" 
    onClick={() => setSectionReport("general")} />
  ```

