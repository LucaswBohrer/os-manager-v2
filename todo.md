# OS Manager — Todo List & Roadmap Incremental

- [x] Inicializar o projeto e configurar o repositório privado no GitHub (`os-manager-v2`) com README profissional
- [x] **Fase 2: Modelo de Dados & Domínio (Drizzle Schema)**
  - [x] Definir entidades base: Clientes, Equipamentos, Ordens de Serviço (OS), Status/Prioridades, Estoque/Peças, Orçamentos e Garantias
  - [x] Configurar relacionamentos e chaves estrangeiras com integridade referencial
- [x] **Fase 3: Backend & Camada de Serviços (tRPC)**
  - [x] Implementar rotas tRPC para Clientes e Equipamentos
  - [x] Implementar motor de Ordens de Serviço com timeline/histórico de alterações
  - [x] Configurar controle de acesso e auditoria local
- [ ] **Fase 4: Frontend & UI (Dashboard Modular)**
  - [x] Desenvolver layout principal com navegação lateral (DashboardLayout)
  - [x] Criar telas de listagem e cadastro rápido de Clientes
  - [ ] Criar telas de listagem e cadastro de Equipamentos e o fluxo de Ordens de Serviço
- [ ] **Fase 5: Qualidade & Testes (Vitest)**
  - [x] Escrever e executar testes unitários e de integração com Vitest
  - [ ] Validar fluxos de dados e renderização no navegador com componentes funcionais
- [ ] **Fase 6: Checkpoint & Publicação**
  - [ ] Criar checkpoint estável final
