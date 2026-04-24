## Visibilidade de "Vazamento Operacional" no Dashboard

### Problema
Hoje o Dashboard mostra apenas 122 clientes Ativos com módulo ativo — KPIs financeiros corretos, mas:
- **17 clientes** Ativos com módulo ativo **NÃO faturado** (financeiro esqueceu de cobrar)
- **6 clientes** Ativos **sem nenhum módulo ativo** (operação/comercial esqueceu de ativar)

Esse "dinheiro na mesa silencioso" fica invisível.

### Solução (dupla camada)

**1. Toggle no `FiltersBar`** — `Incluir clientes sem operação ativa`
- Desligado (padrão): comportamento atual (122 clientes, KPIs limpos)
- Ligado: amplia query trazendo também clientes Ativos sem módulo ativo / sem faturamento. KPIs recalculam mostrando "potencial total na mesa"

**2. Card sentinela `OperationalLeakAlert`** (sempre visível, independente do toggle)
- Posicionado abaixo dos KPIs operacionais (linha 2)
- Visual: padrão `KPICard variant="danger"` (borda esquerda vermelha), 2 mini-blocos clicáveis lado a lado:
  - 🔴 **Sem faturamento ativo** — `17 clientes` · `R$ X em risco` (módulo ativo + `faturado_flag=false`)
  - 🟠 **Sem operação ativa** — `6 clientes` (status Ativo + nenhum módulo ativo)
- Clique abre `SectionReportDialog` no novo tipo `operationalLeak`

**3. Novo relatório `operationalLeak` em `SectionReportDialog`** (duas listas separadas)
- **Seção 1 — Sem faturamento ativo** (responsável: Financeiro)
  - Cliente · Consultor · Região · Módulos ativos não faturados · Valor contratado em risco · Última atualização
- **Seção 2 — Sem operação ativa** (responsável: Comercial/Operações)
  - Cliente · Consultor · Região · Cliente desde · Status do cadastro · Observações
- Botão imprimir (padrão do sistema)

### Arquivos afetados (5)

1. **`src/hooks/useContracts.ts`** — `loadFromDatabase` aceita flag `includeInactiveOperation`. Quando `true`, remove `.eq("ativo_no_cliente", true)` mantendo `clients.status_cliente=Ativo`. Default `false` (preserva regra atual). Adicionar função `loadOperationalLeaks()` que busca os dois conjuntos independentemente dos filtros visuais.
2. **`src/components/dashboard/FiltersBar.tsx`** — novo `Switch` "Incluir clientes sem operação ativa" no painel expandido.
3. **`src/components/dashboard/Dashboard.tsx`** — consumir nova flag, passar dados de vazamento para o novo card, abrir relatório dedicado.
4. **`src/components/dashboard/OperationalLeakAlert.tsx`** *(novo)* — card sentinela com 2 blocos clicáveis (padrão visual KPICard).
5. **`src/components/dashboard/SectionReportDialog.tsx`** — adicionar `SectionReportType "operationalLeak"` com as duas listas.

### O que NÃO muda
- Tela de Clientes (continua 130 registros)
- Regra de consolidação, mapeamento, KPIs financeiros padrão
- Layout geral, sidebar, demais cards e gráficos
- Memória `dashboard-client-visibility-rule` permanece — apenas estendida com nota sobre a camada de alerta opcional

### Resultado esperado
- KPIs financeiros continuam confiáveis (122 ativos com operação)
- Toggle permite simular "potencial total" quando quiser olhar dinheiro perdido
- Card sentinela transforma erro humano invisível em ação concreta — clique → relatório → cobrar consultor/financeiro
- Métrica de governança: o número desse card deve cair com o tempo

### Memória
Atualizar `mem://logic/dashboard-client-visibility-rule` documentando a nova camada de alerta sentinela e o toggle opcional.
