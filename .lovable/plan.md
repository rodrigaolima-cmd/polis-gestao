

## Diagnóstico da causa raiz

O problema é uma **race condition entre auto-focus e fetch assíncrono**:

1. Component monta com `form = defaultForm` (valores zerados)
2. `CurrencyInput` inicializa `display = formatCurrencyInput(0)` → "0,00"
3. Auto-focus dispara em 150ms → `focused = true` no CurrencyInput
4. Fetch do banco retorna (200-500ms) → `setForm(dataToForm(data))` → prop `value` muda para 35000
5. **MAS** o `useEffect` do CurrencyInput que atualiza `display` tem a condição `if (!focused)` — como `focused = true`, o display **não atualiza**

Resultado: campos monetários ficam com "0,00" enquanto datas e outros campos (que não têm essa guarda de `focused`) atualizam normalmente.

## Correção (2 arquivos, mudanças mínimas)

### 1. `ClienteDetailPage.tsx` — Passar dados da row como estado inicial

Passar `initialData={editingRow}` para o form. Isso elimina a dependência do fetch para a renderização inicial.

```tsx
<ClienteModuloForm
  key={editingModuleId || 'new'}
  open={moduleFormOpen}
  onOpenChange={handleModuleFormOpenChange}
  clientId={id}
  existingModuleId={editingModuleId}
  initialData={editingRow}
  onSaved={reloadModules}
/>
```

### 2. `ClienteModuloForm.tsx` — Usar initialData como estado inicial do form

- Aceitar prop `initialData?: { valor_contratado: number; valor_faturado: number; ... } | null`
- Inicializar `form` com `initialData ? dataToForm(initialData) : defaultForm` em vez de sempre `defaultForm`
- O fetch do banco continua rodando em background para confirmar/atualizar, mas o form já começa preenchido
- Mover o auto-focus para **depois** do fetch retornar (ou remover o delay e confiar no estado inicial correto)

### Fluxo corrigido

1. User clica editar → `editingModuleId = mod.id`
2. `editingRow` encontra o módulo na lista local (dados já corretos)
3. Form monta com `initialData` → campos já preenchidos com valores reais
4. Auto-focus no Valor Contratado → `display` já mostra "35.000,00" → select all funciona
5. Fetch do banco confirma em background (atualiza se houve mudança externa)

### Arquivos afetados
- `src/pages/ClienteDetailPage.tsx` — adicionar prop `initialData`
- `src/components/clientes/ClienteModuloForm.tsx` — aceitar `initialData`, usar como estado inicial

