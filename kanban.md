# Kanban: Sistema de Contas Recorrentes, Parceladas e Cartões de Crédito

## 📋 Visão Geral

### Objetivo
Implementar um sistema completo para gerenciamento de:
1. **Contas Recorrentes** - Contas fixas mensais (aluguel, streaming, etc.)
2. **Contas Parceladas** - Compras divididas em X vezes (cartão de crédito)
3. **Cartões de Crédito** - Gestão de faturas com datas de fechamento/vencimento
4. **Notificações/Lembretes** - Alertas de vencimento

### Status Atual da Base de Código
| Componente | Status | Arquivo |
|------------|--------|---------|
| `recurringBills` (tabela) | ✅ Pronto | `backend/src/db/schema.ts:124-137` |
| `creditCardStatements` (tabela) | ✅ Pronto | `backend/src/db/schema.ts:63-76` |
| `accounts` (campos de crédito) | ✅ Pronto | `backend/src/db/schema.ts:54-58` |
| `/api/recurring` (rotas) | ✅ Pronto | `backend/src/routes/recurring.ts` |
| `/api/credit-card-statements` (rotas) | ✅ Pronto | `backend/src/routes/credit-card-statements.ts` |
| Sistema de notificações | ✅ Pronto | `backend/src/routes/notifications.ts` |
| **Tela de recorrentes (Frontend)** | ❌ Faltando | - |
| **Tela de parceladas (TUDO)** | ❌ Faltando | - |
| **Tela de faturas (Frontend)** | ❌ Faltando | - |
| **Scheduler de lembretes** | ❌ Faltando | - |

---

## 🚀 Sprint 1: Contas Recorrentes (Frontend)

**Objetivo**: Criar a interface visual para gestão de contas recorrentes, aproveitando a API já existente.

### Tasks

#### BE-1.1: Adicionar API de Recorrentes no Frontend
- [ ] **Task**: Adicionar `recurringApi` em `frontend/src/lib/api.ts`
- [ ] **Arquivos**: `frontend/src/lib/api.ts`
- [ ] **Descrição**:
  - Criar interface `RecurringBill` TypeScript
  - Criar objeto `recurringApi` com métodos:
    - `list(context?)` - GET `/api/recurring`
    - `create(body)` - POST `/api/recurring`
    - `update(id, body)` - PATCH `/api/recurring/:id`
    - `delete(id)` - DELETE `/api/recurring/:id`
    - `toggleActive(id)` - PATCH `/api/recurring/:id/toggle-active`
- [ ] **Dependências**: Nenhuma
- [ ] **Estimativa**: 1h

#### FE-1.2: Criar Hook `useRecurringBills`
- [ ] **Task**: Criar hook customizado para gerenciar contas recorrentes
- [ ] **Arquivos**: `frontend/src/hooks/useRecurringBills.ts`
- [ ] **Descrição**:
  - Estado para lista de recorrentes
  - Funções CRUD (create, update, delete, toggle)
  - Integração com `recurringApi`
  - Loading e error states
- [ ] **Dependências**: BE-1.1
- [ ] **Estimativa**: 1.5h

#### FE-1.3: Criar Tela `RecurringBillsScreen`
- [ ] **Task**: Criar tela principal de contas recorrentes
- [ ] **Arquivos**: `frontend/src/components/screens/RecurringBillsScreen.tsx`
- [ ] **Descrição**:
  - Layout similar ao `AccountsScreen`
  - Lista de contas recorrentes agrupadas por contexto (individual/joint)
  - Exibir: título, valor, frequência, próxima data de vencimento
  - Toggle para ativar/desativar
  - Botão para adicionar nova
- [ ] **Dependências**: FE-1.2
- [ ] **Estimativa**: 3h

#### FE-1.4: Criar Modal de Nova Conta Recorrente
- [ ] **Task**: Criar modal para adicionar/editar conta recorrente
- [ ] **Arquivos**: Integrado em `RecurringBillsScreen.tsx` ou componente separado
- [ ] **Descrição**:
  - Campos: título, valor, categoria, contexto, frequência, próxima data
  - Seleção de frequência: mensal (padrão), semanal, anual
  - Validação de campos
  - Integração com hook
- [ ] **Dependências**: FE-1.3
- [ ] **Estimativa**: 2h

#### FE-1.5: Adicionar Navegação para Contas Recorrentes
- [ ] **Task**: Integrar tela no fluxo de navegação do app
- [ ] **Arquivos**: `frontend/src/App.tsx`
- [ ] **Descrição**:
  - Adicionar `recurring` ao tipo `Screen`
  - Adicionar ícone no bottom nav (usar `Receipt` ou `Calendar`)
  - Adicionar lógica de renderização da tela
