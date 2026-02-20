

## Relatorios Completos por Sessao com Totalizadores e Novas KPIs

### Resumo
Cada uma das 6 sessoes de graficos e 2 tabelas de acao ganhara um botao "Relatorio" no cabecalho que abre um modal com dados consolidados de toda a sessao (nao apenas um item individual), com totalizadores e exportacao PDF. Alem disso, serao adicionadas novas KPIs sugeridas.

### Botoes de Relatorio por Sessao

Cada card de grafico e cada tabela de acao recebera um botao com icone de impressora no cabecalho, ao lado do titulo. Ao clicar, abre o relatorio completo daquela sessao.

### Estrutura dos Relatorios

**1. Faturamento por Cliente (Top 10)**
| Cliente | Tipo UG | Contratado | Faturado | Diferenca | % Faturado |
Rodape: Totais de Contratado, Faturado, Diferenca

**2. Contratado vs Faturado**
| Cliente | Tipo UG | Contratado | Faturado | Diferenca | % Faturado |
Rodape: Totais de Contratado, Faturado, Diferenca

**3. Ranking - Dinheiro Nao Faturado**
| # | Cliente | Tipo UG | Contratado | Faturado | Pendente | % Pendente |
Rodape: Totais — lista TODOS os clientes com diferenca > 0

**4. Contratos Criticos**
| Cliente | Produtos | Contratado | Faturado | Dias p/ Vencimento | Status |
Rodape: Total Contratado, Total Faturado dos criticos

**5. Faturamento por Produto**
| Produto | Contratado | Faturado | Diferenca | % do Total Contratado | % do Total Faturado |
Rodape: Totais

**6. Distribuicao por Tipo de UG**
| Tipo UG | Qtd Contratos | Contratado | Nao Faturado | % do Total Contratado | % do Total Nao Faturado |
Rodape: Totais

### Novas KPIs Sugeridas
- **Ticket Medio**: valor medio contratado por cliente (Total Contratado / N clientes)
- **Indice de Inadimplencia**: % do valor contratado que nao foi faturado (Nao Faturado / Total Contratado)
- **Contratos Ativos**: quantidade de contratos com status "Ativo"

### Alteracoes Tecnicas

**1. Novo componente: `src/components/dashboard/SectionReportDialog.tsx`**
- Componente generico que recebe um `reportType` e os dados necessarios
- Tipos de relatorio: `"top10"` | `"contractedVsBilled"` | `"ranking"` | `"critical"` | `"byProduct"` | `"byUG"`
- Renderiza tabela especifica para cada tipo com colunas e totalizadores adequados
- Botao "Exportar PDF" via `window.print()`
- Props: `reportType`, `clients` (ClientSummary[]), `contracts` (ContractRow[]), `open`, `onOpenChange`

**2. Alteracao: `src/components/dashboard/DashboardCharts.tsx`**
- Adicionar callbacks de relatorio por sessao:
  - `onTop10Report?: () => void`
  - `onContractedVsBilledReport?: () => void`
  - `onProductReport?: () => void`
  - `onUGReport?: () => void`
  - `onStatusReport?: () => void`
  - `onTimelineReport?: () => void`
- Adicionar botao de relatorio (icone Printer) no componente `ChartCard`:
  - Nova prop `onReport?: () => void`
  - Renderizar botao ao lado do titulo quando `onReport` for fornecido

**3. Alteracao: `src/components/dashboard/ActionTables.tsx`**
- Adicionar callbacks:
  - `onRankingReport?: () => void`
  - `onCriticalReport?: () => void`
- Adicionar botao de relatorio no cabecalho de cada tabela

**4. Alteracao: `src/components/dashboard/Dashboard.tsx`**
- Novo estado: `sectionReport: { type: string } | null`
- Funcoes handler para cada sessao que configuram o estado
- Renderizar `SectionReportDialog` controlado pelo estado
- Passar dados necessarios (clients, filteredContracts)
- Adicionar as 3 novas KPIs (Ticket Medio, Indice de Inadimplencia, Contratos Ativos)

**5. Alteracao: `src/components/dashboard/KPICard.tsx`** (se necessario)
- Verificar se suporta as novas KPIs sem alteracao

### Fluxo do Usuario

1. Usuario ve botao de impressora no cabecalho de cada sessao
2. Clica no botao -> abre modal com relatorio completo da sessao
3. Relatorio mostra dados consolidados com totalizadores e percentuais
4. Botao "Exportar PDF" imprime o relatorio formatado
5. Clique em itens individuais dos graficos continua funcionando como antes (relatorio por item)

