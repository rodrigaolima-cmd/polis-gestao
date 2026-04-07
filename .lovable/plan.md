

## Correções: Tipos de UG, botão voltar e modal fechando ao trocar aba

### Problema 1: Tipos de UG duplicados e inconsistentes

No banco existem "CONSORCIO" (sem acento) e "CONSÓRCIO" (com acento). No formulário de edição, a lista hardcoded (`UG_TYPES`) tem "CONSÓRCIO" com acento, mas o valor no banco é "CONSORCIO" sem acento — por isso não aparece no select ao editar o cliente 54.

Além disso, a lista hardcoded no formulário (`PREFEITURA, CÂMARA, AUTARQUIA, CONSÓRCIO, FUNDO, INSTITUTO, SAAE, RPPS`) é diferente dos tipos reais no banco (`ASSOCIACAO, CAMARA, CONSORCIO, PREFEITURA, PREVIDENCIA, SAAE`).

**Solução**:

1. **Migration SQL**: Normalizar "CONSÓRCIO" → "CONSORCIO" no banco (1 registro afetado: ACISPES)
2. **`ClienteForm.tsx`**: Trocar a lista hardcoded `UG_TYPES` para carregar dinamicamente do banco (igual a Região/Consultor), com opção "Outro..." para digitar manualmente. Lista base de fallback: `ASSOCIACAO, AUTARQUIA, CAMARA, CONSORCIO, FUNDO, INSTITUTO, PREFEITURA, PREVIDENCIA, RPPS, SAAE`

### Problema 2: Botão voltar

**Arquivo**: `src/pages/ClienteDetailPage.tsx`

Adicionar botão "Voltar" no `headerActions` (ao lado de "Editar Cliente") usando `navigate(-1)` com ícone `ArrowLeft`.

### Problema 3: Modal fecha ao trocar de aba do navegador

O Radix Dialog fecha quando a janela perde foco (evento `onInteractOutside` / `onPointerDownOutside`). 

**Arquivo**: `src/components/ui/dialog.tsx`

Adicionar `onPointerDownOutside={(e) => e.preventDefault()}` e `onInteractOutside={(e) => e.preventDefault()}` no `DialogPrimitive.Content`. Isso impede que o dialog feche ao clicar fora ou ao mudar de aba.

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| Migration SQL | `UPDATE clients SET tipo_ug = 'CONSORCIO' WHERE tipo_ug = 'CONSÓRCIO'` |
| `src/components/clientes/ClienteForm.tsx` | Carregar UG types dinamicamente + fallback list sem acentos |
| `src/pages/ClienteDetailPage.tsx` | Adicionar botão "Voltar" |
| `src/components/ui/dialog.tsx` | Prevenir fechamento ao perder foco |

### O que NÃO muda
- Layout, cálculos, RLS, edge functions, dashboard
- Fluxo de cadastro, campos, validações