- [ ] **Dependências**: FE-1.3
- [ ] **Estimativa**: 0.5h

#### FE-1.6: Estilização e UX
- [ ] **Task**: Aplicar estilos consistentes com o design atual
- [ ] **Arquivos**: `RecurringBillsScreen.tsx`, `App.tsx`
- [ ] **Descrição**:
  - Animações com `motion/react` (seguir padrão do `AccountsScreen`)
  - Cores de contexto (individual = indigo, joint = primary)
  - Responsividade mobile-first
  - Skeleton loading states
- [ ] **Dependências**: FE-1.3
- [ ] **Estimativa**: 1.5h

**Total Sprint 1**: ~9.5 horas

---

## 🚀 Sprint 2: Compras Parceladas (Backend + Frontend)

**Objetivo**: Implementar modelo e CRUD para compras parceladas (não existe no backend).

### Tasks

#### DB-2.1: Criar Migração de Banco de Dados
- [ ] **Task**: Adicionar tabela `installment_purchases`
- [ ] **Arquivos**:
  - `backend/src/db/schema.ts`
  - Nova migração SQL
- [ ] **Descrição**:
  ```typescript
  // Nova tabela
  export const installmentPurchases = pgTable('installment_purchases', {
    id:                text('id').primaryKey().$defaultFn(() => nanoid()),
    userId:            text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    coupleId:          text('couple_id').references(() => couples.id, { onDelete: 'set null' }),
    accountId:         text('account_id').references(() => accounts.id, { onDelete: 'set null' }),
    title:             text('title').notNull(),
    totalAmount:       numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
    installmentCount:  integer('installment_count').notNull(),
    currentInstallment: integer('current_installment').notNull().default(1),
    installmentAmount: numeric('installment_amount', { precision: 12, scale: 2 }).notNull(),
    startDate:         timestamp('start_date').notNull(),
    nextDueDate:       timestamp('next_due_date').notNull(),
    category:          categoryEnum('category').notNull().default('shopping'),
    context:           contextEnum('context').notNull().default('individual'),
    isActive:          boolean('is_active').notNull().default(true),
    notes:             text('notes'),
    createdAt:         timestamp('created_at').defaultNow(),
    updatedAt:         timestamp('updated_at').defaultNow(),
  })

  // Relações
  export const installmentPurchasesRelations = relations(installmentPurchases, ({ one }) => ({
    user:    one(users, { fields: [installmentPurchases.userId], references: [users.id] }),
    couple:  one(couples, { fields: [installmentPurchases.coupleId], references: [couples.id] }),
    account: one(accounts, { fields: [installmentPurchases.accountId], references: [accounts.id] }),
  }))
  ```
- [ ] **Dependências**: Nenhuma
- [ ] **Estimativa**: 1h

#### BE-2.2: Criar Rotas `/api/installments`
- [ ] **Task**: Implementar CRUD para compras parceladas
- [ ] **Arquivos**: `backend/src/routes/installments.ts`
- [ ] **Descrição**:
  - `GET /` - Listar parceladas (filtro por contexto, isActive)
  - `POST /` - Criar nova compra parcelada
  - `GET /:id` - Obter detalhes
  - `PATCH /:id` - Atualizar
  - `DELETE /:id` - Excluir
  - `PATCH /:id/advance` - Avançar parcela manualmente
  - Validações com Zod
  - Autenticação via `requireAuth`
- [ ] **Dependências**: DB-2.1
- [ ] **Estimativa**: 2.5h

#### BE-2.3: Registrar Rotas no Index
- [ ] **Task**: Adicionar rotas de parceladas ao app principal
- [ ] **Arquivos**: `backend/src/index.ts`
- [ ] **Descrição**:
  - Importar router de installments
  - Registrar em `/api/installments`
- [ ] **Dependências**: BE-2.2
- [ ] **Estimativa**: 0.25h

