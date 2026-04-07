

## Importação de dados cadastrais de clientes (migração Bling)

### Resumo

Criar uma nova página/fluxo de importação de dados cadastrais de clientes a partir da planilha Bling, com tela de auditoria/preview antes de gravar, e tornar o `codigo_cliente` auto-incremental e não editável.

### Análise dos dados

- **Planilha**: ~163 linhas, com coluna `Codigo` (código do Gestão), `Cod Bling`, `Nome`, etc.
- **Banco atual**: 120 clientes, max `codigo_cliente` = 121
- **Linhas sem código na planilha** (~15 linhas): são clientes novos que precisam receber código a partir de 122
- **Linhas com código repetido** (ex: código 9 aparece 2x — FUMPREF e Fundo Municipal de Saúde): divergência a tratar
- **Observações multilinhas**: campo CSV com quebras de linha (ex: dados bancários)

### Arquivos a criar/modificar

**1. `src/pages/ImportClientesPage.tsx`** — Nova página dedicada

Página standalone acessível via rota `/importar-clientes` (ou via botão em ClientesPage). Fluxo em etapas:

1. **Upload**: aceita CSV/XLSX, parseia com `xlsx`
2. **Matching engine** (client-side):
   - Para cada linha, busca match na lista de clientes do banco por: `codigo_cliente` → `codigo_bling` → `cnpj` → nome normalizado
   - Classifica: `atualizar` | `criar` | `divergencia` | `ignorar`
   - Divergências: código igual + nome muito diferente, mesmo CNPJ em outro cliente, código Bling em outro cliente, etc.
3. **Tela de auditoria**: tabela mostrando cada linha com:
   - Código planilha, Cod Bling, Nome planilha, Cliente encontrado no sistema, Ação sugerida, Divergência, checkbox de confirmação
   - Filtros por status (Atualizar/Criar/Divergência/Ignorar)
   - Para divergências: dropdown para escolher ação (Atualizar, Criar novo, Ignorar, Vincular manualmente)
4. **Confirmação e gravação**:
   - Updates: enriquecer campos existentes (nome_fantasia, cnpj, fone, celular, email, email_nfse, codigo_bling, cliente_desde, observacoes)
   - Observações: merge com separador `[Importação Bling - data]`
   - Creates: usar próximo código auto-incremental (a partir de 122)
   - Audit log de cada operação
5. **Resumo final**: contadores de atualizados, criados, divergências, ignorados, erros

**2. `src/components/clientes/ClienteForm.tsx`** — Tornar `codigo_cliente` read-only

- Remover qualquer campo editável de código (se existir)
- Na criação, não mostrar campo de código (será auto-gerado)
- Na edição, mostrar como badge/texto read-only

**3. `src/App.tsx`** — Adicionar rota `/importar-clientes`

**4. `src/pages/ClientesPage.tsx`** — Adicionar botão "Importar Dados Cadastrais" no header

### Regras de matching (prioridade)

```text
1. codigo_cliente da planilha == codigo_cliente do banco → MATCH
2. codigo_bling da planilha == codigo_bling do banco → MATCH
3. CNPJ normalizado (só dígitos) → MATCH
4. Nome normalizado (lowercase, sem acentos, trim) → MATCH (fallback)
```

### Regras de divergência

- Código encontrado mas nome difere significativamente (similarity < 0.4)
- Código Bling vinculado a outro cliente
- CNPJ vinculado a outro cliente
- Mesmo nome normalizado mas CNPJ diferente

### Mapeamento de campos

```text
Planilha          →  Banco
Codigo            →  codigo_cliente (match only, não sobrescreve)
Cod Bling         →  codigo_bling
Nome              →  nome_cliente
Fantasia          →  nome_fantasia
Fone              →  fone
Celular           →  celular
E-mail            →  email
CNPJ / CPF        →  cnpj
Observações       →  observacoes_cliente (merge)
E-mail envio NFe  →  email_nfse
Cliente desde     →  cliente_desde
```

### Merge de observações

```text
Se existente vazio → salva importada
Se importada vazia → mantém existente
Se ambas preenchidas →
  [texto existente]
  
  [Importação Bling — 2026-04-07]
  [texto importado]
```

### Regra do codigo_cliente (going forward)

- Coluna `codigo_cliente` continua SERIAL
- `ClienteForm` não permite edição do código
- Novos clientes recebem código auto-gerado pelo banco
- Import de novos clientes: não passa `codigo_cliente`, deixa o banco gerar

### O que NÃO muda

- Tabelas de módulos, contratos, dashboard
- Layout geral da aplicação
- Lógica de negócio existente
- Formulários de módulo

