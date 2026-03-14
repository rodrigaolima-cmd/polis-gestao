

# Plano Completo — 4 Prompts de Uma Vez

Sim, entendi perfeitamente o intuito: um **sistema de gestão de contratos para a Polis Gestao**, que atende orgaos publicos (Prefeituras, Camaras, Autarquias, Consorcios) com modulos de software (Saude, Educacao, Gestao, Legislativo, Transparencia). Hoje o dashboard funciona com dados mock/importados em memoria. Os 4 prompts transformam isso em um sistema com **dados persistentes no banco**.

Sim, consigo gerar os 4 de uma vez. Aqui esta o plano consolidado:

---

## Prompt 1 — Estrutura de Dados

**Migration SQL** criando 3 tabelas:

- **clients** — `id`, `nome_cliente`, `tipo_ug`, `regiao`, `consultor`, `status_cliente` (default 'Ativo'), `observacoes_cliente`, `created_at`, `updated_at`
- **modules** — `id`, `nome_modulo` (unique), `categoria_modulo`, `status_modulo` (default 'Ativo'), `descricao`, `created_at`, `updated_at`
- **client_modules** — `id`, `client_id` (FK), `modulo_id` (FK), `valor_contratado`, `valor_faturado`, `data_assinatura`, `vencimento_contrato`, `faturado_flag`, `status_contrato`, `observacoes`, `ativo_no_cliente`, `created_at`, `updated_at`, unique(client_id, modulo_id)

Trigger `updated_at` nas 3 tabelas. RLS permissiva (anon access) por enquanto.

---

## Prompt 2 — Importacao Inteligente

Atualizar `ImportDialog.tsx`:
- Ao importar, fazer find-or-create de **Client** (por nome), find-or-create de **Module** (por produto), e upsert de **ClientModules**
- Criar hook `useContracts.ts` que carrega dados do banco (JOIN das 3 tabelas → `ContractRow[]`) e expoe funcao de importacao
- Dashboard usa o hook em vez de `mockContracts` diretamente

---

## Prompt 3 — Tela de Clientes

- Nova rota `/clientes` → `ClientesPage.tsx`
- Tabela com: nome, tipo UG, regiao, consultor, qtd modulos, total contratado/faturado, diferenca, proximo vencimento
- Filtros: regiao, consultor, tipo UG, status, busca por nome
- Acoes: ver, editar, adicionar cliente (dialog com formulario)
- Link "Clientes" no header do Dashboard

---

## Prompt 4 — Tela Cliente x Modulos

- Nova rota `/clientes/:id` → `ClienteDetailPage.tsx`
- Secao superior com dados do cliente
- Tabela "Modulos do Cliente" com: modulo, valores, datas, status, ativo/inativo
- Menu 3 pontos por linha: ativar, inativar, editar, atualizar valores, excluir vinculo
- Botao "Adicionar modulo ao cliente" com dialog completo

---

## Arquivos a Criar/Modificar

| Acao | Arquivo |
|------|---------|
| Migration | SQL: 3 tabelas + triggers + RLS |
| Criar | `src/hooks/useContracts.ts` |
| Criar | `src/pages/ClientesPage.tsx` |
| Criar | `src/pages/ClienteDetailPage.tsx` |
| Criar | `src/components/clientes/ClienteForm.tsx` |
| Criar | `src/components/clientes/ClienteModuloForm.tsx` |
| Modificar | `src/App.tsx` (rotas /clientes e /clientes/:id) |
| Modificar | `src/components/dashboard/Dashboard.tsx` (usar hook useContracts) |
| Modificar | `src/components/dashboard/ImportDialog.tsx` (importacao inteligente) |

O dashboard existente **nao sera alterado visualmente** — apenas a fonte de dados muda de mock para banco.

