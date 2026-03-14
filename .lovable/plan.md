

# Fix: Loading infinito — fallback com timeout

## Problema raiz

O `onAuthStateChange` do Supabase tem um bug conhecido (issue #41968, #29572) onde **intermitentemente não dispara nenhum evento**, deixando `loading = true` para sempre. Isso acontece especialmente após refresh de token ou quando o navegador retorna de background.

O código atual depende **exclusivamente** do `onAuthStateChange` para sair do estado de loading. Sem fallback, quando o evento não chega, o spinner fica preso.

## Solução

Adicionar um **fallback duplo** no `useAuth.ts`:

1. Chamar `getSession()` manualmente como fallback logo após registrar o listener
2. Adicionar um **timeout de segurança** (5 segundos) que força `loading = false` caso nenhum dos dois mecanismos funcione

### `src/hooks/useAuth.ts`

```typescript
useEffect(() => {
  // 1. Registrar listener
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (_event, session) => {
      if (initialized.current) {
        // Eventos subsequentes (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED)
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setRole(null);
        }
        return;
      }
      // Primeiro evento (INITIAL_SESSION)
      initialized.current = true;
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setRole(null);
      }
      setLoading(false);
    }
  );

  // 2. Fallback: getSession() caso onAuthStateChange não dispare
  supabase.auth.getSession().then(async ({ data: { session } }) => {
    if (!initialized.current) {
      initialized.current = true;
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setRole(null);
      }
      setLoading(false);
    }
  });

  // 3. Timeout de segurança absoluto (5s)
  const timeout = setTimeout(() => {
    if (!initialized.current) {
      initialized.current = true;
      setLoading(false);
    }
  }, 5000);

  return () => {
    subscription.unsubscribe();
    clearTimeout(timeout);
  };
}, [fetchProfile]);
```

A lógica: quem chegar primeiro (`onAuthStateChange`, `getSession`, ou timeout) resolve o loading. O `initialized.current` garante que só um deles executa.

## Arquivo

| Ação | Arquivo |
|------|---------|
| Modificar | `src/hooks/useAuth.ts` |

