# 📋 Kanban - Orçamento Mensal FinCouple

**Objetivo:** Implementar sistema completo de orçamento mensal conforme SPEC.md e CHECKLIST.md
**Status Geral:** 🔴 **NÃO INICIADO** - 0% implementado

---

## 📝 Backlog (Tarefas a Fazer)

### Backend - Schema & Banco de Dados

#### Alta Prioridade

- [x] **TASK 1.1:** Criar tabela `monthly_budgets` no schema
  - Campos necessários:
    - `id` (nanoid, primary key)
    - `userId` (FK → users.id)
    - `coupleId` (FK → couples.id, nullable)
    - `month` (integer 1-12)
    - `year` (integer)
    - `totalBudget` (numeric precision 12 scale 2)
    - `context` (enum: individual, joint)
    - `createdAt`, `updatedAt` (timestamp)
  - Adicionar migration correspondente

- [x] **TASK 1.2:** Criar tabela `budget_categories` para limites por categoria
  - Campos necessários:
    - `id` (nanoid, primary key)
    - `budgetId` (FK → monthly_budgets.id)
    - `category` (enum: dining, home, transport, shopping, health, travel, bills, salary, investment, other)
    - `limitAmount` (numeric precision 12 scale 2)
    - `spentAmount` (numeric precision 12 scale 2, default 0)
    - `alertThreshold` (numeric precision 5 scale 2, default 80.00 - porcentagem)
    - `createdAt`, `updatedAt` (timestamp)
  - Adicionar migration correspondente

- [x] **TASK 1.3:** Atualizar enum `notification_type` se necessário (já existe `budget_alert`)
  - ✅ Verificado: `budget_alert` já existe no schema (linha 156)

### Backend - API Endpoints

#### Alta Prioridade

- [x] **TASK 2.1:** Criar endpoint `POST /api/budget` para criar orçamento mensal
  - [x] **TASK 2.1.1:** Validação Zod: month (1-12), year, totalBudget, context, categories (array opcional)
    - Schema criado com validações completas
    - Month: 1-12
    - Year: 2020-2100
    - TotalBudget: positivo, máximo 999999.99
    - Context: enum individual/joint
    - Categories: array opcional com category, limitAmount, alertThreshold
  - [x] **TASK 2.1.2:** Middleware requireAuth e validação de permissões
    - Verificar se usuário está autenticado
    - Validar permissão para contexto joint (precisa estar em casal)
  - [x] **TASK 2.1.3:** Lógica de criação do orçamento no banco
    - Verificar duplicidade (mês/ano/contexto)
    - Insert na tabela monthly_budgets
    - Insert nas categorias (se fornecidas)
  - [x] **TASK 2.1.4:** Logging de auditoria e tratamento de erros
    - Registrar ação no audit_logs
    - Retorno padrão: `{ data: { budget, categories } }`
  - [x] **TASK 2.1.5:** Registrar rota no index.ts
    - Importar router de budget
    - Registrar em `/api/budget`

- [x] **TASK 2.2:** Criar endpoint `GET /api/budget/:month/:year` para buscar orçamento do mês
  - Params: month, year
  - Query: context (individual/joint)
  - Retorno: `{ data: { budget, categories, spentTotal, remainingTotal } }`
  - [x] **TASK 2.2.1:** Criar schemas de validação Zod para params e query
    - budgetParamsSchema: month (string→int 1-12), year (string→int 2020-2100)
    - budgetQuerySchema: context (enum individual/joint, default individual)
  - [x] **TASK 2.2.2:** Implementar middleware de autenticação e validação de permissões
    - requireAuth middleware já aplicado no router
    - Validação de contexto joint (usuário precisa estar em casal)
    - Validação de month (1-12) e year (2020-2100)
  - [x] **TASK 2.2.3:** Implementar busca do orçamento no banco de dados
    - Query na tabela monthly_budgets com filters: userId, month, year, context
    - Retorno 404 se orçamento não encontrado
  - [x] **TASK 2.2.4:** Buscar categorias do orçamento
    - Query na tabela budget_categories filtrando por budgetId
  - [x] **TASK 2.2.5:** Calcular gastos totais baseado nas transações do mês
    - Definir período do mês (startDate, endDate)
    - Query de agregração com SUM nas transações (type=expense)
    - Filtros: userId, type, date range, context, coupleId (se joint)
    - Agrupamento por categoria
  - [x] **TASK 2.2.6:** Processar e retornar dados formatados
    - Mapear expenses por categoria usando Map
    - Calcular spentTotal somando todas as categorias
    - Calcular remainingTotal (totalBudget - spentTotal)
    - Adicionar campos calculados: spentAmount, remainingAmount, percentageUsed por categoria
    - Adicionar percentageUsed total no retorno
  - [x] **TASK 2.2.7:** Implementar logging de auditoria
    - Log action 'read' para entidade 'monthly_budget'
    - Registrar IP e User-Agent
  - [x] **TASK 2.2.8:** Retornar resposta no padrão da API
    - Formato: `{ data: { budget, categories, spentTotal, remainingTotal, percentageUsed } }`
    - Status 200 OK

