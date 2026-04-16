export type Context = 'individual' | 'joint'
export type TransactionType = 'income' | 'expense' | 'transfer'
export type Category = 'dining' | 'home' | 'transport' | 'shopping' | 'health' | 'travel' | 'bills' | 'salary' | 'investment' | 'other'
export type AccountType = 'checking' | 'savings' | 'credit' | 'investment' | 'benefit'
export type GoalStatus = 'active' | 'completed' | 'paused'

export interface User {
  id:                   string
  email:                string
  name:                 string
  avatarUrl?:           string | null
  coupleId:             string | null
  theme?:               string
  language?:            string
  notifications?:       boolean
  // Budget preferences
  budgetDefaultMonth?:  number | null
  budgetDefaultYear?:   number | null
  budgetDefaultContext?: 'individual' | 'joint' | null
}

export interface BudgetPreferences {
  selectedMonth: number
  selectedYear: number
  budgetContext: Context
}

export interface Account {
  id:          string
  userId:      string
  coupleId:    string | null
  name:        string
  institution: string | null
  type:        AccountType
  balance:     string
  currency:    string
  lastFour:    string | null
  context:     Context
  isActive:    boolean
  creditLimit?: string | null  // Novo campo para limite de crédito
  dueDate?:    string | null  // Novo campo para data de vencimento (contas de crédito)
  closingDate?: string | null // Novo campo para data de fechamento (contas de crédito)
  createdAt:   string
}

export interface CreditCardStatement {
  id:             string
  accountId:      string
  userId:         string
  statementDate:  string
  dueDate:        string
  totalAmount:    string
  minimumPayment?: string
  paidAmount:     string
  isPaid:         boolean
  isClosed:       boolean
  createdAt:      string
  updatedAt:      string
}

export interface Transaction {
  id:          string
  userId:      string
  coupleId:    string | null
  accountId:   string | null
  title:       string
  amount:      string
  type:        TransactionType
  category:    Category
  context:     Context
  notes:       string | null
  date:        string
  isRecurring: boolean
  createdAt:   string
  tags?:       Tag[] // Tags associadas à transação
  attachments?: Attachment[] // Anexos/comprovantes da transação
}

export interface Tag {
  id:        string
  name:      string
  color:     string
  createdAt: string
}

export interface Attachment {
  id:         string
  fileName:   string
  fileType:   string
  fileSize:   number
  createdAt:  string
}

export interface SavingsGoal {
  id:                 string
  userId:             string
  coupleId:           string | null
  title:              string
  targetAmount:       string
  currentAmount:      string
  context:            Context
  status:             GoalStatus
  emoji:              string
  deadline:           string | null
  // Campos para metas recorrentes
  isRecurring:        boolean
  frequency:          'daily' | 'weekly' | 'monthly' | 'yearly'
  nextTargetDate:     string | null
  originalTargetAmount: string | null
  createdAt:          string
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: { total: number; page: number; limit: number; pages: number }
}

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('session_token')

  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const data = await res.json()

  if (!res.ok) {
    throw new ApiError(res.status, data.error || 'Unknown error')
  }

  return data
}

