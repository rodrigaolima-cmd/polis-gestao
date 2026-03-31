

## Atualização de lógica de negócio — Módulos do Cliente

### Mudanças planejadas

#### 1. Toggle "Faturado?" — auto-preencher (`ClienteModuloForm.tsx`)
- Quando `faturado_flag` muda para `true`: copiar `valor_contratado` para `valor_faturado`, setar `status_contrato = "Ativo"`
- Campo `valor_faturado` continua editável após a cópia
- Quando muda para `false`: não alterar valores (apenas desmarca o flag)

#### 2. Toggle "Ativo no cliente" OFF (`ClienteModuloForm.tsx`)
- Quando `ativo_no_cliente` muda para `false`: setar `valor_faturado = 0`, `faturado_flag = false`, `status_contrato = "Inativo"`
- Quando muda para `true`: setar `status_contrato = "Ativo"` (valores ficam como estão)

#### 3. Opções de Status do Contrato (`ClienteModuloForm.tsx` + `ClienteMultiModuloForm.tsx`)
- Atualizar lista: Ativo, Inativo, Vencido, A vencer, Suspenso, Cancelado
- O campo continua editável manualmente para override

#### 4. Inativação em cascata do cliente (`ClienteForm.tsx` + `ClienteDetailPage.tsx`)
- No `ClienteForm`, ao salvar com `status_cliente = "Inativo"` (quando antes era diferente de Inativo): mostrar `confirm()` perguntando se deseja inativar todos os módulos
- Se confirmado: após salvar o cliente, executar update em `client_modules` setando `ativo_no_cliente = false`, `faturado_flag = false`, `valor_faturado = 0`, `status_contrato = "Inativo"` para todos os módulos do cliente
- Se não confirmado: salva só o status do cliente, módulos ficam como estão

#### 5. Unificar botão de adicionar módulos (`ClienteDetailPage.tsx`)
- Remover botão "+ Adicionar Módulo" (o que abre form individual)
- Renomear "Adicionar Vários" para "Adicionar Módulos"
- Manter apenas 1 botão principal que abre o `ClienteMultiModuloForm`

#### 6. Busca no modal de adicionar módulos (`ClienteMultiModuloForm.tsx`)
- Adicionar `Input` de busca acima da grid de módulos
- Filtrar `allModules` por texto parcial (case-insensitive, normalize para acentos) no `nome_modulo`
- Atualização em tempo real conforme digita

#### 7. Toggle "Ativo no cliente" na tabela — cascata (`ClienteDetailPage.tsx`)
- Ajustar `toggleActive` para, ao inativar (ativo → inativo), também setar `faturado_flag = false`, `valor_faturado = 0`, `status_contrato = "Inativo"` no update do banco

### Arquivos afetados
- `src/components/clientes/ClienteModuloForm.tsx` — toggles inteligentes, status options
- `src/components/clientes/ClienteMultiModuloForm.tsx` — busca, status options
- `src/pages/ClienteDetailPage.tsx` — unificar botão, toggleActive cascata
- `src/components/clientes/ClienteForm.tsx` — cascata ao inativar cliente

### O que NÃO muda
- Dashboard, relatórios, importações
- Schema do banco (usa campos existentes)
- Cálculos financeiros existentes
- Layout visual

