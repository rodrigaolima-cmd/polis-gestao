

## Fix: Site publicado não carrega — spinner infinito

### Causa raiz

Na correção anterior para ignorar `SIGNED_OUT` espúrios, o `hydrateUser` foi modificado para só chamar `clearAuthState()` quando `manualSignOutRef.current` é `true`. 

O problema: quando um usuário **não logado** acessa o site pela primeira vez, `getSession()` retorna `null`, e `hydrateUser(null, null)` é chamado. Como `manualSignOutRef` é `false`, a função retorna sem fazer nada — **sem setar `loading: false`**. O app fica preso com `loading: true` para sempre, mostrando o spinner.

### Solução

**Arquivo**: `src/contexts/AuthContext.tsx`

Na guarda de `hydrateUser` (linhas 116-123), adicionar uma condição: se não existe snapshot anterior (`userRef.current` é null), chamar `clearAuthState()` normalmente para finalizar o loading e permitir o redirecionamento para `/login`:

```typescript
if (!currentUser || !token) {
  // If manual sign-out OR no existing snapshot, clear state to finalize loading
  if (manualSignOutRef.current || !userRef.current) {
    if (thisRequest === requestIdRef.current) {
      clearAuthState();
    }
  }
  // If there IS a snapshot but no manual sign-out, keep existing state (tab switch protection)
  return;
}
```

**Lógica**:
- Primeiro acesso sem sessão → `userRef.current` é null → limpa estado → `loading: false` → mostra login
- Tab switch espúrio → `userRef.current` tem valor → mantém snapshot → modal não fecha
- Logout manual → `manualSignOutRef` é true → limpa estado → redireciona para login

### Arquivos afetados
- `src/contexts/AuthContext.tsx` — uma mudança de 2 linhas na guarda do `hydrateUser`

### O que NÃO muda
- Proteção de modais, dialog, formulários
- ProtectedRoute, layout, dashboard
- Fluxo de logout manual

