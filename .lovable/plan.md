

## Row click para editar módulo — ClienteDetailPage

### Mudança

No `src/pages/ClienteDetailPage.tsx`, na tabela de módulos:

1. **Mover o `onClick` do `<TableCell>` do nome para o `<TableRow>`** — `onClick={() => handleEditModule(m)}` com `cursor-pointer` e hover highlight
2. **Remover o handler de click e estilos hover/underline do `<TableCell>` do nome** (já não precisa, pois a row inteira é clicável)
3. **Adicionar `e.stopPropagation()`** no `<DropdownMenuTrigger>` (menu de ações) para evitar abrir o modal ao clicar no menu
4. **Estilos da row**: `cursor-pointer hover:bg-muted/50 transition-colors` (o hover já existe parcialmente via Table component)

### Arquivo afetado
- `src/pages/ClienteDetailPage.tsx` — ~5 linhas alteradas na seção de renderização dos módulos

### O que NÃO muda
- Cálculos, totais, lógica de status, toggle, delete, dashboard

