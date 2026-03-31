
Objetivo: corrigir os 3 comportamentos sem mexer no banco nem no layout geral: (1) modal de edição reabrindo com valor antigo e só atualizando depois, (2) campo monetário difícil de limpar/substituir, (3) módulo mudando de posição no grid após salvar.

1. Corrigir a fonte de verdade da edição
- Arquivo: `src/pages/ClienteDetailPage.tsx`
- Problema provável: após salvar, a lista `modules` recarrega, mas `editingModule` continua apontando para o objeto antigo em memória. Quando o modal é reaberto, ele recebe primeiro os dados antigos e só depois sincroniza.
- Ajuste:
  - ao salvar/fechar o modal, limpar `editingModule` explicitamente;
  - criar um `handleModuleFormOpenChange` para, ao fechar, fazer `setModuleFormOpen(false)` + `setEditingModule(null)`;
  - ao atualizar a lista em `loadData`, manter ordenação estável e evitar depender de objeto antigo guardado em estado.

Resultado esperado:
- ao reabrir “Editar contrato”, os valores já entram corretos imediatamente, sem “atualizar alguns segundos depois”.

2. Reidratar o formulário sempre que abrir em modo edição
- Arquivo: `src/components/clientes/ClienteModuloForm.tsx`
- Problema atual: o `form` nasce do `initialForm`, mas não há um `useEffect` robusto para reidratar quando `open`/`existingModule` mudam.
- Ajuste:
  - criar uma função `buildForm(existingModule)` para normalizar os dados;
  - usar `useEffect` para fazer:
    - se estiver editando e o modal abrir: `setForm(buildForm(existingModule))`
    - se for novo módulo: `setForm(defaultForm)`
    - limpar `newModuleName`
  - depender de `open` + `existingModule` relevante, não só do estado inicial.

Resultado esperado:
- os campos do modal sempre refletem o registro mais recente vindo da linha clicada.

3. Melhorar a UX do `CurrencyInput` para substituição rápida
- Arquivo: `src/components/ui/currency-input.tsx`
- Problema atual: ao focar no campo, o usuário precisa apagar manualmente o texto formatado antes de digitar.
- Ajuste:
  - no foco, selecionar todo o conteúdo do input (`e.target.select()`), principalmente útil quando faturado = contratado e o usuário quer apenas substituir;
  - manter `onChange` por keystroke;
  - no `Backspace`, se o campo estiver totalmente selecionado, ele deve limpar tudo naturalmente e permitir digitar o novo valor sem “lutar” com a máscara;
  - preservar a formatação no blur.

Resultado esperado:
- clicar no valor faturado, pressionar `Backspace` uma vez e digitar o novo número passa a funcionar de forma direta.

4. Impedir que o módulo vá para o fim do grid após salvar
- Arquivo: `src/pages/ClienteDetailPage.tsx`
- Causa identificada: a query do grid usa `.order("created_at", { ascending: false })`. Como vários registros importados têm `created_at` igual e a atualização muda só `updated_at`, a ordem visual pode oscilar/reorganizar de forma confusa após recarga.
- Ajuste:
  - trocar para uma ordenação estável que não mude ao editar, por exemplo por nome do módulo no cliente após mapear os dados, ou por `created_at asc` + critério secundário estável;
  - a opção mais segura para UX do grid é ordenar por `nome_modulo` ascendente no frontend depois do `map`, já que editar valores não altera esse campo.
- Não alterar cálculos, apenas a ordem de exibição no grid.

Resultado esperado:
- depois de salvar, o módulo permanece na mesma posição lógica do grid, sem “descer para o final”.

5. Validação após implementar
- Editar `valor_contratado` e `valor_faturado`, salvar, fechar e reabrir o mesmo módulo: o modal deve abrir com os valores novos imediatamente.
- Clicar em `Valor Faturado`, pressionar `Backspace` e digitar outro valor: o campo deve limpar e aceitar substituição direta.
- Editar 2 ou 3 módulos diferentes no mesmo cliente: nenhum deve mudar de lugar no grid após salvar.

Arquivos afetados
- `src/pages/ClienteDetailPage.tsx`
- `src/components/clientes/ClienteModuloForm.tsx`
- `src/components/ui/currency-input.tsx`

Observação técnica
- A consulta no backend já mostra `updated_at` sendo alterado corretamente, então o problema principal aqui é de sincronização de estado local/rehidratação do modal e de ordenação visual do grid, não de atraso real na gravação.
