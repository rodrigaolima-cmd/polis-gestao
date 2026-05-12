## Plano: Expurgo de 9 clientes + renumeração alfabética PT-BR

### 1. Exclusões (transação única)

**9 clientes** + **50 lançamentos** em `client_modules`:

| Código | Nome | Módulos |
|---|---|---|
| 1 | AMOC | 0 |
| 14 | Prefeitura Municipal de Carangola | 16 |
| 17 | Prefeitura Municipal de Congonhas do Norte | 12 |
| 40 | Prefeitura Municipal de Santa Maria de Itabira | 14 |
| 47 | Prefeitura Municipal de Guanhães | 0 |
| 75 | Câmara Municipal de Santa Maria de Itabira | 8 |
| 123 | Câmara Municipal de Água Boa | 0 |
| 125 | Consórcio Intermunicipal de Saúde da Micro Região de Caratinga (encoding quebrado) | 0 |
| 128 | Prefeitura Municipal de Araçuaí | 0 |

### 2. Renumeração — alfabética PT-BR (1 → 124)

Ordenação por `nome_cliente` usando `unaccent` + `lower` para respeitar PT-BR ignorando acentos e caixa. Sequence `clients_codigo_cliente_seq` realinhada ao final.

### 3. Migration (executada em uma chamada após sua aprovação)

```sql
BEGIN;

-- 1) audit log do expurgo
INSERT INTO audit_logs (action, entity_type, entity_id, details)
SELECT 'bulk_delete_pre_migration', 'client', id::text,
       jsonb_build_object('codigo_cliente', codigo_cliente, 'nome_cliente', nome_cliente)
FROM clients WHERE codigo_cliente IN (1,14,17,40,47,75,123,125,128);

-- 2) excluir lançamentos vinculados
DELETE FROM client_modules
WHERE client_id IN (SELECT id FROM clients WHERE codigo_cliente IN (1,14,17,40,47,75,123,125,128));

-- 3) excluir clientes
DELETE FROM clients WHERE codigo_cliente IN (1,14,17,40,47,75,123,125,128);

-- 4) mover códigos atuais para faixa negativa (evita colisão de UNIQUE)
UPDATE clients SET codigo_cliente = -codigo_cliente;

-- 5) renumeração alfabética PT-BR (1..N)
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           ORDER BY lower(public.unaccent(nome_cliente)) ASC, id ASC
         ) AS novo
  FROM clients
)
UPDATE clients c SET codigo_cliente = r.novo
FROM ranked r WHERE r.id = c.id;

-- 6) realinhar sequence
SELECT setval('clients_codigo_cliente_seq', (SELECT MAX(codigo_cliente) FROM clients));

COMMIT;
```

> Se a extensão `unaccent` não estiver habilitada, a migration adicionará `CREATE EXTENSION IF NOT EXISTS unaccent;` no início.

### 4. Pós-execução

- Gero CSV `mapeamento_codigo_cliente.csv` em `/mnt/documents/` com colunas `codigo_antigo (negativo invertido) → codigo_novo → nome_cliente` para os 124 remanescentes.
- Atualizo a memória `mem://data/client-sequence-code` para refletir o novo `MAX`.

### 5. Sem alterações de código-fonte

Renumeração é puramente de dados; UI exibe `codigo_cliente` como leitura, joins internos usam `id` (UUID).

---

**Aprove para que eu rode a migration.** A operação não é reversível após COMMIT.
