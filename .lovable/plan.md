

## Bugfix: Restaurar PDF — Relatórios em Branco

### Causa Raiz
A regra CSS `body > div > * { display: none !important; }` esconde filhos de TODOS os `<div>` diretos do body — incluindo os portais Radix (`<div data-radix-portal>`). Isso esconde o conteúdo dos relatórios. A regra `[data-radix-portal] { display: block }` torna o portal visível, mas seus filhos continuam escondidos.

Além disso, `ChartReportDialog` não tem o wrapper `#print-area`.

### Alterações

#### 1. `src/index.css` — Corrigir seletor print (1 linha)
Trocar `body > div > *` por `#root` para esconder apenas o app React, não os portais Radix:

```css
#root {
  display: none !important;
}
```

Isso preserva os portais Radix (que são irmãos de `#root` no body).

#### 2. `src/components/dashboard/ChartReportDialog.tsx`
Envolver o conteúdo do `DialogContent` em `<div id="print-area">` (mesmo padrão do `SectionReportDialog`), movendo header e tabela para dentro.

