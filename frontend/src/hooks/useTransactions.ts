import { useState, useEffect, useCallback } from 'react'
import { transactionsApi, type Transaction, type Context, type Category, type TransactionType } from '../lib/api'

interface UseTransactionsOptions {
  context?: Context
  category?: Category
  autoFetch?: boolean
}

export function useTransactions({ context, category, autoFetch = true }: UseTransactionsOptions = {}) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<{ income: number; expenses: number; balance: number } | null>(null)
  const [categorySummary, setCategorySummary] = useState<{ totalExpenses: number; byCategory: { category: Category; amount: number; count: number; percentage: number }[] } | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [txRes, summaryRes, categoryRes] = await Promise.all([
        transactionsApi.list({ context, category, limit: 50 }),
        transactionsApi.monthlySummary(context),
        transactionsApi.byCategorySummary(context),
      ])
      setTransactions(txRes.data)
      setSummary(summaryRes)
      setCategorySummary(categoryRes)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [context, category])

  useEffect(() => {
    if (autoFetch) fetch()
  }, [fetch, autoFetch])

  const create = async (body: {
    title: string
    amount: number
    type: TransactionType
    category: Category
    context: Context
    accountId?: string
    notes?: string
    date?: string
  }) => {
    const { data } = await transactionsApi.create(body)
    setTransactions(prev => [data, ...prev])
    transactionsApi.monthlySummary(context).then(setSummary).catch(() => {})
    return data
  }

  const remove = async (id: string) => {
    await transactionsApi.delete(id)
    setTransactions(prev => prev.filter(t => t.id !== id))
    transactionsApi.monthlySummary(context).then(setSummary).catch(() => {})
  }

  const edit = async (id: string, body: Partial<{
    title: string
    amount: number
    type: TransactionType
    category: Category
    context: Context
    notes?: string
    date?: string
    isRecurring?: boolean
    accountId?: string
  }>) => {
    const { data } = await transactionsApi.update(id, body)
    setTransactions(prev => prev.map(t => t.id === id ? data : t))
    transactionsApi.monthlySummary(context).then(setSummary).catch(() => {})
    return data
  }

  return { transactions, loading, error, summary, categorySummary, refetch: fetch, create, remove, edit }
}

import { savingsApi, type SavingsGoal } from '../lib/api'

export function useSavingsGoals(context?: Context) {
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await savingsApi.list(context)
      setGoals(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [context])

  useEffect(() => { fetch() }, [fetch])

  const create = async (body: Parameters<typeof savingsApi.create>[0]) => {
    const { data } = await savingsApi.create(body)
    setGoals(prev => [...prev, data])
    return data
  }

  const contribute = async (id: string, amount: number) => {
    const { data, completed } = await savingsApi.contribute(id, amount)
    setGoals(prev => prev.map(g => g.id === id ? data : g))
    return { goal: data, completed }
  }

  const edit = async (id: string, body: Partial<{ title: string; targetAmount: number; emoji: string; deadline: string }>) => {
    const { data } = await savingsApi.update(id, body)
    setGoals(prev => prev.map(g => g.id === id ? data : g))
    return data
  }

  const remove = async (id: string) => {
    await savingsApi.delete(id)
    setGoals(prev => prev.filter(g => g.id !== id))
  }

  return { goals, loading, error, refetch: fetch, create, contribute, edit, remove }
}
