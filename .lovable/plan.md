

# Correções: Intermitência de Dados e Lógica de Módulo Inativo

## Problema 1: Dados não carregam (intermitente)

A raiz do problema está no `useAuth` hook. O listener `onAuthStateChange` pode disparar múltiplas vezes (INITIAL_SESSION, TOKEN_REFRESHED, etc.), e a flag `initialLoad` cria uma janela onde o `loading` pode ficar em estado inconsistente. Quando `ProtectedRoute` re-renderiza durante essas transições, `ClientesPage` pode ser remontado enquanto a sessão Supabase ainda não está pronta, causando queries que falham silenciosamente (RLS bloqueia sem sessão válida).

### Correção em `src/hooks/useAuth.ts`
- Remover a flag `initialLoad` e simplificar: usar apenas `getSession` para o carregamento inicial, e `onAuthStateChange` apenas para eventos subsequentes (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED)
- Garantir que `setLoading(false)` só execute uma vez, após o fetch do perfil no carregamento inicial
- Usar um `ref` para controlar se a inicialização já ocorreu, evitando re-execuções

### Correção em `src/pages/ClientesPage.tsx`
- Adicionar tratamento de erro visível (mostrar mensagem em vez de ficar preso em "Carregando...")
- Adicionar um retry automático se a query falhar

## Problema 2: Módulo inativo deve contar como "não faturado"

Atualmente, o `useContracts` carrega todos os `client_modules` e mapeia para `ContractRow` sem considerar `ativo_no_cliente`. Quando um módulo é inativado, o `billedValue` continua sendo contado no total faturado do dashboard.

A regra de negócio correta: se `ativo_no_cliente = false`, o valor faturado deve ser zerado para fins de cálculo, movendo o valor contratado para a coluna "diferença / dinheiro na mesa".

### Correção em `src/hooks/useContracts.ts`
- Na função `mapToContractRow`, verificar `ativo_no_cliente`:
  - Se `false`: setar `billedValue = 0` e `billed = false`
  - Manter o `contractedValue` para que a diferença (contratado - faturado) reflita o "dinheiro na mesa"

### Correção em `src/pages/ClientesPage.tsx`  
- Na agregação de módulos (linhas 63-65), aplicar a mesma regra: módulos inativos devem ter `valor_faturado = 0` no cálculo dos totais

## Arquivos Afetados

| Ação | Arquivo |
|------|---------|
| Modificar | `src/hooks/useAuth.ts` — simplificar inicialização |
| Modificar | `src/hooks/useContracts.ts` — zerar faturado de inativos |
| Modificar | `src/pages/ClientesPage.tsx` — erro visível + regra de inativo |

