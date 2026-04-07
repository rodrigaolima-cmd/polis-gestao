

## Fix: Modal showing wrong/stale values when editing different modules

### Root cause (3 issues)

1. **`persistKey` not scoped per module** — Currently `detail:${id}:module-form` is the same key for ALL modules of a client. Draft saved for module A is restored when opening module B.

2. **No React `key` on `ClienteModuloForm`** — The component is never remounted when switching from module A to module B. The `useState` initializer (line 87-92) runs only once with the first module's data, and subsequent opens reuse stale state.

3. **`initialized` flag blocks reload** — When the modal closes, `initialized` resets to false, but since the component doesn't remount, the initial `useState` value (from the first render) persists.

### Fix

**`src/pages/ClienteDetailPage.tsx`** (2 changes)

1. Add `key={moduleFormModal.entityId || "new"}` to `<ClienteModuloForm>` — forces full remount per module, clearing all local state.

2. Change `persistKey` to include the entity ID:
   ```
   persistKey={`detail:${id}:module-form:${moduleFormModal.entityId || "new"}`}
   ```

**`src/components/clientes/ClienteModuloForm.tsx`** (1 change)

3. Clear draft on close — in the `useEffect` that handles `!open`, also call `draft.clearDraft()` to prevent stale drafts from being restored for a different module that happens to reuse the component instance.

### What does NOT change

- Save logic, business rules, layout
- Modal persistence for tab-switch protection (still works, now scoped per module)
- CurrencyInput, other form fields
- Other modals (ClienteForm, MultiModulo, CopyDates)

