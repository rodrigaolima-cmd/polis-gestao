

## Adicionar múltiplos sistemas de uma vez

### Resumo
Novo componente `ClienteMultiModuloForm` — modal acessível via botão "Adicionar Vários" ao lado do botão existente "Adicionar Módulo" na tela de detalhe do cliente.

### Novo arquivo: `src/components/clientes/ClienteMultiModuloForm.tsx`

**Layout do modal (max-w-3xl):**
1. **Seleção de módulos** — lista de checkboxes com todos os módulos do catálogo (`modules` table), ordenados alfabeticamente. Filtra os já vinculados ao cliente (marca como "já vinculado" e desabilita). 
2. **Campos compartilhados** — Data de Assinatura, Vencimento, Status, Faturado?, Observações, Ativo no cliente. Preenchidos uma vez, aplicados a todos.
3. **Tabela de valores individuais** — uma linha por módulo selecionado com colunas: Módulo (nome), Valor Contratado (input), Valor Faturado (input). Botão opcional "Aplicar mesmo valor a todos" acima da tabela para copiar um valor base.
4. **Salvamento** — insere N registros em `client_modules` em batch. Exibe warning se algum módulo já está vinculado (detectado ao carregar `client_modules` existentes do cliente). Pula duplicatas automaticamente.

### Edição: `src/pages/ClienteDetailPage.tsx`

- Adicionar state `multiModuleFormOpen`
- Adicionar botão "Adicionar Vários" (com ícone `ListPlus` ou similar) ao lado do "Adicionar Módulo" existente
- Importar e renderizar `ClienteMultiModuloForm`
- Manter toda a funcionalidade existente intacta

### Detalhes técnicos
- Busca módulos existentes do cliente (`client_modules` where `client_id`) para detectar duplicatas
- Busca catálogo completo (`modules` table) para a lista de seleção
- Insert batch: `supabase.from("client_modules").insert([...arrayOfPayloads])`
- Sem alterações no banco de dados
- Sem alterações no dashboard ou relatórios
- 1 novo arquivo, 1 arquivo editado

