

# Correção: Importação Incompleta (500 de 975 registros)

## Problema Identificado

O banco contém apenas **500 registros** em vez de 975. A importação está falhando silenciosamente em algum lote após o 5º batch (500 registros). Possíveis causas:
- Algum registro com data em formato inválido para o tipo `date` do PostgreSQL
- Erro em um batch que interrompe o loop mas não reporta claramente ao usuário

Além disso, o `loadFromDatabase` não tem paginação — se ultrapassar 1000 registros no futuro, perderá dados.

## Correção

### 1. Tornar a inserção resiliente a erros por lote (`useContracts.ts`)

Em vez de `throw insertError` que aborta toda a importação quando um lote falha:
- **Tentar inserir cada lote individualmente**
- Se um lote falhar, tentar inserir **registro por registro** nesse lote para identificar e pular apenas os registros problemáticos
- Acumular lista de registros com erro para reportar ao final
- Sanitizar datas antes da inserção: converter strings vazias ou inválidas para `null`

### 2. Adicionar validação de datas antes da inserção (`useContracts.ts`)

Adicionar uma função `sanitizeDate(dateStr)` que:
- Retorna `null` para strings vazias ou inválidas
- Valida que a data está no formato `YYYY-MM-DD`
- Previne erro do PostgreSQL ao inserir data malformada

### 3. Garantir leitura completa dos dados (`useContracts.ts`)

Na função `loadFromDatabase`, adicionar `.range(0, 9999)` à query para garantir que todos os registros sejam retornados (não depender do limite padrão de 1000).

### 4. Reportar falhas detalhadas (`ImportDialog.tsx`)

Na tela "done", exibir quantos registros falharam com mensagem clara, para o usuário saber se precisa corrigir a planilha.

### Arquivos afetados

| Ação | Arquivo |
|------|---------|
| Modificar | `src/hooks/useContracts.ts` — sanitização de datas, inserção resiliente, paginação na leitura |
| Modificar | `src/components/dashboard/ImportDialog.tsx` — exibir erros detalhados na tela de resultado |

