
Objetivo: corrigir só os dois pontos relatados, sem refazer layout, sem mexer no banco e sem alterar cálculos do dashboard.

### Diagnóstico confirmado

1. Edição de módulo ainda abre zerada
- O problema não está só no `CurrencyInput`.
- Pela captura, também as datas vêm vazias, o que indica que o `form` inteiro está abrindo com `defaultForm`, não com os dados do módulo selecionado.
- O `ClienteModuloForm` hoje hidrata o estado apenas dentro de um `useEffect([open, existingModule?.id])`. Isso é frágil quando o dialog abre e o módulo é trocado muito próximo do mount/re-render.
- A consulta no banco confirma que os valores existem para o cliente/módulo; então a falha é de sincronização da UI.

2. Cards do HERO “Total Contratado” e “Total Faturado”
- Os relatórios continuam implementados em `SectionReportDialog` (`contractedVsBilled` existe).
- No `Dashboard.tsx`, os dois cards perderam o `onClick` após o remix.
- Ou seja: o relatório existe, mas os cards não disparam mais a abertura.

### Correções planejadas

#### 1. Reforçar a hidratação do modal de edição
Arquivos:
- `src/components/clientes/ClienteModuloForm.tsx`
- opcionalmente `src/pages/ClienteDetailPage.tsx`

Ajustes:
- Separar claramente dois cenários:
  - abertura para novo módulo
  - abertura para editar módulo existente
- Reidratar o `form` sempre que o modal abrir com `existingModule`, usando uma função de normalização dedicada.
- Evitar depender só de `existingModule?.id`; incluir uma estratégia que sincronize também quando o objeto chegar depois da abertura.
- Se necessário, forçar remontagem controlada do `ClienteModuloForm` por `editingModule?.id ?? "new"` para garantir que cada edição abra com estado limpo e correto.
- Manter o `CurrencyInput`, mas fazer a fonte da verdade ser o `form` já corretamente carregado.

Resultado esperado:
- Ao clicar em “Editar contrato”, devem aparecer corretamente:
  - valor contratado
  - valor faturado
  - data de assinatura
  - vencimento
  - status / switches / observações

#### 2. Restaurar clique nos cards do HERO
Arquivo:
- `src/components/dashboard/Dashboard.tsx`

Ajustes:
- Adicionar `onClick={() => setSectionReport("contractedVsBilled")}` em:
  - `Total Contratado`
  - `Total Faturado`
- Manter os mesmos valores, sparklines e layout atual.
- Não alterar cálculo nem conteúdo do relatório.

Resultado esperado:
- Ambos os cards voltam a ser clicáveis.
- Ambos abrem o relatório já existente de “Contratado vs Faturado”.

### Arquivos afetados
- `src/components/clientes/ClienteModuloForm.tsx`
- `src/pages/ClienteDetailPage.tsx` (se necessário para chave/remount estável)
- `src/components/dashboard/Dashboard.tsx`

### Validação após implementar
1. Abrir um cliente com módulos já cadastrados.
2. Clicar em editar em 3 módulos diferentes.
3. Confirmar que valores e datas aparecem preenchidos imediatamente.
4. Fechar e reabrir o modal para garantir que não volta a zerar.
5. No dashboard, clicar em:
   - Total Contratado
   - Total Faturado
6. Confirmar que ambos abrem o relatório corretamente e continuam sensíveis ao filtro atual.
