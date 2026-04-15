import React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { AlertTriangle, X, Wallet } from 'lucide-react'

interface BudgetAlertProps {
  percentageUsed: number
  totalBudget: number
  spent: number
  remaining: number
  onAdjustBudget?: () => void
  onDismiss?: () => void
  visible?: boolean
}

/**
 * Componente de alerta de orçamento para notificações visuais
 * 
 * Features:
 * - Toast/banner quando orçamento está próximo do limite (>80%)
 * - Exibe alerta vermelho quando orçamento ultrapassado (>100%)
 * - Link rápido para ajustar orçamento
 * - Animações de entrada/saída suaves
 * - Dismissível pelo usuário
 * - Cores contextuais baseadas na porcentagem utilizada
 * 
 * @param percentageUsed - Porcentagem do orçamento utilizada (0-100+)
 * @param totalBudget - Valor total do orçamento
 * @param spent - Valor já gasto
 * @param remaining - Valor restante
 * @param onAdjustBudget - Callback para ação de ajustar orçamento
 * @param onDismiss - Callback para dispensar o alerta
 * @param visible - Controla visibilidade do alerta
 */
export default function BudgetAlert({
  percentageUsed,
  totalBudget,
  spent,
  remaining,
  onAdjustBudget,
  onDismiss,
  visible = true,
}: BudgetAlertProps) {
  // Formatação de valores monetários
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  // Determina o tipo de alerta baseado na porcentagem
  const isOverBudget = percentageUsed >= 100
  const isNearLimit = percentageUsed >= 80 && percentageUsed < 100
  const isWarning = percentageUsed >= 70 && percentageUsed < 80
  
  // Se não estiver em nenhuma faixa de alerta, não renderiza
  if (!isWarning && !isNearLimit && !isOverBudget) {
    return null
  }

  // Configurações do alerta baseadas no nível
  const getAlertConfig = () => {
    if (isOverBudget) {
      return {
        bgColor: 'bg-negative/10',
        borderColor: 'border-negative/20',
        iconColor: 'text-negative',
        textColor: 'text-negative',
        title: 'Orçamento Ultrapassado!',
        message: `Você ultrapassou seu orçamento em ${(percentageUsed - 100).toFixed(1)}%`,
        severity: 'critical',
      }
    }
    if (isNearLimit) {
      return {
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/20',
        iconColor: 'text-amber-400',
        textColor: 'text-amber-400',
        title: 'Atenção: Orçamento Próximo do Limite',
        message: `Você já utilizou ${percentageUsed.toFixed(1)}% do seu orçamento`,
        severity: 'warning',
      }
    }
    return {
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      iconColor: 'text-blue-400',
      textColor: 'text-blue-400',
      title: 'Orçamento em Monitoramento',
      message: `Você utilizou ${percentageUsed.toFixed(1)}% do seu orçamento`,
      severity: 'info',
    }
  }

  const config = getAlertConfig()

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className={`fixed top-4 left-4 right-4 z-50 p-4 ${config.bgColor} ${config.borderColor} border rounded-2xl shadow-2xl backdrop-blur-sm`}
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-start gap-3">
            {/* Ícone com animação de pulso para alertas críticos */}
            <motion.div
              className={`${config.iconColor} flex-shrink-0`}
              animate={isOverBudget ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 1, repeat: isOverBudget ? Infinity : 0, repeatDelay: 2 }}
            >
              {isOverBudget || isNearLimit ? (
                <AlertTriangle size={24} />
              ) : (
                <Wallet size={24} />
              )}
            </motion.div>

            {/* Conteúdo do alerta */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className={`font-headings font-semibold ${config.textColor}`}>
                    {config.title}
                  </h3>
                  <p className={`text-sm ${config.textColor} opacity-90`}>
                    {config.message}
                  </p>
                </div>
                
                {/* Botão de dismiss */}
                {onDismiss && (
                  <motion.button
                    onClick={onDismiss}
                    className={`${config.textColor} opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-lg p-1`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Dispensar alerta"
                  >
                    <X size={18} />
                  </motion.button>
                )}
              </div>

              {/* Resumo dos valores */}
              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/5">
                <div>
                  <p className="text-[10px] text-muted uppercase tracking-widest">Total</p>
                  <p className={`text-sm font-headings font-medium ${config.textColor}`}>
                    R${formatCurrency(totalBudget)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted uppercase tracking-widest">Gasto</p>
                  <p className={`text-sm font-headings font-medium ${config.textColor}`}>
                    -R${formatCurrency(spent)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted uppercase tracking-widest">Restante</p>
                  <p className={`text-sm font-headings font-medium ${
                    remaining < 0 ? 'text-negative' : config.textColor
                  }`}>
                    R${formatCurrency(Math.max(0, remaining))}
                  </p>
                </div>
              </div>

              {/* Barra de progresso */}
              <div className="pt-2">
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(percentageUsed, 100)}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
                    className={`h-full rounded-full ${
                      isOverBudget ? 'bg-negative' :
                      isNearLimit ? 'bg-amber-400' : 'bg-blue-400'
                    }`}
                  />
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-2 pt-3">
                {onAdjustBudget && (
                  <motion.button
                    onClick={onAdjustBudget}
                    className={`flex-1 px-4 py-2 ${config.textColor.replace('text-', 'bg-').replace('400', '500').replace('negative', 'negative')} text-white text-sm font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Ajustar Orçamento
                  </motion.button>
                )}
                {!onAdjustBudget && onDismiss && (
                  <motion.button
                    onClick={onDismiss}
                    className={`flex-1 px-4 py-2 bg-white/10 ${config.textColor} text-sm font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Entendi
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
