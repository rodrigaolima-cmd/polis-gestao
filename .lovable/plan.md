## Corrigir paginação no carregamento de contratos do Dashboard

### Causa raiz confirmada via diagnóstico no banco
- A tabela `client_modules` tem 1.117+ registros
- O PostgREST aplica `max-rows = 1000` no servidor, ignorando `.range(0, 9999)` quando o limite do servidor é menor
- Como muitos registros têm `created_at` idêntico (importação em massa), a ordenação é não-determinística → registros como ASMEF (cliente #19) caem fora aleatoriamente dos 1.000 retornados
- Por isso o Dashboard mostra 104 clientes / 2 associações em vez do total real

### Correção (1 arquivo)

**`src/hooks/useContracts.ts`** — função `loadFromDatabase`:

1. Substituir a query única por um **loop de paginação** com blocos de 1.000:
```ts
const PAGE_SIZE = 1000;
let from = 0;
const allData: DbClientModule[] = [];
while (true) {
  const { data, error } = await supabase
    .from("client_modules")
    .select("*, clients(*), modules(*)")
    .order("id", { ascending: true })
    .range(from, from + PAGE_SIZE - 1);
  if (error) throw error;
  if (!data || data.length === 0) break;
  allData.push(...(data as unknown as DbClientModule[]));
  if (data.length < PAGE_SIZE) break;
  from += PAGE_SIZE;
}
```

2. Ordenar por **`id`** (chave primária estável) em vez de `created_at` para garantir paginação determinística sem pular nem duplicar registros.

3. Mapear `allData` para `ContractRow[]` exatamente como antes via `mapToContractRow`.

### O que NÃO muda
- Layout, KPIs, filtros, lógica de consolidação por cliente
- Mapeamento `mapToContractRow`
- Fluxo de import, edição, modais
- Tela de Clientes (já busca direto da tabela `clients`, não tem esse problema)

### Resultado esperado
- Dashboard passa a refletir os 1.117+ módulos completos
- ASMEF e outros clientes ativos "sumidos" voltam a aparecer
- Contagem de clientes/associações no Dashboard sobe e fica consistente
- Diferença residual entre Dashboard e tela Clientes continua sendo apenas inativos/prospects/sem módulo (correto por design)