- [x] **TASK 2.3:** Criar endpoint `PATCH /api/budget/:id` para atualizar orçamento
  - Validação: apenas campos atualizáveis (totalBudget, categories)
  - Atualizar spentAmount automaticamente baseado nas transações do mês
  - [x] **TASK 2.3.1:** Criar schemas de validação Zod para params e body
    - budgetIdSchema: id (string, nanoid)
    - updateBudgetSchema: totalBudget (opcional), categories (array opcional)
  - [x] **TASK 2.3.2:** Implementar middleware de autenticação e validação de permissões
    - requireAuth middleware já aplicado no router
    - Validar se usuário é dono do orçamento
    - Validar permissão para contexto joint
  - [x] **TASK 2.3.3:** Implementar busca e validação do orçamento existente
    - Verificar se orçamento existe
    - Retornar 404 se não encontrado
    - Validar permissão de edição
  - [x] **TASK 2.3.4:** Implementar atualização do totalBudget
    - Atualizar campo totalBudget se fornecido
    - Manter updatedAt
  - [x] **TASK 2.3.5:** Implementar atualização/crição de categorias
    - Upsert nas categorias (atualizar existentes, criar novas)
    - Remover categorias não fornecidas (opcional)
  - [x] **TASK 2.3.6:** Calcular e atualizar spentAmount baseado nas transações
    - Reutilizar lógica do GET /api/budget/:month/:year
    - Atualizar budget_categories.spentAmount
  - [x] **TASK 2.3.7:** Implementar logging de auditoria
    - Log action 'update' para entidade 'monthly_budget'
    - Registrar oldValues e newValues
  - [x] **TASK 2.3.8:** Retornar resposta no padrão da API
    - Formato: `{ data: { budget, categories, spentTotal, remainingTotal, percentageUsed } }`
    - Status 200 OK

- [x] **TASK 2.4:** Criar endpoint `DELETE /api/budget/:id` para deletar orçamento
  - [x] **TASK 2.4.1:** Implementar hard delete com confirmação de segurança
    - Schema Zod para confirmação: `{ confirm: true }` obrigatório
    - Validação de permissão (usuário dono do orçamento)
    - Validação de contexto joint
  - [x] **TASK 2.4.2:** Implementar deleção em cascata das categorias
    - Deleta budget_categories associadas
    - Deleta monthly_budgets
  - [x] **TASK 2.4.3:** Implementar logging de auditoria para deleção
    - Registra oldValues (dados do orçamento e categorias deletados)
    - Registra IP e User-Agent
  - [x] **TASK 2.4.4:** Retornar resposta no padrão da API
    - Formato: `{ data: { message, deletedBudget } }`
    - Status 200 OK

