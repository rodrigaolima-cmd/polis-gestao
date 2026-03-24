

## Plano: Inserir módulos e criar cadastro de módulos

### 1. Inserir os 26 módulos no banco

Usar o insert tool para inserir na tabela `modules` com `categoria_modulo` derivada do prefixo (GSP ou EDU):

- 16 módulos GSP (categoria "GSP - Saúde")
- 10 módulos EDU (categoria "EDU - Educação")

Todos com `status_modulo = 'Ativo'`.

### 2. Criar seção "Catálogo de Módulos" na página de Configurações

**Edição: `src/pages/ConfiguracoesPage.tsx`**

Adicionar novo Card abaixo dos existentes com:

- Tabela listando todos os módulos (`nome_modulo`, `categoria_modulo`, `status_modulo`)
- Ordenação alfabética por nome
- Badge de status (Ativo/Inativo)
- Ações por linha:
  - **Editar** — abre dialog para alterar nome, categoria, descrição
  - **Ativar/Inativar** — toggle switch (soft delete, não exclui)
  - **Excluir** — botão com confirmação; só permite se módulo não estiver vinculado a nenhum cliente (`client_modules`). Se vinculado, mostra aviso.
- Botão "Novo Módulo" no header do card — dialog com campos: nome, categoria, descrição
- Busca/filtro por nome

### Arquivos afetados
- 1 arquivo editado: `src/pages/ConfiguracoesPage.tsx`
- 26 registros inseridos via insert tool na tabela `modules`
- Sem alterações no banco de dados (schema)
- Sem alterações no dashboard ou layout

