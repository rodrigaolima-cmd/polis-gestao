

## Correções: Toggle tema mobile + Contagem de módulos

### Problema 1: Toggle dark/light mode invisível em mobile/tablet

O botão de tema tem `hidden sm:flex`, ou seja, fica oculto abaixo de 640px. Mas no tablet (até 768px) ele aparece — o problema real é que em telas menores que 640px não há toggle.

**Solução**: Adicionar opção de toggle de tema no `MobileMenu.tsx` (menu lateral mobile), com ícone Sun/Moon. Também no `AppLayout.tsx`, trocar `hidden sm:flex` por `flex` para mostrar o ícone (sem texto) em todas as telas, ou alternativamente manter apenas no mobile menu.

Abordagem escolhida: **ambas** — manter botão no header visível em todas as telas (só ícone em mobile) + adicionar no menu mobile para redundância.

**Arquivos**:
- `src/components/layout/AppLayout.tsx` — linha 50: trocar `hidden sm:flex` por `flex`
- `src/components/MobileMenu.tsx` — adicionar item "Modo Claro/Escuro" com Sun/Moon antes do botão Sair, importando `useTheme`

### Problema 2: Dashboard mostra 976 registros mas Total Módulos mostra 975

O subtitle diz "976 registros" (= `contracts.length`, linhas individuais do banco). O KPI "Total Módulos" soma `productCount` por cliente consolidado, que é `products.length` (produtos únicos por cliente). Se um cliente tem 2 linhas com o mesmo produto, conta como 1 módulo — daí a diferença.

O "976 registros" é o total de linhas de contrato (correto para o subtitle). O "975 módulos" é o total de módulos únicos por cliente (correto para o KPI). São métricas diferentes.

**Solução**: Melhorar o subtitle do KPI "Total Módulos" para deixar claro que são módulos únicos, e ajustar o subtitle do dashboard para dizer "registros" sem confundir com módulos.

- `src/components/dashboard/Dashboard.tsx` — linha 57: manter cálculo, mas no KPI subtitle trocar `${clients.length} clientes` para algo mais descritivo
- Linha 133: manter subtitle como está (é correto)

Na verdade, a discrepância é esperada e correta. Vou apenas deixar os labels mais claros para evitar confusão.

**Arquivos afetados**:
- `src/components/dashboard/Dashboard.tsx` — KPI subtitle "Total Módulos": adicionar "(únicos)" ou similar
- Alternativa: usar `filteredContracts.length` para igualar, mas isso mudaria a semântica

**Recomendação**: Trocar o subtitle do dashboard de `${contracts.length} registros` para `${contracts.length} contratos` e no KPI Total Módulos manter `${clients.length} clientes`. O número diferente (976 vs 975) se explica por produtos duplicados no mesmo cliente. Isso é correto e não deve ser alterado — apenas melhorar a clareza dos labels.

### Resumo de mudanças

1. **`src/components/layout/AppLayout.tsx`** — Remover `hidden sm:` do botão de tema para que o ícone apareça em todas as telas
2. **`src/components/MobileMenu.tsx`** — Adicionar toggle de tema (Sun/Moon) no menu lateral mobile, importando `useTheme`
3. **`src/components/dashboard/Dashboard.tsx`** — Ajustar subtitle para `contratos` em vez de `registros` para evitar confusão com contagem de módulos

### O que NÃO muda
- Cálculos, lógica de negócio, dados, RLS, edge functions
- Layout geral, cores, tipografia existente
