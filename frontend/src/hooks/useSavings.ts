import { useState, useEffect, useCallback } from 'react'
import { savingsApi, SavingsGoal, Context } from '../lib/api'

interface UseSavingsOptions {
  context?: Context
  autoFetch?: boolean
}

export function useSavings({ context, autoFetch = true }: UseSavingsOptions = {}) {
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await savingsApi.list(context)
      setGoals(response.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch savings goals')
      console.error('Error fetching savings goals:', err)
    } finally {
      setLoading(false)
    }
  }, [context])

  const createGoal = useCallback(async (goalData: {
    title: string
    targetAmount: number
    context: Context
    emoji?: string
    deadline?: string
    isRecurring?: boolean
    frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly'
    nextTargetDate?: string
  }) => {
    try {
      setLoading(true)
      const response = await savingsApi.create(goalData)
      setGoals(prev => [...prev, response.data])
      return response.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create savings goal')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateGoal = useCallback(async (id: string, updates: Partial<{
    title: string
    targetAmount: number
    emoji: string
    deadline: string
    isRecurring: boolean
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
    nextTargetDate: string
  }>) => {
    try {
      setLoading(true)
      const response = await savingsApi.update(id, updates)

      // Atualizar o estado local
      setGoals(prev => prev.map(goal =>
        goal.id === id ? response.data : goal
      ))

      return response.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update savings goal')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteGoal = useCallback(async (id: string) => {
    try {
      setLoading(true)
      await savingsApi.delete(id)
      setGoals(prev => prev.filter(goal => goal.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete savings goal')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const contributeToGoal = useCallback(async (id: string, amount: number) => {
    try {
      setLoading(true)
      const response = await savingsApi.contribute(id, amount)

      // Atualizar o estado local
      setGoals(prev => prev.map(goal =>
        goal.id === id ? response.data : goal
      ))

      return response.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to contribute to savings goal')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const checkAndResetGoal = useCallback(async (id: string) => {
    try {
      setLoading(true)
      const response = await savingsApi.checkAndReset(id)

      // Atualizar o estado local
      setGoals(prev => prev.map(goal =>
        goal.id === id ? response.data : goal
      ))

      return response.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check and reset savings goal')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getRecurrenceInfo = useCallback(async (id: string) => {
    try {
      setLoading(true)
      const response = await savingsApi.getRecurrenceInfo(id)
      return response.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get recurrence info')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (autoFetch) {
      fetchGoals()
    }
  }, [fetchGoals, autoFetch])

  return {
    goals,
    loading,
    error,
    refetch: fetchGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    contributeToGoal,
    checkAndResetGoal,
    getRecurrenceInfo,
  }
}