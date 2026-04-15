import React from 'react'
import { motion } from 'motion/react'
import { AlertTriangle } from 'lucide-react'
import type { BudgetCategory } from '../lib/api'

interface CategoryBudgetItemProps {
  category: BudgetCategory
  icon?: React.ReactNode
  label?: string
  delay?: number
  showRemaining?: boolean
  showAlerts?: boolean
}

/**
 * Componente de item de categoria de orçamento para exibição detalhada
 * 
 * Features:
 * - Ícone da categoria (personalizado ou default)
 * - Nome da categoria
 * - Limite definido
 * - Gasto atual
 * - Barra de progresso por categoria
 * - Alerta visual se próximo do limite (>80%)
 * - Alerta visual se limite ultrapassado (>100%)
 * - Exibição do valor restante
 * - Animações de entrada suaves
 * 
 * Cores contextuais:
 * - Verde: <80% utilizado
 * - Amarelo: 80-100% utilizado
 * - Vermelho: >100% utilizado
 * 
 * @param category - Objeto BudgetCategory com dados da categoria
 * @param icon - Ícone opcional (substitui o ícone padrão)
 * @param label - Label opcional (substitui o label padrão)
 * @param delay - Delay para animação de entrada (em segundos)
 * @param showRemaining - Se deve exibir o valor restante
 * @param showAlerts - Se deve exibir alertas visuais
 */
export default function CategoryBudgetItem({
  category,
  icon,
  label,
  delay = 0,
  showRemaining = true,
  showAlerts = true,
}: CategoryBudgetItemProps) {
  // Formatação de valores monetários
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  // Determina cor baseada na porcentagem utilizada
  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'text-negative'
    if (percentage >= 80) return 'text-amber-400'
    return 'text-muted'
  }

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-negative'
    if (percentage >= 80) return 'bg-amber-400'
    return 'bg-positive'
  }

  const getBackgroundColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-negative/10 text-negative'
    if (percentage >= 80) return 'bg-amber-500/10 text-amber-400'
    return 'bg-white/5 text-muted'
  }

  // Cálculos
  const spentAmount = parseFloat(category.spentAmount)
  const limitAmount = parseFloat(category.limitAmount)
  const percentage = limitAmount > 0 ? (spentAmount / limitAmount) * 100 : 0
  const remaining = limitAmount - spentAmount

  const isOverBudget = percentage >= 100
  const isNearLimit = percentage >= 80 && percentage < 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ delay, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="p-4 bg-surface rounded-2xl border border-white/5 shadow-sm"
    >
      {/* Header da Categoria */}
      <div className="flex items-center gap-3 mb-3">
        {/* Ícone da Categoria */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getBackgroundColor(percentage)}`}>
          {icon || <AlertTriangle size={18} />}
        </div>

        {/* Informações da Categoria */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{label || category.category}</h4>
          <p className="text-xs text-muted">
            Limite: R${formatCurrency(limitAmount)}
          </p>
        </div>

        {/* Valores */}
        <div className="text-right flex-shrink-0">
          <p className={`font-headings font-medium text-sm ${getProgressColor(percentage)}`}>
            R${formatCurrency(spentAmount)}
          </p>
          <p className={`text-xs ${getProgressColor(percentage)}`}>
            {percentage.toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Barra de Progresso */}
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percentage, 100)}%` }}
          transition={{ delay: delay + 0.2, duration: 0.6, ease: 'easeOut' }}
          className={`h-full rounded-full ${getProgressBarColor(percentage)}`}
        />
      </div>

      {/* Informações Adicionais */}
      {showRemaining && (
        <>
          {remaining > 0 && !isNearLimit && (
            <p className="text-xs text-muted mt-2">
              Restante: R${formatCurrency(remaining)}
            </p>
          )}
          {remaining <= 0 && remaining > -limitAmount && (
            <p className="text-xs text-negative mt-2 font-medium">
              Limite ultrapassado em R${formatCurrency(Math.abs(remaining))}!
            </p>
          )}
        </>
      )}

      {/* Alertas Visuais */}
      {showAlerts && isNearLimit && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: delay + 0.3, duration: 0.3 }}
          className="mt-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2"
        >
          <AlertTriangle size={14} className="text-amber-400 flex-shrink-0" />
          <p className="text-amber-400 text-xs">
            Atenção: {percentage.toFixed(0)}% do limite utilizado
          </p>
        </motion.div>
      )}

      {showAlerts && isOverBudget && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: delay + 0.3, duration: 0.3 }}
          className="mt-3 p-2 bg-negative/10 border border-negative/20 rounded-xl flex items-center gap-2"
        >
          <AlertTriangle size={14} className="text-negative flex-shrink-0" />
          <p className="text-negative text-xs font-medium">
            Orçamento ultrapassado em {(percentage - 100).toFixed(0)}%!
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}