- [x] **TASK 2.5:** Criar endpoint `GET /api/budget/history` para histórico de orçamentos
  - Query: limit, offset, year (opcional)
  - Retorno: lista de orçamentos com resumo
  - [x] **TASK 2.5.1:** Criar schema Zod para validação dos query params (limit, offset, year)
    - limit: string opcional, default '10', convertido para número
    - offset: string opcional, default '0', convertido para número
    - year: string opcional, convertido para número
  - [x] **TASK 2.5.2:** Implementar validação dos parâmetros
    - limit: entre 1 e 100
    - offset: não negativo
    - year: entre 2020 e 2100 (se fornecido)
  - [x] **TASK 2.5.3:** Implementar busca de orçamentos no banco
    - Filtrar por userId
    - Filtrar por year (opcional)
    - Aplicar limit e offset
    - Ordenar por ano/mês
  - [x] **TASK 2.5.4:** Calcular resumo para cada orçamento
    - Buscar categorias de cada orçamento
    - Calcular gastos totais do mês baseado nas transações
    - Calcular spentTotal, remainingTotal, percentageUsed
  - [x] **TASK 2.5.5:** Processar e ordenar resultados
    - Ordenar por ano/mês decrescente (mais recentes primeiro)
    - Retornar metadados de paginação
  - [x] **TASK 2.5.6:** Implementar logging de auditoria
    - Log action 'read' para entidade 'monthly_budget'
    - Registrar parâmetros da requisição
  - [x] **TASK 2.5.7:** Retornar resposta no padrão da API
    - Formato: `{ data: { budgets: [...], meta: { limit, offset, year, total } } }`
    - Status 200 OK

- [x] **TASK 2.6:** Criar endpoint `POST /api/budget/calculate` para calcular gastos do mês
  - Calcula spentAmount baseado nas transações do usuário/casal
  - Atualiza automaticamente budget_categories.spentAmount
  - Retorna: `{ data: { categories: [...], totalSpent, percentageUsed } }`
  - [x] **TASK 2.6.1:** Criar schema Zod para validação do body (month, year, context)
    - Validação de month (1-12), year (2020-2100), context (enum)
  - [x] **TASK 2.6.2:** Implementar middleware de autenticação e validação de permissões
    - requireAuth já aplicado no router
    - Validação de contexto joint (usuário precisa estar em casal)
  - [x] **TASK 2.6.3:** Implementar busca do orçamento no banco
    - Query na tabela monthly_budgets com filters: userId, month, year, context
    - Retorno 404 se orçamento não encontrado
  - [x] **TASK 2.6.4:** Buscar categorias do orçamento
    - Query na tabela budget_categories filtrando por budgetId
  - [x] **TASK 2.6.5:** Calcular gastos totais baseado nas transações do mês
    - Definir período do mês (startDate, endDate)
    - Query de agregação com SUM nas transações (type=expense)
    - Filtros: userId, type, date range, context, coupleId (se joint)
    - Agrupamento por categoria
  - [x] **TASK 2.6.6:** Processar e formatar dados das categorias
    - Mapear expenses por categoria usando Map
    - Calcular spentAmount, remainingAmount, percentageUsed por categoria
    - Calcular totalSpent somando todas as categorias
  - [x] **TASK 2.6.7:** Atualizar spentAmount no banco de dados
    - Update em budget_categories.spentAmount para cada categoria
    - Atualizar updatedAt
  - [x] **TASK 2.6.8:** Implementar logging de auditoria
    - Log action 'update' para entidade 'monthly_budget'
    - Registrar parâmetros e categorias atualizadas
  - [x] **TASK 2.6.9:** Retornar resposta no padrão da API
    - Formato: `{ data: { categories: [...], totalSpent, percentageUsed } }`
    - Status 200 OK

#### Média Prioridade

- [x] **TASK 2.7:** Criar endpoint `GET /api/budget/alerts` para verificar alertas de orçamento
  - Verifica categorias que ultrapassaram threshold (ex: 80%, 100%)
  - Cria notificações do tipo `budget_alert` automaticamente
  - Retorno: `{ data: { alerts: [{ category, limit, spent, percentage }] } }`
  - **Subtasks concluídas:**
    - [x] **TASK 2.7.1:** Importar pushNotifications do schema
    - [x] **TASK 2.7.2:** Implementar busca de orçamentos dos últimos 3 meses
    - [x] **TASK 2.7.3:** Calcular gastos por categoria baseado nas transações
    - [x] **TASK 2.7.4:** Verificar categorias que ultrapassaram o threshold
    - [x] **TASK 2.7.5:** Criar notificações budget_alert automaticamente
    - [x] **TASK 2.7.6:** Implementar logging de auditoria
    - [x] **TASK 2.7.7:** Retornar resposta no padrão da API

