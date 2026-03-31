

## Refinamento UX — Edição de Módulos do Cliente

### Problema crítico (runtime error)
Há um erro `editingModule is not defined` que pode ser de um build stale. Será resolvido implicitamente pelas mudanças abaixo.

### Mudanças planejadas

#### 1. Eliminar flash "Carregando dados..." (`ClienteDetailPage.tsx` + `ClienteModuloForm.tsx`)

**ClienteDetailPage.tsx**: Passar os dados da row como `initialData` prop para o form, além do `existingModuleId`:
```tsx
const editingRow = modules.find(m => m.id === editingModuleId) || null;
// ...
<ClienteModuloForm
  initialData={editingRow}
  existingModuleId={editingModuleId}
  ...
/>
```

**ClienteModuloForm.tsx**: Usar `initialData` para preencher o form imediatamente (sem loading). Buscar dados frescos do banco em background silenciosamente e atualizar o form só se houver diferenças. Remover o estado `loadingData` e o texto "Carregando dados...".

#### 2. Auto-focus e select no campo Valor Contratado (`ClienteModuloForm.tsx`)

Adicionar `ref` ao primeiro `CurrencyInput` e chamar `.focus()` + `.select()` após o modal abrir, usando `useEffect` com pequeno delay (`setTimeout 100ms`) para aguardar a animação do Dialog.

**CurrencyInput.tsx**: Adicionar `React.forwardRef` e expor a `ref` do input interno. Manter comportamento de select-all no focus.

#### 3. "Salvar" e "Salvar e fechar" (`ClienteModuloForm.tsx`)

Trocar o botão único "Salvar" por dois:
- **Salvar**: salva, atualiza o form com valores salvos, mantém modal aberto, chama `onSaved()` para atualizar grid
- **Salvar e fechar**: salva e fecha o modal

Após salvar com sucesso: toast "✓ Alterações salvas" (já usa sonner, só ajustar texto).

Desabilitar ambos os botões durante `saving` para prevenir duplicatas.

#### 4. Keyboard navigation (`ClienteModuloForm.tsx`)

Adicionar `onKeyDown` no form container:
- `Enter` → `handleSave()` (salvar e fechar)
- `Escape` já é tratado pelo Dialog

TAB/Shift+TAB já funcionam nativamente entre inputs.

#### 5. Preservar scroll após save

`onSaved` (que é `loadData`) já não altera scroll. Confirmar que `loadData` não chama `setLoading(true)` para reloads parciais — criar `reloadModules()` que só recarrega módulos sem o loading spinner da página inteira.

**ClienteDetailPage.tsx**: Extrair `reloadModules()` que faz só o fetch de módulos (sem `setLoading(true)`), e usar essa função no `onSaved`.

#### 6. Optimistic UI update (`ClienteModuloForm.tsx` + `ClienteDetailPage.tsx`)

Após salvar, atualizar o estado local `modules` imediatamente com os valores do form (optimistic), e depois confirmar com o reload do banco. Se falhar, reverter e mostrar erro.

### Arquivos afetados
- `src/pages/ClienteDetailPage.tsx` — passar `initialData`, extrair `reloadModules`, optimistic update
- `src/components/clientes/ClienteModuloForm.tsx` — eliminar loading flash, auto-focus, dois botões save, keyboard, forwardRef no CurrencyInput
- `src/components/ui/currency-input.tsx` — adicionar `forwardRef`

### O que NÃO muda
- Dashboard, relatórios, importações, cálculos financeiros
- Schema do banco
- Layout geral

