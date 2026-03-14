

# Fix: Login travado — ProtectedRoute redireciona antes do perfil carregar

## Problema real

Analisando os logs de rede e console, o login **funciona** (API retorna 200, perfil existe e está ativo). O problema está no **ProtectedRoute**: após `navigate("/")`, ele monta e o `useAuth` inicializa. Existe uma janela onde `loading=false` mas `profile` ainda é `null` (porque `fetchProfile` é assíncrono). Nesse momento:

```
isActive = profile?.is_active ?? false  →  false  (profile é null)
```

O ProtectedRoute vê `!isActive` e redireciona para `/login`, cancelando o login.

O console confirma: `<Navigate>` renderizou dentro do `ProtectedRoute`, provando o redirect indevido.

## Solução

Duas mudanças:

### 1. `src/components/ProtectedRoute.tsx`
Tratar `user && !profile` como "ainda carregando" — se o user existe mas o profile não foi buscado, mostrar spinner ao invés de redirecionar:

```typescript
// Considerar loading se: loading=true OU user logado mas perfil ainda não carregou
if (loading || (user && !profile)) {
  return <spinner />;
}
```

### 2. `src/pages/LoginPage.tsx`
Remover a query redundante de `profiles` no `handleLogin`. O `useAuth` do ProtectedRoute já faz essa verificação. Simplificar para:

```typescript
const handleLogin = async () => {
  setLoading(true);
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  setLoading(false);
  if (error) {
    toast.error(error.message);
    return;
  }
  navigate("/", { replace: true });
};
```

A verificação de `is_active` já acontece no ProtectedRoute (via useAuth + useEffect que chama signOut se inativo).

## Arquivos

| Ação | Arquivo |
|------|---------|
| Modificar | `src/components/ProtectedRoute.tsx` |
| Modificar | `src/pages/LoginPage.tsx` |

