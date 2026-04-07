
## Correção definitiva de persistência de modal ao trocar de aba

### Diagnóstico
O problema restante não está mais no layout do modal em si. A causa principal é que o estado de abertura e o rascunho dos formulários ainda ficam presos ao ciclo de vida local da página/componente.

Hoje há 3 fragilidades no código:
1. `ClientesPage`, `ClienteDetailPage` e `ConfiguracoesPage` controlam modais com `useState` local (`formOpen`, `editClientOpen`, `moduleFormOpen`, `dialogOpen`, `editUser`).
2. Os formulários resetam ao abrir/remontar:
   - `ClienteForm`: reseta em `[cliente, open]`
   - `ClienteModuloForm`: reseta em `[open, existingModuleId]`
   - `ClienteMultiModuloForm`: reseta em `[open, clientId]`
   - Novo usuário também limpa estado ao abrir
3. Se a tela remonta por foco/visibilidade/route churn/auth churn, o modal fecha e o draft some porque não existe restauração automática.

### Solução proposta
Implementar persistência real de contexto de modal + draft, desacoplada do estado local volátil.

### Como vou fazer

#### 1) Criar um store global de modal persistente
Adicionar um contexto/hook compartilhado para manter, por rota, o estado do modal aberto:
- tipo do modal
- entidade/ID em edição
- draft atual do formulário
- flag de alterações não salvas

Persistência:
- memória React para manter a UX instantânea
- `sessionStorage` como backup para restaurar após remount da página/componente na mesma aba

Chave por rota + modal, por exemplo:
- `/clientes` + `client-form:new`
- `/clientes/:id` + `client-form:edit:{id}`
- `/clientes/:id` + `module-form:{moduleId|new}`
- `/configuracoes` + `user-form:new`
- `/configuracoes` + `user-form:edit:{userId}`

#### 2) Tirar os modais críticos do controle frágil por `useState` puro
Nas páginas:
- `src/pages/ClientesPage.tsx`
- `src/pages/ClienteDetailPage.tsx`
- `src/pages/ConfiguracoesPage.tsx`

trocar o controle local simples por um controller persistente:
- abrir modal grava contexto global
- fechar explicitamente limpa contexto
- ao montar/remontar a página, se existir contexto salvo para a rota atual, o modal reabre automaticamente com o mesmo registro

Isso garante:
- mesma tela
- mesmo modal
- mesmo registro em edição

#### 3) Persistir o draft dos formulários enquanto o modal estiver aberto
Aplicar o padrão nos modais principais:
- `ClienteForm`
- `ClienteModuloForm`
- `ClienteMultiModuloForm`
- modal de Novo Usuário
- modal de Editar Usuário
- outros modais com input relevante podem reaproveitar o mesmo hook

Ajuste importante:
- o formulário deixa de resetar automaticamente em todo `open`/`remount`
- primeiro tenta hidratar do draft persistido
- se não houver draft, usa dados iniciais (`cliente`, `initialData`, usuário etc.)
- busca em background não pode sobrescrever draft já alterado

#### 4) Blindar o fechamento
Somente estas ações poderão limpar estado e fechar:
- `Cancelar`
- botão X explícito
- salvar com sucesso

Eventos passivos não poderão fechar nem limpar:
- `blur`
- `focus`
- `visibilitychange`
- remount de componente
- recuperação de sessão
- re-render da rota

#### 5) Opcional recomendado: confirmação de saída com alterações não salvas
Nos modais de formulário, adicionar confirmação ao tentar fechar com mudanças:
“Você tem alterações não salvas. Deseja sair mesmo assim?”

Isso vale para:
- Cancelar
- botão X

Não muda regra de negócio; só evita perda acidental.

### Detalhes técnicos
- Criar algo como:
  - `src/contexts/ModalPersistenceContext.tsx`
  - `src/hooks/usePersistentModal.ts`
  - `src/hooks/usePersistentFormDraft.ts`
- Envolver a aplicação no provider em `src/App.tsx`
- Em `ClienteDetailPage`, revisar o `key={editingModuleId || 'new'}` do `ClienteModuloForm`; se ele continuar, o draft precisará ser reidratado por chave de entidade para não perder dados. Se não for necessário, remover o remount forçado.
- Em `ClienteForm` e `ClienteModuloForm`, separar:
  - hidratação inicial
  - sincronização do draft
  - carga de catálogo/opções
- Em `ConfiguracoesPage`, os modais hoje usam `setDialogOpen` / `setEditUser(null)` diretamente; isso precisa passar pelo controller persistente.
- Manter a proteção já existente em `dialog.tsx`, mas sem depender só dela.

### Arquivos afetados
- Novo:
  - `src/contexts/ModalPersistenceContext.tsx`
  - `src/hooks/usePersistentModal.ts`
  - `src/hooks/usePersistentFormDraft.ts`
- Ajustes:
  - `src/App.tsx`
  - `src/pages/ClientesPage.tsx`
  - `src/pages/ClienteDetailPage.tsx`
  - `src/pages/ConfiguracoesPage.tsx`
  - `src/components/clientes/ClienteForm.tsx`
  - `src/components/clientes/ClienteModuloForm.tsx`
  - `src/components/clientes/ClienteMultiModuloForm.tsx`
  - `src/components/clientes/CopyDatesDialog.tsx` se for incluído no padrão
  - possivelmente `src/components/ui/dialog.tsx` apenas se precisar expor fechamento explícito com confirmação

### Resultado esperado
Após a correção:
- trocar de aba não fecha modal
- voltar para a aba mantém a mesma tela
- o mesmo registro continua aberto
- tudo digitado permanece intacto
- se houver remount da página, o modal e o draft são restaurados automaticamente

### O que não muda
- layout
- dashboard
- regras de negócio
- lógica de salvamento
- cálculos
- estrutura visual das telas
