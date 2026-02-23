

## Remover KPIs "Inadimplencia" e "% Medio Faturado"

### Alteracoes

**Arquivo: `src/components/dashboard/Dashboard.tsx`**

1. Remover o KPI card "Inadimplencia" da grid de renderizacao
2. Remover o KPI card "% Medio Faturado" da grid de renderizacao
3. Remover as variaveis nao mais utilizadas:
   - `avgBilledPct` (media percentual faturado)
   - `inadimplencia` (calculo de inadimplencia)
4. Remover os imports nao mais utilizados:
   - `ShieldAlert` do lucide-react (usado apenas no KPI Inadimplencia)
   - `BarChart3` do lucide-react (usado apenas no KPI % Medio Faturado)

Resultado: Dashboard ficara com 8 KPI cards, melhorando a visualizacao em tela cheia. A grid pode ser ajustada para `xl:grid-cols-8` para um encaixe perfeito.

KPIs restantes:
- Total Contratado
- Total Faturado
- Nao Faturado
- Vencidos
- Vencer 90 dias
- Vencer 30 dias
- Ticket Medio
- Relatorio Geral