#### FE-2.4: Adicionar API de Parceladas no Frontend
- [ ] **Task**: Criar interface e métodos de API
- [ ] **Arquivos**: `frontend/src/lib/api.ts`
- [ ] **Descrição**:
  ```typescript
  export interface InstallmentPurchase {
    id: string
    userId: string
    coupleId: string | null
    accountId: string | null
    title: string
    totalAmount: string
    installmentCount: number
    currentInstallment: number
    installmentAmount: string
    startDate: string
    nextDueDate: string
    category: Category
    context: Context
    isActive: boolean
    notes: string | null
  }

  export const installmentsApi = {
    list: (context?: Context) => request<{ data: InstallmentPurchase[] }>(...),
    get: (id: string) => request<{ data: InstallmentPurchase }>(...),
    create: (body: {...}) => request<{ data: InstallmentPurchase }>(...),
    update: (id: string, body: {...}) => request<{ data: InstallmentPurchase }>(...),
    delete: (id: string) => request<{ ok: boolean }>(...),
    advance: (id: string) => request<{ data: InstallmentPurchase }>(...),
  }
  ```
- [ ] **Dependências**: BE-2.2
- [ ] **Estimativa**: 1h

#### FE-2.5: Criar Hook `useInstallments`
- [ ] **Task**: Hook para gerenciar compras parceladas
- [ ] **Arquivos**: `frontend/src/hooks/useInstallments.ts`
- [ ] **Descrição**:
  - Estado para lista de parceladas
  - Funções CRUD
  - Função `advanceInstallment()` para avançar parcela
  - Loading/error states
- [ ] **Dependências**: FE-2.4
- [ ] **Estimativa**: 1.5h

#### FE-2.6: Criar Tela `InstallmentsScreen`
- [ ] **Task**: Tela principal de compras parceladas
- [ ] **Arquivos**: `frontend/src/components/screens/InstallmentsScreen.tsx`
- [ ] **Descrição**:
  - Lista de compras parceladas ativas
  - Exibir progresso (3/12 parcelas)
  - Card com informações: título, valor parcela, valor total, próxima data
  - Filtro por contexto
  - Botão de adicionar
- [ ] **Dependências**: FE-2.5
- [ ] **Estimativa**: 3h

#### FE-2.7: Criar Modal de Nova Compra Parcelada
- [ ] **Task**: Modal para cadastro de compra parcelada
- [ ] **Arquivos**: Integrado em `InstallmentsScreen.tsx`
- [ ] **Descrição**:
  - Campos: título, valor total, número de parcelas, data de início
  - Seleção de cartão de crédito (dropdown de accounts type=credit)
  - Cálculo automático do valor da parcela
  - Seleção de categoria e contexto
  - Validações
- [ ] **Dependências**: FE-2.6
- [ ] **Estimativa**: 2.5h

#### FE-2.8: Integração na Navegação
- [ ] **Task**: Adicionar tela ao fluxo de navegação
- [ ] **Arquivos**: `frontend/src/App.tsx`
- [ ] **Descrição**:
  - Decidir onde colocar:
    - Opção A: Nova aba "Parceladas" no bottom nav
    - Opção B: Integrar como subseção de contas/recorrentes
  - (Recomendado: Criar seção "Contas a Pagar" com sub-telas)
- [ ] **Dependências**: FE-2.6
- [ ] **Estimativa**: 0.5h

**Total Sprint 2**: ~12.25 horas

---

## 🚀 Sprint 3: Faturas de Cartão de Crédito (Frontend)

**Objetivo**: Criar interface para visualização e gestão de faturas (backend já existe).

### Tasks

#### FE-3.1: Criar Hook `useCreditCardStatements`
- [ ] **Task**: Hook para gerenciar faturas
- [ ] **Arquivos**: `frontend/src/hooks/useCreditCardStatements.ts`
- [ ] **Descrição**:
  - Usar `accountsApi.statements` já existente em `api.ts`
  - Estado para faturas
  - Funções: list, get, create, update, delete, pay
  - Filtro por accountId, month, year
- [ ] **Dependências**: Nenhuma (API já existe)
- [ ] **Estimativa**: 1.5h

#### FE-3.2: Criar Tela `CreditCardStatementsScreen`
- [ ] **Task**: Tela de gestão de faturas
- [ ] **Arquivos**: `frontend/src/components/screens/CreditCardStatementsScreen.tsx`
- [ ] **Descrição**:
  - Seletor de cartão de crédito (accounts type=credit)
  - Seletor de mês/ano
  - Card da fatura: total, mínimo, data vencimento, status (paga/aberta)
  - Lista de faturas por cartão
  - Botão para pagar fatura
- [ ] **Dependências**: FE-3.1
- [ ] **Estimativa**: 3h

#### FE-3.3: Integrar com Tela de Contas
- [ ] **Task**: Adicionar seção de faturas na `AccountsScreen`
- [ ] **Arquivos**: `frontend/src/components/screens/AccountsScreen.tsx`
- [ ] **Descrição**:
  - Para cada conta type=credit, mostrar card especial com:
    - Limite disponível
    - Data de fechamento da fatura atual
    - Data de vencimento
    - Link para ver faturas detalhadas
