## Plano: Documentação Técnica Exaustiva — Pólis Hub (Gestão de Contratos)

### Objetivo
Produzir um documento técnico profissional descrevendo **o que** foi construído e **como** opera o sistema, entregue como **PDF** (impressão/distribuição) e **Markdown** (versionável), salvos em `/mnt/documents/`.

### Observação importante de fidelidade técnica
O documento refletirá **a stack real do projeto**, não suposições genéricas. Diferenças relevantes em relação ao briefing original:

| Item solicitado | Realidade do projeto | Tratamento no documento |
|---|---|---|
| Axios/Fetch para API externa | `@supabase/supabase-js` SDK + `fetch` nativo (REST PostgREST lock-free) | Documentar a Service Layer real (`src/integrations/supabase/client.ts` + helpers `restSelect`/`restUpsert` em `useContracts.ts`) |
| TanStack Query para cache | TanStack Query **está instalado** mas o estado de domínio é gerido por **hooks customizados** (`useContracts`, `useAuth`) com `useState`/`useEffect` e revalidação manual | Documentar o padrão real: hooks + invalidação via re-fetch explícito (`loadFromDatabase`), e mencionar TanStack Query disponível |
| Banco "externo" | Lovable Cloud (Supabase gerenciado) — referido ao usuário como "backend Lovable Cloud" | Tratar como banco gerenciado, omitindo o termo Supabase no texto voltado ao usuário |
| Tabelas "Contratos / Aditivos / Partes / Histórico" | Modelo real: `clients`, `modules`, `client_modules`, `ug_types`, `profiles`, `user_roles`, `audit_logs` | Mapear as tabelas **reais** com colunas, tipos, RLS e relacionamentos |
| Validação Zod | `zod` instalado e usado em validação de import (`master-data-import`) | Documentar onde Zod é aplicado |
| Paginação server-side | Paginação por `range()` em loops (1000 linhas/página) + chunking de IDs | Documentar o padrão real implementado em `loadOperationalLeaks` |

### Estrutura do documento (≈ 25–35 páginas)

1. **Capa & Sumário Executivo** — Pólis Hub, propósito (gestão de contratos da Polis Gestão), público-alvo, versão, data.
2. **Stack e Infraestrutura**
   - Frontend: React 18, Vite 5, TypeScript 5, Tailwind v3, shadcn/ui (Radix), React Router 6, Recharts, date-fns, lucide-react.
   - Backend: Lovable Cloud (PostgreSQL gerenciado + Auth + Edge Functions Deno).
   - Service Layer: SDK `@supabase/supabase-js` + fallback REST `fetch` direto (PostgREST) com `AbortController` e timeout de 15s, evitando lock interno do SDK em operações em lote.
   - Estado: hooks de domínio (`useContracts`, `useAuth`, `useAuditLog`), Context API (`AuthContext`, `ModalPersistenceContext`); TanStack Query disponível para futuras migrações.
3. **Arquitetura de Pastas** — diagrama ASCII de `src/` (components, pages, hooks, integrations, utils, types).
4. **Dicionário de Dados (O QUE)**
   - Tabela por tabela: `clients`, `modules`, `client_modules`, `ug_types`, `profiles`, `user_roles`, `audit_logs`.
   - Colunas, tipos PG, nullability, defaults.
   - Relacionamentos lógicos: 1 cliente N módulos via `client_modules` (junction com atributos: valor contratado/faturado, datas, flags).
   - Diagrama ER em ASCII.
   - Políticas RLS resumidas em tabela.
5. **Lógica de Interação e Querys (COMO)**
   - Padrões de busca: `select` com joins implícitos PostgREST (`client_modules?select=*,clients(*),modules(*)`).
   - Paginação server-side: loop `.range(offset, offset+999)`, chunking de IDs em 200, agregação cliente-side.
   - Filtros avançados: pipeline em `applyFilters` (`src/utils/contractUtils.ts`) — UG, produto, status, ano, cliente, região, consultor, busca normalizada (NFD, mojibake-fix).
   - Gatilhos de UI: ao salvar módulo → `loadFromDatabase()` re-hidrata estado global; toasts via `sonner`; logs em `audit_logs` via `useAuditLog`.
   - Validação Zod: schemas em `src/pages/ImportClientesPage.tsx` (limite 10MB / 10k linhas).
