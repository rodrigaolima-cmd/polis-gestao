

## Correcao: PDFs em Branco e Ordenacao Alfabetica

### Problema 1: PDFs saindo em branco

**Causa raiz**: O CSS de impressao (em `src/index.css`) esconde TUDO na pagina (`body * { visibility: hidden !important }`) e so mostra elementos com a classe `.print-report`. O componente `ChartReportDialog` tem essa classe no `DialogContent`, mas o `SectionReportDialog` nao tem — por isso os relatorios de sessao saem em branco no PDF.

**Correcao**: Adicionar a classe `print-report` no `DialogContent` do `SectionReportDialog`.

### Problema 2: Clientes fora de ordem alfabetica

**Correcao**: Ordenar clientes alfabeticamente nos seguintes locais:
- `SectionReportDialog`: nos relatorios Top 10 (secundario por nome apos valor), Contratado vs Faturado, e Criticos
- `ActionTables`: nas tabelas de Ranking e Contratos Criticos
- `consolidateByClient` em `contractUtils.ts`: ordenar o resultado final por nome do cliente

### Alteracoes Tecnicas

**1. `src/components/dashboard/SectionReportDialog.tsx`** (linha 42)
- Adicionar classe `print-report` ao `DialogContent`:
  - De: `className="max-w-5xl max-h-[90vh] overflow-auto print:max-w-none..."`
  - Para: `className="max-w-5xl max-h-[90vh] overflow-auto print-report"`
- Nos sub-relatorios `ContractedVsBilledReport` e `RankingReport`, aplicar sort alfabetico como criterio secundario (apos o criterio principal de valor)

**2. `src/utils/contractUtils.ts`** (funcao `consolidateByClient`)
- Ordenar o array final por `clientName` em ordem alfabetica (locale pt-BR)

Essas duas alteracoes resolvem ambos os problemas de forma simples e direta.

