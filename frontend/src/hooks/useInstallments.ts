import { useState, useEffect, useCallback } from 'react'
import { installmentsApi, type InstallmentPurchase, type Context, type Category } from '../lib/api'

interface UseInstallmentsOptions {
  context?: Context
  isActive?: boolean
  autoFetch?: boolean
}

export function useInstallments({ context, isActive, autoFetch = true }: UseInstallmentsOptions = {}) {
  const [installments, setInstallments] = useState<InstallmentPurchase[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await installmentsApi.list(context, isActive)
      setInstallments(data)
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
    totalAmount: number
    installmentCount: number
    installmentAmount: number
    startDate: string
    nextDueDate: string
    category?: Category
    context: Context
    accountId?: string
    notes?: string
  }) => {
    const { data } = await installmentsApi.create(body)
    setInstallments(prev => [data, ...prev])
    return data
  }

  const update = async (id: string, body: Partial<{
    title: string
    totalAmount: number
    installmentCount: number
    installmentAmount: number
    startDate: string
    nextDueDate: string
    category: Category
    context: Context
    accountId: string | null
    notes: string | null
    isActive: boolean
  }>) => {
    const { data } = await installmentsApi.update(id, body)
    setInstallments(prev => prev.map(i => i.id === id ? data : i))
    return data
  }

  const remove = async (id: string) => {
    await installmentsApi.delete(id)
    setInstallments(prev => prev.filter(i => i.id !== id))
  }

  const advance = async (id: string) => {
    const { data, completed } = await installmentsApi.advance(id)
    if (completed) {
      setInstallments(prev => prev.filter(i => i.id !== id))
    } else {
      setInstallments(prev => prev.map(i => i.id === id ? data : i))
    }
    return { installment: data, completed }
  }

  const toggleActive = async (id: string) => {
    const { data } = await installmentsApi.toggleActive(id)
    setInstallments(prev => prev.map(i => i.id === id ? data : i))
    return data
  }

  return {
    installments,
    loading,
    error,
    refetch: fetch,
    create,
    update,
    remove,
    advance,
    toggleActive,
  }
}