

## Bugfix: Restaurar PDF/Print dos Relatórios

### Problema
O CSS `body * { visibility: hidden !important }` esconde os containers pai do `#print-area` (Radix Dialog portal, overlay, content). Mesmo com `#print-area` visível, o conteúdo não renderiza porque os elementos pai estão invisíveis e limitam o layout. Além disso, `DialogContent` tem `max-h-[90vh] overflow-auto` e o componente `Table` tem um wrapper com `overflow-auto` — ambos cortam o conteúdo na impressão.

### Alterações

#### 1. `src/index.css` — Reescrever `@media print` (linhas 128-189)

Substituir a abordagem `visibility: hidden` por `display: none` seletivo, mantendo toda a cadeia do dialog visível:

- **Esconder dashboard**: `body > div > * { display: none !important; }` (esconde conteúdo principal)
- **Manter portal Radix visível**: `[data-radix-portal] { display: block !important; }`
- **Radix overlay**: `[data-radix-dialog-overlay] { background: white !important; position: fixed; }`
- **DialogContent**: forçar `max-height: none !important; overflow: visible !important; height: auto !important; position: relative !important;` (remove scroll container)
- **`#print-area`**: `width: 100%; height: auto; overflow: visible; background: white; color: black; padding: 20px;`
- **Table wrapper** (`#print-area .relative.overflow-auto`): `overflow: visible !important;`
- **Page break rules**: `table { page-break-inside: auto; }`, `tr, td, th { page-break-inside: avoid; }`, `tfoot { page-break-inside: avoid; }`
- **Evitar páginas extras**: remover `min-height` do body, `@page { margin: 10mm; }`
- Manter `print:hidden` para botão Exportar PDF

#### 2. `src/components/ui/table.tsx` — Nenhuma alteração
O overflow do wrapper será tratado via CSS print.

#### 3. `src/components/dashboard/SectionReportDialog.tsx` — Nenhuma alteração estrutural
A estrutura com `<div id="print-area">` dentro do `DialogContent` já está correta (linhas 53-75).

