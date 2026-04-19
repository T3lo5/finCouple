import { pgTable, text, integer, boolean, timestamp, numeric, pgEnum } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { nanoid } from 'nanoid'

export const contextEnum = pgEnum('context', ['individual', 'joint'])
export const transactionTypeEnum = pgEnum('transaction_type', ['income', 'expense', 'transfer'])
export const categoryEnum = pgEnum('category', [
  'dining', 'home', 'transport', 'shopping', 'health',
  'travel', 'bills', 'salary', 'investment', 'other'
])
export const accountTypeEnum = pgEnum('account_type', ['checking', 'savings', 'credit', 'investment', 'benefit'])
export const frequencyEnum = pgEnum('frequency', ['daily', 'weekly', 'monthly', 'yearly'])
export const goalStatusEnum = pgEnum('goal_status', ['active', 'completed', 'paused'])

export const users = pgTable('users', {
  id:                     text('id').primaryKey().$defaultFn(() => nanoid()),
  email:                  text('email').notNull().unique(),
  name:                   text('name').notNull(),
  passwordHash:           text('password_hash').notNull(),
  avatarUrl:              text('avatar_url'),
  coupleId:               text('couple_id').references(() => couples.id, { onDelete: 'set null' }),
  theme:                  text('theme').notNull().default('dark'),
  language:               text('language').notNull().default('pt-BR'),
  notifications:          boolean('notifications').notNull().default(true),
  // Budget preferences
  budgetDefaultMonth:     integer('budget_default_month'),
  budgetDefaultYear:      integer('budget_default_year'),
  budgetDefaultContext:   contextEnum('budget_default_context').default('individual'),
  createdAt:              timestamp('created_at').defaultNow().notNull(),
  updatedAt:              timestamp('updated_at').defaultNow().notNull(),
})

export const couples = pgTable('couples', {
  id:                         text('id').primaryKey().$defaultFn(() => nanoid()),
  name:                       text('name').notNull().default('Our Finances'),
  user1VisibleToPartner:      boolean('user1_visible_to_partner').notNull().default(false),
  user2VisibleToPartner:      boolean('user2_visible_to_partner').notNull().default(false),
  inviteCode:                 text('invite_code').unique(),
  createdAt:                  timestamp('created_at').defaultNow().notNull(),
})

export const accounts = pgTable('accounts', {
  id:          text('id').primaryKey().$defaultFn(() => nanoid()),
  userId:      text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  coupleId:    text('couple_id').references(() => couples.id, { onDelete: 'set null' }),
  name:        text('name').notNull(),
  institution: text('institution'),
  type:        accountTypeEnum('type').notNull().default('checking'),
  balance:     numeric('balance', { precision: 12, scale: 2 }).notNull().default('0'),
  currency:    text('currency').notNull().default('BRL'),
  lastFour:    text('last_four'),
  context:     contextEnum('context').notNull().default('individual'),
  isActive:    boolean('is_active').notNull().default(true),
  // Novos campos para contas de crédito
  creditLimit: numeric('credit_limit', { precision: 12, scale: 2 }), // Limite de crédito
  dueDate:     timestamp('due_date'), // Data de vencimento (para contas de crédito)
  closingDate: timestamp('closing_date'), // Data de fechamento (para contas de crédito)
  createdAt:   timestamp('created_at').defaultNow().notNull(),
  updatedAt:   timestamp('updated_at').defaultNow().notNull(),
})

