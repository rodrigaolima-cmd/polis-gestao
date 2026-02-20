

## Correcoes e Melhorias nos KPI Cards

### Problema: KPI "Contratos Ativos" mostrando 0 com dados importados

**Causa raiz**: A comparacao `c.contractStatus.trim().toLowerCase() === "ativo"` so reconhece o valor exato "ativo". Planilhas importadas podem trazer valores como "Vigente", "Em vigor", "Em andamento", "ATIVO", "Active" etc.

**Solucao**: Ampliar a deteccao para aceitar multiplos termos que indicam contrato ativo:
- Verificar se o status contem "ativ" (cobre "Ativo", "ATIVO", "Inativo" sera excluido com logica adicional)
- Tambem aceitar "vigente", "em vigor", "em andamento", "active"
- Excluir explicitamente termos negativos como "inativ", "cancel", "suspens", "encerr", "vencid"

**Arquivo**: `src/components/dashboard/Dashboard.tsx` (linha 52)
```typescript
// De:
const contratosAtivos = filteredContracts.filter(
  (c) => c.contractStatus.trim().toLowerCase() === "ativo"
).length;

// Para:
const contratosAtivos = filteredContracts.filter((c) => {
  const s = c.contractStatus.trim().toLowerCase();
  const negativos = ["inativ", "cancel", "suspens", "encerr", "vencid", "rescind"];
  if (negativos.some(n => s.includes(n))) return false;
  return s.includes("ativ") || s.includes("vigente") || s.includes("em vigor") || s === "active";
}).length;
```

---

### Melhoria: Sparklines nos KPI Cards

Adicionar mini graficos de tendencia (sparklines) dentro dos KPI cards usando Recharts (ja instalado). Os sparklines mostrarao a distribuicao mensal dos dados.

**Arquivo**: `src/components/dashboard/KPICard.tsx`
- Adicionar prop opcional `sparklineData?: number[]`
- Quando presente, renderizar um mini `LineChart` do Recharts (40x20px) abaixo do valor
- Linha fina na cor do variant, sem eixos nem labels
- Area preenchida com opacidade baixa

**Arquivo**: `src/components/dashboard/Dashboard.tsx`
- Calcular dados de sparkline para cada KPI baseado nos meses de assinatura/vencimento dos contratos
- Para KPIs de valor (Total Contratado, Faturado, Nao Faturado): soma mensal dos ultimos 6 meses
- Para KPIs de contagem (Vencidos, Ativos): contagem mensal
- Para KPIs de percentual: media mensal

**Arquivo**: `src/utils/contractUtils.ts`
- Criar funcao `getMonthlyTrend(contracts, field, months)` que retorna array de valores mensais para os ultimos N meses

### Alteracoes por Arquivo

| Arquivo | Alteracao |
|---------|-----------|
| `KPICard.tsx` | Nova prop `sparklineData`, mini LineChart do Recharts |
| `Dashboard.tsx` | Deteccao flexivel de "Ativo"; calculo de sparkline data para cada KPI |
| `contractUtils.ts` | Nova funcao `getMonthlyTrend` para gerar dados de tendencia mensal |
