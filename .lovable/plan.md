# Diagnóstico das divergências

Confirmei os números diretamente no banco:

| Métrica | Valor real (DB) |
|---|---|
| Clientes total | **124** (123 Ativo + 1 Inativo) |
| Módulos total | **1.108** |
| Módulos ativos no cliente (`ativo_no_cliente=true`) | **831** |
| Módulos inativos no cliente (`ativo_no_cliente=false`) | **277** |

## O que cada tela mostra

### Dashboard — 119 clientes / 831 módulos
- **831 módulos** = está correto (todos os módulos ativos de clientes Ativos). O `useContracts.loadFromDatabase` já pagina em chunks de 1.000.
- **119 clientes** = clientes com `status_cliente='Ativo'` **E** ao menos 1 módulo ativo. São 123 Ativos no DB, mas 4 não têm nenhum módulo ativo, então o Dashboard só conta 119. Comportamento intencional (regra "Dashboard Client Visibility Rule").

### Menu Clientes — 124 clientes / 759 módulos
- **124 clientes** = correto (lista todos, inclusive Inativo).
- **759 módulos** = **BUG**. A query em `src/pages/ClientesPage.tsx` (linhas 64-66) busca `client_modules` sem paginação:

  ```ts
  const { data: modulesData } = await supabase
    .from("client_modules")
    .select("client_id, ativo_no_cliente");
  ```

  O Supabase REST tem teto **default de 1.000 linhas por chamada**. Como temos 1.108 registros, ele retorna só os primeiros 1.000 — desses, exatamente 759 têm `ativo_no_cliente=true`. Os 108 restantes ficam de fora da contagem.

# Plano de correção

## 1. Paginar a query de `client_modules` em `ClientesPage.tsx`
Aplicar o mesmo padrão de paginação já usado em `useContracts.ts` (loop `range(from, from+999)` até esvaziar). Após o fix, o rodapé passará a mostrar **831 módulo(s)** — alinhado com o Dashboard e com o banco.

```text
Antes:  124 cliente(s) encontrado(s) • 759 módulo(s)
Depois: 124 cliente(s) encontrado(s) • 831 módulo(s)
```

## 2. (Opcional, recomendado) Clarear o subtítulo do Dashboard
Hoje o Dashboard exibe "Dados do banco (831 contratos)" e o card "Relatório Geral" mostra "119 Clientes". Para evitar nova confusão entre "clientes Ativos com módulo" (119) vs "clientes cadastrados" (124), posso:
- Trocar o subtítulo para `Dados do banco — 831 módulos ativos de 119 clientes operacionais`
- Manter o link "Relatório Geral" como está (já segue a regra de visibilidade do Dashboard)

## 3. Sem alteração nas regras de negócio
- A regra "Dashboard só mostra clientes Ativos com ≥1 módulo ativo" permanece (memória do projeto).
- Nenhum dado é alterado — apenas a forma de **contar/exibir** no menu Clientes.

# Arquivos afetados

- `src/pages/ClientesPage.tsx` — paginar query de `client_modules` (item 1, obrigatório).
- `src/components/dashboard/Dashboard.tsx` — ajuste textual no subtítulo (item 2, se aprovado).

# Pergunta antes de implementar

Confirma que devo:
- (a) Apenas corrigir a contagem do menu Clientes (item 1)?
- (b) Item 1 **+** ajustar o subtítulo do Dashboard (item 2)?