- [x] **TASK 2.8:** Criar rota no index.ts para registrar todas as rotas de budget
  - [x] **TASK 2.8.1:** Importar router de budget no index.ts
    - Adicionar `import budgetRoutes from './routes/budget'`
  - [x] **TASK 2.8.2:** Registrar rota em `/api/budget`
    - Adicionar `app.route('/api/budget', budgetRoutes)`
  - [x] **TASK 2.8.3:** Verificar integração com outras rotas
    - Validar ordem de registro das rotas
    - Testar conflitação de rotas

### Frontend - Componentes UI

#### Alta Prioridade

- [x] **TASK 3.1:** Criar componente `BudgetScreen.tsx` ✅ **CONCLUÍDA**
  - Layout similar ao Dashboard
  - Toggle de contexto (individual/joint)
  - Seletor de mês/ano
  - Display do orçamento total vs gasto total
  - Lista de categorias com limites e gastos
  
  **Subtasks quebradas para melhor gerenciamento:**
  - [x] **TASK 3.1.1:** Criar estrutura básica do componente BudgetScreen.tsx
    - Imports e types
    - Interface BudgetScreenProps
    - Motion animations conforme SPEC.md
  - [x] **TASK 3.1.2:** Implementar seletor de mês/ano
    - Navegação entre meses (prev/next)
    - Display do mês/ano atual
    - Labels contextuais (individual/joint)
  - [x] **TASK 3.1.3:** Implementar estados de loading, error e empty state
    - Loading spinner
    - Error handling com mensagens claras
    - Empty state com call-to-action
  - [x] **TASK 3.1.4:** Implementar card de resumo do orçamento
    - Display do orçamento total
    - Gasto total e restante
    - Barra de progresso animada
    - Alerta visual quando >80% utilizado
  - [x] **TASK 3.1.5:** Implementar lista de categorias
    - Ícone, nome e limite por categoria
    - Gasto atual e porcentagem utilizada
    - Barra de progresso por categoria
    - Cores contextuais (<80%, 80-100%, >100%)
  - [x] **TASK 3.1.6:** Adicionar tipos Budget e BudgetCategory no api.ts
  - [x] **TASK 3.1.7:** Criar budgetApi com endpoints
    - GET /api/budget/:month/:year
    - POST /api/budget
    - PATCH /api/budget/:id
    - DELETE /api/budget/:id
    - GET /api/budget/history
    - POST /api/budget/calculate
    - GET /api/budget/alerts

- [x] **TASK 3.2:** Criar componente `BudgetCard.tsx` para exibição do orçamento ✅ **CONCLUÍDA**
  - Mostra: total budget, spent, remaining
  - Barra de progresso visual
  - Porcentagem utilizada
  - Cores: verde (<80%), amarelo (80-100%), vermelho (>100%)
  
  **Subtasks quebradas para melhor gerenciamento:**
  - [x] **TASK 3.2.1:** Criar estrutura básica do componente BudgetCard.tsx
    - Imports (React, Motion, Lucide)
    - Interface BudgetCardProps tipada
    - Export default do componente
  - [x] **TASK 3.2.2:** Implementar formatação de valores monetários
    - Função formatCurrency com locale pt-BR
    - Separação de inteiros e decimais para exibição elegante
  - [x] **TASK 3.2.3:** Implementar lógica de cores contextuais
    - getProgressColor: retorna classes text-negative, text-amber-400, text-positive
    - getProgressBarColor: retorna classes bg-negative, bg-amber-400, bg-positive
    - Thresholds: <80% verde, 80-100% amarelo, >100% vermelho
  - [x] **TASK 3.2.4:** Implementar exibição do orçamento total
    - Display com font-headings
    - Formatação em duas partes (inteiro e decimal)
  - [x] **TASK 3.2.5:** Implementar grid de gasto e restante
    - Layout grid-cols-2
    - Valores coloridos conforme porcentagem
    - Labels uppercase tracking-widest
  - [x] **TASK 3.2.6:** Implementar barra de progresso animada
    - Motion.div com animate de width
    - Transição easeOut com delay
    - Limite máximo de 100% na largura
  - [x] **TASK 3.2.7:** Implementar alertas visuais
    - Alerta amarelo para 80-100% (isNearLimit)
    - Alerta vermelho para >100% (isOverBudget)
    - Animações de entrada com scale e opacity
  - [x] **TASK 3.2.8:** Integrar BudgetCard no BudgetScreen
    - Import do componente
    - Substituição do card inline pelo componente reutilizável
    - Passagem de props: totalBudget, spent, remaining, percentageUsed, context, showAlert

