

## Relatorio por Status ao Clicar no Grafico

### Objetivo
Ao clicar em uma barra do grafico "Contratos por Status" (ex: Vigente, Vencido, Suspenso), abrir um dialog/modal com a lista detalhada dos contratos daquele status, com opcao de exportar em PDF.

### Alteracoes

**1. Novo componente: `src/components/dashboard/StatusReportDialog.tsx`**
- Dialog (usando Radix Dialog existente) que recebe:
  - `status: string` (o status clicado)
  - `contracts: ContractRow[]` (contratos filtrados por aquele status)
  - `open / onOpenChange` (controle do dialog)
- Conteudo do dialog:
  - Titulo: "Relatorio - Contratos [Status]"
  - Tabela com colunas: Cliente, Tipo UG, Produto, Valor Contratado, Valor Faturado, Diferenca, Data Assinatura, Vencimento
  - Totalizadores no rodape: soma de contratado, faturado, diferenca
  - Botao "Exportar PDF" que usa `window.print()` com CSS `@media print` para imprimir apenas o conteudo do relatorio

**2. Alteracao: `src/components/dashboard/DashboardCharts.tsx`**
- Adicionar prop `onStatusClick: (status: string) => void` na interface `ChartsProps`
- No grafico "Contratos por Status", adicionar `onClick` handler na `Bar` usando o evento do Recharts (`onClick` no componente `Bar` ou `BarChart`)
- Ao clicar, chamar `onStatusClick(entry.status)`

**3. Alteracao: `src/components/dashboard/Dashboard.tsx`**
- Adicionar estado para controlar o dialog: `selectedStatus` e `statusReportOpen`
- Filtrar `filteredContracts` pelo status selecionado para passar ao dialog
- Passar callback `onStatusClick` ao `DashboardCharts`
- Renderizar `StatusReportDialog`

**4. CSS para impressao PDF**
- No `StatusReportDialog`, usar uma div com classe especifica (ex: `print-report`)
- Adicionar regras `@media print` no `src/index.css`:
  - Esconder tudo exceto o conteudo do relatorio
  - Estilizar tabela para impressao (bordas, fontes, cores em preto/branco)
  - Ajustar margens e quebras de pagina

### Detalhes Tecnicos

- O evento de clique do Recharts `BarChart` fornece o `payload` com os dados da barra clicada, incluindo o campo `status`
- Para o PDF, `window.print()` combinado com `@media print` e visibilidade condicional que esconde o restante da pagina durante a impressao
- O dialog usa os componentes `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` ja existentes no projeto
- A tabela reutiliza os componentes `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell` existentes

