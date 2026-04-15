import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { type Context } from '../lib/api'

export interface BudgetPreferences {
  selectedMonth: number
  selectedYear: number
  context: Context
}

interface UseBudgetPreferencesOptions {
  autoSync?: boolean
}

/**
 * Hook para gerenciamento de preferências de orçamento do usuário
 * 
 * - Persiste mês/ano selecionado e contexto (individual/joint)
 * - Sincroniza com backend via API
 * - Fallback para localStorage se não autenticado
 * 
 * @param options - Opções de configuração do hook
 * @returns Objeto com preferências e ações de atualização
 */
export function useBudgetPreferences({ autoSync = true }: UseBudgetPreferencesOptions = {}) {
  const { user, updatePreferences, loading: authLoading } = useAuth()
  
  // Estado local das preferências
  const [preferences, setPreferences] = useState<BudgetPreferences>(() => {
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1
    
    // Tenta carregar do localStorage primeiro (fallback)
    try {
      const stored = localStorage.getItem('budget_preferences')
      if (stored) {
        return JSON.parse(stored)
      }
    } catch {
      // Ignora erros de parsing
    }
    
    // Valores padrão
    return {
      selectedMonth: currentMonth,
      selectedYear: currentYear,
      context: 'individual' as Context,
    }
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Salva preferências no localStorage
   */
  const saveToLocalStorage = useCallback((prefs: BudgetPreferences) => {
    try {
      localStorage.setItem('budget_preferences', JSON.stringify(prefs))
    } catch (err) {
      console.error('Failed to save budget preferences to localStorage:', err)
    }
  }, [])

  /**
   * Atualiza as preferências de orçamento
   * 
   * @param updates - Partial de atualizações (month, year, context)
   * @param syncWithBackend - Se deve sincronizar com o backend (default: true)
   */
  const updateBudgetPreferences = useCallback(async (
    updates: Partial<BudgetPreferences>,
    syncWithBackend: boolean = true
  ) => {
    setLoading(true)
    setError(null)
    
    const newPreferences = { ...preferences, ...updates }
    setPreferences(newPreferences)
    saveToLocalStorage(newPreferences)
    
    // Sincroniza com backend se usuário estiver autenticado
    if (syncWithBackend && user && !authLoading) {
      try {
        await updatePreferences({
          budgetDefaultMonth: newPreferences.selectedMonth,
          budgetDefaultYear: newPreferences.selectedYear,
          budgetDefaultContext: newPreferences.context,
        })
      } catch (err: any) {
        setError(err.message || 'Failed to sync preferences')
        // Reverte para estado anterior em caso de erro
        setPreferences(preferences)
        saveToLocalStorage(preferences)
      }
    }
    
    setLoading(false)
  }, [preferences, user, authLoading, updatePreferences, saveToLocalStorage])

  /**
   * Define o mês selecionado
   */
  const setSelectedMonth = useCallback((month: number) => {
    if (month < 1 || month > 12) return
    updateBudgetPreferences({ selectedMonth: month })
  }, [updateBudgetPreferences])

  /**
   * Define o ano selecionado
   */
  const setSelectedYear = useCallback((year: number) => {
    if (year < 2020 || year > 2100) return
    updateBudgetPreferences({ selectedYear: year })
  }, [updateBudgetPreferences])

  /**
   * Define o contexto (individual/joint)
   */
  const setContext = useCallback((context: Context) => {
    updateBudgetPreferences({ context })
  }, [updateBudgetPreferences])

  /**
   * Navega para o mês anterior
   */
  const prevMonth = useCallback(() => {
    if (preferences.selectedMonth === 1) {
      updateBudgetPreferences({ 
        selectedMonth: 12, 
        selectedYear: preferences.selectedYear - 1 
      })
    } else {
      updateBudgetPreferences({ selectedMonth: preferences.selectedMonth - 1 })
    }
  }, [preferences.selectedMonth, preferences.selectedYear, updateBudgetPreferences])

  /**
   * Navega para o próximo mês
   */
  const nextMonth = useCallback(() => {
    if (preferences.selectedMonth === 12) {
      updateBudgetPreferences({ 
        selectedMonth: 1, 
        selectedYear: preferences.selectedYear + 1 
      })
    } else {
      updateBudgetPreferences({ selectedMonth: preferences.selectedMonth + 1 })
    }
  }, [preferences.selectedMonth, preferences.selectedYear, updateBudgetPreferences])

  /**
   * Sincroniza preferências do backend para o estado local
   */
  const syncFromBackend = useCallback(() => {
    if (!user) return
    
    const updates: Partial<BudgetPreferences> = {}
    
    if (user.budgetDefaultMonth && user.budgetDefaultMonth >= 1 && user.budgetDefaultMonth <= 12) {
      updates.selectedMonth = user.budgetDefaultMonth
    }
    
    if (user.budgetDefaultYear && user.budgetDefaultYear >= 2020 && user.budgetDefaultYear <= 2100) {
      updates.selectedYear = user.budgetDefaultYear
    }
    
    if (user.budgetDefaultContext && (user.budgetDefaultContext === 'individual' || user.budgetDefaultContext === 'joint')) {
      updates.context = user.budgetDefaultContext
    }
    
    if (Object.keys(updates).length > 0) {
      const newPreferences = { ...preferences, ...updates }
      setPreferences(newPreferences)
      saveToLocalStorage(newPreferences)
    }
  }, [user, preferences, saveToLocalStorage])

  // Sincroniza com backend quando usuário carrega
  useEffect(() => {
    if (autoSync && user && !authLoading) {
      syncFromBackend()
    }
  }, [user, authLoading, autoSync, syncFromBackend])

  return {
    // Estado
    preferences,
    loading,
    error,
    
    // Ações
    updateBudgetPreferences,
    setSelectedMonth,
    setSelectedYear,
    setContext,
    prevMonth,
    nextMonth,
    syncFromBackend,
  }
}
