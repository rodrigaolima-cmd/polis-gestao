# Corrigir valores fantasmas em "Inativos" / "Prospects"

## Problema

Ao selecionar **Status do Cliente = Inativos** ou **Prospects** no Dashboard, aparecem valores grandes (R$ 6.504.000,00 contratado, R$ 3.104.000,00 faturado, etc.) que **não existem no banco**.

## Causa

Verificação real no banco:
- **Ativos**: 123 clientes / 1.107 módulos / R$ 1.780.534,49
- **Inativos**: 1 cliente / 1 módulo / R$ 2.000 (com `ativo_no_cliente = false`)
- **Prospects**: 0 clientes / 0 módulos

Em `src/hooks/useContracts.ts → loadFromDatabase` (linhas ~219-226), quando a consulta retorna 0 linhas o hook substitui tudo pelos **dados de demonstração (`mockContracts`)**:

```ts
if (allData.length > 0) {
  setContracts(mapped);
  setDataSource("database");
} else {
  setContracts(mockContracts);   // ← bug
  setDataSource("mock");
}
```

Como Inativos (com toggle off) e Prospects retornam zero, o mock entra no lugar — daí os R$ 6.5M.

## Correção

**`src/hooks/useContracts.ts`** — única alteração:

Trocar o fallback para mock por estado vazio real, **mantendo** `dataSource = "database"`:

```ts
if (allData.length > 0) {
  setContracts(allData.map(mapToContractRow));
} else {
  setContracts([]);
}
setDataSource("database");
```

Mock continua disponível apenas via `resetToMock()` (botão "Dados demo" já existente).

## Resultado

- **Ativos**: continua igual (123 clientes / 1.107 módulos).
- **Inativos** (toggle off): KPIs zerados / tabelas vazias — sem números falsos.
- **Inativos** (toggle on): mostra o 1 cliente / 1 módulo (R$ 2.000) real.
- **Prospects**: KPIs zerados (não há nenhum no banco).
- **Todos**: 124 clientes do banco.

Sem mudanças em layout, filtros ou outros componentes.