- [ ] **Dependências**: FE-3.2
- [ ] **Estimativa**: 2h

#### FE-3.4: Modal de Pagamento de Fatura
- [ ] **Task**: Criar fluxo de pagamento
- [ ] **Arquivos**: Integrado em `CreditCardStatementsScreen.tsx`
- [ ] **Descrição**:
  - Modal de confirmação
  - Campo para valor a pagar (total ou mínimo)
  - Opção de registrar pagamento
  - Atualização de status
- [ ] **Dependências**: FE-3.2
- [ ] **Estimativa**: 1.5h

**Total Sprint 3**: ~8 horas

---

## 🚀 Sprint 4: Sistema de Lembretes/Notificações

**Objetivo**: Implementar scheduler que dispara notificações para vencimentos.

### Tasks

#### BE-4.1: Criar Serviço de Agendamento
- [ ] **Task**: Sistema de cron jobs para verificação de vencimentos
- [ ] **Arquivos**: `backend/src/services/scheduler.ts` (novo)
- [ ] **Descrição**:
  - Biblioteca `node-cron` ou类似的
  - Job diário que verifica:
    - `recurringBills.nextDueDate` - 3 dias antes
    - `installmentPurchases.nextDueDate` - 3 dias antes
    - `creditCardStatements.dueDate` - 5 dias antes
  - Chama `createNotification()` para cada item
- [ ] **Dependências**: Sprint 2 (parceladas)
- [ ] **Estimativa**: 2h

#### BE-4.2: Estender Tipos de Notificação
- [ ] **Task**: Adicionar novos tipos de lembrete
- [ ] **Arquivos**: `backend/src/db/schema.ts`
- [ ] **Descrição**:
  ```typescript
  export const notificationTypeEnum = pgEnum('notification_type', [
    'bill_reminder',           // Já existe
    'installment_reminder',    // NOVO
    'credit_card_due',         // NOVO
    'goal_completed',
    'goal_near_completion',
    'budget_alert',
    'couple_invite',
    'general'
  ])
  ```
- [ ] **Dependências**: Nenhuma
- [ ] **Estimativa**: 0.5h

#### BE-4.3: Integrar Scheduler no Index
- [ ] **Task**: Iniciar scheduler ao subir o servidor
- [ ] **Arquivos**: `backend/src/index.ts`
- [ ] **Descrição**:
  - Importar e iniciar scheduler
  - Configurar timezone (pt-BR)
  - Logs para debug
- [ ] **Dependências**: BE-4.1
- [ ] **Estimativa**: 0.5h

#### FE-4.4: Componente de Notificações
- [ ] **Task**: Criar/expor centro de notificações
- [ ] **Arquivos**: `frontend/src/components/NotificationCenter.tsx` (novo)
- [ ] **Descrição**:
  - Badge no header com contador
  - Dropdown com lista de notificações
  - Ações: marcar como lida, ir para item relacionado
  - Usar `useNotifications` hook (já existe em `hooks/useNotifications.ts`)
- [ ] **Dependências**: Nenhuma
- [ ] **Estimativa**: 2.5h

#### FE-4.5: Integrar Notificações no Header
- [ ] **Task**: Adicionar ícone de notificação
- [ ] **Arquivos**: `frontend/src/App.tsx`
- [ ] **Descrição**:
  - Ícone de sino (Bell) no header
  - Badge com contador de não lidas
  - Modal/drawer de notificações
- [ ] **Dependências**: FE-4.4
- [ ] **Estimativa**: 1h

#### FE-4.6: Push Notifications (Opcional/Bônus)
- [ ] **Task**: Implementar notificações push do navegador
- [ ] **Arquivos**:
  - `frontend/src/lib/pushNotifications.ts`
  - Service Worker
- [ ] **Descrição**:
  - Solicitar permissão de notificação
  - Registrar subscription via `notificationsApi.subscribe`
  - Service worker para exibir push
- [ ] **Dependências**: BE-4.3
- [ ] **Estimativa**: 3h (Opcional)

**Total Sprint 4**: ~9.5 horas (sem bônus) / ~12.5 horas (com push)

---

## 🚀 Sprint 5: Dashboard e Refinamentos

**Objetivo**: Integrar tudo em uma visão unificada e polishing final.

### Tasks

