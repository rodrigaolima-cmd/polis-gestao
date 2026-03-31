

## Relatório sensível aos filtros aplicados

### Problema
Atualmente o relatório recebe `modules` (todos) quando não há seleção por checkbox, ignorando os filtros de busca e categoria ativos.

### Solução
Na linha 611 de `ModuloCatalogo.tsx`, alterar a lógica de passagem de dados para o componente `ModuloCatalogoReport`:

**Prioridade:**
1. Se há módulos selecionados via checkbox → passa `selectedModules`
2. Senão → passa `filtered` (resultado da busca + filtro de categoria)

Isso é uma mudança de uma única linha:
```tsx
// De:
modules={selectedIds.size > 0 ? selectedModules : modules}
// Para:
modules={selectedIds.size > 0 ? selectedModules : filtered}
```

O `filtered` já existe como `useMemo` (linha 92) e já aplica busca + filtro de categoria + ordenação. Nenhuma outra mudança necessária.

### Arquivos afetados
- `src/components/configuracoes/ModuloCatalogo.tsx` — 1 linha alterada

