
Objetivo: corrigir de forma incremental o formulário de edição de módulo para que os valores já existentes apareçam sempre ao abrir o modal, sem alterar layout, banco ou cálculos do dashboard.

### Diagnóstico
Pelo código atual, a referência de `existingModule` já foi estabilizada, então o problema restante está no próprio `CurrencyInput`:
- ele mantém um estado interno `display`
- ao abrir o dialog, o primeiro campo pode receber foco automático do Radix
- quando isso acontece, o `handleFocus` troca a exibição para modo de edição antes da sincronização visual ficar estável
- como o componente também usa estado interno, isso pode prender o input em `0,00` mesmo com `value` correto vindo do form

As imagens batem com esse cenário: a tabela mostra os valores corretos, mas o modal abre com ambos zerados.

### Correção principal
**Arquivo: `src/components/ui/currency-input.tsx`**

Ajustar o componente para ser mais confiável com valor controlado:
- sincronizar `display` sempre que `value` mudar e o conteúdo exibido estiver divergente
- no `handleFocus`, exibir o valor bruto formatado a partir de `value`, inclusive quando for `0`
- evitar depender do estado inicial do `useState` para refletir dados vindos depois
- opcionalmente aceitar `value?: number | null` e normalizar internamente para evitar edge cases

Resultado esperado:
- ao abrir “Editar Módulo”, `Valor Contratado` e `Valor Faturado` passam a refletir imediatamente os números do registro selecionado
- ao focar no campo, o valor continua editável sem resetar para zero

### Ajuste complementar
**Arquivo: `src/components/clientes/ClienteModuloForm.tsx`**

Fazer um pequeno reforço na hidratação do formulário:
- extrair um `defaultForm` constante para evitar duplicação
- ao carregar `existingModule`, usar `setForm({ ...existingModule })`
- limpar `newModuleName` quando o modal abrir/fechar para evitar resíduo de estado

Isso não muda comportamento funcional principal, mas elimina ruído de estado entre aberturas.

### O que não será alterado
- layout do modal
- estrutura do banco
- lógica do dashboard
- tabela de clientes
- fluxo de importação

### Arquivos afetados
- `src/components/ui/currency-input.tsx` — correção principal
- `src/components/clientes/ClienteModuloForm.tsx` — reforço de sincronização do form

### Validação após implementar
1. Abrir um cliente com módulos que tenham valores preenchidos.
2. Clicar em “Editar contrato” em diferentes linhas.
3. Confirmar que os dois campos monetários abrem já preenchidos.
4. Testar um caso com valor `0,00` real para garantir que continua funcionando.
5. Editar, salvar e reabrir para confirmar persistência visual correta.
