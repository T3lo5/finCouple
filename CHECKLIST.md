# Checklist do Projeto - FinCouple

Este documento lista o que está implementado e o que seria útil implementar no futuro.

---

## ✅ Implementado

### Autenticação & Usuários

| Feature | Status | Observações |
|---------|--------|-------------|
| Registro de usuário | ✅ | Email, nome, senha (min 8 chars) |
| Login | ✅ | Email + senha com hash SHA-256 |
| Logout | ✅ | Invalida sessão no backend + localStorage |
| Session management | ✅ | Tokens de 30 dias, HttpOnly cookie |
| Recuperação de senha | ✅ | Flow completo com email via Brevo (300 emails/dia grátis) |
| Esqueci minha senha | ✅ | UI integrada na AuthScreen + endpoint /forgot-password |
| OAuth (Google/Apple) | ❌ | Não implementado |
| 2FA | ❌ | Não implementado |
| Verificação de email | ❌ | Não implementado |

### Casais

| Feature | Status | Observações |
|---------|--------|-------------|
| Criar casal | ✅ | Gera código de convite único (nanoid 10) |
| Entrar em casal | ✅ | Via código de convite |
| Sair do casal | ✅ | Endpoint POST /api/couples/leave implementado com auditoria |
| Dissolver casal | ✅ | Endpoint DELETE /api/couples implementado com auditoria |
| Configurações do casal | ✅ | Nome, visibilidade implementados (endpoints GET/PUT /api/couples) |
| Convite por link | ✅ | Sistema completo com geração/revogação de links de convite |
| Múltiplos casais | ❌ | Limitado a 1 casal por usuário |

### Transações

| Feature | Status | Observações |
|---------|--------|-------------|
| Criar transação | ✅ | Receita, despesa, categoria, contexto |
| Listar transações | ✅ | Com paginação (limit/offset) |
| Filtrar por contexto | ✅ | Individual ou joint |
| Filtrar por categoria | ✅ | Todas as 10 categorias |
| Filtrar por período | ✅ | From/to dates |
| Editar transação | ✅ | UI implementada via ActionModal no App.tsx |
| Deletar transação | ✅ | Endpoint DELETE existe no backend + hook useTransactions.delete() |
| Transferências entre contas | ✅ | Tipo 'transfer' implementado com atualização de saldo entre contas |
| Anexos/comprovantes | ✅ | Upload, listagem e download de anexos por transação |
| Tags personalizadas | ✅ | Criação, associação e gerenciamento de tags por transação |
| Busca textual | ✅ | Busca por título e notas nas transações |
| Exportar transações | ✅ | CSV implementado (backend + frontend) |
| Edição de data da transação | ✅ | Funcionalidade adicionada no modal de edição |
| Associação de tags na criação/edição | ✅ | Funcionalidade de selecionar tags ao criar ou editar transações |

### Metas de Economia

| Feature | Status | Observações |
|---------|--------|-------------|
| Criar meta | ✅ | Título, valor alvo, emoji, prazo |
| Listar metas | ✅ | Ordenadas por criação |
| Contribuir para meta | ✅ | Incrementa currentAmount |
| Completar meta automaticamente | ✅ | Status muda quando atinge target |
| Editar meta | ✅ | UI implementada com modal bottom sheet |
| Deletar meta | ✅ | UI implementada com confirmação (handleDelete + remove hook) |
| Pausar/retomar meta | ✅ | Status é atualizado automaticamente ao completar meta |
| Histórico de contribuições | ✅ | Implementado com detalhes de quem contribuiu e quando |
| Metas recorrentes | ✅ | Suporte a metas que se repetem com diferentes frequências |
| Compartilhamento de progresso | ✅ | Notificações quando parceiro contribui para meta conjunta |
| Detalhes da meta | ✅ | Visualização de informações detalhadas incluindo histórico de contribuições |
| Frequências personalizadas | ✅ | Opções diária, semanal, mensal e anual para metas recorrentes |
| Reinício automático de metas | ✅ | Metas recorrentes reiniciam automaticamente após atingirem a meta |

### Contas

| Feature | Status | Observações |
|---------|--------|-------------|
| Criar conta | ✅ | Múltiplos tipos, saldo inicial |
| Listar contas | ✅ | Com totalBalance |
| Atualizar saldo | ✅ | Endpoint PATCH /:id/balance |
| Inativar conta | ✅ | Soft delete com isActive |
| Tipos de conta | ✅ | Checking, savings, credit, investment, benefit |
| Editar conta | ✅ | Agora permite edição de outros campos além do saldo |
| Excluir permanentemente | ✅ | Opção de exclusão permanente com parâmetro ?permanent=true |
| Limites de crédito | ✅ | Suporte para limite de crédito em contas de crédito |
| Faturas de cartão | ✅ | Sistema completo de faturas para cartões de crédito |
| Conciliação bancária | ✅ | Funcionalidade de conciliação de transações |
| Importação OFX/CSV | ✅ | Importação de transações de arquivos OFX e CSV |