- [ ] **TASK 3.3:** Criar componente `CategoryBudgetItem.tsx`
  - Ícone da categoria
  - Nome da categoria
  - Limite definido
  - Gasto atual
  - Barra de progresso por categoria
  - Alerta visual se próximo do limite

- [ ] **TASK 3.4:** Criar modal `BudgetModal.tsx` para criar/editar orçamento
  - Bottom sheet (seguir padrão do ActionModal)
  - Input de valor total do orçamento
  - Lista de categorias para definir limites individuais
  - Toggle para ativar/desativar alertas
  - Botões: Cancelar, Salvar

- [ ] **TASK 3.5:** Integrar BudgetScreen no App.tsx
  - Adicionar ícone de orçamento no menu inferior
  - Navegação via screen state
  - Context toggle compartilhado

#### Média Prioridade

- [ ] **TASK 3.6:** Criar componente `BudgetAlert.tsx` para notificações visuais
  - Toast ou banner quando orçamento está próximo do limite
  - Exibir quando >80% do orçamento utilizado
  - Link rápido para ajustar orçamento

- [ ] **TASK 3.7:** Criar hook `useBudget.ts` para gerenciamento de estado
  - fetchBudget(month, year, context)
  - createBudget(data)
  - updateBudget(id, data)
  - deleteBudget(id)
  - calculateSpent(month, year)
  - checkAlerts()

### Frontend - Integração

#### Alta Prioridade

- [ ] **TASK 4.1:** Integrar endpoints de budget no useBudget hook
  - GET /budget/:month/:year
  - POST /budget
  - PATCH /budget/:id
  - DELETE /budget/:id
  - POST /budget/calculate

- [ ] **TASK 4.2:** Atualizar contexto de auth para incluir preferências de orçamento
  - Armazenar mês/ano selecionado
  - Persistir contexto (individual/joint)

- [ ] **TASK 4.3:** Tratamento de erros da API na UI
  - Mensagens claras para erros de validação
  - Feedback visual de loading
  - Error states para falhas na requisição

- [ ] **TASK 4.4:** Calcular automaticamente gastos ao carregar BudgetScreen
  - Chamar calculateSpent ao montar componente
  - Atualizar UI em tempo real

#### Média Prioridade

- [ ] **TASK 4.5:** Integrar sistema de notificações com alertas de orçamento
  - Usar useNotifications existente
  - Exibir budget_alerts no painel de notificações
  - Polling para novos alertas

### Segurança & Validação

#### Alta Prioridade

- [ ] **TASK 5.1:** Validar permissões de acesso ao orçamento
  - Usuário só pode ver/editar seus próprios orçamentos
  - Em contexto joint, ambos podem editar
  - Middleware requireAuth em todas as rotas

- [ ] **TASK 5.2:** Validação Zod completa nos endpoints
  - Month: 1-12
  - Year: 2020-2100
  - Amounts: positivos, máximo 999999.99
  - Categories: enum válido
  - Threshold: 0-100

- [ ] **TASK 5.3:** Rate limiting nos endpoints de budget
  - Prevenir abuso de criação/atualização
  - Máximo 10 requisições/minuto

- [ ] **TASK 5.4:** Logging de auditoria para mudanças de orçamento
  - Registrar no audit_logs
  - Ações: create, update, delete
  - Old values e new values em JSON

### UX & Acessibilidade

#### Alta Prioridade

- [ ] **TASK 6.1:** Mensagens de erro claras na UI
  - "Orçamento não encontrado para este mês"
  - "Valor inválido para orçamento"
  - "Categoria sem limite definido"

