

## Plano: Corrigir visualização de ordenação no gráfico "Faturamento por Produto"

### Problema
O gráfico de "Faturamento por Produto" usa um **PieChart** (gráfico de pizza), que não transmite visualmente a ordenação decrescente — as fatias são dispostas em círculo e as labels aparecem em posições variadas, dando a impressão de desordem mesmo com os dados corretamente ordenados.

### Solução: Trocar PieChart por BarChart horizontal

**`src/components/dashboard/DashboardCharts.tsx`**
- Substituir o `PieChart` do "Faturamento por Produto" por um `BarChart` horizontal (layout `"vertical"`), igual ao padrão do "Faturamento por Cliente (Top 10)"
- Eixo Y: nome do produto
- Eixo X: valor faturado formatado em R$
- Barras coloridas com `radius` arredondado
- Manter o `onClick` para abrir relatório do produto
- Manter o `Tooltip` com `formatCurrency`

Isso tornará a ordenação decrescente **visualmente clara**, com as barras de cima para baixo do maior para o menor valor.

