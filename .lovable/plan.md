## Problema confirmado

O cliente **Prefeitura Municipal de Caparaó** (código 95) tem 2 módulos que se enquadram exatamente no critério "Não implantado":

| Módulo | status_contrato | faturado_flag | ativo_no_cliente | valor_contratado |
|---|---|---|---|---|
| ISS BAN | Ativo | false | false | R$ 850 |
| DATA CENTER | Ativo | false | false | R$ 1.400 |

Consulta direta no banco confirma que existem **44 clientes** que deveriam aparecer na categoria "Não implantado" — mas o card mostra 0.

## Causa provável

A lógica em `useContracts.ts > loadOperationalLeaks()` está sintaticamente correta. Possíveis causas do estado vazio em runtime:

1. **Erro silencioso** dentro do `try/catch` (cai no `console.error` e o estado nunca é populado com a nova categoria — mantém o inicial `[]`).
2. **Estado inicial não atualizado** em algum dos múltiplos pontos onde `setOperationalLeaks` é chamado (já validado: linhas 172, 238, 329 estão consistentes).
3. **Tipagem do select**: a query usa `select("...status_contrato...")` mas o TypeScript pode estar inferindo o campo como `unknown` se os tipos do Supabase não foram regenerados após adicionarmos a coluna no critério — fazendo `(m as any).status_contrato` retornar `undefined` em runtime quando o cliente Supabase faz tree-shaking.

## Correções

### 1. Adicionar logs de diagnóstico em `loadOperationalLeaks`

Em `src/hooks/useContracts.ts`, logar contagens antes do `setOperationalLeaks` para ver no console exatamente o que está sendo carregado:

```ts
console.log("[OperationalLeaks]", {
  totalActiveClients: activeClients.length,
  totalModules: cms?.length ?? 0,
  semFaturamento: semFaturamento.length,
  semOperacao: semOperacao.length,
  naoImplantado: naoImplantado.length,
});
```

### 2. Tornar o filtro de `status_contrato` mais robusto

Substituir o filtro atual:
```ts
isActiveStatus(String((m as any).status_contrato || ""))
```
por uma leitura tipada e com fallback explícito (caso o campo venha `null`/`undefined`, considerar como "Ativo" — já que o default da coluna no banco é `'Ativo'`):
```ts
const sc = (m as { status_contrato?: string | null }).status_contrato;
const contratoAtivo = !sc || isActiveStatus(String(sc));
```

Isso garante que módulos com `status_contrato` nulo/vazio (que no banco são tratados como "Ativo" pelo default) também sejam considerados.

### 3. Adicionar tratamento de erro visível

No `catch` de `loadOperationalLeaks`, além do `console.error`, exibir um `toast` de aviso para evitar falha silenciosa:
```ts
toast({ title: "Falha ao carregar vazamento operacional", description: String(err), variant: "destructive" });
```

### 4. Garantir que `resetToMock` também limpe `operationalLeaks`

Em `resetToMock` (linha 528), adicionar:
```ts
setOperationalLeaks({ semFaturamento: [], semOperacao: [], naoImplantado: [] });
```
Para evitar que dados reais residuais se misturem ao modo demo.

## Arquivos a editar

- `src/hooks/useContracts.ts` (4 alterações pontuais — sem refator estrutural)

## Resultado esperado

Após o deploy:
- O console mostrará `naoImplantado: 44` confirmando que a lógica processa corretamente.
- A Prefeitura Municipal de Caparaó aparecerá no card "Não implantado" com 2 módulos e R$ 2.250,00 em risco.
- Erros futuros na carga serão visíveis ao usuário via toast.

## O que NÃO muda

- Layout do card e do dashboard.
- Critérios das outras categorias (Sem faturamento ativo, Sem operação ativa).
- Filtros do hero.