### Contas Recorrentes (Bills)

| Feature | Status | Observações |
|---------|--------|-------------|
| Schema no banco | ✅ | Tabela recurring_bills criada |
| CRUD API | ✅ | Rotas implementadas em /api/recurring |
| UI de gestão | ❌ | Não implementada |
| Auto-pay | ⚠️ | Campo existe, lógica não implementada |
| Lembretes | ❌ | Não implementado |
| Histórico de pagamentos | ❌ | Não implementado |

### Orçamento Mensal (Budget)

| Feature | Status | Observações |
|---------|--------|-------------|
| Schema no banco | ✅ | Tabelas monthly_budgets e budget_categories criadas |
| Endpoint POST /api/budget | ✅ | Criação de orçamento com validação Zod completa |
| Validações de segurança | ✅ | requireAuth, permissão joint, duplicidade, filtro por userId, validação de propriedade (userId !== user.id) |
| Logging de auditoria | ✅ | Audit logs implementados via logAudit() para todas as operações (create, read, update, delete, calculate, history, alerts) |
| Endpoint GET /api/budget/:month/:year | ✅ | Busca orçamento do mês com cálculos de gastos |
| Endpoint PATCH /api/budget/:id | ✅ | Atualização de totalBudget e categorias com cálculo automático de spentAmount |
| Endpoint DELETE /api/budget/:id | ✅ | Implementado com confirmação de segurança, deleção em cascata e logging de auditoria |
| Endpoint GET /api/budget/history | ✅ | Histórico de orçamentos com paginação e filtro por ano |
| **Endpoint POST /api/budget/calculate** | ✅ | Cálculo de gastos do mês e atualização automática de spentAmount |
| **Registro de rotas no index.ts** | ✅ | Rotas registradas em /api/budget |
| Cálculo automático de gastos | ✅ | Implementado nos endpoints GET, PATCH, history e calculate |
| Sistema de alertas | ✅ | Endpoint GET /api/budget/alerts verifica thresholds e cria notificações budget_alert automaticamente |
| UI de orçamento | ✅ | BudgetScreen.tsx implementado com layout similar ao Dashboard, seletor de mês/ano, display de orçamento total vs gasto total, e lista de categorias com limites e gastos |
| **Componente BudgetCard** | ✅ | Componente reutilizável criado com: total budget, spent, remaining, barra de progresso animada, porcentagem utilizada, cores contextuais (verde <80%, amarelo 80-100%, vermelho >100%), alertas visuais integrados |
| **Componente CategoryBudgetItem** | ✅ | Componente reutilizável criado com: ícone da categoria, nome, limite definido, gasto atual, barra de progresso animada por categoria, alertas visuais (>80% amarelo, >100% vermelho), exibição de valor restante, animações de entrada suaves |
| **Componente BudgetModal** | ✅ | Bottom sheet modal para criar/editar orçamento com: input de valor total, lista de categorias com toggle, limites individuais por categoria, toggle de alertas, slider de threshold (50-100%), resumo de alocação orçamentária, alerta de overbudget, botões Cancelar/Salvar, integração completa com BudgetScreen |
| **Integração BudgetScreen no App.tsx** | ✅ | BudgetScreen integrado ao fluxo de navegação principal: ícone Wallet no menu inferior, navegação via screen state ('budget'), context toggle compartilhado entre todas as telas |
| **Hook useBudget.ts** | ✅ | Hook customizado criado com: fetchBudget, createBudget, updateBudget, deleteBudget, calculateSpent, checkAlerts, clearBudget - seguindo padrões do SPEC.md para hooks customizados |
| **Integração notificações budget_alert** | ✅ | useNotifications atualizado com filtro budgetAlerts e contador unreadBudgetAlertsCount, polling de alertas implementado no useBudget.ts (60s padrão) |
| **Sistema de alertas** | ✅ | Endpoint GET /api/budget/alerts cria notificações budget_alert automaticamente, frontend exibe no painel de notificações com polling |

### Dashboard & Visualização

| Feature | Status | Observações |
|---------|--------|-------------|
| Toggle contexto | ✅ | Individual/Joint no topo |
| Saldo do mês | ✅ | Com receitas/gastos |
| Gráfico de fluxo | ✅ | SVG animado com Motion |
| Lista de transações recentes | ✅ | Últimas 10 transações |
| Resumo por categoria | ✅ | Gastos por categoria com gráfico de barra |
| Comparativo mês anterior | ❌ | Não implementado |
| Projeções futuras | ❌ | Não implementado |
| Widgets personalizáveis | ❌ | Não implementado |

