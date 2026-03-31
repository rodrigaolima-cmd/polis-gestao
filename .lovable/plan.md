

## Catálogo de Módulos — Relatório + Inserção de módulos

### 1. Inserir módulos no banco (sem duplicatas)

Usar o insert tool para adicionar os 26 módulos listados. Query com `ON CONFLICT` ou `INSERT ... WHERE NOT EXISTS` para evitar duplicatas (match por `nome_modulo`).

```sql
INSERT INTO public.modules (nome_modulo, categoria_modulo, status_modulo, descricao)
SELECT v.nome, v.cat, 'Ativo', ''
FROM (VALUES
  ('GSP - Portal de Terceiros','GSP'),
  ('GSP - Pronto Atendimento','GSP'),
  -- ... todos os 26 módulos
  ('GSP - Gestão Completa','GSP')
) AS v(nome, cat)
WHERE NOT EXISTS (
  SELECT 1 FROM public.modules m WHERE m.nome_modulo = v.nome
);
```

### 2. Relatório do Catálogo — novo componente `ModuloCatalogoReport.tsx`

Criar um dialog de relatório seguindo o padrão visual existente (`ChartReportDialog`, `ClientesReportDialog`):

- **Dialog** com classe `print-report`, max-width, scroll
- **Header**: título "Relatório do Catálogo de Módulos" + botão "Exportar PDF" (`window.print()`)
- **Subtítulo**: quantidade total de módulos
- **Tabela** com colunas: Nome do Módulo | Categoria | Status | Descrição
- **Footer**: total de módulos
- Ordenação alfabética pt-BR por `nome_modulo`
- Recebe `modules: Module[]` como prop (reutiliza dados já carregados)

### 3. Integrar botão no `ModuloCatalogo.tsx`

No header do card, adicionar botão "Relatório" (ícone `FileText`) ao lado de "Novo Módulo":

```tsx
<Button size="sm" variant="outline" className="gap-2" onClick={() => setReportOpen(true)}>
  <FileText className="h-4 w-4" /> Relatório
</Button>
```

State `reportOpen` controla o dialog. Passa `modules` (todos, sem filtro de busca) para o relatório.

### Arquivos afetados
- `src/components/configuracoes/ModuloCatalogoReport.tsx` — **novo** — dialog de relatório
- `src/components/configuracoes/ModuloCatalogo.tsx` — botão + state para abrir relatório
- Insert SQL (26 módulos, sem duplicatas)

### O que NÃO muda
- Layout, dashboard, autenticação, outros relatórios

