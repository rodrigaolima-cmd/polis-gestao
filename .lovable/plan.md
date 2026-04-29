## Problema confirmado

Logs em runtime mostram `totalModules: 1000` — exatamente o teto padrão do Supabase REST (`max-rows`). No banco existem **1.081** `client_modules` para clientes ativos. Os módulos cortados incluem justamente os do cliente 95 (Prefeitura Municipal de Caparaó) e do 122 (ARDOCE), explicando por que aparecem somente 2 clientes em "Não implantado" em vez dos 3 reais.

O `.range(0, 19999)` não eleva o teto — apenas desloca a janela. Com `from = 0`, a query continua devolvendo apenas as primeiras 1000 linhas.

## Causa

Em `src/hooks/useContracts.ts > loadOperationalLeaks()`:

```ts
const { data: cms } = await supabase
  .from("client_modules")
  .select("...")
  .in("client_id", ids)
  .range(0, 19999); // ← não funciona; Supabase corta em 1000
```

Esse mesmo problema já foi tratado em `loadFromDatabase` com paginação por `PAGE_SIZE = 1000`. Falta replicar aqui.

## Correção

Em `src/hooks/useContracts.ts`, dentro de `loadOperationalLeaks()`:

1. **Paginar a query de `client_modules`** com loop idêntico ao usado em `loadFromDatabase`:
   - `PAGE_SIZE = 1000`, `MAX_PAGES = 50` (50k registros, margem segura).
   - Ordenar por `id` ascendente para paginação estável.
   - Acumular em `allCms: typeof cms` e parar quando o lote retornado for menor que `PAGE_SIZE`.

2. **Paginar também a query de `clients`** (`status_cliente = 'Ativo'`) pelo mesmo motivo — hoje são ~120 clientes ativos, mas crescerá. Mesmo padrão de paginação.

3. **Paginar a query interna `.in("client_id", ids)`**: como `ids` pode passar de centenas, e o Postgres tem limite de tamanho de URL, dividir `ids` em chunks de 200 e fazer múltiplas chamadas, concatenando o resultado.

4. **Manter** todos os filtros já implementados (status_contrato, faturado_flag, ativo_no_cliente) e o log de diagnóstico `[OperationalLeaks]`.

## Resultado esperado

Após o deploy, o log mostrará `totalModules: 1081` (e crescerá com o tempo) e o card "Não implantado" exibirá **3 clientes**, incluindo Prefeitura Municipal de Caparaó com R$ 2.250 em risco.

## Arquivos a editar

- `src/hooks/useContracts.ts` — apenas a função `loadOperationalLeaks()` (sem mudanças de layout, UI ou outras categorias).

## O que NÃO muda

- Layout do card `OperationalLeakAlert`.
- Lógica de filtros do hero (`Dashboard.tsx`).
- Outras consultas e o fluxo de import.
