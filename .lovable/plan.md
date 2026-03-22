

## Plano: 3 melhorias no módulo Clientes

### 1. Relatório Completo de Clientes e Sistemas

**Novo arquivo:** `src/components/clientes/ClientesReportDialog.tsx`

- Modal/dialog aberto por botão na `ClientesPage`
- Busca dados de `clients` + `client_modules` + `modules` (join)
- Agrupa por cliente (ordem alfabética pt-BR), dentro de cada cliente ordena sistemas alfabeticamente
- Mostra: Nome Cliente, Sistema, Valor Contratado, Valor Faturado, Diferença
- Subtotal por cliente, grand total no footer
- Respeita filtros ativos da `ClientesPage` (recebe `filtered` client IDs como prop)
- Botão "Exportar PDF" usando `window.print()` com classe `.print-report`

**Edição:** `src/pages/ClientesPage.tsx`
- Adicionar botão "Relatório Completo" no header ao lado de "Novo Cliente"
- Passar lista de IDs filtrados para o dialog

### 2. Copiar datas para todos os sistemas

**Edição:** `src/pages/ClienteDetailPage.tsx`
- Adicionar botão "Aplicar datas para todos os sistemas" na seção de módulos (ao lado de "Adicionar Módulo")
- Só aparece quando há 2+ módulos
- Ao clicar, abre dialog com:
  - Campos de Data de Assinatura e Vencimento (preenchidos com valores do primeiro módulo se existirem)
  - Checkboxes: "Assinatura" / "Vencimento" (ambos marcados por padrão)
  - Botão "Aplicar" com confirmação ("Isto substituirá as datas de X módulos. Continuar?")
- Executa update em batch nos `client_modules` do cliente
- Recarrega dados após sucesso

**Novo arquivo:** `src/components/clientes/CopyDatesDialog.tsx`

### 3. Dropdowns de Região e Consultor no formulário de cliente

**Edição:** `src/components/clientes/ClienteForm.tsx`
- Carregar valores únicos de `regiao` e `consultor` da tabela `clients` ao abrir o dialog
- Substituir `<Input>` por `<Select>` com Combobox-like behavior:
  - Lista valores existentes ordenados alfabeticamente (pt-BR)
  - Opção "Outro..." que revela um Input para valor manual
- Mantém compatibilidade com edição (valor atual aparece selecionado mesmo se não estiver na lista)

### Detalhes técnicos
- Sem alterações no banco de dados
- Sem alterações no dashboard
- 2 novos arquivos, 3 arquivos editados
- Estilo visual consistente com o existente (glass-card, text-xs, etc.)

