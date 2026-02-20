

## Relatorios Interativos em Todas as Sessoes dos Graficos

### Resumo
Adicionar funcionalidade de clique em todos os 6 graficos do dashboard, abrindo um relatorio detalhado em tela (dialog/modal) com opcao de exportar em PDF. Atualmente apenas o grafico "Contratos por Status" possui essa funcionalidade.

### Graficos que receberao a funcionalidade

| Grafico | Filtro ao clicar | Exemplo |
|---------|-----------------|---------|
| Faturamento por Cliente (Top 10) | Por nome do cliente | Clicou em "Prefeitura X" -> contratos desse cliente |
| Contratado vs Faturado | Por nome do cliente | Clicou em "Prefeitura X" -> contratos desse cliente |
| Faturamento por Produto | Por produto | Clicou em "Contabilidade" -> contratos desse produto |
| Distribuicao por Tipo de UG | Por tipo de UG | Clicou em "Prefeitura" -> contratos desse tipo |
| Contratos por Status | Ja funciona | Mantido como esta |
| Linha do Tempo de Vencimentos | Por mes de vencimento | Clicou em "2025-06" -> contratos que vencem nesse mes |

### Alteracoes Tecnicas

**1. Novo componente generico: `src/components/dashboard/ChartReportDialog.tsx`**
- Substituira o `StatusReportDialog` atual por um componente mais flexivel
- Props:
  - `title: string` (ex: "Relatorio - Produto: Contabilidade")
  - `contracts: ContractRow[]` (ja filtrados)
  - `open / onOpenChange`
- Mesma estrutura visual: tabela com colunas (Cliente, Tipo UG, Produto, Contratado, Faturado, Diferenca, Assinatura, Vencimento), totalizadores no rodape, botao Exportar PDF

**2. Alteracao: `src/components/dashboard/DashboardCharts.tsx`**
- Adicionar novos callbacks na interface `ChartsProps`:
  - `onClientClick?: (clientName: string) => void`
  - `onProductClick?: (product: string) => void`
  - `onUGClick?: (ugType: string) => void`
  - `onMonthClick?: (month: string) => void`
- Adicionar `cursor="pointer"` e `onClick` em cada grafico:
  - Barras dos graficos de cliente: chamar `onClientClick`
  - Fatias do pie de produto: chamar `onProductClick`
  - Fatias do pie de UG: chamar `onUGClick`
  - Pontos da linha de vencimentos: chamar `onMonthClick` (usando `activeDot` com onClick)

**3. Alteracao: `src/components/dashboard/Dashboard.tsx`**
- Substituir os estados `selectedStatus` e `statusReportOpen` por um estado generico:
  - `reportConfig: { title: string; contracts: ContractRow[] } | null`
- Criar funcoes de filtro para cada tipo de clique:
  - `onStatusClick`: filtra por `contractStatus`
  - `onClientClick`: filtra por `clientName`
  - `onProductClick`: filtra por `product`
  - `onUGClick`: filtra por `ugType`
  - `onMonthClick`: filtra por mes do `expirationDate` (substring 0-7)
- Passar todos os callbacks para `DashboardCharts`
- Renderizar `ChartReportDialog` controlado por `reportConfig`

**4. Remover `StatusReportDialog.tsx`**
- Sera substituido pelo `ChartReportDialog` generico
- As regras de CSS `@media print` existentes no `index.css` serao mantidas

### Fluxo do Usuario

1. Usuario clica em qualquer elemento de qualquer grafico
2. Abre modal com titulo descritivo (ex: "Relatorio - Produto: Contabilidade")
3. Tabela mostra todos os contratos filtrados por aquele criterio
4. Rodape mostra totais de valores
5. Botao "Exportar PDF" imprime apenas o conteudo do relatorio

