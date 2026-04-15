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
| Sair do casal | ❌ | Não implementado |
| Dissolver casal | ❌ | Não implementado |
| Configurações do casal | ❌ | Nome, visibilidade, etc |
| Convite por link | ❌ | Apenas código manual |
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
| Transferências entre contas | ❌ | Tipo 'transfer' definido, não implementado |
| Anexos/comprovantes | ❌ | Não implementado |
| Tags personalizadas | ❌ | Não implementado |
| Busca textual | ❌ | Não implementado |
| Exportar transações | ✅ | CSV implementado (backend + frontend) |

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
| Histórico de contribuições | ❌ | Não implementado |
| Metas recorrentes | ❌ | Não implementado |
| Compartilhamento de progresso | ❌ | Notificações não implementadas |

### Contas

| Feature | Status | Observações |
|---------|--------|-------------|
| Criar conta | ✅ | Múltiplos tipos, saldo inicial |
| Listar contas | ✅ | Com totalBalance |
| Atualizar saldo | ✅ | Endpoint PATCH /:id/balance |
| Inativar conta | ✅ | Soft delete com isActive |
| Tipos de conta | ✅ | Checking, savings, credit, investment, benefit |
| Editar conta | ❌ | Apenas balance, outros campos não |
| Excluir permanentemente | ❌ | Apenas soft delete |
| Limites de crédito | ❌ | Não implementado |
| Faturas de cartão | ❌ | Não implementado |
| Conciliação bancária | ❌ | Não implementado |
| Importação OFX/CSV | ❌ | Não implementado |

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
| Validações de segurança | ✅ | requireAuth, permissão joint, duplicidade |
| Logging de auditoria | ✅ | Audit logs para criação de orçamento |
| Endpoint GET /api/budget/:month/:year | ✅ | Busca orçamento do mês com cálculos de gastos |
| Endpoint PATCH /api/budget/:id | ✅ | Atualização de totalBudget e categorias com cálculo automático de spentAmount |
| Endpoint DELETE /api/budget/:id | ❌ | Não implementado |
| Endpoint GET /api/budget/history | ✅ | Histórico de orçamentos com paginação e filtro por ano |
| **Endpoint POST /api/budget/calculate** | ✅ | Cálculo de gastos do mês e atualização automática de spentAmount |
| **Registro de rotas no index.ts** | ✅ | Rotas registradas em /api/budget |
| Cálculo automático de gastos | ✅ | Implementado nos endpoints GET, PATCH, history e calculate |
| Sistema de alertas | ❌ | Não implementado |
| UI de orçamento | ✅ | BudgetScreen.tsx implementado com layout similar ao Dashboard, seletor de mês/ano, display de orçamento total vs gasto total, e lista de categorias com limites e gastos |
| **Componente BudgetCard** | ✅ | Componente reutilizável criado com: total budget, spent, remaining, barra de progresso animada, porcentagem utilizada, cores contextuais (verde <80%, amarelo 80-100%, vermelho >100%), alertas visuais integrados |
| **Componente CategoryBudgetItem** | ✅ | Componente reutilizável criado com: ícone da categoria, nome, limite definido, gasto atual, barra de progresso animada por categoria, alertas visuais (>80% amarelo, >100% vermelho), exibição de valor restante, animações de entrada suaves |
| **Componente BudgetModal** | ✅ | Bottom sheet modal para criar/editar orçamento com: input de valor total, lista de categorias com toggle, limites individuais por categoria, toggle de alertas, slider de threshold (50-100%), resumo de alocação orçamentária, alerta de overbudget, botões Cancelar/Salvar, integração completa com BudgetScreen |
| **Integração BudgetScreen no App.tsx** | ✅ | BudgetScreen integrado ao fluxo de navegação principal: ícone Wallet no menu inferior, navegação via screen state ('budget'), context toggle compartilhado entre todas as telas |

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
| Error handling | ✅ | Mensagens de erro na UI |
| Empty states | ✅ | "Nenhuma transação ainda" |
| Skeleton screens | ❌ | Apenas loading spinner |
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
| Audit log | ❌ | Não implementado |
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
| **Busca de transações** | Médio | Baixo | Search por título/notas |
| **Tags customizadas** | Baixo | Médio | Organizar transações livremente |

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
| Casais | 2 | 0 | 5 | 7 |
| Transações | 6 | 2 | 6 | 14 |
| Metas | 6 | 0 | 4 | 10 |
| Contas | 5 | 1 | 5 | 11 |
| Bills Recorrentes | 1 | 1 | 5 | 7 |
| **Orçamento Mensal** | **8** | **0** | **2** | **10** |
| Dashboard | 3 | 0 | 5 | 8 |
| Onboarding | 2 | 1 | 2 | 5 |
| UI/UX | 9 | 0 | 4 | 13 |
| Backend | 6 | 1 | 4 | 11 |
| Segurança | 4 | 1 | 3 | 8 |

**Total Geral:** 54 implementados, 7 parciais, 52 não implementados

### Progresso Geral

```
Implementado:      ████████████████░░░░░░░░  48%
Parcial:           ███░░░░░░░░░░░░░░░░░░░░░   6%
Não Implementado:  ██████████████████░░░░░░  46%
```

---

## 🎯 Roadmap Sugerido

### Sprint 1 - Complete o Básico (1-2 semanas)
- [x] UI de edição/deleção de transações
- [x] UI de edição/deleção de metas
- [x] Recuperação de senha
- [x] Configurações de perfil (implementado conforme PROFILE_SETTINGS_KANBAN.md)

### Sprint 2 - Dashboard Rico (2-3 semanas)
- [ ] Gráficos por categoria
- [ ] Comparativo mensal
- [ ] Exportar CSV
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
