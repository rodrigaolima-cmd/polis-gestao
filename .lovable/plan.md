

## Diagnóstico

O bug está na extração de cabeçalhos (linhas 142-146). O método `eachCell` do ExcelJS **pula células vazias**. Se a planilha tem uma coluna vazia entre cabeçalhos (ex: coluna B vazia), o array `cols` fica com os nomes na ordem errada em relação às posições reais.

Depois, na leitura dos dados (linha 164), o código usa `row.getCell(idx + 1)` — que assume que as colunas são contíguas (1, 2, 3...). Mas como `eachCell` pulou colunas vazias, `idx + 1` não corresponde à coluna real do cabeçalho. Resultado: valores lidos da coluna errada → "00" para Valor Faturado.

**Exemplo**: Se "Valor Faturado" está na coluna 7 da planilha mas é o 5º cabeçalho não-vazio, `getCell(5)` lê a coluna errada.

## Correção em `ImportDialog.tsx`

1. **Trocar `cols: string[]` por `cols: { name: string; colNumber: number }[]`** — armazenar o nome E o número real da coluna retornado por `eachCell`.

2. **Na leitura de dados**, usar `row.getCell(col.colNumber)` em vez de `row.getCell(idx + 1)`.

3. **Ajustar referências** a `cols` no resto do código (headers para mapeamento usam `cols.map(c => c.name)`).

4. **Manter `parseCurrency` com locale brasileiro** — atualizar para usar parsing locale-aware conforme padrão sugerido, tratando `1.234,56` corretamente (ponto = milhar, vírgula = decimal).

### Mudanças específicas

```typescript
// Header extraction — track real column numbers
const cols: { name: string; colNumber: number }[] = [];
headerRow.eachCell((cell, colNumber) => {
  const val = String(extractCellValue(cell.value) ?? "").trim();
  if (val) cols.push({ name: val, colNumber });
});

// Data extraction — use real column number
cols.forEach((col) => {
  const cell = row.getCell(col.colNumber);
  const val = extractCellValue(cell.value);
  obj[col.name] = val ?? "";
});

// Update headers state to string[] for mapping UI
setHeaders(cols.map(c => c.name));
```

```typescript
// Updated parseCurrency with locale-aware parsing
const parseCurrency = (val: unknown): number => {
  if (typeof val === "object" && val !== null && "result" in (val as any)) {
    val = (val as any).result;
  }
  if (typeof val === "number") return val;
  if (val === null || val === undefined || val === "") return 0;
  let str = String(val).replace(/[R$\s]/g, "").trim();
  // Brazilian format: 1.234,56 (dot=thousand, comma=decimal)
  const lastComma = str.lastIndexOf(",");
  const lastDot = str.lastIndexOf(".");
  if (lastComma > lastDot) {
    str = str.replace(/\./g, "").replace(",", ".");
  } else {
    str = str.replace(/,/g, "");
  }
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
};
```

