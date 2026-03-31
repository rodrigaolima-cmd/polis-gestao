

## Problema identificado

O bug é uma **race condition entre blur e click**. O `CurrencyInput` só chama `onChange` (que atualiza `form`) no evento `onBlur`. Quando o usuário digita "300" e clica em "Salvar":

1. O `onBlur` do input dispara e chama `onChange(300)` → `setForm({...form, valor_contratado: 300})`
2. O `onClick` do botão "Salvar" dispara `handleSave()` que lê `form.valor_contratado`
3. Mas o `setForm` do passo 1 é **assíncrono** (React batching) — o state ainda não atualizou quando `handleSave` executa
4. Resultado: o payload enviado ao banco contém o **valor antigo** (400), não o novo (300)

Por isso: a tabela mostra 300 (valor do form local após render), mas ao reabrir a edição mostra 400 (valor real do banco, que nunca foi atualizado).

## Correção

### `src/components/ui/currency-input.tsx`

Chamar `onChange` **a cada keystroke** (não só no blur), para que o `form` esteja sempre sincronizado:

- No `handleChange`: fazer parse do valor digitado e chamar `onChange(parsed)` imediatamente
- No `handleBlur`: manter a formatação visual, mas não depender dele para propagar o valor
- No `handleFocus`: manter comportamento atual (mostrar valor editável)

Isso elimina a race condition porque quando o usuário clica "Salvar", o `form` já tem o valor correto.

### Arquivos afetados
- 1 arquivo: `src/components/ui/currency-input.tsx` (apenas ~5 linhas alteradas)
- Sem alteração no banco, layout ou lógica do dashboard

