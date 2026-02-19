

## Correcao: Valor Contratado deve somar todas as linhas do cliente

### Problema

Na funcao `consolidateByClient` (arquivo `src/utils/contractUtils.ts`, linha 27), o calculo do valor contratado usa `Math.max()`, que pega apenas o maior valor entre todas as linhas do cliente. Isso ignora as demais linhas.

O valor faturado ja funciona corretamente porque usa `.reduce()` para somar todas as linhas.

### Solucao

Alterar a linha 27 para usar a mesma logica de soma do faturado:

**Antes:**
```typescript
const totalContracted = Math.max(...rows.map((r) => r.contractedValue));
```

**Depois:**
```typescript
const totalContracted = rows.reduce((sum, r) => sum + r.contractedValue, 0);
```

### Arquivo alterado

- `src/utils/contractUtils.ts` - uma unica linha (linha 27)

Isso fara com que o Total Contratado some todas as linhas de cada cliente, da mesma forma que o Total Faturado ja faz.

