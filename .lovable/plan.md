

## Bugfix: Restaurar PDF — Relatórios em Branco

### Alterações

#### 1. `src/index.css` — Corrigir seletor print (linha 142)
Trocar `body > div > *` por `#root`:
```css
#root {
  display: none !important;
}
```
Manter `[data-radix-portal] { display: block !important; }` (já existe linha 147).

Adicionar regra para classes de altura fixa:
```css
.h-screen, .min-h-screen {
  height: auto !important;
  min-height: auto !important;
}
```

Adicionar `break-inside: avoid` nas linhas de tabela (complementar ao existente):
```css
#print-area tr,
#print-area td,
#print-area th {
  break-inside: avoid !important;
  page-break-inside: avoid !important;
}
```

#### 2. `src/components/dashboard/ChartReportDialog.tsx`
Envolver conteúdo do `DialogContent` em `<div id="print-area">` (header + contagem + tabela). Mesmo padrão do `SectionReportDialog`.

