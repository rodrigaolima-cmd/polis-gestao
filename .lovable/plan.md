

## Problema raiz

A sequência ao clicar "Editar contrato":
1. `setEditingModule(mod)` + `setModuleFormOpen(true)`
2. A `key` do `ClienteModuloForm` muda → React **desmonta** a instância anterior
3. O Dialog do Radix dispara `onOpenChange(false)` durante o desmonte
4. `handleModuleFormOpenChange(false)` executa → `setEditingModule(null)`
5. A nova instância monta com `existingModule = null`
6. `buildForm(null)` retorna `defaultForm` → tudo zerado

## Correção

### `src/pages/ClienteDetailPage.tsx`

1. **Remover a prop `key`** do `ClienteModuloForm` — não forçar mais remount
2. **Ajustar `handleModuleFormOpenChange`** para só limpar `editingModule` quando o modal realmente fechar por ação do usuário (não por desmonte forçado)

### `src/components/clientes/ClienteModuloForm.tsx`

1. Manter o `useEffect` com `[open, existingModule?.id]` que já chama `buildForm(existingModule)`
2. Adicionar um **segundo `useEffect`** que observe mudanças no objeto `existingModule` completo (serializado ou por campos-chave) para reidratar o form caso o módulo mude enquanto o modal já está aberto — cenário de trocar de módulo sem fechar
3. Resultado: sem `key`, a reidratação fica 100% controlada pelo `useEffect`

### Resumo das mudanças
- `ClienteDetailPage.tsx`: remover `key={}`, simplificar `handleModuleFormOpenChange`
- `ClienteModuloForm.tsx`: reforçar `useEffect` para cobrir troca de módulo sem remount

### Arquivos afetados
- 2 arquivos: `ClienteDetailPage.tsx`, `ClienteModuloForm.tsx`
- Sem alteração no banco, layout ou dashboard

