

# Fix: Spinner infinito — profile null mantém ProtectedRoute travado

## Diagnóstico

Identifiquei a causa raiz real. O problema **não é** o `fetchProfile` falhando — o banco confirma que o usuário `rodrigo.lima@polisgestao.com.br` tem perfil ativo e role admin. O problema está na lógica do `ProtectedRoute`:

```text
Fluxo atual:
1. Timeout 5s dispara → setLoading(false)
2. Mas se onAuthStateChange/getSession ainda não resolveu,
   user pode estar null e profile null
3. loading=false, user=null → redireciona para /login ✓ (funciona)

MAS se o user TEM sessão válida:
1. onAuthStateChange dispara → initialized=true, fetchProfile inicia
2. fetchProfile usa supabase.from().select() — NÃO lança exceção em erro
3. Se retorna { data: null, error: {...} }, setProfile(null) é chamado
4. setLoading(false)
5. ProtectedRoute vê: loading=false, user=truthy, profile=null
6. Condição: user && !profile → TRUE → spinner infinito!
```

O `try/catch` no `fetchProfile` não captura erros do Supabase JS client porque eles são retornados como `{ error }` no objeto de resposta, não como exceções thrown. Então `data` pode ser `null` sem nenhuma exceção.

A condição `user && !profile` no ProtectedRoute foi adicionada como "espere o perfil carregar", mas quando o perfil **falha** ao carregar, vira um deadlock.

## Solução

Duas mudanças simples:

### 1. `src/hooks/useAuth.ts`
Adicionar um estado `profileLoaded` (boolean) que fica `true` após `fetchProfile` completar, independente de sucesso ou falha. Isso diferencia "perfil ainda não buscado" de "perfil buscado mas não encontrado".

```typescript
const [profileLoaded, setProfileLoaded] = useState(false);

const fetchProfile = useCallback(async (userId: string) => {
  // ... existing try/catch logic ...
  setProfileLoaded(true);  // sempre executa no final
}, []);
```

Resetar `profileLoaded` no signOut e quando user fica null.

Retornar `profileLoaded` no hook.

### 2. `src/components/ProtectedRoute.tsx`
Usar `profileLoaded` em vez de checar `profile !== null`:

```typescript
const { user, profile, loading, isActive, isAdmin, signOut, profileLoaded } = useAuth();

// Antes: loading || (user && !profile) — deadlock quando profile falha
// Depois: loading || (user && !profileLoaded) — resolve quando fetch completa
if (loading || (user && !profileLoaded)) {
  return <spinner />;
}
```

## Arquivos

| Ação | Arquivo |
|------|---------|
| Modificar | `src/hooks/useAuth.ts` |
| Modificar | `src/components/ProtectedRoute.tsx` |