// Tabela para faturas de cartão de crédito
export const creditCardStatements = pgTable('credit_card_statements', {
  id:          text('id').primaryKey().$defaultFn(() => nanoid()),
  accountId:   text('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  userId:      text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  statementDate: timestamp('statement_date').notNull(), // Data de fechamento da fatura
  dueDate:     timestamp('due_due_date').notNull(), // Data de vencimento da fatura
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(), // Valor total da fatura
  minimumPayment: numeric('minimum_payment', { precision: 12, scale: 2 }), // Pagamento mínimo
  paidAmount:  numeric('paid_amount', { precision: 12, scale: 2 }).default('0'), // Valor pago
  isPaid:      boolean('is_paid').notNull().default(false), // Indica se a fatura foi paga
  isClosed:    boolean('is_closed').notNull().default(false), // Indica se a fatura está fechada
  createdAt:   timestamp('created_at').defaultNow().notNull(),
  updatedAt:   timestamp('updated_at').defaultNow().notNull(),
})

export const transactions = pgTable('transactions', {
  id:          text('id').primaryKey().$defaultFn(() => nanoid()),
  userId:      text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accountId:   text('account_id').references(() => accounts.id, { onDelete: 'set null' }),
  coupleId:    text('couple_id').references(() => couples.id, { onDelete: 'set null' }),
  title:       text('title').notNull(),
  amount:      numeric('amount', { precision: 12, scale: 2 }).notNull(),
  type:        transactionTypeEnum('type').notNull(),
  category:    categoryEnum('category').notNull().default('other'),
  context:     contextEnum('context').notNull().default('individual'),
  notes:       text('notes'),
  date:        timestamp('date').notNull().defaultNow(),
  isRecurring: boolean('is_recurring').notNull().default(false),
  recurringId: text('recurring_id').references(() => recurringBills.id, { onDelete: 'set null' }),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
})

// Tabela para anexos/comprovantes de transações
export const transactionAttachments = pgTable('transaction_attachments', {
  id:          text('id').primaryKey().$defaultFn(() => nanoid()),
  transactionId: text('transaction_id').notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  fileName:    text('file_name').notNull(),
  filePath:    text('file_path').notNull(),
  fileType:    text('file_type').notNull(), // mime type
  fileSize:    integer('file_size').notNull(),
  uploadedBy:  text('uploaded_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
})

// Tabela para tags personalizadas
export const transactionTags = pgTable('transaction_tags', {
  id:          text('id').primaryKey().$defaultFn(() => nanoid()),
  userId:      text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name:        text('name').notNull().unique(), // nome da tag
  color:       text('color').default('#6366f1'), // cor para UI
  createdAt:   timestamp('created_at').defaultNow().notNull(),
})

// Tabela intermediária para relacionamento entre transações e tags
export const transactionTagMappings = pgTable('transaction_tag_mappings', {
  id:            text('id').primaryKey().$defaultFn(() => nanoid()),
  transactionId: text('transaction_id').notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  tagId:         text('tag_id').notNull().references(() => transactionTags.id, { onDelete: 'cascade' }),
  createdAt:     timestamp('created_at').defaultNow().notNull(),
})

export const recurringBills = pgTable('recurring_bills', {
  id:          text('id').primaryKey().$defaultFn(() => nanoid()),
  userId:      text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  coupleId:    text('couple_id').references(() => couples.id, { onDelete: 'set null' }),
  title:       text('title').notNull(),
  amount:      numeric('amount', { precision: 12, scale: 2 }).notNull(),
  category:    categoryEnum('category').notNull().default('bills'),
  context:     contextEnum('context').notNull().default('joint'),
  frequency:   frequencyEnum('frequency').notNull().default('monthly'),
  nextDueDate: timestamp('next_due_date').notNull(),
  isActive:    boolean('is_active').notNull().default(true),
  autoPay:     boolean('auto_pay').notNull().default(false),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
})

// Tabela para compras parceladas
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
  createdAt:         timestamp('created_at').defaultNow().notNull(),
  updatedAt:         timestamp('updated_at').defaultNow().notNull(),
})

