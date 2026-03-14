

# Fix: fetchProfile error causes infinite spinner

## Root Cause

In `useAuth.ts`, the initialization sets `initialized.current = true` **before** calling `await fetchProfile()`. If `fetchProfile` throws (network error, RLS error, etc.), execution stops before reaching `setLoading(false)`. The safety timeout can't help either because it checks `!initialized.current`, which is already `true`.

```text
initialized.current = true   ← set here
await fetchProfile(...)       ← if this throws...
setLoading(false)             ← ...this never runs

timeout checks !initialized.current → false → does nothing
```

## Solution

Wrap `fetchProfile` calls in try/catch so `setLoading(false)` **always** executes regardless of errors.

### `src/hooks/useAuth.ts`

Refactor the `fetchProfile` function itself to be error-safe (catch internally), so callers don't need try/catch:

```typescript
const fetchProfile = useCallback(async (userId: string) => {
  try {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, is_active")
      .eq("id", userId)
      .single();
    setProfile(data);
  } catch (e) {
    console.error("Error fetching profile:", e);
    setProfile(null);
  }

  try {
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    setRole(roleData?.role ?? null);
  } catch (e) {
    console.error("Error fetching role:", e);
    setRole(null);
  }
}, []);
```

Additionally, add a **secondary safety net** in the timeout: change it to check `loading` state instead of just `initialized.current`, so even if initialization ran but `setLoading` was somehow skipped, the timeout still clears it.

```typescript
const timeout = setTimeout(() => {
  // Force loading=false regardless — absolute safety net
  setLoading(false);
}, 5000);
```

| Action | File |
|--------|------|
| Modify | `src/hooks/useAuth.ts` |