- [ ] **TASK 6.2:** Skeleton screens durante loading
  - BudgetSkeleton para tela principal
  - CategorySkeleton para lista de categorias
  - Seguir padrão do SettingsSkeleton

- [ ] **TASK 6.3:** Garantir acessibilidade (ARIA labels, focus states)
  - Labels em todos os inputs
  - Focus states visíveis
  - aria-live para atualizações dinâmicas
  - Suporte a navegação por teclado

- [ ] **TASK 6.4:** Testar responsividade em mobile
  - Layout adaptável para telas pequenas
  - Bottom sheet otimizado para mobile
  - Touch targets adequados (mínimo 44px)

#### Média Prioridade

- [ ] **TASK 6.5:** Animações Motion para transições
  - Fade in/out ao trocar de mês
  - Spring transition em barras de progresso
  - Slide up para modais

- [ ] **TASK 6.6:** Feedback visual interativo
  - Hover states em botões e cards
  - Active states durante ações
  - Loading spinners em operações assíncronas

---

## 🚧 Em Progresso

*Nenhuma task em progresso no momento*

---

## ✅ Concluído

- [x] **TASK 0.1:** Analisar SPEC.md e CHECKLIST.md para entender requisitos
- [x] **TASK 0.2:** Verificar schema atual do banco de dados
  - ✅ `budget_alert` já existe no notificationTypeEnum
  - ❌ Tabelas `monthly_budgets` e `budget_categories` não existem
- [x] **TASK 0.3:** Revisar componentes existentes no frontend
  - ✅ ActionModal como referência para BudgetModal
  - ✅ Dashboard como referência para BudgetScreen
  - ✅ Skeleton components como referência
- [x] **TASK 0.4:** Criar documento Kanban para organização das tasks
- [x] **TASK 2.1:** Criar endpoint POST /api/budget para criar orçamento mensal
  - [x] Validação Zod completa: month (1-12), year (2020-2100), totalBudget, context, categories
  - [x] Middleware requireAuth implementado
  - [x] Validação de permissão para contexto joint
  - [x] Verificação de duplicidade de orçamento (mês/ano/contexto)
  - [x] Criação do orçamento e categorias no banco
  - [x] Logging de auditoria implementado
  - [x] Rota registrada no index.ts
- [x] **TASK 2.2:** Criar endpoint GET /api/budget/:month/:year para buscar orçamento do mês
  - [x] Validação Zod para params (month, year) e query (context)
  - [x] Middleware requireAuth e validação de permissões
  - [x] Busca do orçamento no banco (monthly_budgets)
  - [x] Busca das categorias (budget_categories)
  - [x] Cálculo de gastos baseado em transações do mês
  - [x] Processamento e formatação dos dados (spentTotal, remainingTotal, percentageUsed)
  - [x] Logging de auditoria para leitura
  - [x] Retorno no padrão `{ data: { budget, categories, spentTotal, remainingTotal, percentageUsed } }`
- [x] **TASK 2.3:** Criar endpoint PATCH /api/budget/:id para atualizar orçamento
  - [x] Validação Zod para params (id) e body (totalBudget, categories)
  - [x] Middleware requireAuth e validação de permissões (dono do orçamento, contexto joint)
  - [x] Busca e validação do orçamento existente
  - [x] Atualização do totalBudget (se fornecido)
  - [x] Atualização/criação de categorias (upsert)
  - [x] Cálculo automático do spentAmount baseado nas transações
  - [x] Atualização do spentAmount no banco de dados
  - [x] Logging de auditoria para atualização
  - [x] Retorno no padrão `{ data: { budget, categories, spentTotal, remainingTotal, percentageUsed } }`

---

## 📌 Notas de Implementação

### Prioridades

1. **Alta Prioridade (Sprint 1):**
   - TASK 1.1: Schema monthly_budgets
   - TASK 1.2: Schema budget_categories
   - TASK 2.1: Endpoint POST /budget
   - TASK 2.2: Endpoint GET /budget/:month/:year
   - TASK 3.1: BudgetScreen UI
   - TASK 3.4: BudgetModal para criar/editar

