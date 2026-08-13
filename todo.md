# OS Manager - Roadmap de Evolução Comercial

- [x] Infraestrutura base, login local, persistência JSON e Electron
- [x] Roteamento principal e eliminação do erro 404 inicial
- [x] **Evolução 1: Aprimorar a Criação de OS** (Busca robusta de clientes, cadastro inline completo, dados de equipamento livres, condições de entrada, prioridades e garantia)
- [x] **Correção de Gerenciamento e Carregamento de OS** (Remoção de duplicidade de imports em OrderDetailPage, restaurando carregamento da rota /ordens/:id e edição de detalhes/status)
- [x] **Correção de Redirecionamento em ServiceOrdersPage** (Adicionado hook useLocation do wouter para garantir que o botão 'Gerenciar OS' abra corretamente a página de detalhes /ordens/:id)
- [ ] **Evolução 2: Tela Profissional da OS** (Abas de resumo, diagnóstico, orçamento, serviços, peças, estoque e timeline)
- [x] **Correção de Sincronização de Status** (Atualização de status na página de detalhes reflete instantaneamente no painel de OS e dashboard)
- [ ] **Evolução 3: Diagnóstico Técnico** (Laudo, causa, testes e solução executada)
- [x] **Correção de Linter/TypeScript no Servidor** (Corrigir erros em server/_core/index.ts e server/routers.ts)
- [ ] **Expansão Detalhada de Diagnóstico** (Campos persistidos para laudo, causa, testes e solução executada)
- [ ] **Evolução 4: Serviços, Mão de Obra e Orçamento Integrado** (Cálculo de margem, custo, lucro, aprovação e status)
- [ ] **Evolução 5: Controle de Estoque Vinculado** (Reserva, baixa automática e movimentação)
- [ ] **Evolução 6: Geração de PDFs Profissionais** (Entrada, Orçamento e Saída/Termo de Garantia)
- [ ] **Evolução 7: Configurações de Empresa e Termos Personalizáveis**
- [ ] **Evolução 8: Sistema Completo de Garantia** (Vínculo com OS original e análise)
- [ ] **Evolução 9: Módulo Financeiro** (Pagamentos parciais/totais, formas de pagamento e estorno)
- [ ] **Evolução 10: Dashboard Gerencial e Backup Completo**
- [ ] **Evolução 11: Portal do Cliente e Integrações Opcionais** (WhatsApp, E-mail, Pagamentos online)

- [x] **Correção Crítica 1: Numeração Sequencial de OS** (Garantir formato 00001, 00002... sem IDs em milissegundos)
- [x] **Correção Crítica 2: Busca e Seleção de Clientes** (Remover seletor redundante e implementar busca instantânea com resultados clicáveis)
- [x] **Correção Crítica 3: Métricas do Dashboard** (Sincronizar contadores da tela inicial com os registros reais)
- [x] **Validação E2E com o Usuário** (Testar ciclo completo e confirmar visualização correta)
- [x] **Ajuste de Retaguarda 1: Backfill de Numeração** (Garantir que todas as OS antigas recebam displayNumber e sequencial correto ao carregar)
- [ ] **Ajuste de Retaguarda 2: Correção de Linter/TypeScript** (Garantir compilação limpa sem erros em routers.ts e index.ts)
