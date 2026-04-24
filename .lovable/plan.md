## Filtrar Dashboard apenas por clientes ativos com módulos ativos

### Causa raiz
O Dashboard hoje carrega **todos** os `client_modules`, incluindo módulos vinculados a clientes com status `Inativo` ou `Prospect`. Por isso aparecem 125 clientes em vez dos 122 ativos esperados.

### Correção (1 arquivo)

**`src/hooks/useContracts.ts`** — função `loadFromDatabase`:

Adicionar dois filtros na query paginada e usar `inner join` no relacionamento de clientes:

```ts
const { data, error } = await supabase
  .from("client_modules")
  .select("*, clients!inner(*), modules(*)")
  .eq("ativo_no_cliente", true)
  .eq("clients.status_cliente", "Ativo")
  .order("id", { ascending: true })
  .range(from, from + PAGE_SIZE - 1);
```

- `.eq("ativo_no_cliente", true)` → apenas módulos ativos no cliente
- `.eq("clients.status_cliente", "Ativo")` → apenas clientes com status Ativo
- `clients!inner(*)` → garante que o filtro no relacionamento exclua de fato as linhas

### O que NÃO muda
- Layout, KPIs, gráficos e filtros visuais do Dashboard
- Mapeamento `mapToContractRow` e lógica de consolidação por cliente
- Tela de Clientes (continua mostrando os 130: 122 ativos + 7 inativos + 1 prospect)
- Lógica de import, edição, modais e paginação por `id`

### Resultado esperado
- Dashboard passa a contar **122 clientes ativos**, alinhado com a tela Clientes
- Módulos inativos e clientes Inativo/Prospect deixam de poluir KPIs financeiros
- Diferença Dashboard × Clientes passa a ser explicável: Dashboard = "operação ativa", Clientes = "cadastro completo"

### Memória
Reforça `mem://logic/dashboard-client-visibility-rule` — agora estendida para exigir módulo **ativo** + cliente com status **Ativo**. Atualizar a memória após aplicar.