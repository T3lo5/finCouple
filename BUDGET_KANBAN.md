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

- [x] **TASK 3.3:** Criar componente `CategoryBudgetItem.tsx` ✅ **CONCLUÍDA**
  - Ícone da categoria
  - Nome da categoria
  - Limite definido
  - Gasto atual
  - Barra de progresso por categoria
  - Alerta visual se próximo do limite
  
  **Subtasks quebradas para melhor gerenciamento:**
  - [x] **TASK 3.3.1:** Criar estrutura básica do componente CategoryBudgetItem.tsx
    - Imports (React, Motion, Lucide)
    - Interface CategoryBudgetItemProps tipada
    - Export default do componente
  - [x] **TASK 3.3.2:** Implementar formatação de valores monetários
    - Função formatCurrency com locale pt-BR
    - Separação de inteiros e decimais para exibição elegante
  - [x] **TASK 3.3.3:** Implementar lógica de cores contextuais
    - getProgressColor: retorna classes text-muted, text-amber-400, text-negative
    - getProgressBarColor: retorna classes bg-positive, bg-amber-400, bg-negative
    - getBackgroundColor: retorna classes para o ícone da categoria
    - Thresholds: <80% verde, 80-100% amarelo, >100% vermelho
  - [x] **TASK 3.3.4:** Implementar exibição do ícone e nome da categoria
    - Ícone contextual com background colorido
    - Label da categoria
    - Limite definido em formato monetário
  - [x] **TASK 3.3.5:** Implementar exibição do gasto atual e porcentagem
    - Valor gasto formatado em BRL
    - Porcentagem utilizada com cor contextual
  - [x] **TASK 3.3.6:** Implementar barra de progresso animada
    - Motion.div com animate de width
    - Transição easeOut com delay
    - Limite máximo de 100% na largura
  - [x] **TASK 3.3.7:** Implementar exibição do valor restante
    - Condicional: mostra restante quando >0 e <80%
    - Mensagem de alerta quando limite ultrapassado
  - [x] **TASK 3.3.8:** Implementar alertas visuais
    - Alerta amarelo para 80-100% (isNearLimit)
    - Alerta vermelho para >100% (isOverBudget)
    - Animações de entrada com scale e opacity
  - [x] **TASK 3.3.9:** Integrar CategoryBudgetItem no BudgetScreen
    - Import do componente
    - Substituição do código inline pelo componente reutilizável
    - Passagem de props: category, icon, label, delay, showRemaining, showAlerts

- [x] **TASK 3.4:** Criar modal `BudgetModal.tsx` para criar/editar orçamento ✅ **CONCLUÍDA**
  - Bottom sheet (seguir padrão do ActionModal)
  - Input de valor total do orçamento
  - Lista de categorias para definir limites individuais
  - Toggle para ativar/desativar alertas
  - Botões: Cancelar, Salvar
  
  **Subtasks quebradas para melhor gerenciamento:**
  - [x] **TASK 3.4.1:** Criar estrutura básica do componente BudgetModal.tsx
    - Imports e types
    - Interface BudgetModalProps
    - Motion animations conforme SPEC.md
  - [x] **TASK 3.4.2:** Implementar bottom sheet modal com backdrop blur
    - Slide up animation com spring damping 25
    - Backdrop com blur e opacity
    - Handle superior decorativo
    - Altura máxima 85vh
  - [x] **TASK 3.4.3:** Implementar input de valor total do orçamento
    - Input numérico com formatação R$
    - Validação de valor positivo
    - Focus border primary/30
  - [x] **TASK 3.4.4:** Implementar lista de categorias com toggle
    - Checkbox customizado para ativar/desativar categorias
    - Ícone e label por categoria
    - Animação de expand/retract ao ativar
  - [x] **TASK 3.4.5:** Implementar input de limite por categoria
    - Input numérico com prefixo R$
    - Validação de valor positivo
    - Cálculo em tempo real do total alocado
  - [x] **TASK 3.4.6:** Implementar toggle de alertas global
    - Switch animado com spring transition
    - Controle se alertas são exibidos por categoria
    - Ícone contextual
  - [x] **TASK 3.4.7:** Implementar slider de threshold por categoria
    - Slider visual com barra de progresso
    - Botões de incremento/decremento (±5%)
    - Range 50-100%
  - [x] **TASK 3.4.8:** Implementar resumo de alocação orçamentária
    - Display do total alocado nas categorias
    - Display do restante para alocar
    - Alerta visual quando ultrapassa orçamento (isOverBudget)
  - [x] **TASK 3.4.9:** Implementar botões de ação (Cancelar, Salvar)
    - Grid 2 colunas no footer
    - Estados disabled e loading
    - Cores contextuais (individual/joint)
  - [x] **TASK 3.4.10:** Integrar BudgetModal no BudgetScreen
    - Import do componente
    - Estado isModalOpen no BudgetScreen
    - Callback onBudgetSaved para refresh dos dados
  - [x] **TASK 3.4.11:** Exportar CATEGORIES_META do BudgetModal
    - Reutilizar metadata das categorias no BudgetScreen
    - Manter consistência visual entre componentes

