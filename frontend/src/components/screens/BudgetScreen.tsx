import React, { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  ChevronLeft,
  ChevronRight,
  Wallet,
  TrendingUp,
  AlertTriangle,
  Plus,
  X,
  Utensils,
  LayoutDashboard,
  Car,
  Receipt,
  ShieldCheck,
  Settings,
  CreditCard,
  ArrowDownLeft,
} from 'lucide-react'
import { type Context } from '../../lib/api'
import { budgetApi, type Budget, type BudgetCategory } from '../../lib/api'

interface BudgetScreenProps {
  context: Context
  onOpenModal?: () => void
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const CATEGORIES_META: { id: string; label: string; icon: React.ReactNode }[] = [
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

const getCategoryMeta = (catId: string) => 
  CATEGORIES_META.find(c => c.id === catId) || { label: catId, icon: <Settings size={18} /> }

const fmt = (n: number) =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function BudgetScreen({ context, onOpenModal }: BudgetScreenProps) {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [budget, setBudget] = useState<Budget | null>(null)
  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [spentTotal, setSpentTotal] = useState(0)
  const [remainingTotal, setRemainingTotal] = useState(0)
  const [percentageUsed, setPercentageUsed] = useState(0)

  const fetchBudget = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await budgetApi.get(selectedMonth, selectedYear, context)
      setBudget(response.data.budget)
      setCategories(response.data.categories)
      setSpentTotal(response.data.spentTotal)
      setRemainingTotal(response.data.remainingTotal)
      setPercentageUsed(response.data.percentageUsed)
    } catch (err: any) {
      if (err.status === 404) {
        setBudget(null)
        setCategories([])
        setSpentTotal(0)
        setRemainingTotal(0)
        setPercentageUsed(0)
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }, [selectedMonth, selectedYear, context])

  useEffect(() => {
    fetchBudget()
  }, [fetchBudget])

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12)
      setSelectedYear(selectedYear - 1)
    } else {
      setSelectedMonth(selectedMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1)
      setSelectedYear(selectedYear + 1)
    } else {
      setSelectedMonth(selectedMonth + 1)
    }
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'text-negative'
    if (percentage >= 80) return 'text-amber-400'
    return 'text-positive'
  }

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-negative'
    if (percentage >= 80) return 'bg-amber-400'
    return 'bg-positive'
  }

  const accentColor = context === 'individual' ? 'var(--color-individual)' : 'var(--color-primary)'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="pt-28 pb-28 px-4 sm:px-6 space-y-6 sm:space-y-8"
    >
      {/* Header com seletor de mês/ano */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevMonth}
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          aria-label="Mês anterior"
        >
          <ChevronLeft size={20} className="text-muted" />
        </button>
        
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-headings font-semibold">
            {MONTHS[selectedMonth - 1]} {selectedYear}
          </h2>
          <span className="text-xs text-muted uppercase tracking-widest">
            {context === 'individual' ? 'Orçamento Pessoal' : 'Orçamento Conjunto'}
          </span>
        </div>
        
        <button
          onClick={handleNextMonth}
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          aria-label="Próximo mês"
        >
          <ChevronRight size={20} className="text-muted" />
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="mt-4 text-muted text-sm">Carregando orçamento...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="p-4 bg-negative/10 border border-negative/20 rounded-2xl">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-negative" />
            <p className="text-negative text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* No Budget State */}
      {!loading && !error && !budget && (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
            <Wallet size={40} className="text-muted" />
          </div>
          <h3 className="text-xl font-headings font-semibold mb-2">
            Nenhum orçamento definido
          </h3>
          <p className="text-muted text-sm mb-6 max-w-xs mx-auto">
            Crie um orçamento para {MONTHS[selectedMonth - 1]} de {selectedYear} para acompanhar seus gastos
          </p>
          <button
            onClick={onOpenModal}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-medium transition-all active:scale-95"
            style={{ 
              backgroundColor: context === 'individual' ? 'var(--color-individual)' : 'var(--color-primary)',
              color: context === 'individual' ? 'white' : 'var(--color-background)'
            }}
          >
            <Plus size={20} />
            Criar Orçamento
          </button>
        </div>
      )}

      {/* Budget Display */}
      {!loading && !error && budget && (
        <>
          {/* Card de Resumo do Orçamento */}
          <div className="p-6 bg-surface rounded-3xl border border-white/5 shadow-xl">
            <div className="text-center space-y-4">
              <div>
                <span className="text-muted text-xs uppercase tracking-widest font-medium">
                  Orçamento Total
                </span>
                <div className="flex items-baseline justify-center gap-1 mt-1">
                  <span className="text-3xl sm:text-4xl font-headings font-medium">
                    R${fmt(parseFloat(budget.totalBudget)).split('.')[0]}
                  </span>
                  <span className="text-lg sm:text-xl font-headings text-muted">
                    ,{fmt(parseFloat(budget.totalBudget)).split('.')[1]}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                <div className="text-center">
                  <p className="text-[10px] text-muted uppercase tracking-widest">Gasto</p>
                  <p className={`text-lg font-headings font-medium ${getProgressColor(percentageUsed)}`}>
                    -R${fmt(spentTotal)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-muted uppercase tracking-widest">Restante</p>
                  <p className={`text-lg font-headings font-medium ${getProgressColor(percentageUsed)}`}>
                    R${fmt(remainingTotal)}
                  </p>
                </div>
              </div>

              {/* Barra de Progresso */}
              <div className="pt-4">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-muted">Utilizado</span>
                  <span className={`font-medium ${getProgressColor(percentageUsed)}`}>
                    {percentageUsed.toFixed(1)}%
                  </span>
                </div>
                <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(percentageUsed, 100)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full ${getProgressBarColor(percentageUsed)}`}
                  />
                </div>
              </div>

              {/* Alerta se próximo do limite */}
              {percentageUsed >= 80 && (
                <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-400" />
                  <p className="text-amber-400 text-xs">
                    Atenção: Você já utilizou {percentageUsed.toFixed(1)}% do seu orçamento
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Lista de Categorias */}
          <div>
            <h3 className="text-lg font-headings font-semibold mb-4">
              Categorias
            </h3>
            <div className="space-y-3">
              <AnimatePresence>
                {categories.map((category, index) => {
                  const categoryMeta = getCategoryMeta(category.category)
                  const spentAmount = parseFloat(category.spentAmount)
                  const limitAmount = parseFloat(category.limitAmount)
                  const percentage = limitAmount > 0 ? (spentAmount / limitAmount) * 100 : 0
                  const remaining = limitAmount - spentAmount

                  return (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      className="p-4 bg-surface rounded-2xl border border-white/5"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          percentage >= 100 ? 'bg-negative/10 text-negative' :
                          percentage >= 80 ? 'bg-amber-500/10 text-amber-400' :
                          'bg-white/5 text-muted'
                        }`}>
                          {categoryMeta.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{categoryMeta.label}</h4>
                          <p className="text-xs text-muted">
                            Limite: R${fmt(limitAmount)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-headings font-medium text-sm ${getProgressColor(percentage)}`}>
                            R${fmt(spentAmount)}
                          </p>
                          <p className="text-xs text-muted">
                            {percentage.toFixed(0)}%
                          </p>
                        </div>
                      </div>

                      {/* Barra de Progresso da Categoria */}
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(percentage, 100)}%` }}
                          transition={{ delay: index * 0.05 + 0.2, duration: 0.6, ease: 'easeOut' }}
                          className={`h-full rounded-full ${getProgressBarColor(percentage)}`}
                        />
                      </div>

                      {/* Restante */}
                      {remaining > 0 && (
                        <p className="text-xs text-muted mt-2">
                          Restante: R${fmt(remaining)}
                        </p>
                      )}
                      {remaining <= 0 && (
                        <p className="text-xs text-negative mt-2">
                          Limite ultrapassado!
                        </p>
                      )}
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Botão de Ação */}
          <button
            onClick={onOpenModal}
            className="w-full py-4 rounded-2xl font-medium transition-all active:scale-95 flex items-center justify-center gap-2"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: 'var(--color-text)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <Plus size={20} />
            Editar Orçamento
          </button>
        </>
      )}
    </motion.div>
  )
}
