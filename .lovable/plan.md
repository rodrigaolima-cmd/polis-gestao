

## Correção definitiva: sessão derrubada ao trocar de aba

### Causa raiz real

O problema **não é o Dialog/Radix** — os modais já estão protegidos contra fechamento automático. O problema é que ao trocar de aba:

1. Supabase dispara `SIGNED_OUT` espúrio
2. O código atual tenta preservar o snapshot, mas chama `getSession()` no setTimeout
3. Se `getSession()` retorna `null` transientemente, o snapshot é preservado... mas na volta da aba, o `reconcileVisibleSession` pode chamar `hydrateUser(null, null)` se `getSession()` ainda retorna null
4. `hydrateUser(null, null)` na linha 116-120 chama `clearAuthState()` **incondicionalmente** → user fica null → `ProtectedRoute` redireciona para `/login` → toda a página (e o modal) é desmontada

### Solução

**Arquivo**: `src/contexts/AuthContext.tsx`

Duas mudanças cirúrgicas:

1. **`hydrateUser`**: Quando recebe `null` user/token, verificar se `manualSignOutRef.current` é true. Se não for e já tivermos um snapshot válido (refs com dados), **não limpar** — simplesmente retornar sem fazer nada:

```typescript
if (!currentUser || !token) {
  // Only clear if this is a manual sign-out
  if (manualSignOutRef.current && thisRequest === requestIdRef.current) {
    clearAuthState();
  }
  return;
}
```

2. **`reconcileVisibleSession`**: Remover a chamada que pode acidentalmente disparar hydration com dados nulos. Só chamar hydrateUser se a sessão existir:

```typescript
const reconcileVisibleSession = () => {
  if (document.visibilityState === "hidden" || !userRef.current || manualSignOutRef.current) {
    return;
  }
  // Already have valid snapshot, no need to re-fetch on every focus
  // Only reconcile token silently
  void supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user && session.access_token) {
      // Just update token ref, don't re-hydrate
      accessTokenRef.current = session.access_token;
      setAccessToken(session.access_token);
    }
    // If no session, do NOT clear — keep snapshot
  });
};
```

### Resultado

- `clearAuthState()` só é chamado quando o usuário clica "Sair" (`manualSignOutRef = true`)
- Eventos espúrios `SIGNED_OUT` do Supabase são ignorados completamente
- Ao voltar de outra aba, o token é atualizado silenciosamente sem derrubar o estado
- O modal permanece aberto porque a página não é desmontada

### Arquivos afetados
- `src/contexts/AuthContext.tsx` (única mudança)

### O que NÃO muda
- Dialog/modal (já está protegido)
- ProtectedRoute (já está correto)
- Formulários de cliente
- Dashboard, layout, RLS

