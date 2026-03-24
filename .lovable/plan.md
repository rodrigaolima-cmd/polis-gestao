

## Problema identificado

A edge function `fix-encoding` existe mas **nunca foi executada com sucesso** -- ela dá timeout porque processa cada registro individualmente (um UPDATE por registro). Com centenas de registros, excede o limite de tempo.

Os dados no banco continuam com mojibake: "CÃ¢mara" em vez de "Câmara", "SÃ£o" em vez de "São", etc.

Além disso, os nomes aparecem quebrados na UI porque não há normalização na renderização.

## Plano de correção

### 1. Reescrever a edge function `fix-encoding` com SQL direto

Em vez de buscar todos os registros e fazer UPDATE um a um, usar `REPLACE()` em SQL em batch -- uma única query por campo:

```sql
UPDATE clients SET nome_cliente = REPLACE(REPLACE(REPLACE(nome_cliente, 'Ã£', 'ã'), 'Ã©', 'é'), 'Ã§', 'ç') ...
WHERE nome_cliente ~ 'Ã[£¡©­³ºç¢ª´¼µ]';
```

Isso resolve em segundos em vez de minutos.

**Arquivo:** `supabase/functions/fix-encoding/index.ts`
- Usar `supabase.rpc()` com uma function SQL ou fazer múltiplos `UPDATE ... SET field = REPLACE(...)` via SQL direto
- Cobrir todos os campos: `nome_cliente`, `regiao`, `consultor`, `tipo_ug`, `observacoes_cliente` (clients), `nome_modulo` (modules), `observacoes` (client_modules)
- Adicionar padrões faltantes para caracteres maiúsculos (Â, Ê, Ô, Õ, Ã, À, Á, É, etc.)

### 2. Aplicar `fixMojibake` na renderização (display-side fix)

Enquanto os dados não são corrigidos no banco, aplicar a correção ao exibir:

**`src/pages/ClientesPage.tsx`** -- ao mapear os resultados de `clientsData`, aplicar `fixMojibake()` nos campos de texto (`nome_cliente`, `regiao`, `consultor`, `tipo_ug`)

**`src/hooks/useContracts.ts`** -- no `loadFromDatabase`, aplicar `fixMojibake()` nos campos ao montar os `ContractRow`

Isso garante que a UI mostra os nomes corretos imediatamente, mesmo antes de executar a correção no banco.

### 3. Criar migration SQL para correção direta (alternativa mais confiável)

Criar uma database migration que faz os REPLACE diretamente, sem depender da edge function:

```sql
UPDATE clients SET nome_cliente = REPLACE(nome_cliente, 'Ã£', 'ã') WHERE nome_cliente LIKE '%Ã£%';
UPDATE clients SET nome_cliente = REPLACE(nome_cliente, 'Ã¢', 'â') WHERE nome_cliente LIKE '%Ã¢%';
-- ... para cada padrão e campo
```

### Resumo de alterações
- 1 arquivo reescrito: `supabase/functions/fix-encoding/index.ts`
- 2 arquivos editados para display fix: `ClientesPage.tsx`, `useContracts.ts`
- 1 migration SQL para corrigir dados no banco diretamente
- Sem alterações de layout, dashboard ou lógica de filtros

