

# Diagnóstico e Correção da Importação

## Problema Identificado

A tabela `client_modules` possui uma **constraint UNIQUE em (client_id, modulo_id)**, o que impede que um cliente tenha mais de um registro para o mesmo módulo. Porém, na planilha original existem clientes com **múltiplas linhas para o mesmo produto** (contratos diferentes, aditivos, etc.).

**Resultado:** A importação sobrescreve registros duplicados em vez de criar novos. Por isso:
- Planilha tem **975 linhas** → banco tem apenas **958 registros** (17 perdidos)
- Total contratado: **R$ 1.582.122** no banco vs **R$ 1.617.648** esperado
- Valores das linhas sobrescritas foram perdidos

## Plano de Correção

### 1. Remover a constraint UNIQUE

Migration SQL para dropar a constraint `client_modules_client_id_modulo_id_key`, permitindo múltiplos registros por par cliente+módulo.

### 2. Atualizar lógica de importação

No `useContracts.ts`, a função `importToDatabase`:
- **Antes:** Verifica se existe (client_id, modulo_id) e faz update
- **Depois:** Limpa todos os `client_modules` existentes e insere todos os registros da planilha como novos (fresh import)

Isso garante que os dados do banco reflitam exatamente a planilha.

### 3. Limpar dados atuais e reimportar

Após a correção, será necessário reimportar a planilha para que os 975 registros e valores corretos sejam persistidos.

### Arquivos afetados

| Ação | Arquivo |
|------|---------|
| Migration | Dropar unique constraint em client_modules |
| Modificar | `src/hooks/useContracts.ts` — lógica de importação |

