
Objetivo: corrigir de forma pontual o fato de o modal “Adicionar Módulos” continuar perdendo os módulos selecionados ao trocar de aba, sem alterar layout nem regras de negócio.

Diagnóstico mais provável no código atual:
- O modal já usa uma chave correta de persistência (`detail:${id}:multi-module`) e já salva `selectedIds`.
- Porém o salvamento do rascunho é feito com debounce de 300ms em `usePersistentFormDraft`.
- Quando o usuário troca de aba logo após clicar em checkboxes, pode ocorrer remount/churn de autenticação antes de o debounce gravar no `sessionStorage`.
- Resultado: o shell do modal volta aberto, mas o último estado selecionado nunca chegou a ser persistido.
- Além disso, a hidratação hoje depende do fluxo assíncrono de carregamento do catálogo; ela restaura dentro do `.then(...)`, o que torna o fluxo mais frágil do que precisa.

Correção proposta

1. Ajustar `usePersistentFormDraft.ts`
- Manter o debounce para campos digitados.
- Adicionar uma função extra de gravação imediata, sem debounce, algo como `saveDraftNow`.
- Adicionar flush no cleanup/unmount para não perder o último draft pendente.
- Assim, eventos críticos como seleção de módulo e troca de aba não dependem do timer.

2. Ajustar `ClienteMultiModuloForm.tsx`
- Persistir seleção de módulos imediatamente ao marcar/desmarcar checkbox.
- Persistir busca e campos comuns no fluxo normal; se necessário, também fazer flush quando a aba ficar oculta (`visibilitychange`) ou no `pagehide`.
- Separar melhor o carregamento:
  - primeiro carregar catálogo + módulos já vinculados
  - depois hidratar o draft salvo
  - reconstituir `selectedIds` como `Set`
  - filtrar/remover da seleção qualquer módulo que já esteja vinculado, para manter consistência
- Garantir que a restauração aconteça uma vez por ciclo de abertura e que não seja sobrescrita por reset posterior.
- Não limpar draft em perda de foco/troca de aba; limpar apenas em:
  - X
  - Cancelar
  - save com sucesso

3. Reforçar a persistência contra troca de aba
- Adicionar listener de `visibilitychange` e/ou `pagehide` dentro do modal para forçar flush imediato do draft atual quando a aba ficar oculta.
- Isso protege exatamente o cenário relatado: selecionar módulos e trocar de aba antes do debounce concluir.

4. Validar o comportamento preservado
- Busca não pode limpar seleção.
- Filtrar lista e limpar filtro não pode limpar seleção.
- Re-render/remount do componente não pode limpar seleção.
- Modal deve continuar aberto via `usePersistentModal`, como já está.

Arquivos a alterar
- `src/hooks/usePersistentFormDraft.ts`
- `src/components/clientes/ClienteMultiModuloForm.tsx`

O que não muda
- Layout do modal
- Lógica de insert/save
- Regras de negócio
- Fluxo de fechamento explícito

Validação após implementar
- Abrir “Adicionar Módulos”
- Selecionar ALM e ASSIST SOCIAL
- Preencher busca e campos comuns
- Trocar imediatamente de aba
- Voltar
- Confirmar:
  - modal continua aberto
  - ALM e ASSIST SOCIAL continuam marcados
  - busca continua preenchida
  - campos comuns continuam preenchidos
- Depois:
  - alterar termo de busca
  - limpar busca
  - confirmar que os módulos continuam selecionados
- Confirmar também que X, Cancelar e salvar limpam o draft corretamente
