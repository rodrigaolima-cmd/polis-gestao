

## Etapa 2 — KPI Cards redesign + Login split-screen

### Arquivos afetados
1. **`src/components/dashboard/KPICard.tsx`** — Redesign visual no padrão Polis Hub
2. **`src/pages/LoginPage.tsx`** — Layout split-screen

### 1. KPICard.tsx — Novo design Polis Hub

Substituir `glass-card` por card com borda colorida à esquerda (4px):

- Fundo `bg-card` (branco no light, card no dark) com `rounded-xl shadow-sm border`
- Borda esquerda colorida por variant: `border-l-4 border-l-{variant-color}`
- Remover `glass-card`, `backdrop-blur`, gradients inline
- Label: `text-xs uppercase tracking-wider text-muted-foreground`
- Valor: manter lógica de fontSize dinâmico existente (funciona bem)
- Ícone: fundo sutil circular à direita
- Sparklines: mantidas sem alteração
- Props `size` e `variant`: mantidos

Estilo resultante:
```text
┌─────────────────────────────┐
│▌ TOTAL CONTRATADO      [📊] │
│▌ R$ 1.635.859,31            │
│▌ ~~sparkline~~              │
└─────────────────────────────┘
  4px borda azul à esquerda
```

### 2. LoginPage.tsx — Split-screen Polis Hub

Layout dividido em duas metades:

- **Esquerda** (hidden em mobile): fundo escuro `bg-[#0F1D2F]` com texto institucional "Polis Gestão" + "Plataforma Integrada de Gestão Operacional" + descrição do sistema
- **Direita**: fundo claro/card com formulário de login existente (toda lógica preservada)
- Mobile: só mostra o lado direito com o form
- Manter toda lógica de auth (handleLogin, handleForgotPassword, hydrateFromSession, redirect)

```text
Desktop:
+---------------------------+---------------------------+
|  bg-[#0F1D2F]             |  bg-background            |
|                           |                           |
|  Polis Gestão             |  [logo text]              |
|  Plataforma Integrada     |                           |
|  de Gestão Operacional    |  E-MAIL CORPORATIVO       |
|                           |  [____________]           |
|  Sistema de gestão de     |  SENHA                    |
|  contratos e módulos      |  [____________]           |
|                           |  [    Entrar    ]         |
|                           |  Esqueci minha senha      |
+---------------------------+---------------------------+

Mobile:
+---------------------------+
|  Polis Gestão             |
|  E-MAIL CORPORATIVO       |
|  [____________]           |
|  SENHA                    |
|  [____________]           |
|  [    Entrar    ]         |
+---------------------------+
```

### O que NÃO muda
- Cálculos de KPI, sparklines, dados
- Lógica de autenticação (login, forgot password, redirect)
- Dashboard grid layout (2 rows de KPIs)
- Rotas, RLS, edge functions

