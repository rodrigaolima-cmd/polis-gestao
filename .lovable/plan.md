

## Etapa 1 — AppSidebar + AppLayout + Migrar todas as páginas

Esta é a primeira etapa da padronização visual. Cria o sistema de layout com sidebar persistente e migra todas as páginas protegidas para usá-lo.

### Arquivos novos
1. **`src/components/layout/AppSidebar.tsx`** — Sidebar de navegação lateral
2. **`src/components/layout/AppLayout.tsx`** — Layout wrapper (sidebar + header + content)

### Arquivos alterados
3. **`src/App.tsx`** — Envolver rotas protegidas com `AppLayout`
4. **`src/components/dashboard/Dashboard.tsx`** — Remover header inline, usar props do layout
5. **`src/pages/ClientesPage.tsx`** — Remover header inline
6. **`src/pages/ClienteDetailPage.tsx`** — Remover header inline
7. **`src/pages/ConfiguracoesPage.tsx`** — Remover header inline
8. **`src/index.css`** — Adicionar variáveis de sidebar escuro (dark sidebar sempre, como Polis Hub)

### Detalhes

#### AppSidebar
- Fundo escuro fixo (`bg-[#0F1D2F]`) independente do tema — igual ao Polis Hub
- Logo "Polis Gestão" no topo
- Seções de navegação:
  - **PRINCIPAL**: Dashboard (LayoutDashboard)
  - **SISTEMA**: Clientes (Users), Configurações (Settings, só admin)
- Item ativo com destaque azul (bg-primary)
- Footer: botão "Sair" + nome do usuário
- Usa componentes `Sidebar*` do shadcn já existentes
- `collapsible="icon"` para mini-mode

#### AppLayout
```text
+--sidebar--+---------------------------+
|  logo      |  breadcrumb / título      |
|  nav       |  + ações da página        |
|  items     |  + theme toggle           |
|            |---------------------------|
|  footer    |  {children}               |
+------------+---------------------------+
```
- Recebe `title`, `subtitle`, `children`, `headerActions`
- Header fino com título à esquerda, ações à direita
- Theme toggle (Modo Claro/Escuro) no header
- Nome do usuário + role badge no header
- Em mobile: sidebar hidden, MobileMenu permanece via Sheet

#### Migração das páginas
Cada página perde seu `<header>` inline e `<div className="min-h-screen">` wrapper. O conteúdo fica dentro do `<main>` do AppLayout.

- **Dashboard.tsx**: Remove linhas 126-173 (header), passa `title="Dashboard"` e `headerActions` (botão Importar, Dados Demo) como props
- **ClientesPage.tsx**: Remove header (linhas 136-159), passa `title="Clientes"` e botões Relatório/Novo Cliente como `headerActions`
- **ClienteDetailPage.tsx**: Remove header (linhas 184-201), passa título dinâmico do cliente e botão Editar como `headerActions`
- **ConfiguracoesPage.tsx**: Remove header (linhas 225-235), passa `title="Configurações"`

#### App.tsx
- Envolver as rotas protegidas com `SidebarProvider` + `AppLayout`
- LoginPage e ResetPasswordPage ficam fora (sem sidebar)

#### CSS
- Adicionar variável `--sidebar-bg: #0F1D2F` para sidebar sempre escuro
- Sidebar text/icons em tons claros independente do tema

### O que NÃO muda
- Lógica funcional, cálculos, validações
- Comportamento de negócio
- Database, RLS, edge functions
- KPI cards (serão refinados na Etapa 2)
- Login page (será redesenhado na Etapa 2)
- Cores gerais do tema (já implementadas)

