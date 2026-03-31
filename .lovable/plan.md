

## Fix KPI value digit splitting

### Problem
`break-all` in the value `<p>` causes numbers to split mid-digit (e.g. `R$ 1.63` / `4.659,17`).

### Changes — `src/components/dashboard/KPICard.tsx`

Line 63-66: Replace `break-all` with proper word-break control:

```tsx
<p 
  className="font-bold tracking-tight mono leading-tight"
  style={{ 
    fontSize: value.length > 14 ? '0.75rem' : value.length > 8 ? '0.85rem' : '1rem',
    wordBreak: 'keep-all',
    overflowWrap: 'normal',
    whiteSpace: 'normal',
  }}
>
  {value}
</p>
```

This removes `break-all` and uses `word-break: keep-all` so numeric groups stay together. If a value must wrap, it will only break at natural points (e.g. after `R$`), producing `R$` / `1.634.659,17` instead of splitting digits.

### File affected
- `src/components/dashboard/KPICard.tsx` — ~3 lines changed (line 63-66)

### What does NOT change
- Calculations, card order, grid, sparklines, icons, colors

