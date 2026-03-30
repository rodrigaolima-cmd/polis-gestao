

## Plano: 6 Correções Incrementais

### 1. Normalizar Tipo de UG (uppercase padronizado)

**SQL (insert tool):** UPDATE `clients` SET `tipo_ug` para versão UPPER com acentos corretos para cada variação conhecida (PREFEITURA, CONSÓRCIO, CÂMARA, AUTARQUIA, FUNDO, INSTITUTO, SAAE, RPPS).

**Código — `ClienteForm.tsx`:** Mudar array `UG_TYPES` para todas maiúsculas: `["PREFEITURA", "CÂMARA", "AUTARQUIA", "CONSÓRCIO", "FUNDO", "INSTITUTO", "SAAE", "RPPS"]`. Ao salvar, aplicar `.toUpperCase()` no campo `tipo_ug`.

**Código — `ClientesPage.tsx` e filtros do Dashboard:** Nenhuma mudança necessária — já usam valores dinâmicos do banco.

---

### 2. Padronizar formato monetário (pt-BR)

**`formatCurrency` em `contractUtils.ts`** já usa `Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })` — já está correto (R$ 1.000,00).

**Verificar todos os locais de exibição:** Garantir que todos usam `formatCurrency()`. Campos de input monetário em `ClienteModuloForm`, `ClienteMultiModuloForm` e `ClienteDetailPage` — adicionar formatação ao sair do campo (onBlur) e aceitar entrada flexível (vírgula ou ponto).

**Criar helper `parseCurrencyInput(value: string): number`** em `contractUtils.ts` que converte "1.000,50" → 1000.50.

---

### 3. Fix overflow nos KPI Cards

**`KPICard.tsx`:** Trocar `text-2xl` por classes responsivas e adicionar `truncate` ou `text-[clamp()]`:
- Valor: `text-lg sm:text-xl xl:text-2xl font-bold tracking-tight mono truncate`
- Isso garante que valores grandes como "R$ 1.640.345,00" nunca estourem o card.

---

### 4. Layout responsivo + menu hamburger

**Novo componente `src/components/MobileMenu.tsx`:**
- Sheet lateral (já temos Sheet do shadcn) com links: Dashboard, Clientes, Importar, Configurações, Sair
- Aparece somente em telas < md (768px)

**`Dashboard.tsx`:** No header, adicionar `<MobileMenu>` visível apenas em mobile (`md:hidden`). Esconder botões inline em mobile (`hidden md:flex`).

**`ClientesPage.tsx`:** Wrapping da tabela em `overflow-x-auto`. Filtros com `flex-wrap`. Cards KPI já usam `grid-cols-2` em mobile — ok.

**`ConfiguracoesPage.tsx`:** Adicionar MobileMenu no header.

---

### 5. Melhorias no gerenciamento de usuários

**Migration SQL:** Adicionar coluna `force_password_change boolean default false` na tabela `profiles`.

**`ConfiguracoesPage.tsx`:**
- Ao clicar num usuário na tabela, abrir dialog de edição com campos: Nome, Email (readonly), Data cadastro, Perfil (Admin/Usuário), checkbox "Solicitar troca de senha no primeiro acesso"
- Salvar atualiza `profiles.full_name`, `user_roles.role`, `profiles.force_password_change`

**`ProtectedRoute.tsx` ou `LoginPage.tsx`:**
- Após login, se `profile.force_password_change === true`, redirecionar para `/reset-password`
- Após troca bem-sucedida, setar `force_password_change = false`

---

### 6. Limpar usuários (manter apenas RODRIGO LIMA)

**Passo 1 — Backup:** Usar `psql` para exportar tabela profiles e user_roles para CSV em `/mnt/documents/`.

**Passo 2 — Identificar ID do RODRIGO LIMA:** Query por email `rodrigo.lima@polisgestao.com.br` nas tabelas auth e profiles.

**Passo 3 — Edge function `admin-cleanup-users`:** Criar edge function que:
- Lista todos os users via admin API
- Deleta cada um exceto o ID do Rodrigo
- Isso cascade-deleta profiles e user_roles

**Passo 4 — Executar** a function uma vez e depois removê-la.

---

### Arquivos afetados
- **SQL (insert tool):** UPDATE clients para normalizar tipo_ug
- **Migration:** ADD COLUMN `force_password_change` em profiles
- **Editados:** `ClienteForm.tsx`, `KPICard.tsx`, `Dashboard.tsx`, `ClientesPage.tsx`, `ConfiguracoesPage.tsx`, `ClienteModuloForm.tsx`, `ClienteMultiModuloForm.tsx`, `contractUtils.ts`, `LoginPage.tsx` ou `ProtectedRoute.tsx`
- **Novos:** `MobileMenu.tsx`, edge function temporária para cleanup
- **Sem alterações:** lógica do dashboard, relatórios, estrutura de rotas

