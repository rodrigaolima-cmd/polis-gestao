## Objetivo

Criar uma terceira categoria de "Dinheiro na Mesa" — chamada **"Não implantado"** — que detecta módulos:

- Pertencentes a cliente com **status_cliente = Ativo**
- Com **status_contrato = Ativo** (`isActiveStatus`)
- **Não faturados** (`faturado_flag = false`)
- **Inativos no cliente** (`ativo_no_cliente = false`)

Essa combinação revela contratos vendidos mas que ainda **não foram implantados** — dinheiro real parado, distinto das duas categorias atuais (sem faturamento de módulo ATIVO, e cliente sem nenhum módulo ativo).

## Diferença vs. categorias existentes

| Categoria | Cliente | Contrato | Faturado | Ativo no cliente | Significado |
|---|---|---|---|---|---|
| Sem faturamento ativo (existente) | Ativo | — | Não | **Sim** | Implantado mas não cobrado |
| Sem operação ativa (existente) | Ativo | — | — | nenhum módulo ativo | Cliente ocioso |
| **Não implantado (novo)** | Ativo | **Ativo** | **Não** | **Não** | **Vendido, não implantado — dinheiro na mesa** |

## Arquivos a editar (4)

### 1. `src/hooks/useContracts.ts`

- Estender `OperationalLeaks` adicionando `naoImplantado: OperationalLeakClient[]`.
- Em `loadOperationalLeaks()`:
  - Incluir `status_contrato` na query de `client_modules`.
  - Após o loop atual, identificar para cada cliente Ativo os módulos com: `ativo_no_cliente === false` **E** `faturado_flag === false` **E** `status_contrato` é "ativo" (usar lista case-insensitive: `["ativo", "vigente", "em vigor"]`, alinhado com `isActiveStatus` em `contractUtils`).
  - Agregar nomes dos módulos, `valorEmRisco` (soma de `valor_contratado`) e `ultimaAtualizacao`.
  - Ordenar alfabeticamente pt-BR como nas demais.
- Inicializar estado com `naoImplantado: []`.

### 2. `src/components/dashboard/OperationalLeakAlert.tsx`

- Trocar grid de 2 para 3 colunas (`md:grid-cols-3`), mantendo divisores.
- Adicionar terceiro `LeakBlock`:
  - `variant="danger"`, `icon={PackageX}` (importar de lucide).
  - Título: **"Não implantado"**
  - Subtítulo: "Contrato ativo, vendido mas não implantado"
  - `count` = `leaks.naoImplantado.length`
  - `extra` = soma `valorEmRisco` formatada (em risco)
  - `responsavel="Operações / CS"`
- `if (semFatCount === 0 && semOpCount === 0 && naoImpCount === 0) return null;`
- Topo do card: somar `valorRisco` das duas categorias com valor (semFaturamento + naoImplantado) — opcional, manter cálculo separado por bloco para não inflar o header.

### 3. `src/components/dashboard/Dashboard.tsx`

- `filteredOperationalLeaks` (useMemo): aplicar mesmo `matches` à nova lista `naoImplantado`. Quando `!isLeakFiltered`, devolve `operationalLeaks` direto (já contém `naoImplantado`).

### 4. `src/components/dashboard/SectionReportDialog.tsx`

- `OperationalLeakReport`:
  - Adicionar terceira seção **"Não implantado — vendido mas não entregue"** com tabela idêntica em estrutura à de "Sem faturamento ativo" (Cliente, UG, Consultor, Módulos não implantados, Valor em risco, Última atualização).
  - Linha de total ao final (count + soma `valorEmRisco`).
  - Atualizar fallbacks (`leaks ?? { semFaturamento: [], semOperacao: [], naoImplantado: [] }`).

## O que NÃO muda

- Critérios das duas categorias atuais.
- Toggle "Incluir clientes sem operação ativa" (a nova categoria já depende de `ativo_no_cliente=false`, então é independente do toggle — sempre carregada).
- KPIs principais, layout do dashboard, sidebar.
- Estrutura interna de `SectionReportDialog`.

## Resultado esperado

- Card "Vazamento Operacional" passa a ter **3 blocos** lado a lado.
- "Não implantado" mostra contagem + valor em risco — visível imediatamente quanto dinheiro está parado por falta de implantação.
- Filtros do hero (consultor, região, UG, cliente, busca) afetam também a nova categoria.
- Relatório expandido com nova seção dedicada, ordenada alfabeticamente.