2. **Média Prioridade (Sprint 2):**
   - TASK 2.6: Calcular gastos automaticamente
   - TASK 2.7: Sistema de alertas
   - TASK 3.2-3.3: Componentes de exibição
   - TASK 4.x: Integração frontend-backend

3. **Baixa Prioridade (Sprint 3):**
   - TASK 3.6: BudgetAlert component
   - TASK 6.5-6.6: Animações e feedback visual refinado
   - TASK 2.8: Histórico de orçamentos

### Dependências

```
TASK 1.x (Schema) → TASK 2.x (API) → TASK 4.x (Integração)
                         ↓
                    TASK 3.x (UI)
                         ↓
                    TASK 6.x (UX)
```

### Guidelines Específicas

**Backend:**
- Seguir padrão Hono com zValidator
- Usar requireAuth middleware em todas as rotas
- Respostas no formato `{ data: {...} }` ou `{ error: "..." }`
- Manter consistência com existing endpoints (transactions, savings)

**Frontend:**
- Componentes com Motion para animações
- Tipagem TypeScript estrita
- Hooks customizados para state management
- Design system: cores, bordas (24px-32px), dark mode
- Mobile-first approach

**Banco de Dados:**
- Usar Drizzle ORM para todas as queries
- Migrations versionadas
- Indexes apropriados para performance (month, year, userId, coupleId)

### Cálculos Importantes

**Orçamento Total:**
```typescript
remainingTotal = totalBudget - totalSpent
percentageUsed = (totalSpent / totalBudget) * 100
```

**Por Categoria:**
```typescript
categoryRemaining = categoryLimit - categorySpent
categoryPercentage = (categorySpent / categoryLimit) * 100
alertTriggered = categoryPercentage >= alertThreshold
```

**Cores de Status:**
- Verde: `percentageUsed < 80`
- Amarelo: `80 <= percentageUsed < 100`
- Vermelho: `percentageUsed >= 100`

---

## 📊 Progresso

| Categoria | Total | Feito | Em Progresso | Pendente |
|-----------|-------|-------|--------------|----------|
| Backend - Schema | 3 | 3 | 0 | 0 |
| Backend - API | 8 | 2 | 0 | 6 |
| Frontend - UI | 7 | 0 | 0 | 7 |
| Frontend - Integração | 5 | 0 | 0 | 5 |
| Segurança | 4 | 0 | 0 | 4 |
| UX | 6 | 1 | 0 | 5 |
| **Total** | **33** | **6** | **0** | **27** |

**Progresso Geral:** 18% (6/33 tasks) - **ENDPOINTS POST E PATCH /api/budget IMPLEMENTADOS**

---

## 🎯 Definição de Pronto (DoD)

Um feature de orçamento é considerada **pronta** quando:

### Funcional
- [ ] Usuário pode criar orçamento para um mês específico
- [ ] Usuário pode definir limites por categoria
- [ ] Gastos são calculados automaticamente baseado nas transações
- [ ] Alertas são gerados quando categorias atingem threshold
- [ ] Visualização clara do orçamento restante

### Técnico
- [ ] Schema do banco criado e migrado
- [ ] Endpoints CRUD completos
- [ ] Validações Zod implementadas
- [ ] Frontend integrado com backend
- [ ] Tratamento de erros adequado

### UX/UI
- [ ] Design consistente com resto da aplicação
- [ ] Responsivo em mobile e desktop
- [ ] Acessível (ARIA labels, keyboard navigation)
- [ ] Animações fluidas
- [ ] Feedback visual em todas as interações

---

*Última atualização: Dezembro 2024 - **KANBAN CRIADO** 📋

**Próximos Passos Imediatos:**
1. Implementar TASK 1.1 e 1.2 (schema do banco)
2. Criar migrations correspondentes
3. Implementar TASK 2.1 e 2.2 (endpoints básicos)
4. Criar TASK 3.1 e 3.4 (UI da BudgetScreen e BudgetModal)

**Checklist Relacionado:**
- CHECKLIST.md menciona "Orçamento mensal" como Alta Prioridade em Média Prioridade
- Status atual: ❌ Não implementado
- Impacto: Alto | Esforço: Alto