- [x] **TASK 3.5:** Integrar BudgetScreen no App.tsx ✅ **CONCLUÍDA**
  - Adicionar ícone de orçamento no menu inferior
  - Navegação via screen state
  - Context toggle compartilhado
  
  **Subtasks quebradas para melhor gerenciamento:**
  - [x] **TASK 3.5.1:** Importar BudgetScreen no App.tsx
    - Import do componente na linha 31
  - [x] **TASK 3.5.2:** Adicionar ícone Wallet ao navItems
    - Ícone adicionado na linha 1377: `{ screen: 'budget', icon: <Wallet size={24} /> }`
  - [x] **TASK 3.5.3:** Implementar navegação via screen state para budget
    - Condicional `activeScreen === 'budget'` na linha 1496
    - Renderização do BudgetScreen com key dinâmica
  - [x] **TASK 3.5.4:** Passar context como prop para BudgetScreen
    - Prop `context={context}` passada na linha 1497
    - Contexto compartilhado do App.tsx para controle individual/joint
  - [x] **TASK 3.5.5:** Verificar integração com ContextToggle
    - BudgetScreen responde às mudanças de contexto
    - Cores e labels atualizados conforme contexto

#### Média Prioridade

- [x] **TASK 3.6:** Criar componente `BudgetAlert.tsx` para notificações visuais ✅ **CONCLUÍDA**
  - Toast ou banner quando orçamento está próximo do limite
  - Exibir quando >80% do orçamento utilizado
  - Link rápido para ajustar orçamento
  
  **Subtasks quebradas para melhor gerenciamento:**
  - [x] **TASK 3.6.1:** Criar estrutura básica do componente BudgetAlert.tsx
    - Imports (React, Motion, Lucide)
    - Interface BudgetAlertProps tipada
    - Export default do componente
  - [x] **TASK 3.6.2:** Implementar lógica de detecção de alertas
    - isOverBudget: >= 100%
    - isNearLimit: 80-100%
    - isWarning: 70-80%
  - [x] **TASK 3.6.3:** Implementar configurações de alerta baseadas no nível
    - getAlertConfig: retorna bgColor, borderColor, iconColor, textColor, title, message
    - Cores: negative (vermelho), amber-500 (âmbar), blue-500 (azul)
  - [x] **TASK 3.6.4:** Implementar exibição condicional
    - Retorna null se não estiver em nenhuma faixa de alerta
    - Respeita prop visible para controle externo
  - [x] **TASK 3.6.5:** Implementar formatação de valores monetários
    - Função formatCurrency com locale pt-BR
    - Separação de inteiros e decimais
  - [x] **TASK 3.6.6:** Implementar layout do toast/banner
    - Posição fixed top-4 left-4 right-4
    - Z-index 50 para sobreposição
    - Backdrop blur e shadow
    - Border-radius 2xl
  - [x] **TASK 3.6.7:** Implementar ícone com animação
    - AlertTriangle para alertas críticos/aviso
    - Wallet para informativo
    - Animação de pulso infinita para overBudget
  - [x] **TASK 3.6.8:** Implementar resumo dos valores
    - Grid com Total, Gasto e Restante
    - Cores contextuais
    - Valor restante negativo destacado em red
  - [x] **TASK 3.6.9:** Implementar barra de progresso animada
    - Motion.div com animate de width
    - Limite máximo de 100%
    - Cores baseadas no nível de alerta
  - [x] **TASK 3.6.10:** Implementar ações do alerta
    - Botão "Ajustar Orçamento" com callback onAdjustBudget
    - Botão "Entendi" com callback onDismiss
    - Animações hover e tap
  - [x] **TASK 3.6.11:** Implementar botão de dismiss
    - Ícone X no canto superior direito
    - Animações hover e tap
    - Aria-label para acessibilidade
  - [x] **TASK 3.6.12:** Implementar animações de entrada/saída
    - AnimatePresence do Motion
    - Initial: opacity 0, y -20, scale 0.95
    - Animate: opacity 1, y 0, scale 1
    - Exit: opacity 0, y -20, scale 0.95
  - [x] **TASK 3.6.13:** Integrar BudgetAlert no BudgetScreen
    - Import do componente
    - Passagem de props: percentageUsed, totalBudget, spent, remaining
    - Callbacks: onAdjustBudget (abre modal), onDismiss (fecha alerta)
    - Controle de visibilidade baseado em showAlert e percentageUsed >= 80

