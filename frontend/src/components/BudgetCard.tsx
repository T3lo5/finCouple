import React from 'react'
import { motion } from 'motion/react'
import { AlertTriangle } from 'lucide-react'

interface BudgetCardProps {
  totalBudget: number
  spent: number
  remaining: number
  percentageUsed: number
  context?: 'individual' | 'joint'
  showAlert?: boolean
}

/**
 * Componente de cartão de orçamento para exibição resumida
 * 
 * Features:
 * - Mostra: total budget, spent, remaining
 * - Barra de progresso visual animada
 * - Porcentagem utilizada
 * - Cores contextuais:
 *   - Verde: <80% utilizado
 *   - Amarelo: 80-100% utilizado
 *   - Vermelho: >100% utilizado
 * 
 * @param totalBudget - Valor total do orçamento
 * @param spent - Valor já gasto
 * @param remaining - Valor restante
 * @param percentageUsed - Porcentagem utilizada (0-100+)
 * @param context - Contexto do orçamento (individual/joint)
 * @param showAlert - Se deve exibir alerta quando >=80%
 */
export default function BudgetCard({
  totalBudget,
  spent,
  remaining,
  percentageUsed,
  context = 'individual',
  showAlert = true,
}: BudgetCardProps) {
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
    return 'text-positive'
  }

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-negative'
    if (percentage >= 80) return 'bg-amber-400'
    return 'bg-positive'
  }

  const isOverBudget = percentageUsed >= 100
  const isNearLimit = percentageUsed >= 80 && percentageUsed < 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="p-6 bg-surface rounded-3xl border border-white/5 shadow-xl"
    >
      <div className="space-y-6">
        {/* Header com contexto */}
        <div className="text-center">
          <span className="text-muted text-xs uppercase tracking-widest font-medium">
            {context === 'individual' ? 'Orçamento Pessoal' : 'Orçamento Conjunto'}
          </span>
        </div>

        {/* Orçamento Total */}
        <div className="text-center">
          <span className="text-muted text-xs uppercase tracking-widest">
            Orçamento Total
          </span>
          <div className="flex items-baseline justify-center gap-1 mt-1">
            <span className="text-3xl sm:text-4xl font-headings font-medium">
              R${formatCurrency(totalBudget).split('.')[0]}
            </span>
            <span className="text-lg sm:text-xl font-headings text-muted">
              ,{formatCurrency(totalBudget).split('.')[1]}
            </span>
          </div>
        </div>

        {/* Grid de Gasto e Restante */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
          <div className="text-center">
            <p className="text-[10px] text-muted uppercase tracking-widest">Gasto</p>
            <p className={`text-lg font-headings font-medium ${getProgressColor(percentageUsed)}`}>
              -R${formatCurrency(spent)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted uppercase tracking-widest">Restante</p>
            <p className={`text-lg font-headings font-medium ${
              isOverBudget ? 'text-negative' : getProgressColor(percentageUsed)
            }`}>
              R${formatCurrency(Math.max(0, remaining))}
            </p>
          </div>
        </div>

        {/* Barra de Progresso */}
        <div className="pt-2">
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
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
              className={`h-full rounded-full ${getProgressBarColor(percentageUsed)}`}
            />
          </div>
        </div>

        {/* Alerta de Orçamento */}
        {showAlert && isNearLimit && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2"
          >
            <AlertTriangle size={16} className="text-amber-400" />
            <p className="text-amber-400 text-xs">
              Atenção: Você já utilizou {percentageUsed.toFixed(1)}% do seu orçamento
            </p>
          </motion.div>
        )}

        {/* Alerta de Orçamento Ultrapassado */}
        {showAlert && isOverBudget && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="p-3 bg-negative/10 border border-negative/20 rounded-xl flex items-center gap-2"
          >
            <AlertTriangle size={16} className="text-negative" />
            <p className="text-negative text-xs font-medium">
              Orçamento ultrapassado em {(percentageUsed - 100).toFixed(1)}%!
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
