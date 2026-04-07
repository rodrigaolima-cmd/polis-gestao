
## Correção real do modal ao trocar de aba

### O que identifiquei
- O bloqueio em `dialog.tsx` já existe para `onPointerDownOutside`, `onInteractOutside` e `onFocusOutside`, então o problema não é mais só “clicar fora”.
- Os modais ainda estão usando `onOpenChange={setState}` diretamente. Se o Radix disparar `false` ao perder foco/alternar aba, o estado local aceita esse fechamento e o modal some, mostrando a tela de Clientes por trás.
- Há também sinal de instabilidade de sessão/autenticação nos logs (`SIGNED_OUT`), então preciso blindar esse fluxo para garantir que trocar de aba não derrube a tela atual.

### Implementação
1. **Fortalecer o componente base de modal**
   - Em `src/components/ui/dialog.tsx`, complementar a proteção com:
     - `onEscapeKeyDown={(e) => e.preventDefault()}`
     - `onCloseAutoFocus={(e) => e.preventDefault()}`
   - Ajustar o botão `X` para continuar funcionando como fechamento explícito do usuário.

2. **Parar de aceitar fechamento automático**
   - Nos modais de cliente, trocar o `onOpenChange={set...}` por um handler protegido:
     - ignora fechamentos automáticos
     - só fecha por ação explícita: `Cancelar`, `Salvar`, `X`
   - Aplicar em:
     - `src/components/clientes/ClienteForm.tsx`
     - `src/components/clientes/ClienteModuloForm.tsx`
     - `src/components/clientes/ClienteMultiModuloForm.tsx`
     - `src/components/clientes/CopyDatesDialog.tsx`

3. **Blindar a sessão para não “derrubar” a tela ao trocar de aba**
   - Revisar `src/contexts/AuthContext.tsx` e `src/components/ProtectedRoute.tsx`
   - Garantir que perda momentânea de foco/rehydration não cause redirecionamento ou reset indevido da interface.
   - Só sair da tela em caso de logout real do usuário.

4. **Ajuste de acessibilidade e ruído de console**
   - Corrigir o warning de dialogs sem descrição:
     - manter `DialogDescription` onde existir texto
     - quando não houver descrição, definir `aria-describedby={undefined}`

### Arquivos afetados
- `src/components/ui/dialog.tsx`
- `src/components/clientes/ClienteForm.tsx`
- `src/components/clientes/ClienteModuloForm.tsx`
- `src/components/clientes/ClienteMultiModuloForm.tsx`
- `src/components/clientes/CopyDatesDialog.tsx`
- `src/contexts/AuthContext.tsx`
- `src/components/ProtectedRoute.tsx`

### Resultado esperado
- Ao abrir **Editar Cliente** e trocar para outra aba do navegador, o modal permanece aberto.
- O sistema não “volta” para a tela por trás sem ordem do usuário.
- A tela atual não é perdida por instabilidade de autenticação.