export const savingsGoals = pgTable('savings_goals', {
  id:                 text('id').primaryKey().$defaultFn(() => nanoid()),
  userId:             text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  coupleId:           text('couple_id').references(() => couples.id, { onDelete: 'set null' }),
  title:              text('title').notNull(),
  targetAmount:       numeric('target_amount', { precision: 12, scale: 2 }).notNull(),
  currentAmount:      numeric('current_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  context:            contextEnum('context').notNull().default('individual'),
  status:             goalStatusEnum('status').notNull().default('active'),
  emoji:              text('emoji').default('🎯'),
  deadline:           timestamp('deadline'),
  // Campos para metas recorrentes
  isRecurring:        boolean('is_recurring').notNull().default(false),
  frequency:          frequencyEnum('frequency').default('monthly'),
  nextTargetDate:     timestamp('next_target_date'),
  originalTargetAmount: numeric('original_target_amount', { precision: 12, scale: 2 }),
  createdAt:          timestamp('created_at').defaultNow().notNull(),
  updatedAt:          timestamp('updated_at').defaultNow().notNull(),
})

export const savingsContributions = pgTable('savings_contributions', {
  id:        text('id').primaryKey().$defaultFn(() => nanoid()),
  goalId:    text('goal_id').notNull().references(() => savingsGoals.id, { onDelete: 'cascade' }),
  userId:    text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount:    numeric('amount', { precision: 12, scale: 2 }).notNull(),
  notes:     text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const sessions = pgTable('sessions', {
  id:        text('id').primaryKey(),
  userId:    text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token:     text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id:        text('id').primaryKey().$defaultFn(() => nanoid()),
  userId:    text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token:     text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  used:      boolean('used').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const usersRelations = relations(users, ({ one, many }) => ({
  couple:       one(couples, { fields: [users.coupleId], references: [couples.id] }),
  accounts:     many(accounts),
  transactions: many(transactions),
  goals:        many(savingsGoals),
  bills:        many(recurringBills),
  installments: many(installmentPurchases),
}))

export const couplesRelations = relations(couples, ({ many }) => ({
  members:      many(users),
  accounts:     many(accounts),
  transactions: many(transactions),
  goals:        many(savingsGoals),
  bills:        many(recurringBills),
  installments: many(installmentPurchases),
}))

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  user:         one(users, { fields: [accounts.userId], references: [users.id] }),
  couple:       one(couples, { fields: [accounts.coupleId], references: [couples.id] }),
  transactions: many(transactions),
  statements:   many(creditCardStatements),
  installments: many(installmentPurchases),
}))

export const creditCardStatementsRelations = relations(creditCardStatements, ({ one, many }) => ({
  account:      one(accounts, { fields: [creditCardStatements.accountId], references: [accounts.id] }),
  user:         one(users, { fields: [creditCardStatements.userId], references: [users.id] }),
}))

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  user:      one(users, { fields: [transactions.userId], references: [users.id] }),
  account:   one(accounts, { fields: [transactions.accountId], references: [accounts.id] }),
  couple:    one(couples, { fields: [transactions.coupleId], references: [couples.id] }),
  recurring: one(recurringBills, { fields: [transactions.recurringId], references: [recurringBills.id] }),
  attachments: many(transactionAttachments),
  tagMappings: many(transactionTagMappings),
}))

export const transactionAttachmentsRelations = relations(transactionAttachments, ({ one }) => ({
  transaction: one(transactions, { fields: [transactionAttachments.transactionId], references: [transactions.id] }),
  uploadedByUser: one(users, { fields: [transactionAttachments.uploadedBy], references: [users.id] }),
}))

export const transactionTagsRelations = relations(transactionTags, ({ one, many }) => ({
  user: one(users, { fields: [transactionTags.userId], references: [users.id] }),
  mappings: many(transactionTagMappings),
}))

export const transactionTagMappingsRelations = relations(transactionTagMappings, ({ one }) => ({
  transaction: one(transactions, { fields: [transactionTagMappings.transactionId], references: [transactions.id] }),
  tag: one(transactionTags, { fields: [transactionTagMappings.tagId], references: [transactionTags.id] }),
}))

export const savingsGoalsRelations = relations(savingsGoals, ({ one, many }) => ({
  user:        one(users, { fields: [savingsGoals.userId], references: [users.id] }),
  couple:      one(couples, { fields: [savingsGoals.coupleId], references: [couples.id] }),
  contributions: many(savingsContributions),
}))

export const savingsContributionsRelations = relations(savingsContributions, ({ one }) => ({
  goal: one(savingsGoals, { fields: [savingsContributions.goalId], references: [savingsGoals.id] }),
  user: one(users, { fields: [savingsContributions.userId], references: [users.id] }),
}))

export const installmentPurchasesRelations = relations(installmentPurchases, ({ one }) => ({
  user:    one(users, { fields: [installmentPurchases.userId], references: [users.id] }),
  couple:  one(couples, { fields: [installmentPurchases.coupleId], references: [couples.id] }),
  account: one(accounts, { fields: [installmentPurchases.accountId], references: [accounts.id] }),
}))

export const notificationTypeEnum = pgEnum('notification_type', [
  'bill_reminder',
  'goal_completed',
  'goal_near_completion',
  'budget_alert',
  'couple_invite',
  'general'
])

export const pushNotifications = pgTable('push_notifications', {
  id:         text('id').primaryKey().$defaultFn(() => nanoid()),
  userId:     text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type:       notificationTypeEnum('type').notNull(),
  title:      text('title').notNull(),
  message:    text('message').notNull(),
  data:       text('data'), // JSON string para dados extras
  read:       boolean('read').notNull().default(false),
  createdAt:  timestamp('created_at').defaultNow().notNull(),
})

export const pushSubscriptions = pgTable('push_subscriptions', {
  id:           text('id').primaryKey().$defaultFn(() => nanoid()),
  userId:       text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  endpoint:     text('endpoint').notNull().unique(),
  keys:         text('keys').notNull(), // JSON string com p256dh e auth
  userAgent:    text('user_agent'),
  createdAt:    timestamp('created_at').defaultNow().notNull(),
  updatedAt:    timestamp('updated_at').defaultNow().notNull(),
})

