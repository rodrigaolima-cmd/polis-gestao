

## Fix: Tela de detalhe do cliente não rola para baixo

### Problema
O container principal (`flex-1 flex flex-col min-w-0`) no `AppLayout.tsx` não tem overflow, então quando o conteúdo excede a altura da tela, não aparece barra de rolagem.

### Solução

**Arquivo**: `src/components/layout/AppLayout.tsx` — linha 28

Trocar:
```
<div className="flex-1 flex flex-col min-w-0">
```
Por:
```
<div className="flex-1 flex flex-col min-w-0 overflow-auto">
```

Isso permite que a coluna de conteúdo role independentemente quando o conteúdo (cards de dados + tabela de módulos) excede a viewport.

### O que NÃO muda
- Nenhuma lógica, dados ou componentes
- Apenas uma classe CSS adicionada

