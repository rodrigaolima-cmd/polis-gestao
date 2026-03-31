

## Fix KPI card value truncation (round 2)

### Problem
Values like `R$ 1.635.859,31` still clip in narrow 9-column cards. The font is still too large for the available space and there's no dynamic sizing.

### Changes — `src/components/dashboard/KPICard.tsx`

1. **Dynamic font sizing based on value length** — Use inline `style` with `fontSize: clamp(...)` that scales down for longer values:
   - Values ≤ 6 chars: normal size
   - Values > 6 chars: progressively smaller via a computed `clamp()` or direct size selection

2. **Value text classes** — Change line 60 from:
   ```tsx
   <p className="text-sm sm:text-base xl:text-lg font-bold tracking-tight mono">{value}</p>
   ```
   To use `break-words` and a dynamic font size style:
   ```tsx
   <p 
     className="font-bold tracking-tight mono leading-tight break-all"
     style={{ fontSize: value.length > 14 ? '0.75rem' : value.length > 8 ? '0.85rem' : '1rem' }}
   >
     {value}
   </p>
   ```
   This ensures long currency values get a smaller font automatically.

3. **Reduce card padding** — From `p-5` to `p-4` to reclaim space.

4. **Reduce spacing between title/value** — From `space-y-1` to `gap-0.5 flex flex-col` for tighter control.

5. **Icon block stays compact** — Already `p-2` / `h-4 w-4` / `ml-2` from prior fix. No change needed.

### Result
- `R$ 1.635.859,31` renders in smaller but fully readable font
- Short values like `50` or `973` render at normal size
- No truncation, no ellipsis, controlled wrap if extreme edge case

### What does NOT change
- KPI calculations, card order, grid layout, sparklines, dark theme

### File affected
- `src/components/dashboard/KPICard.tsx` only

