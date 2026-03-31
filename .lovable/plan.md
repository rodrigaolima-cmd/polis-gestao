

## Diagnóstico

O problema persiste porque a hidratação do form depende de `existingModule` como prop (objeto em memória), que fica stale ou é limpo por `handleModuleFormOpenChange(false)` antes do novo mount completar. As tentativas anteriores com `useEffect` + deps não resolveram de forma confiável.

## Abordagem definitiva

Eliminar a dependência de `existingModule` como objeto. Em vez disso, passar apenas o **ID** e fazer o form **buscar seus próprios dados do banco** ao abrir.

### 1. `ClienteDetailPage.tsx`

- Trocar `editingModule` de `ClientModuleRow | null` para `string | null` (apenas o ID)
- `handleEditModule(mod)` → `setEditingModule(mod.id)`
- Passar `existingModuleId={editingModule}` em vez de `existingModule={editingModule}`
- No module name cell, adicionar `onClick={() => handleEditModule(m)}` com estilo clicável (cursor-pointer, hover:underline)

### 2. `ClienteModuloForm.tsx`

- Trocar prop `existingModule` por `existingModuleId?: string | null`
- Quando `open` muda para `true` e `existingModuleId` existe:
  - Fazer `SELECT * FROM client_modules WHERE id = existingModuleId` direto do banco
  - Hidratar o form com dados frescos do DB (nunca stale)
- Quando `open` e sem `existingModuleId`: form default (novo módulo)
- Após salvar com sucesso: chamar `onSaved()` + `onOpenChange(false)` como já faz

### 3. `CurrencyInput.tsx`

- Já está correto (onChange por keystroke, select-all no focus)
- Sem alterações necessárias

### 4. Click no nome do módulo para editar

- Na `TableCell` do nome do módulo em `ClienteDetailPage.tsx`:
  - Adicionar `onClick={() => handleEditModule(m)}`
  - Adicionar classes: `cursor-pointer hover:underline hover:text-primary transition-colors`

## Arquivos afetados
- `src/pages/ClienteDetailPage.tsx` — simplificar estado, adicionar click no nome
- `src/components/clientes/ClienteModuloForm.tsx` — fetch próprio por ID, eliminar dependência de prop objeto

## Resultado
- Modal sempre abre com dados frescos do banco (impossível ficar stale)
- Salvamento reflete imediatamente (loadData já é chamado via onSaved)
- Click no nome do módulo abre edição
- Campos monetários com select-all no focus para digitação rápida

