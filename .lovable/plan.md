
## Correção real: rolagem do modal "Editar Cliente"

### O que identifiquei
O problema visível nas imagens não é mais a página `/clientes/:id` em si, e sim o modal `Editar Cliente`.

O `AppLayout` já está com `overflow-y-auto`, então a correção anterior atacou o lugar errado para este caso.

No formulário de cliente, hoje existe esta combinação:
- `DialogContent` com limite de altura
- `ScrollArea` do Radix dentro do modal
- `ScrollArea` base com `overflow-hidden` e viewport dependente de altura explícita

Isso faz o conteúdo ficar “preso” no modal, sem uma área de rolagem funcional para os campos abaixo.

### Implementação
#### 1. Ajustar `src/components/clientes/ClienteForm.tsx`
Trocar a estratégia de rolagem interna do modal:

- remover o uso de `ScrollArea` nesse formulário
- manter o cabeçalho fixo no topo do modal
- envolver apenas o corpo do formulário em um container com:
  - `flex-1`
  - `min-h-0`
  - `overflow-y-auto`
  - `px-6 pb-6`

Estrutura alvo:
```text
DialogContent
├─ DialogHeader
└─ div (corpo rolável)
   └─ conteúdo do formulário
```

#### 2. Garantir contenção correta no modal
No `DialogContent` do `ClienteForm`, aplicar classes para o modal realmente limitar a altura e permitir scroll interno:
- `max-h-[90vh]`
- `overflow-hidden`
- `flex flex-col`

Isso evita que a janela cresça além da viewport e faz a rolagem acontecer dentro do corpo.

#### 3. Manter layout atual
Nada será recriado:
- mesmas seções
- mesmos campos
- mesmas validações
- mesmo fluxo de salvar/editar
- mesmo visual Polis Hub

### Arquivo afetado
- `src/components/clientes/ClienteForm.tsx`

### Resultado esperado
Ao abrir `Editar Cliente`, será possível rolar até:
- Cliente desde
- Dados cadastrais / fiscais
- Contato
- E-mail NFSe
- Observações
- botões Salvar / Cancelar

### O que não muda
- `AppLayout`
- estrutura da tela de detalhe do cliente
- cadastro atual
- lógica de negócio
- tema dark/light