6. **Fluxo de Comunicação (Request Lifecycle)**
   - Diagrama de sequência: User → Component → Hook → Supabase Client → PostgREST → Postgres → RLS → Response → State → Re-render.
   - Tratamento de erros: `try/catch`, `toast.error`, fallback para inserts individuais quando bulk falha (Data Import Resilience), retry implícito via re-fetch.
   - Timeout: `AbortController` 15s por operação REST.
   - Auth: token JWT injetado em headers; `onAuthStateChange` ignora `SIGNED_OUT` espúrios (estabilidade de sessão).
7. **Regras de Negócio Implementadas**
   - **Valor Contratado**: soma de `valor_contratado` de todas as linhas `client_modules` do cliente.
   - **Faturamento de módulo inativo**: zerado automaticamente (`isInactive ? 0 : valor_faturado`).
   - **Não Faturado / Dinheiro na Mesa**: `totalContracted - totalBilled` agregado.
   - **Não Implantado (Vazamento Operacional)**: contrato ativo + `faturado_flag=false` + `ativo_no_cliente=false`.
   - **Status Ativo (detecção)**: case-insensitive, exclui `inativ|cancel|suspens|encerr|vencid|rescind`, inclui `ativ|vigente|em vigor|active`.
   - **Dias para Expiração**: `differenceInDays(parseISO(expirationDate), today)`; categorias `expired|critical(≤30)|warning(≤90)|ok`.
   - **Cascata de Inativação**: ao inativar cliente, módulos vinculados são marcados `ativo_no_cliente=false`.
   - **Sincronização Faturado**: toggle `faturado_flag` sincroniza valores e status.
   - **Consolidação Região/Consultor**: primeiro valor não-vazio; flag `regiaoConflict`/`consultorConflict` se divergente entre módulos.
   - **Códigos de Cliente**: `codigo_cliente` SERIAL (read-only, inicia em 122).
   - **Lookup de Importação**: prioridade Bling Code → CNPJ → Nome Normalizado.
8. **Autenticação e Autorização**
   - Provisionamento admin via Edge Function `admin-create-user`.
   - `force_password_change` flag.
   - `user_roles` separada de `profiles` (anti-escalada).
   - Função `has_role()` SECURITY DEFINER.
9. **Edge Functions** — `admin-create-user`, `admin-list-users`, `admin-update-email`, `fix-encoding`. Propósito de cada uma.
10. **Sanitização e Internacionalização** — `fixMojibake`, `normalizeForSearch` (NFD), formatação BRL pt-BR, ordenação `localeCompare('pt-BR')`.
11. **Apêndices**
    - A. Pseudocódigo: filtro de Vazamento Operacional, paginação chunked.
    - B. Lista completa de RLS policies.
    - C. Variáveis de ambiente (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`).

### Implementação técnica da geração

1. Script Python `/tmp/gen_doc.py` constrói:
   - **Markdown** completo (`/mnt/documents/Polis_Hub_Documentacao_Tecnica.md`).
   - **PDF** via `reportlab` (paginação, sumário, títulos, tabelas, blocos de código monoespaçados, capa com cor da marca `#0F1D2F`).
2. QA obrigatório: converter cada página do PDF em PNG e inspecionar (layout, overflow, fontes, tabelas).
3. Entrega de ambos os arquivos via `<lov-artifact>`.

### Arquivos a criar
- `/mnt/documents/Polis_Hub_Documentacao_Tecnica.pdf`
- `/mnt/documents/Polis_Hub_Documentacao_Tecnica.md`

### Sem alterações no código-fonte
Tarefa puramente documental — nenhum arquivo do projeto será modificado.

Aprove para que eu execute a geração.
