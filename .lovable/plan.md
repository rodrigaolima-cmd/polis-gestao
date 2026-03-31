

## Problema

Ao editar um módulo do cliente, os valores (Contratado/Faturado) aparecem como "0,00" em vez dos valores reais. A causa é dupla:

1. **`existingModule` é recriado a cada render** como objeto inline no JSX do `ClienteDetailPage`, gerando uma nova referência. O `useEffect` do `ClienteModuloForm` depende dessa referência, causando re-execuções desnecessárias e instabilidade.

2. **O `CurrencyInput` inicializa com `useState(formatCurrencyInput(value))`** — se o componente monta antes do form receber os dados reais, o display trava em "0,00".

## Correções

### 1. `ClienteDetailPage.tsx` — passar `editingModule` direto

Linha ~305: em vez de criar objeto inline, passar `editingModule` diretamente como prop:
```tsx
existingModule={editingModule}
```
O `editingModule` já tem todas as propriedades necessárias (e `id` também). Isso estabiliza a referência.

### 2. `ClienteModuloForm.tsx` — estabilizar useEffect

Trocar dependência do `existingModule` por `existingModule?.id` para evitar loops de re-render:
```tsx
useEffect(() => {
  if (open) {
    // fetch modules...
    if (existingModule) {
      setForm({ ...existingModule });
    } else {
      setForm({ ...defaults });
    }
  }
}, [open, existingModule?.id]);
```

### Arquivos afetados
- 2 arquivos editados: `ClienteDetailPage.tsx` (1 linha), `ClienteModuloForm.tsx` (1 linha)

