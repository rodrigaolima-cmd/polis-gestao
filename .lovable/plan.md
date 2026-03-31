

## Diagnóstico

O modal abre como "Adicionar Módulo" (não "Editar"), confirmado pelo session replay que mostra o campo "Módulo *" visível e título "Adicionar Módulo". Isso significa `existingModuleId` é `null` quando o form renderiza.

**Causa raiz**: `handleModuleFormOpenChange(false)` limpa `setEditingModuleId(null)` ao fechar o dialog. Porém, quando o Radix Dialog faz a transição de abertura, pode disparar `onOpenChange` internamente, ou a limpeza da sessão anterior interfere com a nova abertura via batching do React.

## Correção definitiva

### 1. `ClienteDetailPage.tsx` — Não limpar `editingModuleId` no `onOpenChange`

```tsx
const handleModuleFormOpenChange = (open: boolean) => {
  setModuleFormOpen(open);
  // NÃO limpar editingModuleId aqui — será definido por handleEditModule/handleAddModule
};
```

E adicionar `key={editingModuleId || 'new'}` de volta ao form. Desta vez, sem problema, porque `onOpenChange(false)` do unmount **não limpa** o ID.

```tsx
<ClienteModuloForm
  key={editingModuleId || 'new'}
  open={moduleFormOpen}
  onOpenChange={handleModuleFormOpenChange}
  clientId={id}
  existingModuleId={editingModuleId}
  onSaved={reloadModules}
/>
```

Remover `initialData` prop — o form buscará seus próprios dados.

### 2. `ClienteModuloForm.tsx` — Simplificar hidratação

- Remover prop `initialData` da interface
- Manter apenas `existingModuleId`
- Quando `open` e `existingModuleId`: fetch direto do banco e hidratar form
- Quando `open` sem `existingModuleId`: defaultForm
- Graças ao `key`, cada abertura de edição monta uma instância limpa → sem estado stale
- Remover o segundo useEffect de sincronização (desnecessário com key)

### Fluxo resultante

1. User clica editar → `editingModuleId = mod.id`, `moduleFormOpen = true`
2. Key muda → form remonta limpo, useEffect busca dados do banco → hidrata
3. User fecha → `moduleFormOpen = false`, `editingModuleId` permanece (inofensivo)
4. User clica outro módulo → `editingModuleId` muda → key muda → remonta limpo

### Arquivos afetados
- `src/pages/ClienteDetailPage.tsx` — ajustar `handleModuleFormOpenChange`, adicionar `key`, remover `initialData`
- `src/components/clientes/ClienteModuloForm.tsx` — remover `initialData`, simplificar useEffect