export const auditLogs = pgTable('audit_logs', {
  id:         text('id').primaryKey().$defaultFn(() => nanoid()),
  userId:     text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  action:     text('action').notNull(), // e.g., 'profile_update', 'email_change', 'password_change', 'preferences_update', 'account_delete'
  entity:     text('entity').notNull().default('user'), // entidade afetada
  entityId:   text('entity_id'), // ID da entidade afetada
  oldValues:  text('old_values'), // JSON string com valores antigos
  newValues:  text('new_values'), // JSON string com novos valores
  ipAddress:  text('ip_address'), // IP da requisição (opcional)
  userAgent:  text('user_agent'), // User agent do cliente
  createdAt:  timestamp('created_at').defaultNow().notNull(),
})

export const budgetContextEnum = pgEnum('budget_context', ['individual', 'joint'])

export const monthlyBudgets = pgTable('monthly_budgets', {
  id:          text('id').primaryKey().$defaultFn(() => nanoid()),
  userId:      text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  coupleId:    text('couple_id').references(() => couples.id, { onDelete: 'set null' }),
  month:       integer('month').notNull(), // 1-12
  year:        integer('year').notNull(),
  totalBudget: numeric('total_budget', { precision: 12, scale: 2 }).notNull(),
  context:     budgetContextEnum('context').notNull().default('individual'),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
  updatedAt:   timestamp('updated_at').defaultNow().notNull(),
})

export const budgetCategoryEnum = pgEnum('budget_category', [
  'dining', 'home', 'transport', 'shopping', 'health',
  'travel', 'bills', 'salary', 'investment', 'other'
])

export const budgetCategories = pgTable('budget_categories', {
  id:            text('id').primaryKey().$defaultFn(() => nanoid()),
  budgetId:      text('budget_id').notNull().references(() => monthlyBudgets.id, { onDelete: 'cascade' }),
  category:      budgetCategoryEnum('category').notNull(),
  limitAmount:   numeric('limit_amount', { precision: 12, scale: 2 }).notNull(),
  spentAmount:   numeric('spent_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  alertThreshold: numeric('alert_threshold', { precision: 5, scale: 2 }).notNull().default('80.00'),
  createdAt:     timestamp('created_at').defaultNow().notNull(),
  updatedAt:     timestamp('updated_at').defaultNow().notNull(),
})

export const monthlyBudgetsRelations = relations(monthlyBudgets, ({ one, many }) => ({
  user:       one(users, { fields: [monthlyBudgets.userId], references: [users.id] }),
  couple:     one(couples, { fields: [monthlyBudgets.coupleId], references: [couples.id] }),
  categories: many(budgetCategories),
}))

export const budgetCategoriesRelations = relations(budgetCategories, ({ one }) => ({
  budget: one(monthlyBudgets, { fields: [budgetCategories.budgetId], references: [monthlyBudgets.id] }),
}))

// Tabela para convites de casal por link
export const coupleInvites = pgTable('couple_invites', {
  id:          text('id').primaryKey().$defaultFn(() => nanoid()),
  coupleId:    text('couple_id').notNull().references(() => couples.id, { onDelete: 'cascade' }),
  token:       text('token').notNull().unique(), // Token para o convite por link
  createdBy:   text('created_by').notNull().references(() => users.id, { onDelete: 'cascade' }), // Usuário que criou o convite
  expiresAt:   timestamp('expires_at').notNull(), // Data de expiração do convite
  maxUses:     integer('max_uses').notNull().default(2), // Número máximo de usos (padrão 2 para casal)
  currentUses: integer('current_uses').notNull().default(0), // Número de usos atuais
  isActive:    boolean('is_active').notNull().default(true), // Se o convite ainda é válido
  revokedAt:   timestamp('revoked_at'), // Quando foi revogado (se aplicável)
  revokedBy:   text('revoked_by').references(() => users.id, { onDelete: 'set null' }), // Quem revogou (se aplicável)
  createdAt:   timestamp('created_at').defaultNow().notNull(),
  updatedAt:   timestamp('updated_at').defaultNow().notNull(),
})

export const coupleInvitesRelations = relations(coupleInvites, ({ one }) => ({
  couple: one(couples, { fields: [coupleInvites.coupleId], references: [couples.id] }),
  createdByUser: one(users, { fields: [coupleInvites.createdBy], references: [users.id] }),
  revokedByUser: one(users, { fields: [coupleInvites.revokedBy], references: [users.id] }),
}))
