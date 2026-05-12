## 1. O que significa "Diferença > 0"

É um filtro do Dashboard que mostra **apenas linhas onde Valor Contratado > Valor Faturado** — ou seja, módulos com saldo a faturar ("dinheiro na mesa"). Quando ligado:

- Esconde módulos já 100% faturados (diferença = 0)
- Esconde módulos com sobre-faturamento (diferença < 0)
- Útil para focar na fila de cobrança / oportunidades de faturamento

Implementação atual: `src/utils/contractUtils.ts → applyFilters` (`c.contractedValue - c.billedValue <= 0` é descartado).

**Sugestão de melhoria opcional:** renomear o rótulo no `FiltersBar` de **"Diferença > 0"** para **"Apenas com saldo a faturar"** com tooltip explicativo (mais claro para o usuário final). Confirmar se quer essa renomeação.

## 2. Filtro de Status do Cliente (Ativo / Inativo / Prospect)

### Comportamento atual
- O Dashboard chama `loadFromDatabase` em `useContracts.ts` com filtro **fixo** `clients.status_cliente = 'Ativo'`. Clientes Inativos e Prospects **nunca** chegam ao Dashboard.
- O toggle existente **"Incluir clientes sem operação ativa"** controla apenas `ativo_no_cliente` dos módulos (não o status do cliente).
- Há um filtro "Status" no `FiltersBar`, mas ele filtra `contractStatus` (status do contrato/módulo), não `status_cliente`.

Resultado: hoje é impossível ver Inativos/Prospects no Dashboard.

### Mudanças propostas

**a) `src/hooks/useContracts.ts`**
- Adicionar parâmetro `clientStatusFilter: 'ativos' | 'inativos' | 'prospects' | 'todos'` (default `'ativos'` — preserva comportamento atual).
- Substituir o `.eq("clients.status_cliente", "Ativo")` por filtro condicional baseado no parâmetro.
- Expor estado `clientStatusFilter` + setter no retorno do hook (mesmo padrão do `includeInactiveOperation`).
- Disparar reload quando o filtro mudar.

**b) `src/types/contract.ts`**
- (Opcional) propagar o tipo `ClientStatusScope` se for útil.

**c) `src/components/dashboard/FiltersBar.tsx`**
- Adicionar um novo controle **"Status do Cliente"** ao lado do toggle "Incluir clientes sem operação ativa", com 4 opções:
  - **Ativos** (padrão)
  - **Inativos**
  - **Prospects**
  - **Todos**
- Visual: `Select` compacto (mesmo estilo dos demais filtros) ou um pequeno grupo de botões `ToggleGroup`. Recomendado `Select` para consistência.

**d) `src/components/dashboard/Dashboard.tsx`**
- Ler `clientStatusFilter` / `setClientStatusFilter` do `useContracts` e passar ao `FiltersBar`.

**e) Indicador no subtítulo (opcional, recomendado)**
- Quando o escopo for diferente de "Ativos", mostrar no subtítulo do Dashboard, ex.: `Dados do banco — escopo: Inativos (X módulos / Y clientes)`. Evita confusão com a leitura "padrão".

### Pontos a confirmar
1. Renomear "Diferença > 0" para "Apenas com saldo a faturar" — sim/não?
2. Controle de status do cliente como **Select** (Ativos/Inativos/Prospects/Todos) ou **multi-seleção** (ex.: marcar Ativos + Prospects ao mesmo tempo)?
3. Quando o usuário escolher "Inativos" ou "Todos", devo manter o toggle "Incluir clientes sem operação ativa" ativo automaticamente (faz mais sentido nesse contexto) ou deixar como está?

### Fora do escopo
- Não altero a lógica do Menu Clientes (que já mostra todos os status).
- Não altero RLS / migrações — apenas filtros de leitura no front-end.