### Onboarding

| Feature | Status | Observações |
|---------|--------|-------------|
| Tela de login/cadastro | ✅ | AuthScreen completa |
| Onboarding de casal | ✅ | OnboardingCouple com criar/entrar |
| Tutorial inicial | ❌ | Não implementado |
| Skip onboarding | ⚠️ | Botão existe, ação não implementada |
| Múltiplos passos | ❌ | Single screen apenas |

### UI/UX

| Feature | Status | Observações |
|---------|--------|-------------|
| Design system | ✅ | Cores, tipografia, bordas definidas |
| Dark mode | ✅ | Único tema (background escuro) |
| Light mode | ❌ | Não implementado |
| Animações Motion | ✅ | Spring transitions, fade, slide |
| Bottom sheet modal | ✅ | Para nova transação |
| Loading states | ✅ | Spinners em botões e listas |
| Error handling | ✅ | Mensagens de erro na UI com validação Zod, status codes específicos e ARIA labels |
| Empty states | ✅ | "Nenhuma transação ainda" e "Nenhum orçamento definido" |
| Skeleton screens | ✅ | BudgetSkeleton, BudgetCardSkeleton, CategoryBudgetSkeleton implementados |
| Toast notifications | ✅ | Componente BudgetAlert implementado com toast/banner para alertas de orçamento (>80%, >100%) |
| Confirmações de ação | ❌ | Não implementado |
| Pull to refresh | ❌ | Não implementado |
| Infinite scroll | ❌ | Paginação tradicional apenas |
| Notificações push | ✅ | Sistema completo com bell, painel e polling |

### Backend & Infra

| Feature | Status | Observações |
|---------|--------|-------------|
| API REST | ✅ | Hono framework |
| PostgreSQL | ✅ | Drizzle ORM |
| Migrations | ✅ | Drizzle-kit generate/migrate |
| CORS | ✅ | Configurado para frontend |
| Rate limiting | ❌ | Não implementado |
| Logging | ⚠️ | Logger do Hono básico |
| Health check | ✅ | GET /health |
| Docker | ⚠️ | docker-compose.yml existe |
| CI/CD | ❌ | Não configurado |
| Monitoramento | ❌ | Não implementado |
| Backups automáticos | ❌ | Não implementado |

### Segurança

| Feature | Status | Observações |
|---------|--------|-------------|
| Hash de senhas | ✅ | SHA-256 + salt |
| Sessions seguras | ✅ | Tokens nanoid(64) |
| Validação Zod | ✅ | Em todas as rotas |
| CORS | ✅ | Origin configurável |
| SQL injection protection | ✅ | Drizzle ORM parametrizado |
| XSS protection | ⚠️ | React protege, headers não configurados |
| CSRF protection | ❌ | Cookies HttpOnly, mas sem token CSRF |
| Audit log | ✅ | Implementado via logAudit() no middleware/auth.ts - usado em todas as rotas de budget (create, read, update, delete, calculate, history, alerts) |
| Criptografia de dados sensíveis | ❌ | Dados em texto puro no DB |

---

## 🚀 Sugestões de Implementação Futura

### Alta Prioridade

| Feature | Impacto | Esforço | Descrição |
|---------|---------|---------|-----------|
| ~~**Edição de transações**~~ | ~~Alto~~ | ~~Baixo~~ | ~~UI para editar/deletar transações existentes~~ |
| **Dashboard por categoria** | Alto | Médio | Gráficos de pizza/barras por categoria |
| ~~**Notificações push**~~ | ~~Alto~~ | ~~Médio~~ | ~~Lembretes de bills, metas atingidas~~ |
| ~~**Exportar dados (CSV)**~~ | ~~Alto~~ | ~~Baixo~~ | ~~Backup e análise externa~~ |
| ~~**Recuperação de senha**~~ | ~~Alto~~ | ~~Médio~~ | ~~Flow completo com email~~ |
| ~~**Edição de metas**~~ | ~~Médio~~ | ~~Baixo~~ | ~~UI para editar/deletar metas~~ |
| **Configurações do perfil** | Médio | Baixo | Mudar nome, email, avatar |

### Média Prioridade

