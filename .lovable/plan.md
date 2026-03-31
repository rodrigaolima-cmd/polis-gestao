

## Problema

A importação criou **~65 clientes duplicados** no banco. Para cada par, um registro tem os módulos vinculados e o outro tem 0 módulos (registro fantasma). Isso aconteceu porque a lógica de importação (`useContracts.ts`) faz lookup por `nome_cliente=ilike.X` mas durante a importação o mesmo cliente pode ter sido criado antes do lookup encontrá-lo (race condition na inserção sequencial).

## Plano

### 1. Limpar duplicatas existentes no banco (SQL migration)

Executar um SQL que para cada `nome_cliente` duplicado:
- Identifica o registro "keeper" (o que tem mais `client_modules`)
- Move quaisquer `client_modules` órfãos do duplicado para o keeper
- Deleta o registro duplicado (com 0 módulos)

```sql
-- Para cada nome duplicado, manter o que tem mais módulos e deletar o vazio
WITH ranked AS (
  SELECT id, nome_cliente,
    ROW_NUMBER() OVER (PARTITION BY nome_cliente ORDER BY 
      (SELECT COUNT(*) FROM client_modules cm WHERE cm.client_id = clients.id) DESC
    ) as rn
  FROM clients
  WHERE nome_cliente IN (SELECT nome_cliente FROM clients GROUP BY nome_cliente HAVING COUNT(*) > 1)
)
-- Primeiro: mover client_modules órfãos para o keeper
-- Depois: deletar os duplicados (rn > 1)
```

### 2. Corrigir lógica de importação para evitar futuras duplicatas

**Edição: `src/hooks/useContracts.ts`** — No passo 2 (find or create clients), mudar a estratégia:
- Antes de iniciar o loop, fazer um único SELECT de todos os clientes existentes
- Usar um Map local para lookup em memória (sem depender de queries individuais durante a inserção)
- Isso elimina a race condition e é mais rápido

### Arquivos afetados
- 1 SQL migration para limpeza de duplicatas
- 1 arquivo editado: `src/hooks/useContracts.ts` (otimizar lookup de clientes na importação)

