import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Plus, Minus, AlertCircle, Check, Utensils, LayoutDashboard, Car, Receipt, ShieldCheck, Settings, CreditCard, ArrowDownLeft, TrendingUp } from 'lucide-react'
import { type Context, type Budget, type BudgetCategory, budgetApi, type Category } from '../../lib/api'

interface BudgetModalProps {
  isOpen: boolean
  onClose: () => void
  context: Context
  selectedMonth: number
  selectedYear: number
  existingBudget?: Budget | null
  existingCategories?: BudgetCategory[]
  onBudgetSaved?: () => void
}

interface CategoryLimit {
  category: string
  limitAmount: string
  alertThreshold: number
  enabled: boolean
}

export default function BudgetModal({
  isOpen,
  onClose,
  context,
  selectedMonth,
  selectedYear,
  existingBudget,
  existingCategories,
  onBudgetSaved,
}: BudgetModalProps) {
  const [totalBudget, setTotalBudget] = useState('')
  const [categoryLimits, setCategoryLimits] = useState<CategoryLimit[]>([])
  const [alertsEnabled, setAlertsEnabled] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize form data when modal opens or editing existing budget
  useEffect(() => {
    if (isOpen) {
      setError(null)
      
      if (existingBudget && existingCategories) {
        // Edit mode: load existing data
        setTotalBudget(parseFloat(existingBudget.totalBudget).toString())
        setAlertsEnabled(true) // Default to enabled for existing budgets
        
        // Initialize all categories with existing limits
        const initializedCategories = CATEGORIES_META.map(catMeta => {
          const existingCategory = existingCategories.find(
            ec => ec.category === catMeta.id
          )
          
          return {
            category: catMeta.id,
            limitAmount: existingCategory 
              ? parseFloat(existingCategory.limitAmount).toString()
              : '',
            alertThreshold: existingCategory?.alertThreshold ?? 80,
            enabled: !!existingCategory,
          }
        })
        
        setCategoryLimits(initializedCategories)
      } else {
        // Create mode: reset form
        setTotalBudget('')
        setAlertsEnabled(true)
        
        // Initialize all categories as empty
        const initializedCategories = CATEGORIES_META.map(catMeta => ({
          category: catMeta.id,
          limitAmount: '',
          alertThreshold: 80,
          enabled: false,
        }))
        
        setCategoryLimits(initializedCategories)
      }
    }
  }, [isOpen, existingBudget, existingCategories])

  const handleCategoryToggle = useCallback((categoryId: string) => {
    setCategoryLimits(prev =>
      prev.map(cat =>
        cat.category === categoryId
          ? { ...cat, enabled: !cat.enabled }
          : cat
      )
    )
  }, [])

  const handleCategoryLimitChange = useCallback(
    (categoryId: string, value: string) => {
      setCategoryLimits(prev =>
        prev.map(cat =>
          cat.category === categoryId
            ? { ...cat, limitAmount: value }
            : cat
        )
      )
    },
    []
  )

  const handleAlertThresholdChange = useCallback(
    (categoryId: string, value: number) => {
      setCategoryLimits(prev =>
        prev.map(cat =>
          cat.category === categoryId
            ? { ...cat, alertThreshold: value }
            : cat
        )
      )
    },
    []
  )

  const calculateTotalCategoriesBudget = useCallback(() => {
    return categoryLimits.reduce((total, cat) => {
      if (cat.enabled && cat.limitAmount) {
        return total + parseFloat(cat.limitAmount) || 0
      }
      return total
    }, 0)
  }, [categoryLimits])

  const handleSave = async () => {
    if (!totalBudget || parseFloat(totalBudget) <= 0) {
      setError('Por favor, informe um valor válido para o orçamento total')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const categoriesData = categoryLimits
        .filter(cat => cat.enabled && cat.limitAmount && parseFloat(cat.limitAmount) > 0)
        .map(cat => ({
          category: cat.category,
          limitAmount: parseFloat(cat.limitAmount),
          alertThreshold: alertsEnabled ? cat.alertThreshold : undefined,
        }))

      if (existingBudget) {
        // Update existing budget
        await budgetApi.update(existingBudget.id, {
          totalBudget: parseFloat(totalBudget),
          categories: categoriesData,
        })
      } else {
        // Create new budget
        await budgetApi.create({
          month: selectedMonth,
          year: selectedYear,
          totalBudget: parseFloat(totalBudget),
          context,
          categories: categoriesData,
        })
      }

      onBudgetSaved?.()
      onClose()
    } catch (err: any) {
      console.error('Error saving budget:', err)
      setError(err.message || 'Erro ao salvar orçamento. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const totalCategoriesBudget = calculateTotalCategoriesBudget()
  const totalBudgetValue = parseFloat(totalBudget) || 0
  const isOverBudget = totalCategoriesBudget > totalBudgetValue
  const remainingToAllocate = totalBudgetValue - totalCategoriesBudget

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
          />

          {/* Bottom Sheet Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 h-[85vh] bg-surface rounded-t-[32px] border-t border-white/10 z-[70] flex flex-col"
          >
            {/* Handle */}
            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-6 mb-4" />

            {/* Header */}
            <div className="flex justify-between items-center px-6 mb-6">
              <h2 className="text-xl sm:text-2xl font-headings font-semibold">
                {existingBudget ? 'Editar Orçamento' : 'Novo Orçamento'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 bg-white/5 rounded-full text-muted hover:bg-white/10 transition-colors"
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
              {/* Month/Year Display */}
              <div className="text-center p-4 bg-white/5 rounded-2xl">
                <span className="text-muted text-xs uppercase tracking-widest block mb-1">
                  {context === 'individual' ? 'Orçamento Pessoal' : 'Orçamento Conjunto'}
                </span>
                <span className="text-lg font-headings font-medium">
                  {MONTHS[selectedMonth - 1]} {selectedYear}
                </span>
              </div>

              {/* Total Budget Input */}
              <div>
                <label className="text-muted text-xs uppercase tracking-widest block mb-3">
                  Orçamento Total do Mês
                </label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-muted text-lg">
                    R$
                  </span>
                  <input
                    type="number"
                    placeholder="0,00"
                    value={totalBudget}
                    onChange={(e) => setTotalBudget(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-14 pr-5 focus:outline-none focus:border-primary/30 placeholder:text-muted/40 text-lg font-headings"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              {/* Budget Summary */}
              {totalBudgetValue > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`p-4 rounded-2xl border ${
                    isOverBudget
                      ? 'bg-negative/10 border-negative/20'
                      : remainingToAllocate > 0
                      ? 'bg-white/5 border-white/5'
                      : 'bg-positive/10 border-positive/20'
                  }`}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-muted text-xs uppercase tracking-widest block">
                        Alocado nas Categorias
                      </span>
                      <span
                        className={`text-lg font-headings ${
                          isOverBudget ? 'text-negative' : 'text-text'
                        }`}
                      >
                        R${totalCategoriesBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted text-xs uppercase tracking-widest block">
                        Restante para Alocar
                      </span>
                      <span
                        className={`text-lg font-headings ${
                          remainingToAllocate < 0 ? 'text-negative' : 'text-positive'
                        }`}
                      >
                        R${remainingToAllocate.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {isOverBudget && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 flex items-center gap-2 text-negative text-sm"
                    >
                      <AlertCircle size={16} />
                      <span>
                        O valor alocado ultrapassa o orçamento total em R$
                        {Math.abs(remainingToAllocate).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Alerts Toggle */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      alertsEnabled ? 'bg-primary/10 text-primary' : 'bg-white/5 text-muted'
                    }`}
                  >
                    <AlertCircle size={20} />
                  </div>
                  <div>
                    <span className="text-sm font-medium block">Alertas de Orçamento</span>
                    <span className="text-xs text-muted">
                      Receba notificações quando próximo do limite
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setAlertsEnabled(!alertsEnabled)}
                  className={`w-14 h-8 rounded-full transition-colors relative ${
                    alertsEnabled ? 'bg-primary' : 'bg-white/10'
                  }`}
                  aria-label="Toggle alerts"
                >
                  <motion.div
                    initial={false}
                    animate={{ x: alertsEnabled ? 24 : 2 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                    className="w-6 h-6 bg-white rounded-full absolute top-1 shadow-md"
                  />
                </button>
              </div>

              {/* Categories List */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-muted text-xs uppercase tracking-widest">
                    Limites por Categoria
                  </label>
                  <span className="text-xs text-muted">
                    {categoryLimits.filter((c) => c.enabled).length} de{' '}
                    {CATEGORIES_META.length} ativas
                  </span>
                </div>

                <div className="space-y-3">
                  {CATEGORIES_META.map((categoryMeta, index) => {
                    const categoryData = categoryLimits.find(
                      (c) => c.category === categoryMeta.id
                    )
                    const isEnabled = categoryData?.enabled ?? false

                    return (
                      <motion.div
                        key={categoryMeta.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={`p-4 rounded-2xl border transition-all ${
                          isEnabled
                            ? 'bg-white/5 border-white/10'
                            : 'bg-transparent border-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <button
                            onClick={() => handleCategoryToggle(categoryMeta.id)}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              isEnabled
                                ? 'bg-primary border-primary text-background'
                                : 'border-white/20 text-transparent hover:border-primary/50'
                            }`}
                            aria-label={`Toggle ${categoryMeta.label}`}
                          >
                            <Check size={14} strokeWidth={3} />
                          </button>

                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                              isEnabled ? 'bg-primary/10 text-primary' : 'bg-white/5 text-muted'
                            }`}
                          >
                            {categoryMeta.icon}
                          </div>

                          <span
                            className={`flex-1 font-medium ${
                              isEnabled ? 'text-text' : 'text-muted'
                            }`}
                          >
                            {categoryMeta.label}
                          </span>
                        </div>

                        {isEnabled && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="ml-14 space-y-3"
                          >
                            <div>
                              <label className="text-muted text-xs uppercase tracking-widest block mb-2">
                                Limite Mensal
                              </label>
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm">
                                  R$
                                </span>
                                <input
                                  type="number"
                                  placeholder="0,00"
                                  value={categoryData?.limitAmount || ''}
                                  onChange={(e) =>
                                    handleCategoryLimitChange(
                                      categoryMeta.id,
                                      e.target.value
                                    )
                                  }
                                  className="w-full bg-white/5 border border-white/5 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-primary/30 placeholder:text-muted/40 text-sm"
                                  step="0.01"
                                  min="0"
                                />
                              </div>
                            </div>

                            {alertsEnabled && (
                              <div>
                                <label className="text-muted text-xs uppercase tracking-widest block mb-2">
                                  Alertar em {categoryData?.alertThreshold || 80}% do limite
                                </label>
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() =>
                                      handleAlertThresholdChange(
                                        categoryMeta.id,
                                        Math.max(
                                          50,
                                          (categoryData?.alertThreshold || 80) - 5
                                        )
                                      )
                                    }
                                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                                    aria-label="Decrease threshold"
                                  >
                                    <Minus size={16} />
                                  </button>

                                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{
                                        width: `${categoryData?.alertThreshold || 80}%`,
                                      }}
                                      transition={{ duration: 0.3 }}
                                      className="h-full bg-primary rounded-full"
                                    />
                                  </div>

                                  <button
                                    onClick={() =>
                                      handleAlertThresholdChange(
                                        categoryMeta.id,
                                        Math.min(
                                          100,
                                          (categoryData?.alertThreshold || 80) + 5
                                        )
                                      )
                                    }
                                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                                    aria-label="Increase threshold"
                                  >
                                    <Plus size={16} />
                                  </button>

                                  <span className="text-sm font-medium w-12 text-right">
                                    {categoryData?.alertThreshold || 80}%
                                  </span>
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-negative/10 border border-negative/20 rounded-2xl"
                >
                  <p className="text-negative text-sm">{error}</p>
                </motion.div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-white/10 bg-surface">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="py-4 rounded-2xl font-medium bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={!totalBudget || loading}
                  className={`py-4 rounded-2xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 ${
                    totalBudget && !loading
                      ? context === 'individual'
                        ? 'bg-individual text-white'
                        : 'bg-primary text-background'
                      : 'bg-white/5 text-muted cursor-not-allowed'
                  }`}
                >
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Months constant for display
const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

// Categories metadata
export const CATEGORIES_META: { id: Category; label: string; icon: React.ReactNode }[] = [
  { id: 'dining',     label: 'Alimentação', icon: <Utensils size={18} /> },
  { id: 'home',       label: 'Casa',        icon: <LayoutDashboard size={18} /> },
  { id: 'transport',  label: 'Transporte',  icon: <Car size={18} /> },
  { id: 'shopping',   label: 'Compras',     icon: <Receipt size={18} /> },
  { id: 'health',     label: 'Saúde',       icon: <ShieldCheck size={18} /> },
  { id: 'travel',     label: 'Viagem',      icon: <TrendingUp size={18} /> },
  { id: 'bills',      label: 'Contas',      icon: <CreditCard size={18} /> },
  { id: 'salary',     label: 'Salário',     icon: <ArrowDownLeft size={18} /> },
  { id: 'investment', label: 'Investimento', icon: <TrendingUp size={18} /> },
  { id: 'other',      label: 'Outros',      icon: <Settings size={18} /> },
]