- [x] **TASK 3.7:** Criar hook `useBudget.ts` para gerenciamento de estado ✅ **CONCLUÍDA**
  - [x] **TASK 3.7.1:** Criar interfaces TypeScript para BudgetWithDetails, BudgetAlert, CreateBudgetData, UpdateBudgetData
  - [x] **TASK 3.7.2:** Implementar fetchBudget(month, year, context)
    - Busca orçamento via budgetApi.get()
    - Atualiza estado local com budget, categories, spentTotal, remainingTotal, percentageUsed
    - Tratamento de erros e loading state
  - [x] **TASK 3.7.3:** Implementar createBudget(data)
    - Cria orçamento via budgetApi.create()
    - Inicializa spentTotal=0, remainingTotal=totalBudget, percentageUsed=0
    - Atualiza estado local com budget criado
  - [x] **TASK 3.7.4:** Implementar updateBudget(id, data)
    - Atualiza orçamento via budgetApi.update()
    - Sincroniza estado local com dados retornados
    - Mantém spentTotal, remainingTotal, percentageUsed atualizados
  - [x] **TASK 3.7.5:** Implementar deleteBudget(id)
    - Deleta orçamento via budgetApi.delete() com confirmação
    - Limpa estado local (setBudget(null))
  - [x] **TASK 3.7.6:** Implementar calculateSpent(month, year)
    - Calcula gastos via budgetApi.calculate()
    - Atualiza categorias com spentAmount calculado
    - Recalcula spentTotal, remainingTotal, percentageUsed
  - [x] **TASK 3.7.7:** Implementar checkAlerts()
    - Verifica alertas via budgetApi.alerts()
    - Retorna categorias que ultrapassaram threshold
    - Armazena alertas em estado local
  - [x] **TASK 3.7.8:** Implementar clearBudget() utilitário
    - Limpa estado do budget ao desmontar ou trocar contexto
  - [x] **TASK 3.7.9:** Adicionar tipos e interfaces exportáveis
    - BudgetWithDetails: Budget + categories + campos calculados
    - BudgetAlert: categoria, limite, gasto, porcentagem
    - CreateBudgetData: dados para criação
    - UpdateBudgetData: dados para atualização

### Frontend - Integração

#### Alta Prioridade

- [x] **TASK 4.1:** Integrar endpoints de budget no useBudget hook
  - [x] **TASK 4.1.1:** Implementar método fetchBudget no useBudget hook
    - Integração com GET /api/budget/:month/:year
    - Suporte a query params context (individual/joint)
    - Tratamento de loading e error states
    - Retorno formatado com budget, categories, spentTotal, remainingTotal, percentageUsed
  - [x] **TASK 4.1.2:** Implementar método createBudget no useBudget hook
    - Integração com POST /api/budget
    - Validação de dados de entrada (month, year, totalBudget, context, categories)
    - Tratamento de erros de duplicidade (409 Conflict)
    - Atualização do estado local após criação
  - [x] **TASK 4.1.3:** Implementar método updateBudget no useBudget hook
    - Integração com PATCH /api/budget/:id
    - Suporte a atualização parcial (totalBudget e/ou categories)
    - Recálculo automático de spentTotal, remainingTotal, percentageUsed
    - Atualização otimista do estado local
  - [x] **TASK 4.1.4:** Implementar método deleteBudget no useBudget hook
    - Integração com DELETE /api/budget/:id
    - Confirmação de segurança obrigatória
    - Limpeza do estado local após deleção
    - Tratamento de erros de permissão
  - [x] **TASK 4.1.5:** Implementar método calculateSpent no useBudget hook
    - Integração com POST /api/budget/calculate
    - Atualização automática dos spentAmount das categorias
    - Sincronização com estado local do budget
    - Retorno de totalSpent e percentageUsed
  - [x] **TASK 4.1.6:** Implementar método checkAlerts no useBudget hook
    - Integração com GET /api/budget/alerts
    - Verificação de categorias que ultrapassaram threshold
    - Armazenamento de alertas no estado local
  - [x] **TASK 4.1.7:** Implementar método clearBudget no useBudget hook
    - Limpeza de estado ao desmontar componente
    - Reset de alerts e error states
  - [x] **TASK 4.1.8:** Adicionar tipos BudgetWithDetails e BudgetAlert no hook
    - Interface BudgetWithDetails estendendo Budget
    - Campos calculados: spentTotal, remainingTotal, percentageUsed
    - Interface BudgetAlert com category, limit, spent, percentage

