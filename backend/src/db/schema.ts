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
  id:            text('id').primaryKey().$defaultFn(() => nanoid()),
  email:         text('email').notNull().unique(),
  name:          text('name').notNull(),
  passwordHash:  text('password_hash').notNull(),
  avatarUrl:     text('avatar_url'),
  coupleId:      text('couple_id').references(() => couples.id, { onDelete: 'set null' }),
  theme:         text('theme').notNull().default('dark'),
  language:      text('language').notNull().default('pt-BR'),
  notifications: boolean('notifications').notNull().default(true),
  createdAt:     timestamp('created_at').defaultNow().notNull(),
  updatedAt:     timestamp('updated_at').defaultNow().notNull(),
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

export const savingsGoals = pgTable('savings_goals', {
  id:            text('id').primaryKey().$defaultFn(() => nanoid()),
  userId:        text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  coupleId:      text('couple_id').references(() => couples.id, { onDelete: 'set null' }),
  title:         text('title').notNull(),
  targetAmount:  numeric('target_amount', { precision: 12, scale: 2 }).notNull(),
  currentAmount: numeric('current_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  context:       contextEnum('context').notNull().default('individual'),
  status:        goalStatusEnum('status').notNull().default('active'),
  emoji:         text('emoji').default('🎯'),
  deadline:      timestamp('deadline'),
  createdAt:     timestamp('created_at').defaultNow().notNull(),
  updatedAt:     timestamp('updated_at').defaultNow().notNull(),
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
}))

export const couplesRelations = relations(couples, ({ many }) => ({
  members:      many(users),
  accounts:     many(accounts),
  transactions: many(transactions),
  goals:        many(savingsGoals),
  bills:        many(recurringBills),
}))

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  user:         one(users, { fields: [accounts.userId], references: [users.id] }),
  couple:       one(couples, { fields: [accounts.coupleId], references: [couples.id] }),
  transactions: many(transactions),
}))

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user:      one(users, { fields: [transactions.userId], references: [users.id] }),
  account:   one(accounts, { fields: [transactions.accountId], references: [accounts.id] }),
  couple:    one(couples, { fields: [transactions.coupleId], references: [couples.id] }),
  recurring: one(recurringBills, { fields: [transactions.recurringId], references: [recurringBills.id] }),
}))

export const savingsGoalsRelations = relations(savingsGoals, ({ one }) => ({
  user:   one(users, { fields: [savingsGoals.userId], references: [users.id] }),
  couple: one(couples, { fields: [savingsGoals.coupleId], references: [couples.id] }),
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
