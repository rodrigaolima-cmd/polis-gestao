

# Feedback Visual de Progresso na Importação

## Problema

O dialog de importação mostra apenas "Importando..." no botão, sem indicar progresso ou conclusão. O usuário não sabe quando terminou — o dialog fecha silenciosamente e o toast de sucesso pode passar despercebido.

## Solução

Adicionar uma **barra de progresso** e **etapas visíveis** dentro do dialog durante a importação, e ao final exibir uma **tela de resultado** antes de fechar.

### Mudanças no `ImportDialog.tsx`:

1. **Novo estado de progresso**: `importProgress` com etapa atual ("Criando clientes...", "Criando módulos...", "Inserindo contratos... 300/975") e percentual
2. **Novo step `"importing"`**: Em vez de ficar no step "map" com botão disabled, mudar para um step dedicado que mostra:
   - Barra de progresso (`Progress` component)
   - Texto da etapa atual
   - Contagem de registros processados
3. **Novo step `"done"`**: Ao concluir, mostrar resumo com totais (registros importados, clientes, módulos) e botão "Fechar"

### Mudanças no `useContracts.ts`:

1. Aceitar um **callback de progresso** na função `importToDatabase`: `onProgress?: (stage: string, percent: number) => void`
2. Chamar o callback em cada etapa:
   - "Processando clientes..." (0-30%)
   - "Processando módulos..." (30-50%)
   - "Limpando dados anteriores..." (50-55%)
   - "Inserindo contratos... lote X de Y" (55-95%)
   - "Finalizando..." (95-100%)

### Arquivos afetados

| Ação | Arquivo |
|------|---------|
| Modificar | `src/hooks/useContracts.ts` — adicionar callback de progresso |
| Modificar | `src/components/dashboard/ImportDialog.tsx` — UI de progresso e tela de resultado |

