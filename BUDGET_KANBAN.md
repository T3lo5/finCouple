# 📋 Kanban - Orçamento Mensal FinCouple

**Objetivo:** Implementar sistema completo de orçamento mensal conforme SPEC.md e CHECKLIST.md
**Status Geral:** 🔴 **NÃO INICIADO** - 0% implementado

---

## 📝 Backlog (Tarefas a Fazer)

### Backend - Schema & Banco de Dados

#### Alta Prioridade

- [ ] **TASK 1.1:** Criar tabela `monthly_budgets` no schema
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

- [ ] **TASK 1.2:** Criar tabela `budget_categories` para limites por categoria
  - Campos necessários:
    - `id` (nanoid, primary key)
    - `budgetId` (FK → monthly_budgets.id)
    - `category` (enum: dining, home, transport, shopping, health, travel, bills, salary, investment, other)
    - `limitAmount` (numeric precision 12 scale 2)
    - `spentAmount` (numeric precision 12 scale 2, default 0)
    - `alertThreshold` (numeric precision 5 scale 2, default 80.00 - porcentagem)
    - `createdAt`, `updatedAt` (timestamp)
  - Adicionar migration correspondente

- [ ] **TASK 1.3:** Atualizar enum `notification_type` se necessário (já existe `budget_alert`)
  - ✅ Verificado: `budget_alert` já existe no schema (linha 156)

### Backend - API Endpoints

#### Alta Prioridade

- [ ] **TASK 2.1:** Criar endpoint `POST /api/budget` para criar orçamento mensal
  - Validação Zod: month (1-12), year, totalBudget, context, categories (array opcional)
  - Middleware requireAuth
  - Retorno: `{ data: { budget, categories } }`

- [ ] **TASK 2.2:** Criar endpoint `GET /api/budget/:month/:year` para buscar orçamento do mês
  - Params: month, year
  - Query: context (individual/joint)
  - Retorno: `{ data: { budget, categories, spentTotal, remainingTotal } }`

- [ ] **TASK 2.3:** Criar endpoint `PATCH /api/budget/:id` para atualizar orçamento
  - Validação: apenas campos atualizáveis (totalBudget, categories)
  - Atualizar spentAmount automaticamente baseado nas transações do mês

- [ ] **TASK 2.4:** Criar endpoint `DELETE /api/budget/:id` para deletar orçamento
  - Soft delete ou hard delete (definir na implementação)
  - Confirmação de segurança

- [ ] **TASK 2.5:** Criar endpoint `GET /api/budget/history` para histórico de orçamentos
  - Query: limit, offset, year (opcional)
  - Retorno: lista de orçamentos com resumo

- [ ] **TASK 2.6:** Criar endpoint `POST /api/budget/calculate` para calcular gastos do mês
  - Calcula spentAmount baseado nas transações do usuário/casal
  - Atualiza automaticamente budget_categories.spentAmount
  - Retorna: `{ data: { categories: [...], totalSpent, percentageUsed } }`

#### Média Prioridade

- [ ] **TASK 2.7:** Criar endpoint `GET /api/budget/alerts` para verificar alertas de orçamento
  - Verifica categorias que ultrapassaram threshold (ex: 80%, 100%)
  - Cria notificações do tipo `budget_alert` automaticamente
  - Retorno: `{ data: { alerts: [{ category, limit, spent, percentage }] } }`

- [ ] **TASK 2.8:** Criar rota no index.ts para registrar todas as rotas de budget
  - Importar router de budget
  - Registrar em `/api/budget`

### Frontend - Componentes UI

#### Alta Prioridade

- [ ] **TASK 3.1:** Criar componente `BudgetScreen.tsx`
  - Layout similar ao Dashboard
  - Toggle de contexto (individual/joint)
  - Seletor de mês/ano
  - Display do orçamento total vs gasto total
  - Lista de categorias com limites e gastos

- [ ] **TASK 3.2:** Criar componente `BudgetCard.tsx` para exibição do orçamento
  - Mostra: total budget, spent, remaining
  - Barra de progresso visual
  - Porcentagem utilizada
  - Cores: verde (<80%), amarelo (80-100%), vermelho (>100%)

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
| Backend - Schema | 3 | 1 | 0 | 2 |
| Backend - API | 8 | 0 | 0 | 8 |
| Frontend - UI | 7 | 0 | 0 | 7 |
| Frontend - Integração | 5 | 0 | 0 | 5 |
| Segurança | 4 | 0 | 0 | 4 |
| UX | 6 | 1 | 0 | 5 |
| **Total** | **33** | **2** | **0** | **31** |

**Progresso Geral:** 6% (2/33 tasks) - **FASE DE PLANEJAMENTO CONCLUÍDA**

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
