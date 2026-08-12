# OS Manager — Sistema Profissional de Ordens de Serviço (Local-First)

> **OS Manager** é um software comercial robusto, modular, seguro e de alta performance para o gerenciamento completo de Ordens de Serviço (OS), desenvolvido com arquitetura **Local-First** para garantir operação contínua e segura independentemente de falhas de conectividade com a internet.

---

## 🌟 Princípios Fundamentais

1. **Local-First**: O sistema opera integralmente no ambiente local do usuário. Banco de dados persistente, rápido e independente de servidores em nuvem para suas operações críticas.
2. **Arquitetura Modular**: Separação clara entre Frontend, Backend, Banco de Dados, Regras de Negócio, Camada de Integração e Geração de Documentos.
3. **Resiliência e Segurança**: Criptografia de senhas, validação rigorosa de dados, controle de acesso por papéis (RBAC), trilha de auditoria e rotinas automatizadas de backup.
4. **Escalabilidade Comercial**: Projetado para oficinas, assistências técnicas, prestadores de serviços e empresas de manutenção que exigem controle absoluto sobre fluxo de caixa, estoque, mão de obra e prazos de garantia.

---

## 🛠️ Stack Tecnológica

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui, Lucide Icons, Vite
- **Backend**: Node.js, Express, TypeScript, arquitetura em serviços/controladores desacoplados
- **Banco de Dados & ORM**: SQLite / MySQL com Drizzle ORM (migrações versionadas, integridade referencial estrita e transações atômicas)
- **Geração de Documentos**: Motores de renderização de PDF customizados para termos de garantia, orçamentos e comprovantes de OS
- **Testes & Qualidade**: Vitest, validação de schemas com Zod

---

## 📦 Módulos Principais

| Módulo | Descrição Detalhada |
| :--- | :--- |
| **Clientes** | Cadastro completo de clientes (Pessoa Física e Jurídica), histórico de atendimentos, endereços e contatos. |
| **Equipamentos** | Registro de ativos vinculados ao cliente (marca, modelo, número de série, histórico de falhas e especificações). |
| **Ordens de Serviço (OS)** | O núcleo do sistema: fluxo de status (Aberto, Em Diagnóstico, Orçamento, Em Andamento, Concluído, Entregue, Cancelado), prioridades, checklist de entrada e timeline/histórico completo. |
| **Estoque & Peças** | Controle de inventário integrado às OS: baixa automática de peças, registro de movimentações e alerta de estoque mínimo. |
| **Orçamentos** | Composição detalhada de peças, mão de obra, serviços, descontos, acréscimos, cálculo de margem e custos. |
| **Garantia** | Gestão de prazos de garantia, termos, vinculação de OS de retorno à OS original e rastreabilidade de peças cobertas. |
| **Documentos & PDFs** | Emissão de comprovantes, orçamentos e termos de garantia personalizados com logotipo da empresa e dados fiscais/operacionais. |
| **Portal do Cliente** | Acesso externo seguro via token para consulta de status, aprovação de orçamentos e acompanhamento de chamados. |
| **Backup & Restauração** | Rotinas locais de backup completo (banco de dados, anexos, configurações) e restauração assistida. |

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js (versão 18 ou superior)
- Gerenciador de pacotes `pnpm`

### Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/os-manager-v2.git
cd os-manager-v2

# Instale as dependências
pnpm install

# Inicie o servidor de desenvolvimento
pnpm dev
```

---

## 📅 Roadmap de Desenvolvimento Incremental

- [x] **Fase 1**: Arquitetura Base e Configuração do Ambiente
- [x] **Fase 2**: Banco de Dados e Migrações (Drizzle ORM)
- [ ] **Fase 3**: Autenticação e Controle de Acessos
- [ ] **Fase 4**: Módulo de Clientes e Equipamentos
- [ ] **Fase 5**: Gestão de Ordens de Serviço e Timeline
- [ ] **Fase 6**: Controle de Estoque e Peças integradas à OS
- [ ] **Fase 7**: Módulo de Orçamentos e Cálculo de Margens
- [ ] **Fase 8**: Gestão de Garantias e Retornos
- [ ] **Fase 9**: Geração de PDFs Profissionais
- [ ] **Fase 10**: Dashboard Analítico e Relatórios
- [ ] **Fase 11**: Rotinas de Backup e Restauração Local
- [ ] **Fase 12**: Portal do Cliente e Integrações Opcionais (WhatsApp, Pagamentos)

---

## 🛡️ Licença

Este projeto é desenvolvido sob licença proprietária/comercial. Todos os direitos reservados.

---
Desenvolvido com excelência por **Manus AI**.
