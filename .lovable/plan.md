

## Plano: Remover botão Imprimir do header

### `src/components/dashboard/Dashboard.tsx`
- Remover o `<Button>` "Imprimir" com `onClick={() => window.print()}` do header
- Remover `Printer` do import de `lucide-react` (não é usado em outro lugar neste arquivo)

