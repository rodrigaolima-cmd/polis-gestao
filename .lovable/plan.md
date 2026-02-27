

## Adição de Região, Consultor e Análises Comerciais

### Resumo
Adicionar campos Região e Consultor ao sistema, com filtros, consolidação, nova seção "Análises Comerciais" e relatório detalhado "Dinheiro na Mesa por Sistema".

---

### Alterações por Arquivo

#### 1. `src/types/contract.ts`
- Adicionar `regiao: string` e `consultor: string` ao `ContractRow`
- Adicionar `regiao: string`, `consultor: string`, `regiaoConflict: boolean`, `consultorConflict: boolean` ao `ClientSummary`
- Adicionar `regiao: string` e `consultor: string` ao `DashboardFilters`

#### 2. `src/data/mockContracts.ts`
- Adicionar campos `regiao` e `consultor` com valores demo a cada registro (ex: "Centro-Oeste", "Sul" / "Carlos Silva", "Ana Souza")
- Backward compatible: strings vazias se ausente

#### 3. `src/utils/contractUtils.ts`
- `consolidateByClient`: extrair `regiao` e `consultor` do primeiro registro não-vazio; detectar conflito se múltiplos valores distintos existem → setar flags `regiaoConflict`/`consultorConflict`
- `applyFilters`: adicionar checagem de `filters.regiao` e `filters.consultor`
- `defaultFilters`: adicionar `regiao: ""` e `consultor: ""`

#### 4. `src/components/dashboard/ImportDialog.tsx`
- Adicionar `regiao` e `consultor` ao `REQUIRED_FIELDS` (como opcionais, sem asterisco)
- No `handleConfirm`, parsear `regiao` e `consultor` com trim
- Backward compatible: se coluna não mapeada, usar `""`

#### 5. `src/components/dashboard/FiltersBar.tsx`
- Adicionar dois `FilterSelect` para "Região" e "Consultor" na grid de filtros expandidos
- Usar `getUniqueValues(contracts, "regiao")` e `getUniqueValues(contracts, "consultor")`
- Incluir no cálculo de `activeCount`

#### 6. `src/components/dashboard/CommercialAnalysis.tsx` (NOVO)
- Nova seção "Análises Comerciais" com ícone `Briefcase`
- Duas tabelas compactas lado a lado (grid 2 colunas):
  - **Dinheiro na Mesa por Consultor**: Consultor | Total Pendência | Nº Clientes (sort: pendência desc, consultor asc pt-BR)
  - **Dinheiro na Mesa por Região**: Região | Total Pendência | Nº Clientes (sort: pendência desc, região asc pt-BR)
- Recebe `clients: ClientSummary[]` já filtrados
- Estilo consistente com `ActionTables` (glass-card, mesmo header pattern)

#### 7. `src/components/dashboard/Dashboard.tsx`
- Importar e renderizar `CommercialAnalysis` entre `DashboardCharts` e `ActionTables`
- Passar `clients` e callbacks de relatório

#### 8. `src/components/dashboard/SectionReportDialog.tsx`
- Adicionar tipo `"dinheiroNaMesaDetalhado"` ao `SectionReportType`
- Adicionar título no mapa TITLES
- Novo componente `DinheiroNaMesaDetalhadoReport`:
  - Recebe `contracts: ContractRow[]`
  - Filtra onde `contractedValue > billedValue`
  - Agrupa por `clientName` (ordem alfabética pt-BR)
  - Dentro de cada grupo: linhas por produto (alfabético) com colunas: Produto, Tipo UG, Região, Consultor, Contratado, Faturado, Pendência, Vencimento, Status, OBS
  - Subtotal por cliente
  - Rodapé: total clientes com pendência, soma pendência, soma contratado, soma faturado
- Na renderização do report `"general"` ou como botão dentro do KPI "Não Faturado": adicionar botão "Ver detalhado por sistema" que abre este relatório

#### 9. `src/components/dashboard/Dashboard.tsx` (KPI "Não Faturado")
- Modificar o KPI "Não Faturado" para ter `onClick` que abre um dialog simples com o valor e um botão "Ver detalhado por sistema" que abre `setSectionReport("dinheiroNaMesaDetalhado")`
- Alternativa mais simples: diretamente no `onClick` do KPI abrir o relatório detalhado

#### 10. Relatórios existentes (GeneralReport, exports CSV)
- Adicionar colunas Região e Consultor ao `GeneralReport`
- Adicionar Região e Consultor ao CSV export
- Badge "⚠ Revisar" ao lado de Região/Consultor quando `regiaoConflict`/`consultorConflict` é true

---

### Detalhes Técnicos

**Consolidação com conflito:**
```text
Se cliente tem contratos com regiao="Centro-Oeste" e regiao="Sul":
  → regiao = "Centro-Oeste" (primeiro não-vazio)
  → regiaoConflict = true
  → Badge "⚠ Revisar" exibido ao lado do valor
```

**Backward compatibility:**
- Mock data recebe valores; dados importados sem coluna mapeada → `""`
- Filtros com valor vazio são ignorados (mesmo padrão existente)