- [ ] **TASK 4.2:** Atualizar contexto de auth para incluir preferências de orçamento
  - Armazenar mês/ano selecionado
  - Persistir contexto (individual/joint)
  
  **Subtasks quebradas para melhor gerenciamento:**
  - [ ] **TASK 4.2.1:** Criar interface BudgetPreferences no api.ts
    - Campos: selectedMonth, selectedYear, budgetContext
  - [ ] **TASK 4.2.2:** Criar endpoint PATCH /api/auth/preferences/budget no backend
    - Validação Zod para month (1-12), year (2020-2100), context (enum)
    - Atualizar tabela users com novas colunas de preferências
  - [ ] **TASK 4.2.3:** Adicionar método updateBudgetPreferences no authApi
    - Integrar com endpoint do backend
  - [ ] **TASK 4.2.4:** Criar hook useBudgetPreferences.ts
    - Estado local para month/year/context
    - Persistência em localStorage
    - Integração com API para sincronização
  - [ ] **TASK 4.2.5:** Integrar useBudgetPreferences no BudgetScreen
    - Substituir estados locais selectedMonth/selectedYear
    - Usar contexto persistido das preferências
  - [ ] **TASK 4.2.6:** Adicionar colunas no schema de users para preferências
    - budgetDefaultMonth, budgetDefaultYear, budgetDefaultContext
    - Criar migration correspondente

- [x] **TASK 4.3:** Tratamento de erros da API na UI
  - [x] **TASK 4.3.1:** Mensagens claras para erros de validação
    - Implementado no useBudget.ts: handleApiError e extractValidationErrors
    - Mensagens específicas por status code (400, 401, 403, 404, 409, 500)
    - Validação de campos: month, year, totalBudget, context, categories, limitAmount
  - [x] **TASK 4.3.2:** Feedback visual de loading
    - Skeleton screens implementados (BudgetSkeleton, BudgetCardSkeleton, CategoryBudgetSkeleton)
    - Substituição do spinner simples por skeleton completo
    - Loading states integrados no hook useBudget
  - [x] **TASK 4.3.3:** Error states para falhas na requisição
    - Error state com ícone AlertTriangle e mensagem clara
    - Exibição de validationErrors em lista
    - ARIA labels para acessibilidade (role="alert", aria-live="assertive")
  - [x] **TASK 4.3.4:** Melhorar acessibilidade
    - Labels ARIA nos botões de navegação (aria-label)
    - role="list" na lista de categorias
    - aria-labelledby no heading de categorias
    - aria-hidden="true" em ícones decorativos

- [ ] **TASK 4.4:** Calcular automaticamente gastos ao carregar BudgetScreen
  - Chamar calculateSpent ao montar componente
  - Atualizar UI em tempo real

#### Média Prioridade

- [x] **TASK 4.5:** Integrar sistema de notificações com alertas de orçamento ✅ **CONCLUÍDA**
  - [x] **TASK 4.5.1:** Atualizar useBudget.ts com polling de alertas
    - Adicionar opção `pollAlerts` e `alertPollInterval` nas opções do hook
    - Implementar useEffect para polling periódico de alertas
    - Manter intervalo padrão de 60 segundos para eficiência
  - [x] **TASK 4.5.2:** Atualizar useNotifications.ts para filtrar budget_alerts
    - Adicionar filtro useMemo para `budgetAlerts` (type === 'budget_alert')
    - Adicionar contador `unreadBudgetAlertsCount` para alerts não lidos
    - Exportar novas propriedades no retorno do hook
  - [x] **TASK 4.5.3:** Integração backend já existente
    - Endpoint GET /api/budget/alerts já cria notificações budget_alert automaticamente
    - Notificações são persistidas na tabela push_notifications
    - Frontend já consome via budgetApi.alerts()

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

- [x] **TASK 6.1:** Mensagens de erro claras na UI ✅ **CONCLUÍDA via TASK 4.3.1**
  - "Orçamento não encontrado para este mês"
  - "Valor inválido para orçamento"
  - "Categoria sem limite definido"
  - Implementado no hook useBudget.ts com handleApiError e extractValidationErrors

- [x] **TASK 6.2:** Skeleton screens durante loading ✅ **CONCLUÍDA via TASK 4.3.2**
  - BudgetSkeleton para tela principal
  - CategoryBudgetSkeleton para lista de categorias
  - BudgetCardSkeleton para card de orçamento
  - Seguir padrão do SettingsSkeleton

- [x] **TASK 6.3:** Garantir acessibilidade (ARIA labels, focus states) ✅ **CONCLUÍDA via TASK 4.3.4**
  - Labels em todos os inputs (aria-label nos botões de navegação)
  - Focus states visíveis
  - aria-live para atualizações dinâmicas (role="alert", aria-live="assertive")
  - Suporte a navegação por teclado
  - aria-labelledby e role="list" na lista de categorias
  - aria-hidden="true" em ícones decorativos

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
