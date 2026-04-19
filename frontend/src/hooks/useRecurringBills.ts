import { useState, useEffect, useCallback } from 'react'
import { recurringApi, type RecurringBill, type Context, type Category } from '../lib/api'

interface UseRecurringBillsOptions {
  context?: Context
  isActive?: boolean
  autoFetch?: boolean
}

export function useRecurringBills({ context, isActive, autoFetch = true }: UseRecurringBillsOptions = {}) {
  const [bills, setBills] = useState<RecurringBill[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await recurringApi.list(context, isActive)
      setBills(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [context, isActive])

  useEffect(() => {
    if (autoFetch) {
      fetch()
    }
  }, [fetch, autoFetch])

  const create = async (body: {
    title: string
    amount: number
    category?: Category
    context: Context
    frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly'
    nextDueDate?: string
    autoPay?: boolean
  }) => {
    const { data } = await recurringApi.create(body)
    setBills(prev => [data, ...prev])
    return data
  }

  const update = async (id: string, body: Partial<{
    title: string
    amount: number
    category: Category
    context: Context
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
    nextDueDate: string
    autoPay: boolean
  }>) => {
    const { data } = await recurringApi.update(id, body)
    setBills(prev => prev.map(b => b.id === id ? data : b))
    return data
  }

  const remove = async (id: string) => {
    await recurringApi.delete(id)
    setBills(prev => prev.filter(b => b.id !== id))
  }

  const toggleActive = async (id: string) => {
    const { data } = await recurringApi.toggleActive(id)
    setBills(prev => prev.map(b => b.id === id ? data : b))
    return data
  }

  return {
    bills,
    loading,
    error,
    refetch: fetch,
    create,
    update,
    remove,
    toggleActive,
  }
}