import { useState, useEffect, useCallback } from 'react'
import { budgetApi, type Budget, type BudgetCategory, type Context, type Category } from '../lib/api'

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
}

/**
 * Hook para gerenciamento de estado de orçamento mensal
 * 
 * @param options - Opções de configuração do hook
 * @returns Objeto com estado, ações e utilitários de orçamento
 */
export function useBudget({ context = 'individual', autoFetch = true }: UseBudgetOptions = {}) {
  const [budget, setBudget] = useState<BudgetWithDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [alerts, setAlerts] = useState<BudgetAlert[]>([])

  /**
   * Busca orçamento do mês/ano especificado
   * 
   * @param month - Mês (1-12)
   * @param year - Ano (2020-2100)
   * @param ctx - Contexto (individual/joint)
   */
  const fetchBudget = useCallback(async (
    month: number,
    year: number,
    ctx?: Context
  ) => {
    const targetContext = ctx || context
    setLoading(true)
    setError(null)
    try {
      const response = await budgetApi.get(month, year, targetContext)
      setBudget({
        ...response.data.budget,
        categories: response.data.categories,
        spentTotal: response.data.spentTotal,
        remainingTotal: response.data.remainingTotal,
        percentageUsed: response.data.percentageUsed,
      })
      return response.data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [context])

  /**
   * Cria novo orçamento mensal
   * 
   * @param data - Dados do orçamento a ser criado
   * @returns Orçamento criado ou null em caso de erro
   */
  const createBudget = useCallback(async (data: CreateBudgetData) => {
    setLoading(true)
    setError(null)
    try {
      const response = await budgetApi.create(data)
      setBudget({
        ...response.data.budget,
        categories: response.data.categories,
        spentTotal: 0,
        remainingTotal: Number(response.data.budget.totalBudget),
        percentageUsed: 0,
      })
      return response.data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Atualiza orçamento existente
   * 
   * @param id - ID do orçamento
   * @param data - Dados a serem atualizados
   * @returns Orçamento atualizado ou null em caso de erro
   */
  const updateBudget = useCallback(async (id: string, data: UpdateBudgetData) => {
    setLoading(true)
    setError(null)
    try {
      const response = await budgetApi.update(id, data)
      setBudget({
        ...response.data.budget,
        categories: response.data.categories,
        spentTotal: response.data.spentTotal,
        remainingTotal: response.data.remainingTotal,
        percentageUsed: response.data.percentageUsed,
      })
      return response.data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Deleta orçamento existente
   * 
   * @param id - ID do orçamento
   * @returns Sucesso da operação
   */
  const deleteBudget = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await budgetApi.delete(id, true)
      setBudget(null)
      return response.data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Calcula gastos do mês baseado nas transações
   * Atualiza automaticamente os valores de spentAmount das categorias
   * 
   * @param month - Mês (1-12)
   * @param year - Ano (2020-2100)
   * @returns Dados calculados ou null em caso de erro
   */
  const calculateSpent = useCallback(async (month: number, year: number) => {
    setLoading(true)
    setError(null)
    try {
      const response = await budgetApi.calculate({ month, year, context })
      
      // Atualiza o budget local com os valores calculados
      if (budget) {
        const updatedCategories = budget.categories.map(cat => {
          const calculated = response.data.categories.find(c => c.category === cat.category)
          return calculated || cat
        })
        
        setBudget({
          ...budget,
          categories: updatedCategories,
          spentTotal: response.data.totalSpent,
          remainingTotal: Number(budget.totalBudget) - response.data.totalSpent,
          percentageUsed: response.data.percentageUsed,
        })
      }
      
      return response.data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [budget, context])

  /**
   * Verifica alertas de orçamento (categorias próximas ou acima do limite)
   * Retorna categorias que ultrapassaram o threshold configurado
   * 
   * @returns Lista de alertas ou lista vazia em caso de erro
   */
  const checkAlerts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await budgetApi.alerts()
      setAlerts(response.data.alerts)
      return response.data.alerts
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Limpa o estado do budget (útil ao desmontar componente ou trocar contexto)
   */
  const clearBudget = useCallback(() => {
    setBudget(null)
    setError(null)
    setAlerts([])
  }, [])

  return {
    // Estado
    budget,
    loading,
    error,
    alerts,
    
    // Ações CRUD
    fetchBudget,
    createBudget,
    updateBudget,
    deleteBudget,
    
    // Utilitários
    calculateSpent,
    checkAlerts,
    clearBudget,
  }
}
