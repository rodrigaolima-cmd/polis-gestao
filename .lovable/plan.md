

## Fix: X button not closing modals

### Root cause

Each modal form blocks Radix's `onOpenChange(false)` to prevent accidental closes:
```tsx
// ClienteForm, ClienteModuloForm, ClienteMultiModuloForm, CopyDatesDialog
<Dialog open={open} onOpenChange={(v) => { if (!v) return; onOpenChange(v); }}>
```

The built-in X button (`DialogPrimitive.Close` in `dialog.tsx` line 50) works by triggering Radix's internal close, which calls `onOpenChange(false)` — but that's blocked. So the X does nothing.

### Solution

Add an optional `onClose` prop to `DialogContent`. When provided, replace the default `DialogPrimitive.Close` with a plain `<button>` that calls `onClose()` directly, bypassing Radix's blocked `onOpenChange`.

### Changes

**1. `src/components/ui/dialog.tsx`**
- Add `onClose?: () => void` to `DialogContent` props
- If `onClose` is provided, render a manual `<button onClick={onClose}>` instead of `DialogPrimitive.Close`
- If not provided, keep existing `DialogPrimitive.Close` (backward compatible)

**2. `src/components/clientes/ClienteForm.tsx`**
- Pass `onClose={handleCancel}` to `DialogContent`

**3. `src/components/clientes/ClienteModuloForm.tsx`**
- Pass `onClose={handleCancel}` to `DialogContent`

**4. `src/components/clientes/ClienteMultiModuloForm.tsx`**
- Add a `handleCancel` that clears draft and calls `onOpenChange(false)`
- Pass `onClose={handleCancel}` to `DialogContent`

**5. `src/components/clientes/CopyDatesDialog.tsx`**
- Pass `onClose={() => onOpenChange(false)}` to `DialogContent`

**6. `src/pages/ConfiguracoesPage.tsx`**
- For any user/UG-type modals, pass `onClose` to `DialogContent`

### What does NOT change
- Modal persistence logic
- Draft persistence
- Auth context
- Layout, business logic, save behavior
- Cancelar and Salvar behavior (already working)

