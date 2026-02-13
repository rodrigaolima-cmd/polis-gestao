

## Problema Identificado

Existem dois problemas nos dados e na logica de consolidacao:

### 1. Valores Contratados incorretos

A funcao `consolidateByClient` usa `Math.max()` para pegar o valor contratado, assumindo que o valor global do contrato e repetido em todas as linhas do cliente. Porem, com dados reais, um cliente pode ter contratos com valores diferentes por produto. Nesse caso, o `Math.max` pega apenas o maior valor e ignora os demais.

**Solucao:** Agrupar as linhas por valor contratado dentro de cada cliente. Se o mesmo valor aparece repetido, conta-lo apenas uma vez (contrato global). Se valores sao diferentes, soma-los. Isso e feito somando os valores **distintos** de `contractedValue` por cliente.

Exemplo pratico:
- Cliente X: Produto A = R$100.000, Produto B = R$100.000, Produto C = R$50.000
- Valores distintos: R$100.000 + R$50.000 = R$150.000 (Total Contratado)

### 2. Duas UGs "Prefeitura" duplicadas

Dados importados provavelmente contem variacoes como "Prefeitura" e "prefeitura" (ou com espacos extras). Isso cria duas categorias separadas nos filtros e graficos.

**Solucao:** Normalizar o campo `ugType` durante a importacao, aplicando `trim()` e capitalizacao consistente (primeira letra maiuscula).

---

### Alteracoes Tecnicas

**Arquivo: `src/utils/contractUtils.ts`**
- Alterar a linha 27 de `Math.max(...)` para somar valores distintos de `contractedValue`:
```typescript
const uniqueContracted = [...new Set(rows.map((r) => r.contractedValue))];
const totalContracted = uniqueContracted.reduce((sum, v) => sum + v, 0);
```

**Arquivo: `src/components/dashboard/ImportDialog.tsx`**
- Na funcao `handleConfirm`, normalizar `ugType` com capitalize:
```typescript
ugType: String(row[mapping.ugType] ?? "").trim().replace(/\b\w/g, c => c.toUpperCase()).substring(0, 100),
```
- Aplicar mesma normalizacao em `contractStatus` para evitar problemas similares.

