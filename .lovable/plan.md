

# Fix: Loading infinito (spinner preso)

## Problema

O `useAuth` tem uma race condition entre `getSession()` e `onAuthStateChange()`. Em versões recentes do Supabase JS client, `onAuthStateChange` dispara o evento `INITIAL_SESSION` **antes** de `getSession` resolver. O código atual ignora esse evento (porque `initialized.current` é `false`), e em alguns casos `getSession` pode não resolver corretamente depois, deixando `loading = true` para sempre.

## Solução

Reescrever `src/hooks/useAuth.ts` para usar `onAuthStateChange` como fonte **única** de inicialização:

- Remover a chamada `getSession()` como mecanismo de inicialização
- Tratar o evento `INITIAL_SESSION` no `onAuthStateChange` como o ponto de inicialização
- Fazer `fetchProfile` e `setLoading(false)` dentro do callback do listener
- Usar a ref `initialized` apenas para garantir que `setLoading(false)` execute uma única vez (na primeira vez que um evento de sessão chega)

```
onAuthStateChange(async (event, session) => {
  setUser(session?.user ?? null);
  if (session?.user) {
    await fetchProfile(session.user.id);
  } else {
    setProfile(null);
    setRole(null);
  }
  if (!initialized.current) {
    initialized.current = true;
    setLoading(false);
  }
});
```

## Arquivo

| Ação | Arquivo |
|------|---------|
| Modificar | `src/hooks/useAuth.ts` |

