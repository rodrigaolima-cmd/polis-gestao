

## Fix KPI card value truncation

### Problem
Line 60 in `KPICard.tsx` has `truncate` which clips long values like `R$ 1.640.345,00`. The 9-column grid on XL screens makes cards narrow.

### Changes — `src/components/dashboard/KPICard.tsx`

1. **Remove `truncate`** from the value `<p>` tag (line 60)
2. **Use auto-scaling font size**: replace fixed `text-base sm:text-lg xl:text-2xl` with smaller responsive sizes that fit: `text-sm sm:text-base xl:text-lg`
3. **Reduce icon margin** from `ml-3` to `ml-2` to give more space to the value
4. **Reduce icon padding** from `p-2.5` to `p-2` and icon size from `h-5 w-5` to `h-4 w-4`
5. **Allow text to wrap** as last resort with `break-all` removed — just let natural word break happen via `whitespace-nowrap` removal

Resulting value line:
```tsx
<p className="text-sm sm:text-base xl:text-lg font-bold tracking-tight mono">{value}</p>
```

### What does NOT change
- KPI calculations, card order, layout grid, sparklines, variants, colors

