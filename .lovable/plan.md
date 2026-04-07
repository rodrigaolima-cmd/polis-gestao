

## Correções: Tipos de UG, cadastro em Configurações e modal fechando ao trocar aba

### Problema 1: Fallback de UG com tipos inexistentes

O `UG_TYPES_FALLBACK` no `ClienteForm.tsx` contém `AUTARQUIA, RPPS, FUNDO, INSTITUTO` que **não existem no banco**. O merge com o fallback infla a lista. Os tipos reais no banco são apenas: `ASSOCIACAO, CAMARA, CONSORCIO, PREFEITURA, PREVIDENCIA, SAAE`.

**Solução**: Remover o fallback estático. Carregar tipos de UG **somente do banco**. Remover toda lógica de "Outro..." / modo manual para UG — o tipo de UG será gerenciado exclusivamente pelo cadastro em Configurações.

### Problema 2: Cadastro de Tipos de UG em Configurações

Criar uma nova tabela `ug_types` e um componente `UgTypeCatalogo` na página de Configurações, seguindo o padrão do `ModuloCatalogo`:

**Migration SQL**:
```sql
CREATE TABLE public.ug_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.ug_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read" ON public.ug_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage" ON public.ug_types FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Seed com tipos existentes do banco
INSERT INTO public.ug_types (nome) VALUES ('ASSOCIACAO'),('CAMARA'),('CONSORCIO'),('PREFEITURA'),('PREVIDENCIA'),('SAAE')
ON CONFLICT (nome) DO NOTHING;
```

**Novo componente**: `src/components/configuracoes/UgTypeCatalogo.tsx`
- Card com título "Tipos de UG"
- Tabela com coluna Nome e botão Editar
- Clicar na linha abre dialog de edição (mesmo padrão do ModuloCatalogo)
- Botão "Adicionar" para novo tipo
- Ao editar o nome, atualizar também `clients.tipo_ug` em cascade para manter consistência

**`ConfiguracoesPage.tsx`**: Importar e renderizar `<UgTypeCatalogo />` após `<ModuloCatalogo />`

### Problema 3: ClienteForm carrega UG do cadastro

**`ClienteForm.tsx`**:
- Remover `UG_TYPES_FALLBACK`, `ugManual`, toda lógica de modo manual para UG
- No `useEffect` de carregamento, buscar de `ug_types` em vez de extrair do campo `clients.tipo_ug`:
  ```ts
  const { data: ugData } = await supabase.from("ug_types").select("nome").order("nome");
  setUgTypes(ugData?.map(d => d.nome) || []);
  ```
- Select simples sem opção "Outro..."

### Problema 4: Modal fecha ao trocar aba do navegador

O `onPointerDownOutside` e `onInteractOutside` já estão no `dialog.tsx`, mas o Radix Dialog usa `onFocusOutside` como outro canal de fechamento quando a janela perde foco.

**`src/components/ui/dialog.tsx`**: Adicionar `onFocusOutside={(e) => e.preventDefault()}` no `DialogPrimitive.Content`.

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| Migration SQL | Criar tabela `ug_types` com seed |
| `src/components/configuracoes/UgTypeCatalogo.tsx` | Novo componente CRUD |
| `src/pages/ConfiguracoesPage.tsx` | Renderizar `<UgTypeCatalogo />` |
| `src/components/clientes/ClienteForm.tsx` | Carregar UG de `ug_types`, remover fallback e modo manual |
| `src/components/ui/dialog.tsx` | Adicionar `onFocusOutside` preventDefault |

### O que NÃO muda
- Dashboard, cálculos, relatórios, sidebar
- Formulário de cliente (seções, campos, validações) — apenas fonte de dados de UG
- RLS de outras tabelas, edge functions
- Lógica de Região e Consultor (continuam com select dinâmico + Outro)

