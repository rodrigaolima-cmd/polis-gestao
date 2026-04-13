

## Fix: Módulos não aparecem no modal "Adicionar Módulos"

### Causa raiz

O `useEffect` de carregamento (linha 178) tem `draft` na lista de dependências. Porém, `usePersistentFormDraft` retorna um objeto novo a cada render (`{ saveDraft, saveDraftNow, getDraft, ... }`). Isso faz o efeito re-executar a cada render, e cada execução:

1. Cancela o `Promise.all` anterior (`cancelled = true`)
2. Reinicia a busca do catálogo
3. A busca nunca completa → `allModules` fica vazio → "Nenhum módulo cadastrado"

### Correção (2 arquivos)

**1. `src/hooks/usePersistentFormDraft.ts`** — Retornar objeto estável via `useMemo`

Envolver o objeto de retorno em `useMemo` para que a referência não mude a cada render:

```typescript
return useMemo(() => ({ saveDraft: save, saveDraftNow: saveNow, getDraft: get, clearDraft: clear, flush }), [save, saveNow, get, clear, flush]);
```

**2. `src/components/clientes/ClienteMultiModuloForm.tsx`** — Remover `draft` das dependências do efeito de carregamento

Trocar a dependência `draft` por referências estáveis individuais (`draft.getDraft`) ou simplesmente remover `draft` do array, já que as funções `getDraft` etc. já são estáveis após a correção no hook. Manter apenas `[open, clientId]` como dependências reais, e usar `restoreSnapshot` via ref se necessário.

### O que não muda

- Layout do modal
- Lógica de save/insert
- Regras de negócio
- Persistência de draft (continua funcionando, agora sem loop infinito)

