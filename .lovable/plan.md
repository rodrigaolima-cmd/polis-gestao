

## Implementar logo Polis Hub + informações na tela de login

### Arquivos afetados
1. **Logo**: Copiar `user-uploads://Logo_Polis_Hub.png` para `src/assets/Logo_Polis_Hub.png`
2. **`src/pages/LoginPage.tsx`** — Adicionar logo + atualizar informações do footer
3. **`src/components/layout/AppSidebar.tsx`** — Substituir ícone "P" pelo logo
4. **`src/components/dashboard/SectionReportDialog.tsx`** — Adicionar logo nos relatórios (topo direito)
5. **`src/components/dashboard/ChartReportDialog.tsx`** — Adicionar logo nos relatórios (topo direito)

### Detalhes

#### 1. Login Page
- **Painel esquerdo**: Substituir texto "Polis Gestão" pelo logo (altura ~80px, proporcional)
- **Painel direito (mobile)**: Logo menor (~48px) acima do formulário
- **Footer do painel esquerdo**: Atualizar para:
  ```
  © 2026 Polis Gestão. Todos os direitos reservados.
  Pólis Hub v1.0 - Beta | Ambiente: Produção
  ```

#### 2. AppSidebar
- Substituir o quadrado azul com "P" pela imagem do logo (altura ~32px, proporcional)
- Manter texto "Polis Gestão" e "Gestão de Contratos" ao lado quando expandido

#### 3. Relatórios (SectionReportDialog + ChartReportDialog)
- Adicionar logo no topo direito do cabeçalho de impressão
- Altura ~40px, manter proporção original
- Posição: `float: right` ou `flex justify-between` no header do relatório

### O que NÃO muda
- Lógica de autenticação, cálculos, dados, RLS, edge functions
- Layout geral, cores, tipografia

