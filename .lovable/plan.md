

## Esclarecimento e ajustes

### Sobre os 2 cadastros de módulos

- **Configurações → Catálogo de Módulos** — este é o cadastro correto do catálogo (CRUD de módulos disponíveis no sistema). Mantê-lo.
- **Clientes → Detalhe do Cliente → "Módulos do Cliente"** — isto NÃO é um cadastro duplicado. É a vinculação de módulos a um cliente específico (com valores, datas, status). Também deve ser mantido.

São coisas diferentes:
- Configurações = **catálogo global** (quais módulos existem)
- Cliente = **vínculo por cliente** (quais módulos o cliente contratou, com preços)

Não há duplicação real. Ambos ficam.

### Mudanças a implementar

**1. Trocar destaque do botão no header do Dashboard**

`src/components/dashboard/Dashboard.tsx` — linha 140-144:
- Botão "Clientes": trocar de `variant="outline"` para `variant="default"` (azul/primário)
- Botão "Importar": trocar de `variant="default"` para `variant="outline"` (neutro)

### Arquivos afetados
- 1 arquivo editado: `src/components/dashboard/Dashboard.tsx` (2 linhas)