export const authApi = {
  register: (body: { email: string; name: string; password: string }) =>
    request<{ user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  login: (body: { email: string; password: string }) =>
    request<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  logout: () =>
    request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),

  me: () =>
    request<{ user: User }>('/api/auth/me'),

  createCouple: () =>
    request<{ couple: { id: string; inviteCode: string } }>('/api/auth/couple/create', {
      method: 'POST',
    }),

  joinCouple: (inviteCode: string) =>
    request<{ couple: { id: string } }>('/api/auth/couple/join', {
      method: 'POST',
      body: JSON.stringify({ inviteCode }),
    }),

  forgotPassword: (email: string) =>
    request<{ message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, newPassword: string) =>
    request<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    }),

  updateProfile: (body: Partial<{ name: string; email: string; avatarUrl: string; password: string }>) =>
    request<{ data: { user: User } }>('/api/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  updatePreferences: (body: Partial<{ theme: string; language: string; notifications: boolean; budgetDefaultMonth: number | null; budgetDefaultYear: number | null; budgetDefaultContext: 'individual' | 'joint' | null }>) =>
    request<{ data: { user: User } }>('/api/auth/preferences', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  deleteAccount: (password: string) =>
    request<{ message: string }>('/api/auth/account', {
      method: 'DELETE',
      body: JSON.stringify({ password }),
    }),
}

export const transactionsApi = {
  list: (params?: {
    context?: Context
    category?: Category
    from?: string
    to?: string
    search?: string  // Nova funcionalidade: busca textual
    page?: number
    limit?: number
  }) => {
    const qs = new URLSearchParams(params as any).toString()
    return request<PaginatedResponse<Transaction>>(`/api/transactions${qs ? `?${qs}` : ''}`)
  },

  get: (id: string) =>
    request<{ data: Transaction }>(`/api/transactions/${id}`),

  create: (body: {
    title: string
    amount: number
    type: TransactionType
    category: Category
    context: Context
    accountId?: string
    notes?: string
    date?: string
    tagIds?: string[]  // Novo campo: IDs das tags
  }) =>
    request<{ data: Transaction }>('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  update: (id: string, body: Partial<{
    title: string
    amount: number
    type: TransactionType
    category: Category
    context: Context
    notes: string
    date: string
    tagIds?: string[]  // Novo campo: IDs das tags
  }>) =>
    request<{ data: Transaction }>(`/api/transactions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  delete: (id: string) =>
    request<{ ok: boolean }>(`/api/transactions/${id}`, { method: 'DELETE' }),

  monthlySummary: (context?: Context) => {
    const qs = context ? `?context=${context}` : ''
    return request<{ income: number; expenses: number; balance: number }>(`/api/transactions/summary/monthly${qs}`)
  },

  byCategorySummary: (context?: Context) => {
    const qs = context ? `?context=${context}` : ''
    return request<{ totalExpenses: number; byCategory: { category: Category; amount: number; count: number; percentage: number }[]; period: { from: string; to: string } }>(`/api/transactions/summary/by-category${qs}`)
  },

  export: async (params?: {
    context?: Context
    category?: Category
    from?: string
    to?: string
  }) => {
    const token = localStorage.getItem('session_token')
    const qs = params ? new URLSearchParams(params as any).toString() : ''
    const url = `${BASE_URL}/api/transactions/export${qs ? `?${qs}` : ''}`

    const res = await fetch(url, {
      credentials: 'include',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })

    if (!res.ok) {
      const data = await res.json()
      throw new ApiError(res.status, data.error || 'Unknown error')
    }

    // Download the CSV file
    const blob = await res.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = `transactions_export_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(downloadUrl)

    return { ok: true }
  },

  // Nova funcionalidade: Tags de transações
  tags: {
    list: () =>
      request<{ data: Tag[] }>('/api/transactions/tags'),

    create: (body: { name: string; color?: string }) =>
      request<{ data: Tag }>('/api/transactions/tags', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    delete: (id: string) =>
      request<{ ok: boolean }>(`/api/transactions/tags/${id}`, { method: 'DELETE' }),

    associate: (id: string, tagIds: string[]) =>
      request<{ ok: boolean }>(`/api/transactions/${id}/tags`, {
        method: 'POST',
        body: JSON.stringify({ tagIds }),
      }),

    get: (id: string) =>
      request<{ data: Tag[] }>(`/api/transactions/${id}/tags`),
  },

  // Nova funcionalidade: Anexos de transações
  attachments: {
    upload: async (id: string, file: File) => {
      const token = localStorage.getItem('session_token')
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`${BASE_URL}/api/transactions/${id}/attachments`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new ApiError(res.status, data.error || 'Unknown error')
      }

      return data
    },

    list: (id: string) =>
      request<{ data: Attachment[] }>(`/api/transactions/${id}/attachments`),

    get: (id: string, attachmentId: string) => {
      const token = localStorage.getItem('session_token')
      const url = `${BASE_URL}/api/transactions/${id}/attachments/${attachmentId}`

      return fetch(url, {
        credentials: 'include',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
    },

    delete: (id: string, attachmentId: string) =>
      request<{ ok: boolean }>(`/api/transactions/${id}/attachments/${attachmentId}`, {
        method: 'DELETE'
      }),
  },
}

export const savingsApi = {
  list: (context?: Context) => {
    const qs = context ? `?context=${context}` : ''
    return request<{ data: SavingsGoal[] }>(`/api/savings${qs}`)
  },

  get: (id: string) =>
    request<{ data: SavingsGoal }>(`/api/savings/${id}`),

  create: (body: {
    title: string
    targetAmount: number
    context: Context
    emoji?: string
    deadline?: string
    // Campos para metas recorrentes
    isRecurring?: boolean
    frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly'
    nextTargetDate?: string
  }) =>
    request<{ data: SavingsGoal }>('/api/savings', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  contribute: (id: string, amount: number) =>
    request<{ data: SavingsGoal; completed: boolean }>(`/api/savings/${id}/contribute`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),

  update: (id: string, body: Partial<{
    title: string
    targetAmount: number
    emoji: string
    deadline: string
    // Campos para metas recorrentes
    isRecurring: boolean
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
    nextTargetDate: string
  }>) =>
    request<{ data: SavingsGoal }>(`/api/savings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  delete: (id: string) =>
    request<{ ok: boolean }>(`/api/savings/${id}`, { method: 'DELETE' }),

  // Funções para metas recorrentes
  checkAndReset: (id: string) =>
    request<{ data: SavingsGoal }>(`/api/savings/${id}/check-and-reset`, {
      method: 'POST',
    }),

  getRecurrenceInfo: (id: string) =>
    request<{ data: {
      isRecurring: boolean
      originalTargetAmount: string | null
      nextTargetDate: string | null
      daysUntilNextTarget: number | null
      frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
    } }>(`/api/savings/${id}/recurrence-info`),

  // Histórico de contribuições
  getContributions: (id: string) =>
    request<{ data: Array<{
      id: string
      goalId: string
      userId: string
      amount: string
      notes: string | null
      createdAt: string
      user: {
        id: string
        name: string
        email: string
      }
    }> }>(`/api/savings/${id}/contributions`),
}

export const accountsApi = {
  list: (context?: Context) => {
    const qs = context ? `?context=${context}` : ''
    return request<{ data: Account[]; totalBalance: number }>(`/api/accounts${qs}`)
  },

  create: (body: {
    name: string
    institution?: string
    type: AccountType
    balance?: number
    currency?: string
    lastFour?: string
    context: Context
    creditLimit?: number  // Novo campo para limite de crédito
    dueDate?: string     // Nova data de vencimento
    closingDate?: string // Nova data de fechamento
  }) =>
    request<{ data: Account }>('/api/accounts', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  update: (id: string, body: Partial<{
    name: string
    institution?: string
    type: AccountType
    balance?: number
    currency?: string
    lastFour?: string
    context: Context
    isActive?: boolean
    creditLimit?: number  // Novo campo para limite de crédito
    dueDate?: string     // Nova data de vencimento
    closingDate?: string // Nova data de fechamento
  }>) =>
    request<{ data: Account }>(`/api/accounts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  updateBalance: (id: string, balance: number) =>
    request<{ data: Account }>(`/api/accounts/${id}/balance`, {
      method: 'PATCH',
      body: JSON.stringify({ balance }),
    }),

  delete: (id: string) =>
    request<{ ok: boolean }>(`/api/accounts/${id}`, { method: 'DELETE' }),

  permanentDelete: (id: string) =>
    request<{ ok: boolean }>(`/api/accounts/${id}?permanent=true`, { method: 'DELETE' }),

  // Funções para faturas de cartão de crédito
  statements: {
    list: (params?: {
      accountId?: string
      month?: number
      year?: number
    }) => {
      const qs = new URLSearchParams(params as any).toString()
      return request<{ data: CreditCardStatement[] }>(`/api/credit-card-statements${qs ? `?${qs}` : ''}`)
    },

    get: (id: string) =>
      request<{ data: CreditCardStatement }>(`/api/credit-card-statements/${id}`),

    create: (body: {
      accountId: string
      statementDate: string
      dueDate: string
      totalAmount: number
      minimumPayment?: number
    }) =>
      request<{ data: CreditCardStatement }>('/api/credit-card-statements', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    update: (id: string, body: Partial<{
      statementDate: string
      dueDate: string
      totalAmount: number
      minimumPayment?: number
      paidAmount: number
      isPaid: boolean
      isClosed: boolean
    }>) =>
      request<{ data: CreditCardStatement }>(`/api/credit-card-statements/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),

    delete: (id: string) =>
      request<{ ok: boolean }>(`/api/credit-card-statements/${id}`, { method: 'DELETE' }),

    pay: (id: string) =>
      request<{ data: CreditCardStatement }>(`/api/credit-card-statements/${id}/pay`, {
        method: 'PATCH',
      }),
  }
}

// API para conciliação bancária
export const bankReconciliationApi = {
  reconcile: (body: {
    transactionIds: string[]
    accountId: string
    startDate: string
    endDate: string
  }) =>
    request<{
      message: string
      reconciledTransactions: number
      transactions: Transaction[]
    }>('/api/bank-reconciliation', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getUnreconciled: (accountId: string) =>
    request<{
      data: Transaction[]
      total: number
    }>(`/api/bank-reconciliation/unreconciled/${accountId}`),

  reconcileTransaction: (id: string) =>
    request<{
      message: string
      data: Transaction
    }>(`/api/bank-reconciliation/reconcile-transaction/${id}`, {
      method: 'PATCH',
    }),
}

// API para importação de transações
export const importApi = {
  import: (formData: FormData) =>
    request<{
      message: string
      importedCount: number
      transactions: Transaction[]
    }>('/api/import-transactions/import', {
      method: 'POST',
      body: formData,
    }),

  preview: (formData: FormData) =>
    request<{
      message: string
      preview: Transaction[]
      totalCount: number
    }>('/api/import-transactions/preview', {
      method: 'POST',
      body: formData,
    }),
}

export interface Notification {
  id:        string
  userId:    string
  type:      'bill_reminder' | 'goal_completed' | 'goal_near_completion' | 'budget_alert' | 'couple_invite' | 'general'
  title:     string
  message:   string
  data:      Record<string, any> | null
  read:      boolean
  createdAt: string
}

export interface PushSubscriptionKeys {
  p256dh: string
  auth:   string
}

export const notificationsApi = {
  list: () =>
    request<{ data: Notification[] }>('/api/notifications'),

  getUnreadCount: () =>
    request<{ data: { unreadCount: number } }>('/api/notifications/unread'),

  markAsRead: (id: string) =>
    request<{ data: { success: boolean } }>(`/api/notifications/${id}/read`, {
      method: 'PATCH',
    }),

  markAllAsRead: () =>
    request<{ data: { success: boolean } }>('/api/notifications/read-all', {
      method: 'PATCH',
    }),

  subscribe: (subscription: {
    endpoint: string
    keys: PushSubscriptionKeys
    userAgent?: string
  }) =>
    request<{ data: { id: string; created: boolean; updated: boolean } }>('/api/notifications/subscribe', {
      method: 'POST',
      body: JSON.stringify(subscription),
    }),

  unsubscribe: (id: string) =>
    request<{ data: { success: boolean } }>(`/api/notifications/subscribe/${id}`, {
      method: 'DELETE',
    }),

  getSubscriptions: () =>
    request<{ data: Array<{ id: string; endpoint: string; userAgent: string | null; createdAt: string; updatedAt: string }> }>('/api/notifications/subscriptions'),
}

export interface Budget {
  id:          string
  userId:      string
  coupleId:    string | null
  month:       number
  year:        number
  totalBudget: string
  context:     Context
  createdAt:   string
  updatedAt:   string
}

export interface BudgetCategory {
  id:            string
  budgetId:      string
  category:      Category
  limitAmount:   string
  spentAmount:   string
  alertThreshold: number
  createdAt:     string
  updatedAt:     string
}

export const budgetApi = {
  get: (month: number, year: number, context: Context) =>
    request<{ 
      data: { 
        budget: Budget
        categories: BudgetCategory[]
        spentTotal: number
        remainingTotal: number
        percentageUsed: number
      } 
    }>(`/api/budget/${month}/${year}?context=${context}`),

  create: (body: {
    month: number
    year: number
    totalBudget: number
    context: Context
    categories?: Array<{
      category: Category
      limitAmount: number
      alertThreshold?: number
    }>
  }) =>
    request<{ data: { budget: Budget; categories: BudgetCategory[] } }>('/api/budget', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  update: (id: string, body: Partial<{
    totalBudget: number
    categories: Array<{
      category: Category
      limitAmount: number
      alertThreshold?: number
    }>
  }>) =>
    request<{ data: { budget: Budget; categories: BudgetCategory[]; spentTotal: number; remainingTotal: number; percentageUsed: number } }>(`/api/budget/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  delete: (id: string, confirm: boolean) =>
    request<{ data: { message: string; deletedBudget: Budget } }>(`/api/budget/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ confirm }),
    }),

  history: (params?: { limit?: number; offset?: number; year?: number }) => {
    const qs = params ? new URLSearchParams(params as any).toString() : ''
    return request<{ data: Array<{ budget: Budget; categories: BudgetCategory[]; spentTotal: number; remainingTotal: number; percentageUsed: number }>; meta: { limit: number; offset: number; year?: number; total: number } }>(`/api/budget/history${qs ? `?${qs}` : ''}`)
  },

  calculate: (body: { month: number; year: number; context: Context }) =>
    request<{ data: { categories: BudgetCategory[]; totalSpent: number; percentageUsed: number } }>('/api/budget/calculate', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  alerts: () =>
    request<{ data: { alerts: Array<{ category: Category; limit: number; spent: number; percentage: number }> } }>('/api/budget/alerts'),
}

export interface Couple {
  id: string
  name: string
  user1VisibleToPartner: boolean
  user2VisibleToPartner: boolean
  createdAt: string
  members: Array<{
    id: string
    name: string
    email: string
    avatarUrl?: string | null
    createdAt: string
  }>
}

export interface CoupleInviteLink {
  inviteLink: string
  expiresAt: string
  maxUses: number
  tokenPreview: string
}

export const couplesApi = {
  get: () =>
    request<{ couple: Couple }>('/api/couples'),

  update: (body: Partial<{
    name: string
    user1VisibleToPartner: boolean
    user2VisibleToPartner: boolean
  }>) =>
    request<{ couple: Couple }>('/api/couples', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  leave: () =>
    request<{ message: string }>('/api/couples/leave', {
      method: 'POST',
    }),

  dissolve: () =>
    request<{ message: string }>('/api/couples', {
      method: 'DELETE',
    }),

  createInviteLink: (body: {
    expiresAt?: string
    maxUses?: number
  }) =>
    request<CoupleInviteLink>('/api/couples/invite-link', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  revokeInviteLink: () =>
    request<{ message: string }>('/api/couples/invite-link', {
      method: 'DELETE',
    }),

  acceptInvite: (token: string) =>
    request<{ message: string; couple: { id: string; name: string } }>('/api/couples/accept-invite', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),
}
