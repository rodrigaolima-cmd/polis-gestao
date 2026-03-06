

## Diagnóstico

O problema foi introduzido na migração de `xlsx` (SheetJS) para `exceljs`. A diferença está em como cada biblioteca retorna valores de células:

- **SheetJS**: sempre retorna o valor final (número puro) para células numéricas e com fórmulas.
- **ExcelJS**: retorna objetos complexos para células com fórmulas, como `{ formula: "=A1+B1", result: 1234.56 }`, e pode também retornar `{ sharedFormula: "...", result: ... }`.

A função `parseCurrency` (linha 196-201) verifica `typeof val === "number"` — isso funciona para células numéricas simples, mas **falha para células com fórmulas**, pois o valor é um objeto. Nesse caso, cai no parsing de string via `String(val)`, que converte o objeto para `"[object Object]"` e retorna `0`.

Como "Valor Contratado" pode ser uma célula numérica simples e "Valor Faturado" pode conter fórmulas (ou vice-versa), isso explica por que um bate e o outro não.

## Plano de Correção

### `src/components/dashboard/ImportDialog.tsx`

1. **Criar função `extractCellValue`** que normaliza qualquer tipo de valor de célula ExcelJS para seu valor primitivo:
   - Se `typeof val === "object"` e tem propriedade `result` → retorna `val.result`
   - Se `typeof val === "object"` e tem propriedade `richText` → concatena os textos
   - Se `typeof val === "object"` e tem propriedade `error` → retorna `""`
   - Caso contrário → retorna o valor como está

2. **Aplicar `extractCellValue` na extração de dados** (linha 154): ao ler cada célula, chamar `extractCellValue(cell.value)` antes de armazenar em `obj[colName]`, garantindo que `rawRows` sempre contenha valores primitivos.

3. **Atualizar `parseCurrency`** para também tratar objetos com `result` como fallback de segurança, caso algum valor passe sem normalização.

Isso restaura o comportamento anterior onde todos os valores numéricos (inclusive de fórmulas) são lidos corretamente.

