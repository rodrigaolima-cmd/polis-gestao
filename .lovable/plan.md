

## Criar cliente "Prefeitura Municipal de Guanhães" com código 47

### O que será feito

1. **Inserir no banco** o cliente com:
   - `codigo_cliente`: 47 (forçado)
   - `nome_cliente`: Prefeitura Municipal de Guanhães
   - `codigo_bling`: 64
   - Demais campos com valores padrão

2. **Nenhuma alteração de código** necessária — o cliente aparecerá automaticamente na listagem de Clientes e no Dashboard assim que inserido, pois as telas já buscam da tabela `clients`.

### SQL a executar

```sql
INSERT INTO clients (codigo_cliente, nome_cliente, codigo_bling)
VALUES (47, 'Prefeitura Municipal de Guanhães', '64');
```

### Observação
- O cliente será criado sem módulos vinculados, então aparecerá na lista de Clientes (119 → 120) mas não no Dashboard até que módulos sejam adicionados.
- Nenhum arquivo de código será alterado.

