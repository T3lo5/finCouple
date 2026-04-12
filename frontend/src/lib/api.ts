export type Context = 'individual' | 'joint'
export type TransactionType = 'income' | 'expense' | 'transfer'
export type Category = 'dining' | 'home' | 'transport' | 'shopping' | 'health' | 'travel' | 'bills' | 'salary' | 'investment' | 'other'
export type AccountType = 'checking' | 'savings' | 'credit' | 'investment' | 'benefit'
export type GoalStatus = 'active' | 'completed' | 'paused'

export interface User {
  id:       string
  email:    string
  name:     string
  coupleId: string | null
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
  createdAt:   string
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
}

export interface SavingsGoal {
  id:            string
  userId:        string
  coupleId:      string | null
  title:         string
  targetAmount:  string
  currentAmount: string
  context:       Context
  status:        GoalStatus
  emoji:         string
  deadline:      string | null
  createdAt:     string
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: { total: number; page: number; limit: number; pages: number }
}

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

class ApiError extends Error {
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
}

export const transactionsApi = {
  list: (params?: {
    context?: Context
    category?: Category
    from?: string
    to?: string
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
}

export const savingsApi = {
  list: (context?: Context) => {
    const qs = context ? `?context=${context}` : ''
    return request<{ data: SavingsGoal[] }>(`/api/savings${qs}`)
  },

  create: (body: {
    title: string
    targetAmount: number
    context: Context
    emoji?: string
    deadline?: string
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

  update: (id: string, body: Partial<{ title: string; targetAmount: number; emoji: string; deadline: string }>) =>
    request<{ data: SavingsGoal }>(`/api/savings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  delete: (id: string) =>
    request<{ ok: boolean }>(`/api/savings/${id}`, { method: 'DELETE' }),
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
  }) =>
    request<{ data: Account }>('/api/accounts', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateBalance: (id: string, balance: number) =>
    request<{ data: Account }>(`/api/accounts/${id}/balance`, {
      method: 'PATCH',
      body: JSON.stringify({ balance }),
    }),

  delete: (id: string) =>
    request<{ ok: boolean }>(`/api/accounts/${id}`, { method: 'DELETE' }),
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
