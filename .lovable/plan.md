

## Aprimorar o formulário de adição em lote de sistemas

O componente `ClienteMultiModuloForm` já existe e cobre a maioria dos requisitos. Este plano adiciona os itens faltantes.

### Edição: `src/components/clientes/ClienteMultiModuloForm.tsx`

**Novos helpers de produtividade:**
- Botão "Copiar contratado → faturado" — para cada módulo selecionado, copia `valor_contratado` para `valor_faturado`
- Reorganizar os bulk helpers em grupo visual claro com labels descritivos

**Melhorias visuais:**
- Renomear seção "Campos Compartilhados" → "Dados comuns para todos os sistemas"
- Adicionar badge "Novo" nas linhas da tabela de valores (módulos não vinculados)
- Badges "Já vinculado" já existem na seleção — manter

**Validação aprimorada:**
- Verificar que valores são numéricos antes de salvar
- Mostrar mensagem se datas estão vazias (warning, não bloqueio)

### Arquivos afetados
- 1 arquivo editado: `src/components/clientes/ClienteMultiModuloForm.tsx`
- Sem alterações no banco, dashboard ou outros módulos

