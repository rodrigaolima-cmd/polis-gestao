

# Fix: Race Condition in useAuth

## Problem
The `useAuth` hook sets `loading = false` **before** the profile/role fetch completes. When `ProtectedRoute` sees `loading = false` + `isActive = false` (profile not yet loaded), it triggers sign-out with "Conta inativa" error.

## Solution
Ensure `setLoading(false)` only runs **after** `fetchProfile` completes.

### `src/hooks/useAuth.ts`
- In `onAuthStateChange`: await `fetchProfile` before setting `loading = false` (remove the `setTimeout` wrapper)
- In `getSession().then()`: await `fetchProfile` before setting `loading = false`
- Both paths must wait for profile data before declaring loading complete

### `src/components/ProtectedRoute.tsx`
- Add a guard: don't check `isActive` until `profile` is actually loaded (not just `!loading`)
- This prevents false negatives during the brief window before profile data arrives

## Files
| Action | File |
|--------|------|
| Modify | `src/hooks/useAuth.ts` |
| Modify | `src/components/ProtectedRoute.tsx` |

