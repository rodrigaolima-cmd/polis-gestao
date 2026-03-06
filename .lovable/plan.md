

## Diagnóstico

O erro é claro no console:

```
Failed to resolve import "xlsx" from "src/components/dashboard/ImportDialog.tsx". Does the file exist?
```

O pacote `xlsx` está no `package.json`, mas o Vite não consegue resolvê-lo. Isso pode ocorrer após reversões quando as dependências não são reinstaladas corretamente. A solução é adicionar `dedupe` no `vite.config.ts` e garantir que o módulo seja resolvido, além de forçar a reinstalação.

## Plano

### 1. `vite.config.ts` — Adicionar dedupe para resolver conflitos de módulos

Adicionar `dedupe` na configuração `resolve` para forçar resolução única de pacotes problemáticos:

```typescript
resolve: {
  alias: {
    "@": path.resolve(__dirname, "./src"),
  },
  dedupe: ["react", "react-dom", "react/jsx-runtime", "xlsx"],
},
```

### 2. Forçar reinstalação do pacote `xlsx`

Reimportar o pacote `xlsx` no `package.json` (remover e re-adicionar) para garantir que está corretamente instalado no `node_modules`. Na prática, basta salvar o `vite.config.ts` editado — o Lovable reinstala dependências automaticamente ao detectar mudanças.

Se persistir, uma alternativa seria trocar o import para um import dinâmico ou verificar se o pacote precisa ser re-adicionado explicitamente.

