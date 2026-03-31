

## Adicionar código sequencial aos clientes

### O que será feito

Adicionar um campo `codigo_cliente` numérico e auto-incrementável à tabela `clients`, preenchendo automaticamente os clientes existentes.

### Mudanças

#### 1. Migration SQL

```sql
-- Adicionar coluna com sequência automática
ALTER TABLE public.clients 
ADD COLUMN codigo_cliente SERIAL;

-- Criar índice único para garantir unicidade
CREATE UNIQUE INDEX idx_clients_codigo ON public.clients (codigo_cliente);
```

O `SERIAL` auto-preenche todos os registros existentes com valores sequenciais (1, 2, 3...) na ordem de inserção e garante auto-incremento para novos clientes.

#### 2. Exibição na interface

- **`ClientesPage.tsx`**: Adicionar coluna "Código" como primeira coluna da tabela, antes do nome
- **`ClienteDetailPage.tsx`**: Exibir o código no cabeçalho do cliente (ex: `#42 — Nome do Cliente`)

#### 3. Exportação da lista

Após a migration, gerar um CSV em `/mnt/documents/` com `codigo_cliente` e `nome_cliente` para consulta.

### Arquivos afetados
- Nova migration SQL (add column)
- `src/pages/ClientesPage.tsx` — coluna Código na tabela
- `src/pages/ClienteDetailPage.tsx` — exibir código no header

### O que NÃO muda
- Dashboard, relatórios, módulos, autenticação
- Nenhuma coluna existente é alterada

