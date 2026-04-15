import { useState, useCallback, useEffect } from 'react'
import { budgetApi, type Budget, type BudgetCategory, type Context, type Category, ApiError } from '../lib/api'

export interface BudgetWithDetails extends Budget {
  categories: BudgetCategory[]
  spentTotal: number
  remainingTotal: number
  percentageUsed: number
}

export interface BudgetAlert {
  category: Category
  limit: number
  spent: number
  percentage: number
}

export interface CreateBudgetData {
  month: number
  year: number
  totalBudget: number
  context: Context
  categories?: Array<{
    category: Category
    limitAmount: number
    alertThreshold?: number
  }>
}

export interface UpdateBudgetData {
  totalBudget?: number
  categories?: Array<{
    category: Category
    limitAmount: number
    alertThreshold?: number
  }>
}

interface UseBudgetOptions {
  context?: Context
  autoFetch?: boolean
  pollAlerts?: boolean
  alertPollInterval?: number // em ms, para polling de alertas de orçamento
}

export function useBudget({ context = 'individual', autoFetch = true, pollAlerts = false, alertPollInterval = 60000 }: UseBudgetOptions = {}) {
  const [budget, setBudget] = useState<BudgetWithDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string> | null>(null)
  const [alerts, setAlerts] = useState<BudgetAlert[]>([])

  const handleApiError = useCallback((err: any): string => {
    if (err instanceof ApiError) {
      if (err.status === 400) return 'Verifique os dados informados e tente novamente.'
      if (err.status === 401) return 'Sessão expirada. Faça login novamente.'
      if (err.status === 403) return 'Você não tem permissão para realizar esta ação.'
      if (err.status === 404) return 'Orçamento não encontrado.'
      if (err.status === 409) return 'Já existe um orçamento para este período.'
      if (err.status >= 500) return 'Erro no servidor. Tente novamente em instantes.'
    }
    return err.message || 'Ocorreu um erro inesperado. Tente novamente.'
  }, [])

  const extractValidationErrors = useCallback((err: any): Record<string, string> | null => {
    if (err instanceof ApiError && err.status === 400) {
      const errors: Record<string, string> = {}
      if (err.message.includes('month')) errors.month = 'Mês inválido. Deve ser entre 1 e 12.'
      if (err.message.includes('year')) errors.year = 'Ano inválido. Deve ser entre 2020 e 2100.'
      if (err.message.includes('totalBudget')) {
        if (err.message.includes('positive')) errors.totalBudget = 'O valor deve ser positivo.'
        else if (err.message.includes('max')) errors.totalBudget = 'Valor máximo permitido é R$ 999.999,99.'
        else errors.totalBudget = 'Valor do orçamento inválido.'
      }
      if (err.message.includes('context')) errors.context = 'Contexto inválido.'
      if (err.message.includes('category')) errors.categories = 'Categoria inválida.'
      if (err.message.includes('limitAmount')) errors.limitAmount = 'Valor do limite inválido.'
      return Object.keys(errors).length > 0 ? errors : null
    }
    return null
  }, [])

  const fetchBudget = useCallback(async (month: number, year: number, ctx?: Context) => {
    setLoading(true)
    setError(null)
    setValidationErrors(null)
    try {
      const response = await budgetApi.get(month, year, ctx || context)
      setBudget({ ...response.data.budget, categories: response.data.categories, spentTotal: response.data.spentTotal, remainingTotal: response.data.remainingTotal, percentageUsed: response.data.percentageUsed })
      return response.data
    } catch (err: any) {
      const validationErrs = extractValidationErrors(err)
      if (validationErrs) setValidationErrors(validationErrs)
      setError(handleApiError(err))
      return null
    } finally {
      setLoading(false)
    }
  }, [context, handleApiError, extractValidationErrors])

  const createBudget = useCallback(async (data: CreateBudgetData) => {
    setLoading(true)
    setError(null)
    setValidationErrors(null)
    try {
      const response = await budgetApi.create(data)
      setBudget({ ...response.data.budget, categories: response.data.categories, spentTotal: 0, remainingTotal: Number(response.data.budget.totalBudget), percentageUsed: 0 })
      return response.data
    } catch (err: any) {
      const validationErrs = extractValidationErrors(err)
      if (validationErrs) setValidationErrors(validationErrs)
      setError(handleApiError(err))
      return null
    } finally {
      setLoading(false)
    }
  }, [handleApiError, extractValidationErrors])

  const updateBudget = useCallback(async (id: string, data: UpdateBudgetData) => {
    setLoading(true)
    setError(null)
    setValidationErrors(null)
    try {
      const response = await budgetApi.update(id, data)
      setBudget({ ...response.data.budget, categories: response.data.categories, spentTotal: response.data.spentTotal, remainingTotal: response.data.remainingTotal, percentageUsed: response.data.percentageUsed })
      return response.data
    } catch (err: any) {
      const validationErrs = extractValidationErrors(err)
      if (validationErrs) setValidationErrors(validationErrs)
      setError(handleApiError(err))
      return null
    } finally {
      setLoading(false)
    }
  }, [handleApiError, extractValidationErrors])

  const deleteBudget = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    setValidationErrors(null)
    try {
      const response = await budgetApi.delete(id, true)
      setBudget(null)
      return response.data
    } catch (err: any) {
      const validationErrs = extractValidationErrors(err)
      if (validationErrs) setValidationErrors(validationErrs)
      setError(handleApiError(err))
      return null
    } finally {
      setLoading(false)
    }
  }, [handleApiError, extractValidationErrors])

  const calculateSpent = useCallback(async (month: number, year: number) => {
    setLoading(true)
    setError(null)
    setValidationErrors(null)
    try {
      const response = await budgetApi.calculate({ month, year, context })
      if (budget) {
        const updatedCategories = budget.categories.map(cat => {
          const calculated = response.data.categories.find(c => c.category === cat.category)
          return calculated || cat
        })
        setBudget({ ...budget, categories: updatedCategories, spentTotal: response.data.totalSpent, remainingTotal: Number(budget.totalBudget) - response.data.totalSpent, percentageUsed: response.data.percentageUsed })
      }
      return response.data
    } catch (err: any) {
      const validationErrs = extractValidationErrors(err)
      if (validationErrs) setValidationErrors(validationErrs)
      setError(handleApiError(err))
      return null
    } finally {
      setLoading(false)
    }
  }, [budget, context, handleApiError, extractValidationErrors])

  const checkAlerts = useCallback(async () => {
    setLoading(true)
    setError(null)
    setValidationErrors(null)
    try {
      const response = await budgetApi.alerts()
      setAlerts(response.data.alerts)
      return response.data.alerts
    } catch (err: any) {
      const validationErrs = extractValidationErrors(err)
      if (validationErrs) setValidationErrors(validationErrs)
      setError(handleApiError(err))
      return []
    } finally {
      setLoading(false)
    }
  }, [handleApiError, extractValidationErrors])

  const clearBudget = useCallback(() => {
    setBudget(null)
    setError(null)
    setValidationErrors(null)
    setAlerts([])
  }, [])

  // Polling para alertas de orçamento
  useEffect(() => {
    if (pollAlerts) {
      // Check inicial
      checkAlerts()
      
      // Polling periódico
      const interval = setInterval(() => {
        checkAlerts()
          .catch(console.error)
      }, alertPollInterval)
      
      return () => clearInterval(interval)
    }
  }, [pollAlerts, alertPollInterval, checkAlerts])

  return { 
    budget, 
    loading, 
    error, 
    validationErrors, 
    alerts, 
    categories: budget?.categories || [],
    fetchBudget, 
    createBudget, 
    updateBudget, 
    deleteBudget, 
    calculateSpent, 
    checkAlerts, 
    clearBudget, 
    handleApiError, 
    extractValidationErrors 
  }
}
