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
| Recuperação de senha | ❌ | Não implementado |
| Esqueci minha senha | ❌ | Não implementado |
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
| Deletar transação | ⚠️ | Endpoint DELETE existe, UI não implementada (apenas editar) |
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
| Editar meta | ⚠️ | Endpoint PATCH existe, UI não implementada |
| Deletar meta | ⚠️ | Endpoint DELETE existe, UI não implementada |
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
| Toast notifications | ❌ | Não implementado |
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
| **Edição de transações** | Alto | Baixo | UI para editar/deletar transações existentes |
| **Dashboard por categoria** | Alto | Médio | Gráficos de pizza/barras por categoria |
| ~~**Notificações push**~~ | ~~Alto~~ | ~~Médio~~ | ~~Lembretes de bills, metas atingidas~~ |
| ~~**Exportar dados (CSV)**~~ | ~~Alto~~ | ~~Baixo~~ | ~~Backup e análise externa~~ |
| **Recuperação de senha** | Alto | Médio | Flow completo com email |
| **Edição de metas** | Médio | Baixo | UI para editar/deletar metas |
| **Configurações do perfil** | Médio | Baixo | Mudar nome, email, avatar |

### Média Prioridade

| Feature | Impacto | Esforço | Descrição |
|---------|---------|---------|-----------|
| **Orçamento mensal** | Alto | Alto | Definir limites por categoria |
| **Alertas de orçamento** | Médio | Médio | Notificar quando接近 limite |
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
| Metas | 4 | 2 | 4 | 10 |
| Contas | 5 | 1 | 5 | 11 |
| Bills Recorrentes | 1 | 1 | 5 | 7 |
| Dashboard | 3 | 0 | 5 | 8 |
| Onboarding | 2 | 1 | 2 | 5 |
| UI/UX | 8 | 0 | 5 | 13 |
| Backend | 6 | 1 | 4 | 11 |
| Segurança | 4 | 1 | 3 | 8 |

**Total Geral:** 45 implementados, 9 parciais, 50 não implementados

### Progresso Geral

```
Implementado:      ████████████████░░░░░░░░  43%
Parcial:           ███░░░░░░░░░░░░░░░░░░░░░   9%
Não Implementado:  ██████████████████░░░░░░  48%
```

---

## 🎯 Roadmap Sugerido

### Sprint 1 - Complete o Básico (1-2 semanas)
- [ ] UI de edição/deleção de transações
- [ ] UI de edição/deleção de metas
- [ ] Recuperação de senha
- [ ] Configurações de perfil

### Sprint 2 - Dashboard Rico (2-3 semanas)
- [ ] Gráficos por categoria
- [ ] Comparativo mensal
- [ ] Exportar CSV
- [ ] Busca de transações

### Sprint 3 - Engajamento (2-3 semanas)
- [x] Notificações push
- [ ] Alertas de orçamento
- [ ] Relatórios mensais por email
- [ ] Light theme toggle

### Sprint 4 - Qualidade (2 semanas)
- [ ] Testes automatizados
- [ ] Error tracking (Sentry)
- [ ] Performance optimization
- [ ] PWA setup

---

*Última atualização: Dezembro 2024*
