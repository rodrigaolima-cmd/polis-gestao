

## Expandir cadastro de Clientes — novos campos para migração Polis Hub / Bling

### 1. Migration — adicionar colunas na tabela `clients`

```sql
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS codigo_bling text DEFAULT '',
  ADD COLUMN IF NOT EXISTS nome_fantasia text DEFAULT '',
  ADD COLUMN IF NOT EXISTS cnpj text DEFAULT '',
  ADD COLUMN IF NOT EXISTS fone text DEFAULT '',
  ADD COLUMN IF NOT EXISTS celular text DEFAULT '',
  ADD COLUMN IF NOT EXISTS email text DEFAULT '',
  ADD COLUMN IF NOT EXISTS email_nfse text DEFAULT '',
  ADD COLUMN IF NOT EXISTS cliente_desde date,
  ADD COLUMN IF NOT EXISTS municipio text DEFAULT '',
  ADD COLUMN IF NOT EXISTS uf text DEFAULT '',
  ADD COLUMN IF NOT EXISTS responsavel_principal text DEFAULT '',
  ADD COLUMN IF NOT EXISTS cargo_responsavel text DEFAULT '';
```

Todos nullable/default vazio — registros existentes não são afetados.

### 2. ClienteForm.tsx — reformular com seções

Expandir o modal para `max-w-2xl` com scroll e organizar em 4 seções visuais:

**Dados Principais**: Nome do Cliente*, Nome Fantasia, Tipo UG, Região, Consultor, Status, Código Bling, Cliente desde (datepicker)

**Dados Cadastrais / Fiscais**: CNPJ (com máscara XX.XXX.XXX/XXXX-XX), Município, UF (select com 27 UFs), Responsável principal, Cargo do responsável

**Contato**: Fone (máscara XX-XXXX XXXX), Celular (máscara XX-XXXX XXXX), E-mail (validação formato), E-mail NFSe (com botão "Copiar e-mail principal")

**Observações**: Textarea existente

- Atualizar `ClienteData` interface com todos os novos campos
- Atualizar `handleSave` para incluir novos campos no insert/update
- Validação de CNPJ (formato) e e-mail (formato) antes de salvar
- Máscaras aplicadas via `onChange` handlers (sem lib externa)

### 3. ClientesPage.tsx — adicionar colunas na tabela

Atualizar `ClientRow` interface e `loadClients` para trazer os novos campos.

Novas colunas na tabela (entre as existentes):
- Nome Fantasia (após Cliente)
- CNPJ (após Consultor)
- E-mail (após CNPJ)
- Celular (após E-mail)

Remover colunas financeiras da listagem principal (Contratado, Faturado, Diferença) para dar espaço — esses dados ficam no detalhe do cliente.

Busca expandida: incluir nome_fantasia, cnpj, email no filtro de busca.

### 4. ClienteDetailPage.tsx — exibir novos campos

Expandir o grid de informações do cliente para mostrar todos os campos novos organizados nas mesmas seções do formulário.

### 5. Arquivos afetados

| Arquivo | Alteração |
|---------|-----------|
| Migration SQL | 12 novas colunas |
| `src/components/clientes/ClienteForm.tsx` | Reformular com seções e novos campos |
| `src/pages/ClientesPage.tsx` | Novas colunas, busca expandida |
| `src/pages/ClienteDetailPage.tsx` | Exibir novos campos no detalhe |

### O que NÃO muda
- Lógica de negócio (cálculos, validações, cascade inactivation)
- RLS policies, edge functions, outras tabelas
- Dashboard, módulos, relatórios
- Layout (sidebar, header, tema)
- Fluxo de região/consultor com select + "Outro"

