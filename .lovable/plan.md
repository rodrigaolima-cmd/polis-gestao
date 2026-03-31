

## Dashboard KPI Layout + Light/Dark Mode Toggle

### Arquivos afetados
- `src/components/dashboard/Dashboard.tsx` — split KPI grid into 2 rows, add theme toggle button
- `src/components/dashboard/KPICard.tsx` — add `size` prop ("lg" | "sm") for financial vs operational cards
- `src/index.css` — add `.light` class with light mode CSS variables
- `src/hooks/useTheme.ts` — **novo** — theme state hook with localStorage persistence
- `src/main.tsx` — apply saved theme class on mount

### 1. Theme system (`src/hooks/useTheme.ts`)

New hook:
- Reads `localStorage.getItem('theme')` on mount
- Defaults to `'dark'` if not set
- Toggles between `'dark'` and `'light'`
- Applies/removes `.light` class on `document.documentElement`
- Persists to localStorage

### 2. Light mode CSS variables (`src/index.css`)

Add a `.light` selector with light theme variables:

```css
.light {
  --background: 220 20% 97%;      /* #F5F7FA */
  --foreground: 220 20% 15%;      /* #1F2937 */
  --card: 0 0% 100%;              /* #FFFFFF */
  --card-foreground: 220 20% 15%;
  --border: 220 13% 90%;          /* #E5E7EB */
  --muted: 220 14% 94%;
  --muted-foreground: 215 15% 45%;
  /* ... all other variables mapped to light equivalents */
}
```

This uses the same CSS variable names so all components adapt automatically.

### 3. KPICard size prop

Add optional `size?: "lg" | "sm"` prop (default `"sm"`):

- **`lg` (financial)**: `min-h-[150px] p-5`, value font `clamp(1.25rem, 2.2vw, 2rem)`, `font-semibold`, icon `h-5 w-5 p-2.5`, premium gradient background + stronger shadow
- **`sm` (operational)**: current styling (p-4, current font sizing)

Keep `wordBreak: 'keep-all'` and `overflowWrap: 'normal'` for both sizes.

### 4. Dashboard KPI grid split

Replace the single 9-column grid with two grids:

**Row 1 — Financial (4 cards, `size="lg"`):**
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
  <KPICard size="lg" title="Total Contratado" ... />
  <KPICard size="lg" title="Total Faturado" ... />
  <KPICard size="lg" title="Não Faturado" ... />
  <KPICard size="lg" title="Ticket Médio" ... />
</div>
```

**Row 2 — Operational (5 cards, `size="sm"`):**
```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
  <KPICard title="Vencidos" ... />
  <KPICard title="Vencer 90 dias" ... />
  <KPICard title="Vencer 30 dias" ... />
  <KPICard title="Total Módulos" ... />
  <KPICard title="Relatório Geral" ... />
</div>
```

### 5. Theme toggle in header

Add a button in the header actions (next to Clientes/Importar/Configurações):

```tsx
<Button variant="outline" size="sm" className="gap-2 text-xs" onClick={toggleTheme}>
  {theme === 'dark' ? <Sun /> : <Moon />}
  {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
</Button>
```

### O que NÃO muda
- Cálculos, dados, filtros, gráficos, métricas, lógica de negócio
- Database, autenticação, outras páginas