| Feature | Impacto | Esforço | Descrição |
|---------|---------|---------|-----------|
| ~~**Orçamento mensal**~~ | ~~Alto~~ | ~~Alto~~ | ~~Definir limites por categoria - Schema implementado (TASK 1.1, 1.2) + Endpoint POST /api/budget implementado~~ |
| ~~**Alertas de orçamento**~~ | ~~Médio~~ | ~~Médio~~ | ~~Notificar quando próximo do limite - Componente BudgetAlert implementado com toast/banner para >80% e >100%~~ |
| **Relatórios mensais** | Médio | Médio | Email com resumo do mês |
| **Metas múltiplas fotos** | Baixo | Médio | Upload de imagens para metas |
| **Compartilhar via link** | Médio | Médio | Gerar link compartilhável |
| **Modo light theme** | Baixo | Baixo | Alternar temas |

### Baixa Prioridade / Nice to Have

| Feature | Impacto | Esforço | Descrição |
|---------|---------|---------|-----------|
| **Integração bancária** | Alto | Muito alto | Open banking, auto-import |
| **OCR de recibos** | Médio | Alto | Foto do comprovante |
| **Chat do casal** | Baixo | Alto | Discussão sobre transações |
| **Multi-moedas** | Baixo | Médio | Conversão automática |
| **Investimentos** | Médio | Alto | Tracking de portfolio |
| **Score financeiro** | Baixo | Alto | Métricas de saúde financeira |
| **Comparativo com amigos** | Baixo | Alto | Benchmarking anonimizado |
| **API pública** | Baixo | Alto | Webhooks, integrações |
| **App mobile nativo** | Alto | Muito alto | React Native / Flutter |
| **Extensão browser** | Baixo | Médio | Auto-categorização online |

### Técnico / Dívida Técnica

| Feature | Impacto | Esforço | Descrição |
|---------|---------|---------|-----------|
| **Testes automatizados** | Alto | Alto | Unit tests, integration tests |
| **E2E testing** | Alto | Alto | Cypress/Playwright |
| **Type coverage 100%** | Médio | Baixo | Garantir tipagem completa |
| **Error tracking** | Alto | Baixo | Sentry ou similar |
| **Analytics** | Médio | Baixo | Usage tracking (privacy-first) |
| **Performance optimization** | Médio | Médio | Code splitting, lazy loading |
| **SEO metadata** | Baixo | Baixo | Meta tags, OG images |
| **PWA** | Médio | Médio | Offline support, install prompt |
| **Documentação API** | Médio | Baixo | OpenAPI/Swagger |
| **Storybook** | Baixo | Médio | Component library docs |

---

## 📊 Resumo do Status

### Por Categoria

| Categoria | Implementado | Parcial | Não Implementado | Total Features |
|-----------|--------------|---------|------------------|----------------|
| Autenticação | 4 | 0 | 6 | 10 |
| Casais | 6 | 0 | 1 | 7 |
| Transações | 10 | 2 | 2 | 14 |
| Metas | 6 | 0 | 4 | 10 |
| Contas | 10 | 0 | 1 | 11 |
| Bills Recorrentes | 1 | 1 | 5 | 7 |
| **Orçamento Mensal** | **10** | **0** | **0** | **10** |
| Dashboard | 4 | 0 | 4 | 8 |
| Onboarding | 2 | 1 | 2 | 5 |
| UI/UX | 10 | 0 | 3 | 13 |
| Backend | 7 | 1 | 3 | 11 |
| Segurança | 5 | 1 | 2 | 8 |

**Total Geral:** 70 implementados, 3 parciais, 39 não implementados

### Progresso Geral

```
Implementado:      ██████████████████████░░  62%
Parcial:           █░░░░░░░░░░░░░░░░░░░░░░   3%
Não Implementado:  ███████░░░░░░░░░░░░░░░  35%
```

---

## 🎯 Roadmap Sugerido

### Sprint 1 - Complete o Básico (1-2 semanas)
- [x] UI de edição/deleção de transações
- [x] UI de edição/deleção de metas
- [x] Recuperação de senha
- [x] Configurações de perfil (implementado conforme PROFILE_SETTINGS_KANBAN.md)

### Sprint 2 - Dashboard Rico (2-3 semanas)
- [x] Gráficos por categoria (Resumo por categoria com gráfico de barra já implementado)
- [ ] Comparativo mensal
- [x] Exportar CSV (Implementado para transações em /api/transactions/export)
- [ ] Busca de transações

### Sprint 3 - Engajamento (2-3 semanas)
- [x] Notificações push
- [x] Alertas de orçamento
- [ ] Relatórios mensais por email
- [ ] Light theme toggle

### Sprint 4 - Qualidade (2 semanas)
- [ ] Testes automatizados
- [ ] Error tracking (Sentry)
- [ ] Performance optimization
- [ ] PWA setup

---

*Última atualização: Dezembro 2024*
