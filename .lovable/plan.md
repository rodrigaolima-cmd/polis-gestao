

## Fix: Ignore ALL SIGNED_OUT in onAuthStateChange

### Root cause

The console log at 12:38:19 shows:
```
[Auth] onAuthStateChange event: SIGNED_OUT
[Auth] hydrateUser requestId: 12 user: null isRefresh: false
```

There is **no** "Ignoring non-manual SIGNED_OUT" log, meaning the guard at lines 203-206 **failed** — either refs were null at that instant or `manualSignOutRef` was true from a prior event. The current guard logic has race conditions with multiple rapid SIGNED_OUT events and the setTimeout reconciliation adds further instability.

### Solution — one surgical change

**File**: `src/contexts/AuthContext.tsx`

**Replace the entire SIGNED_OUT handler block (lines 203-244)** with a simple unconditional ignore for ALL `SIGNED_OUT` events:

```typescript
// Completely ignore SIGNED_OUT in the listener.
// Manual sign-out is handled by handleSignOut() which calls
// clearAuthState() directly in its finally block.
if (_event === "SIGNED_OUT") {
  console.log("[Auth] Ignoring SIGNED_OUT event in listener");
  return;
}

const isRefresh = _event === "TOKEN_REFRESHED";
setTimeout(() => {
  if (mounted) hydrateUser(session?.user ?? null, session?.access_token ?? null, isRefresh);
}, 0);
```

**Why this is safe:**
- **Manual sign-out**: `handleSignOut()` (line 292) calls `clearAuthState()` directly in `finally` — it does NOT rely on the `onAuthStateChange` listener at all.
- **Spurious SIGNED_OUT** (tab switch): completely ignored — refs, state, and UI remain untouched.
- **Real session revocation**: the user would continue with stale token; API calls would fail with 401, which is recoverable. Far better than losing form data.
- **Token refresh**: still handled normally via `TOKEN_REFRESHED` event.
- **Reconciliation on tab return**: `reconcileVisibleSession` already silently refreshes the token when focus returns.

### What changes
- `src/contexts/AuthContext.tsx` — simplify onAuthStateChange SIGNED_OUT handling (~15 lines removed, 4 added)

### What does NOT change
- Dialog protection (already complete)
- Form onOpenChange handlers (already blocking false)
- ProtectedRoute logic
- Layout, dashboard, business logic
- Manual sign-out flow

