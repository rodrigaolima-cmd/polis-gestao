

## Plano: Correção de encoding e busca sem acentos

### 1. Criar utilitário de normalização de texto — `src/utils/textUtils.ts`

Funções:
- `fixMojibake(text: string): string` — corrige sequências UTF-8 quebradas (ex: `Ã£` → `ã`, `Ã©` → `é`). Usa mapa de substituições conhecidas de double-encoding latin1→UTF-8.
- `normalizeForSearch(text: string): string` — remove acentos via `normalize("NFD").replace(/[\u0300-\u036f]/g, "")`, lowercase, trim.
- `normalizeText(text: string): string` — aplica `fixMojibake` + trim.

### 2. Corrigir dados existentes no banco — edge function `fix-encoding`

Edge function `supabase/functions/fix-encoding/index.ts`:
- Busca todos os registros de `clients` e `modules`
- Aplica `fixMojibake` nos campos: `nome_cliente`, `regiao`, `consultor`, `tipo_ug`, `observacoes_cliente` (clients) e `nome_modulo` (modules)
- Também aplica em `client_modules.observacoes`
- Só faz UPDATE quando o valor mudou (segurança)
- Retorna contagem de registros corrigidos
- Pode ser chamada manualmente (botão na tela de Configurações ou via fetch direto)

### 3. Normalizar imports futuros — `src/hooks/useContracts.ts`

No `importToDatabase`, antes de salvar clientes e módulos, aplicar `normalizeText()` nos campos de texto (nome_cliente, regiao, consultor, tipo_ug, observacoes, nome_modulo).

### 4. Busca accent-insensitive — múltiplos arquivos

**`src/pages/ClientesPage.tsx`** — linha 111:
Trocar `c.nome_cliente.toLowerCase().includes(search.toLowerCase())` por comparação usando `normalizeForSearch`:
```
normalizeForSearch(c.nome_cliente).includes(normalizeForSearch(search))
```

**`src/utils/contractUtils.ts`** — `applyFilters` linhas 79-82:
Trocar busca por search para usar `normalizeForSearch` em `clientName` e `product`.

**`src/utils/contractUtils.ts`** — `getUniqueValues` linha 115:
Ordenar com `localeCompare('pt-BR')` (já feito em alguns lugares, garantir consistência).

**`src/components/dashboard/FiltersBar.tsx`** — sem mudanças estruturais, os filtros de dropdown usam valores exatos que já funcionam.

### 5. Normalizar formulário de cliente — `src/components/clientes/ClienteForm.tsx`

<lov-plan>

## Plano: Correção de encoding e busca sem acentos

### 1. Criar utilitário de normalização — `src/utils/textUtils.ts` (novo)

- `fixMojibake(text)` — mapa de substituições de double-encoding latin1→UTF-8 (Ã£→ã, Ã©→é, Ã§→ç, etc.)
- `normalizeForSearch(text)` — `normalize("NFD").replace(/[\u0300-\u036f]/g, "")` + lowercase + trim
- `normalizeText(text)` — `fixMojibake` + trim

### 2. Corrigir dados existentes — edge function `fix-encoding` (novo)

`supabase/functions/fix-encoding/index.ts`:
- Busca todos os `clients`, aplica fixMojibake em `nome_cliente`, `regiao`, `consultor`, `tipo_ug`, `observacoes_cliente`
- Busca todos os `modules`, aplica em `nome_modulo`
- Busca todos os `client_modules`, aplica em `observacoes`
- Só faz UPDATE quando valor mudou
- Retorna contagem de correções
- Chamável via botão na tela de Configurações

### 3. Normalizar imports futuros — `src/hooks/useContracts.ts`

No `importToDatabase`, aplicar `normalizeText()` nos campos de texto antes de salvar (nome_cliente, regiao, consultor, tipo_ug, observacoes, nome_modulo).

### 4. Busca accent-insensitive

**`src/pages/ClientesPage.tsx`** — filtro de busca (linha 111):
Usar `normalizeForSearch(c.nome_cliente).includes(normalizeForSearch(search))`

**`src/utils/contractUtils.ts`** — `applyFilters` (linhas 79-82):
Usar `normalizeForSearch` para comparar search com clientName e product.

### 5. Normalizar entrada no formulário — `src/components/clientes/ClienteForm.tsx`

Aplicar trim nos campos ao salvar (já parcialmente feito, garantir consistência).

### 6. Botão para executar correção — `src/pages/ConfiguracoesPage.tsx`

Adicionar seção "Qualidade de Dados" com botão "Corrigir encoding dos dados" que chama a edge function.

### Arquivos afetados
- 1 novo utilitário: `src/utils/textUtils.ts`
- 1 nova edge function: `supabase/functions/fix-encoding/index.ts`
- 4 arquivos editados: `ClientesPage.tsx`, `contractUtils.ts`, `useContracts.ts`, `ConfiguracoesPage.tsx`
- Sem alterações no banco, dashboard ou layout

