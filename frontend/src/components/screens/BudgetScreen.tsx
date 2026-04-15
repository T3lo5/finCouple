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
  Settings,
} from 'lucide-react'
import { type Context } from '../../lib/api'
import { useBudgetPreferences } from '../../hooks/useBudgetPreferences'
import { useBudget } from '../../hooks/useBudget'
import BudgetCard from '../BudgetCard'
import CategoryBudgetItem from '../CategoryBudgetItem'
import BudgetModal from '../BudgetModal'
import BudgetAlert from '../BudgetAlert'
import { CATEGORIES_META } from '../BudgetModal'
import { BudgetSkeleton } from '../Skeleton'

interface BudgetScreenProps {
  context: Context
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const getCategoryMeta = (catId: string) => 
  CATEGORIES_META.find(c => c.id === catId) || { label: catId, icon: <Settings size={18} /> }

export default function BudgetScreen({ context }: BudgetScreenProps) {
  const { preferences, setSelectedMonth, setSelectedYear, prevMonth, nextMonth, loading: prefsLoading } = useBudgetPreferences({ autoSync: true })
  
  const {
    budget,
    categories,
    loading,
    error,
    validationErrors,
    fetchBudget,
    clearBudget,
  } = useBudget({ context, autoFetch: false })
  
  const [spentTotal, setSpentTotal] = useState(0)
  const [remainingTotal, setRemainingTotal] = useState(0)
  const [percentageUsed, setPercentageUsed] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showAlert, setShowAlert] = useState(true)

  const handleFetchBudget = useCallback(async () => {
    const result = await fetchBudget(preferences.selectedMonth, preferences.selectedYear, context)
    if (result) {
      setSpentTotal(result.spentTotal)
      setRemainingTotal(result.remainingTotal)
      setPercentageUsed(result.percentageUsed)
      setShowAlert(true)
    } else if (!budget) {
      // 404 - no budget for this month/year
      setSpentTotal(0)
      setRemainingTotal(0)
      setPercentageUsed(0)
    }
  }, [preferences.selectedMonth, preferences.selectedYear, context, fetchBudget, budget])

  useEffect(() => {
    handleFetchBudget()
  }, [handleFetchBudget])

  // Use prefsLoading for initial skeleton loading
  const isLoading = prefsLoading || loading

  const handlePrevMonth = () => {
    prevMonth()
  }

  const handleNextMonth = () => {
    nextMonth()
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
            {MONTHS[preferences.selectedMonth - 1]} {preferences.selectedYear}
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

      {/* Skeleton Loading State */}
      {isLoading && <BudgetSkeleton />}

      {/* Error State */}
      {!isLoading && error && (
        <div className="p-4 bg-negative/10 border border-negative/20 rounded-2xl" role="alert" aria-live="assertive">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-negative" aria-hidden="true" />
            <div className="flex-1">
              <p className="text-negative text-sm font-medium">{error}</p>
              {validationErrors && (
                <ul className="mt-2 space-y-1" role="list">
                  {Object.entries(validationErrors).map(([field, message]) => (
                    <li key={field} className="text-negative/80 text-xs">• {message}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* No Budget State */}
      {!isLoading && !error && !budget && (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
            <Wallet size={40} className="text-muted" />
          </div>
          <h3 className="text-xl font-headings font-semibold mb-2">
            Nenhum orçamento definido
          </h3>
          <p className="text-muted text-sm mb-6 max-w-xs mx-auto">
            Crie um orçamento para {MONTHS[preferences.selectedMonth - 1]} de {preferences.selectedYear} para acompanhar seus gastos
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
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
      {!isLoading && !error && budget && (
        <>
          {/* Alerta de Orçamento - Toast/Banner quando >80% utilizado */}
          <BudgetAlert
            percentageUsed={percentageUsed}
            totalBudget={parseFloat(budget.totalBudget)}
            spent={spentTotal}
            remaining={remainingTotal}
            visible={showAlert && percentageUsed >= 80}
            onDismiss={() => setShowAlert(false)}
            onAdjustBudget={() => setIsModalOpen(true)}
          />

          {/* Card de Resumo do Orçamento - Usando componente BudgetCard */}
          <BudgetCard
            totalBudget={parseFloat(budget.totalBudget)}
            spent={spentTotal}
            remaining={remainingTotal}
            percentageUsed={percentageUsed}
            context={context}
            showAlert={true}
          />

          {/* Lista de Categorias */}
          <div>
            <h3 className="text-lg font-headings font-semibold mb-4" id="categories-heading">
              Categorias
            </h3>
            <div className="space-y-3" role="list" aria-labelledby="categories-heading">
              <AnimatePresence>
                {categories.map((category, index) => {
                  const categoryMeta = getCategoryMeta(category.category)

                  return (
                    <CategoryBudgetItem
                      key={category.id}
                      category={category}
                      icon={categoryMeta.icon}
                      label={categoryMeta.label}
                      delay={index * 0.05}
                      showRemaining={true}
                      showAlerts={true}
                    />
                  )
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Botão de Ação */}
          <button
            onClick={() => setIsModalOpen(true)}
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

      {/* Budget Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        context={context}
        selectedMonth={preferences.selectedMonth}
        selectedYear={preferences.selectedYear}
        existingBudget={budget}
        existingCategories={categories}
        onBudgetSaved={() => {
          handleFetchBudget()
        }}
      />
    </motion.div>
  )
}
