
Objetivo: corrigir de forma pontual por que o modal “Adicionar Módulos” ainda perde os módulos selecionados ao trocar de aba, sem alterar layout, regras de negócio nem lógica de add/save.

Diagnóstico real no código atual:
- O problema principal não parece mais ser a chave de persistência.
- Hoje o `ClienteMultiModuloForm` começa com estado vazio e já dispara o efeito de persistência (`draft.saveDraft(...)`) assim que monta com `open=true`.
- A hidratação do draft só acontece depois, dentro do `Promise.all(...)` que carrega catálogo + módulos já vinculados.
- Se houver remount ao trocar de aba, esse efeito inicial salva um snapshot vazio/default antes da restauração terminar e sobrescreve o draft correto.
- Resultado: o modal reabre, mas `selectedIds` e demais campos já foram zerados no storage.

Correção proposta

1. Ajustar `src/components/clientes/ClienteMultiModuloForm.tsx`
- Adicionar um estado de hidratação/inicialização do ciclo atual, por exemplo `isHydrated`.
- Ao abrir o modal:
  - marcar `isHydrated = false`
  - ler o draft salvo imediatamente
  - restaurar em memória `selectedIds`, `moduleSearch`, campos comuns e `moduleValues`
  - depois carregar catálogo + módulos já vinculados
  - reaplicar/finalizar `selectedIds` filtrando apenas módulos já vinculados, se necessário
  - só então marcar `isHydrated = true`
- Isso impede que o componente comece a salvar estado vazio antes de concluir a restauração.

2. Bloquear persistência antes da hidratação terminar
- No efeito que hoje salva o draft a cada mudança, só persistir quando:
  - `open === true`
  - `isHydrated === true`
- Fazer a mesma proteção no flush por `visibilitychange` / `pagehide`, para nunca gravar snapshot parcial/default no começo do mount.

3. Manter persistência explícita da seleção
- Continuar persistindo `selectedIds` de forma imediata ao marcar/desmarcar checkbox.
- Garantir que o `checked` continue derivado exclusivamente de `selectedIds.has(id)`, nunca da lista filtrada.
- Busca/filtro deve afetar apenas o que aparece na tela, não a seleção persistida.

4. Não mudar fechamento explícito
- Manter limpeza do draft apenas em:
  - X
  - Cancelar
  - add/save com sucesso
- Não limpar em troca de aba, blur, rerender ou remount.

Arquivos a alterar
- `src/components/clientes/ClienteMultiModuloForm.tsx`

O que não muda
- Layout do modal
- Regras de negócio
- Lógica de insert/save
- Outras telas/modais

Validação após implementar
1. Abrir “Adicionar Módulos”
2. Selecionar ALM e ASSIST SOCIAL
3. Preencher busca e campos comuns
4. Trocar de aba e voltar
5. Confirmar:
- modal continua aberto
- ALM continua marcado
- ASSIST SOCIAL continua marcado
- busca continua preenchida
- campos comuns continuam preenchidos
6. Alterar busca, limpar busca e confirmar que a seleção continua intacta
7. Confirmar que X, Cancelar e salvar limpam o draft corretamente
