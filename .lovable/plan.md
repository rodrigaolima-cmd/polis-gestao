

## Relatorios nas Tabelas de Acao (Ranking e Contratos Criticos)

### Resumo
Adicionar funcionalidade de clique nas linhas das tabelas "Ranking - Dinheiro Nao Faturado" e "Contratos Criticos" para abrir o mesmo modal de relatorio detalhado (ChartReportDialog) com exportacao PDF.

### Como vai funcionar

- **Ranking - Dinheiro Nao Faturado**: ao clicar em uma linha, abre relatorio com todos os contratos daquele cliente
- **Contratos Criticos**: ao clicar em uma linha, abre relatorio com todos os contratos daquele cliente

Ambos reutilizam o `ChartReportDialog` ja existente e o mecanismo de `reportConfig` do Dashboard.

### Alteracoes Tecnicas

**1. `src/components/dashboard/ActionTables.tsx`**
- Adicionar prop `onClientClick?: (clientName: string) => void`
- Nas linhas de ambas as tabelas (Ranking e Criticos), adicionar `cursor-pointer` e `onClick` que chama `onClientClick(c.clientName)`
- Adicionar efeito visual de hover para indicar que as linhas sao clicaveis

**2. `src/components/dashboard/Dashboard.tsx`**
- Passar o callback `handleClientClick` (ja existente) para o componente `ActionTables`:
  ```
  <ActionTables clients={clients} onClientClick={handleClientClick} />
  ```

Nenhum componente novo precisa ser criado. A funcao `handleClientClick` ja filtra os contratos pelo nome do cliente e abre o modal com titulo "Relatorio - Cliente: [nome]".

