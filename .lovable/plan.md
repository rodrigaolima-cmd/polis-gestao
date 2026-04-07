

## Correção dos dropdowns de Consultor e Região no cadastro de Clientes

### Diagnóstico

O formulário de cliente (`ClienteForm.tsx`) carrega as opções de Consultor e Região a partir dos valores já existentes na tabela `clients`. Os dados no banco estão corretos (3 consultores: Adimar, Diogo, Magno; 11 regiões). O problema é que o dropdown inclui a opção **"Outro..."** que permite digitação livre, o que causa inconsistência nos dados ao inserir novos clientes.

No Dashboard, os filtros funcionam porque vêm dos dados de contratos já consolidados.

### Alterações

**1. `src/components/clientes/ClienteForm.tsx`**

- **Consultor**: remover a opção "Outro..." (`__other__`) e o modo de digitação manual (`consultorManual`). O dropdown será fixo com apenas os 3 consultores existentes no banco.
- **Região**: remover a opção "Outro..." e o modo manual também, mantendo apenas as regiões existentes no banco.
- Limpar variáveis de estado `consultorManual` e `regiaoManual` que não serão mais necessárias.

### O que NÃO muda

- Layout, dashboard, filtros da ClientesPage
- Lógica de salvamento
- Demais campos do formulário
- Estrutura do banco de dados

