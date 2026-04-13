

## Fix: Persistir estado do modal "Adicionar Módulos" durante troca de abas

### Problema

O `ClienteMultiModuloForm` usa apenas `useState` — todo o estado (módulos selecionados, campos comuns, valores por módulo, busca) é perdido quando o componente remonta por troca de aba ou churn de autenticação. Além disso, o `useEffect` na linha 63 reseta tudo quando `open` muda.

### Solução

Integrar o modal com o sistema de persistência existente (`usePersistentModal` + `usePersistentFormDraft`), igual ao que já é feito no `ClienteModuloForm`.

### Alterações

**1. `src/pages/ClienteDetailPage.tsx`**

- O `multiModuleModal` já usa `usePersistentModal`. Verificar que `open`/`close` estão corretos (já estão).

**2. `src/components/clientes/ClienteMultiModuloForm.tsx`** — Alteração principal

- Importar `usePersistentFormDraft`
- Aceitar nova prop `persistKey` (ex: `detail:${id}:multi-module-form`)
- No `useEffect` que roda quando `open` muda:
  - Se `open` é true: verificar se existe draft salvo. Se sim, restaurar estado do draft em vez de resetar. Se não, resetar normalmente e carregar catálogo.
  - Se `open` é false: não fazer nada (o estado já foi limpo pelo close explícito).
- Salvar draft (debounced) sempre que qualquer estado muda: `selectedIds`, `moduleValues`, `moduleSearch`, `dataAssinatura`, `vencimento`, `statusContrato`, `faturadoFlag`, `observacoes`, `ativoNoCliente`, `bulkContratado`, `bulkFaturado`
- Nos 3 pontos de fechamento (Cancelar, X/onClose, save success): limpar draft antes de fechar
- O draft será serializado como objeto plano com `selectedIds` convertido de Set para Array

**3. `src/pages/ClienteDetailPage.tsx`** — Passar `persistKey`

- Adicionar `persistKey={`detail:${id}:multi-module-form`}` ao `ClienteMultiModuloForm`

### O que NÃO muda

- Layout do modal
- Lógica de save/insert
- Regras de negócio (módulos vinculados, bulk values)
- Outros modais

