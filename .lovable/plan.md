

## Bugfix: Relatórios imprimindo apenas 1 página

### Causa Raiz
O `[data-radix-dialog-overlay]` está com `position: fixed !important` no CSS de print. Elementos com `position: fixed` são renderizados em uma única "viewport" pelo navegador — o conteúdo que ultrapassa não flui para a próxima página. O mesmo ocorre com o portal e o content que herdam contexto fixo.

### Solução
Forçar **toda a cadeia** (portal → overlay → content) para `position: static` ou `relative` no print, permitindo que o conteúdo flua naturalmente entre páginas.

### Alterações

#### 1. `src/index.css` — Corrigir posicionamento no `@media print`

Substituir as regras do overlay e dialog content (linhas 157-180) por:

```css
/* Radix overlay: remove fixed positioning for multi-page flow */
[data-radix-dialog-overlay] {
  position: static !important;
  background: white !important;
}

/* DialogContent: static position for page flow */
[data-radix-dialog-content] {
  position: static !important;
  transform: none !important;
  max-height: none !important;
  overflow: visible !important;
  height: auto !important;
  border: none !important;
  box-shadow: none !important;
  background: white !important;
  color: black !important;
  width: 100% !important;
  max-width: 100% !important;
  padding: 0 !important;
}
```

Também forçar o portal a `position: static`:
```css
[data-radix-portal] {
  display: block !important;
  position: static !important;
}
```

Nenhuma outra alteração. Os componentes `SectionReportDialog` e `ChartReportDialog` permanecem inalterados.

