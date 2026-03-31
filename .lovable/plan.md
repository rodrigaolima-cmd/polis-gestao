

## Catálogo de Módulos — Melhorias de UX e Produtividade

Este é um refactor significativo do componente `ModuloCatalogo.tsx` e melhorias no `ModuloCatalogoReport.tsx`. Nenhuma mudança de schema é necessária.

### Arquivos afetados
- `src/components/configuracoes/ModuloCatalogo.tsx` — reescrita principal
- `src/components/configuracoes/ModuloCatalogoReport.tsx` — adicionar coluna "Data de criação", exportar Excel

### Mudanças detalhadas

#### 1. Row click → abre modal de edição
- Adicionar `onClick={() => openEdit(m)}` no `<TableRow>` com `cursor-pointer`
- Nos botões de ação (edit, toggle, delete): `e.stopPropagation()` para evitar bubbling

#### 2. Multi-select com checkbox
- State: `selectedIds: Set<string>`
- Checkbox master no header (seleciona/deseleciona todos os filtrados)
- Checkbox individual em cada row
- Rows selecionadas com `bg-muted/30`

#### 3. Bulk actions toolbar
- Aparece quando `selectedIds.size > 0`
- Ações: Ativar, Inativar, Excluir (com confirmação via AlertDialog), Alterar categoria (com input), Exportar PDF (reutiliza report com seleção)
- Excluir em lote: verificar vínculos em `client_modules` antes de excluir
- Após cada ação: atualizar state local sem full reload quando possível

#### 4. Search melhorado
- Já usa `normalizeForSearch` — manter. Busca por nome e categoria já funciona.

#### 5. Category filter dropdown
- Novo state `filterCategoria`
- Dropdown com opções fixas: Todas, GSP, EDU + categorias dinâmicas extraídas dos módulos
- Combina com search na filtragem

#### 6. Sorting por colunas
- State: `sortCol` (nome | categoria | status | created_at), `sortDir` (asc | desc)
- Click no header alterna asc/desc
- Ícone visual (ChevronUp/ChevronDown)
- Fetch precisa incluir `created_at` do banco

#### 7. Status badge colors
- Ativo: `variant="default"` com classe verde (`bg-green-500/10 text-green-500`)
- Inativo: `variant="secondary"` cinza
- Substituir o uso de `destructive` para inativo

#### 8. Toggle refinado
- Inativar: mostrar confirm dialog antes
- Ativar: imediato (como hoje)

#### 9. Report melhorado
- Adicionar coluna "Data de criação" ao relatório
- Adicionar botão "Exportar Excel" que gera download via blob (tabela → CSV como fallback simples)
- Manter PDF via `window.print()`

#### 10. Responsivo — card layout mobile
- Usar `useIsMobile()` hook existente
- Em mobile: renderizar cards em vez de tabela
- Cada card mostra nome, categoria, status badge, botões de ação

#### 11. Pagination
- Se `filtered.length > 50`: mostrar paginação (20 por página)
- Usar componente `Pagination` já existente no projeto

#### 12. Empty state
- Quando `modules.length === 0` (não apenas filtered): mostrar mensagem + botão "Criar novo módulo"
- Quando `filtered.length === 0` mas `modules.length > 0`: "Nenhum módulo encontrado" (já existe)

#### 13. Otimização de updates
- Após toggle/edit/delete: atualizar o array `modules` localmente em vez de `fetchModules()` quando possível
- `fetchModules` apenas no mount e após create (para pegar o novo ID)

### O que NÃO muda
- Dashboard, relatórios do dashboard, importações
- Schema do banco (usa `created_at` que já existe em `modules`)
- Tema, tipografia, espaçamento geral
- Páginas de Clientes, Usuários

