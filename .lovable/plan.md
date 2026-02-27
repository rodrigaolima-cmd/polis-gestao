

## Bugfix: Remover botão Imprimir e corrigir PDF com páginas em branco

### Alterações

#### 1. `src/components/dashboard/Dashboard.tsx`
- Remover o botão "Imprimir" (linhas 157-159)
- Remover import `Printer` do lucide-react

#### 2. `src/components/dashboard/SectionReportDialog.tsx`
- Envolver o conteúdo do relatório em `<div id="print-area">` dentro do `DialogContent`
- Mover a classe `print-report` do `DialogContent` para o `#print-area` div

#### 3. `src/index.css` — Reescrever bloco `@media print`
- Esconder tudo exceto `#print-area`
- Esconder overlay do Radix dialog
- No `#print-area`: position absolute, top/left 0, width 100%, **height auto**, **max-height none**, **overflow visible**
- Adicionar `page-break-inside: avoid` no `tfoot` para evitar quebra no rodapé
- Adicionar `margin: 0` e `padding: 0` no body para print
- Remover qualquer scroll container que force altura fixa