#### FE-5.1: Widget de Próximos Vencimentos
- [ ] **Task**: Adicionar seção no dashboard principal
- [ ] **Arquivos**: `frontend/src/App.tsx` (dashboard section)
- [ ] **Descrição**:
  - Card com "Próximos Vencimentos"
  - Lista próxima: recorrentes, parceladas, faturas
  - Ordenado por data
  - Limite de 5 itens
  - Link para tela específica
- [ ] **Dependências**: Sprints 1-4
- [ ] **Estimativa**: 2h

#### FE-5.2: Resumo Financeiro por Cartão
- [ ] **Task**: Card de gastos do cartão no mês
- [ ] **Arquivos**: Integrar em dashboard ou AccountsScreen
- [ ] **Descrição**:
  - Para cada cartão, exibir:
    - Total de gastos no mês
    - Limite disponível
    - Parceladas do cartão
    - Fatura atual (aberta/fechada)
- [ ] **Dependências**: Sprint 3
- [ ] **Estimativa**: 2h

#### FE-5.3: Tratamento de Erros e Edge Cases
- [ ] **Task**: Robustecer a aplicação
- [ ] **Arquivos**: Todos os arquivos de tela
- [ ] **Descrição**:
  - Error boundaries
  - Mensagens toast para ações
  - Loading states consistentes
  - Pull-to-refresh em listas
  - Retry logic
- [ ] **Dependências**: Todos anteriores
- [ ] **Estimativa**: 3h

#### TEST-5.4: Testes Manuais
- [ ] **Task**: Testar fluxos completos
- [ ] **Descrição**:
  - Criar conta recorrente
  - Criar compra parcelada
  - Verificar listagem
  - Simular vencimento (ajustar data)
  - Verificar notificação
  - Pagar fatura
  - Verificar atualização de status
- [ ] **Dependências**: Todos anteriores
- [ ] **Estimativa**: 2h

**Total Sprint 5**: ~9 horas

---

## 📊 Resumo de Estimativas

| Sprint | Foco | Estimativa |
|--------|------|------------|
| Sprint 1 | Contas Recorrentes (Frontend) | 9.5h |
| Sprint 2 | Compras Parceladas (Full Stack) | 12.25h |
| Sprint 3 | Faturas de Cartão (Frontend) | 8h |
| Sprint 4 | Sistema de Lembretes | 9.5h |
| Sprint 5 | Dashboard e Refinamentos | 9h |
| **TOTAL** | | **~48h** |

---

## 🔧 Stack e Padrões a Seguir

### Backend
- Hono + Drizzle ORM
- Validação com Zod
- Autenticação via middleware `requireAuth`
- Rotas em `backend/src/routes/`
- Schema em `backend/src/db/schema.ts`

### Frontend
- React + TypeScript
- Framer Motion (`motion/react`) para animações
- Hooks customizados em `frontend/src/hooks/`
- API client em `frontend/src/lib/api.ts`
- Telas em `frontend/src/components/screens/`
- Tailwind CSS para estilos

### Padrões de Código
- Seguir estrutura existente (ver `AccountsScreen.tsx` como referência)
- Context toggle para individual/joint
- Modals com `AnimatePresence` e `motion.div`
- Loading skeletons
- Toast notifications com `useToast()`

---

## 📝 Notas Adicionais

### Decisões de Design Pendentes
1. **Navegação**: Adicionar nova aba no bottom nav ou integrar como subseção?
   - Opção A: Nova aba "Contas a Pagar" (ícone Calendar)
   - Opção B: Integrar em Settings ou Dashboard
   - **Recomendado**: Opção A para melhor UX

2. **Notificações Push**: Prioridade do Sprint 4
   - Implementação básica: apenas badges e lista no app
   - Implementação completa: push notifications nativas
   - **Recomendado**: Começar com básica, push como bônus

3. **Integração com Transações**: Ao pagar recorrente/parcelada, criar transação automaticamente?
   - **Recomendado**: Sim, criar transação ao marcar como pago

### Riscos Identificados
- Migração de banco pode conflitar com dados existentes
- Scheduler de notificações requer teste cuidadoso
- Push notifications podem ter limitações em alguns browsers

---

## ✅ Checklist Final (Após todas Sprints)

- [ ] Contas recorrentes funcionando (CRUD completo)
- [ ] Compras parceladas funcionando (CRUD + avanço de parcela)
- [ ] Faturas de cartão acessíveis e editáveis
- [ ] Notificações de vencimento funcionando
- [ ] Dashboard com visão consolidada
- [ ] Testes manuais passando
- [ ] Responsivo em mobile
- [ ] Documentação atualizada