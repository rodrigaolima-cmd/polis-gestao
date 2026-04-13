

## Fix: Draft never saved because of key mismatch

### Root cause

The modal is opened with key `detail:${id}:multi-module`, but the draft is saved with key `detail:${id}:multi-module-form`. These are **different keys**.

In `ModalPersistenceContext.saveDraft()` (line 74-81), the code checks `if (store[key])` before saving — meaning it only saves drafts for entries that already exist in the store. Since the draft key (`multi-module-form`) was never registered via `openModal` (which used `multi-module`), `store[key]` is always `undefined`, and **the draft is silently discarded every time**.

The modal shell persists (correct key), but all form state is lost (wrong key → never saved).

### Fix (2 changes)

**1. `src/contexts/ModalPersistenceContext.tsx`** — Make `saveDraft` resilient

Change `saveDraft` to create a minimal entry if one doesn't exist yet, instead of silently failing. This prevents this class of bug for all modals:

```typescript
const saveDraft = useCallback((key: string, draft: Record<string, any>) => {
  const store = readStore();
  if (!store[key]) {
    store[key] = { modalType: "draft", openedAt: Date.now(), draft };
  } else {
    store[key].draft = draft;
  }
  writeStore(store);
  storeRef.current = store;
}, []);
```

**2. `src/pages/ClienteDetailPage.tsx`** — Align the keys

Change the `persistKey` to match the modal key so they share the same store entry:

```
persistKey={`detail:${id}:multi-module`}
```

Both changes together ensure the draft is always saved and always found on restore.

### What does NOT change

- Modal layout, save logic, business rules
- Other modals (ClienteForm, ClienteModuloForm, CopyDates)
- Close/cancel/save clearing behavior

