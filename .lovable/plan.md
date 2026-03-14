

## Fix: Login não carrega perfil após autenticação

### Problema raiz confirmado
O login retorna 200 com token válido, mas **nenhuma requisição** a `profiles` ou `user_roles` é feita depois. O `onAuthStateChange` deveria disparar `applyAuthSession(user)` via `setTimeout`, mas esse callback está sendo engolido silenciosamente (possível interferência do ambiente preview ou timing do Supabase client). O LoginPage fica preso com `submitting=true` esperando um estado que nunca chega.

### Correção (2 arquivos)

**1. `src/pages/LoginPage.tsx`** — Forçar fetch explícito após login

Após `signInWithPassword` sem erro, chamar `await refreshAuth()` para forçar `getSession()` → `applyAuthSession(user)` → fetch profile/role. Isso garante que o perfil é carregado independentemente do `onAuthStateChange`.

```typescript
const handleLogin = async () => {
  setSubmitting(true);
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    toast.error(error.message);
    setSubmitting(false);
    return;
  }
  // Forçar carregamento de perfil/role sem depender do onAuthStateChange
  await refreshAuth();
  // useEffect fará a navegação quando user + profileLoaded + isActive
};
```

**2. `src/contexts/AuthContext.tsx`** — Adicionar console.log de diagnóstico

Adicionar logs em pontos-chave para confirmar o fluxo (temporários, para debug):
- Entrada de `applyAuthSession` (com source: "listener" vs "getSession" vs "refresh")
- Resultado do fetch de profile/role
- Estado final (loading, profileLoaded, user !== null)

Isso permite diagnosticar se o `onAuthStateChange` está realmente disparando e se o `requestId` está invalidando resultados válidos.

### Fluxo esperado pós-correção
```text
signInWithPassword → 200 OK
 → refreshAuth() chamado explicitamente
 → getSession() retorna sessão ativa
 → applyAuthSession(user) → requestId=N
 → fetch profiles + user_roles (AGORA VISÍVEL na rede)
 → profileLoaded=true, loading=false, isActive=true
 → useEffect no LoginPage detecta → navigate("/")
```

### Arquivos
- `src/pages/LoginPage.tsx` — chamar `refreshAuth` após login
- `src/contexts/AuthContext.tsx` — console.logs de diagnóstico

