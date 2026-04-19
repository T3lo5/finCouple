import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, CreditCard, X, Pencil, ChevronRight, Calendar, Percent } from 'lucide-react'
import { useInstallments } from '../../hooks/useInstallments'
import { type Context, type Category, type InstallmentPurchase, type AccountType } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../Toast'

const CATEGORY_LABELS: Record<Category, string> = {
  dining: 'Alimentação',
  home: 'Casa',
  transport: 'Transporte',
  shopping: 'Compras',
  health: 'Saúde',
  travel: 'Viagem',
  bills: 'Contas',
  salary: 'Salário',
  investment: 'Investimento',
  other: 'Outros',
}

const CATEGORY_COLORS: Record<Category, string> = {
  dining: '#f97316',
  home: '#8b5cf6',
  transport: '#3b82f6',
  shopping: '#ec4899',
  health: '#10b981',
  travel: '#06b6d4',
  bills: '#6366f1',
  salary: '#22c55e',
  investment: '#eab308',
  other: '#6b7280',
}

interface InstallmentsScreenProps {
  context: Context
}

const InstallmentsScreen = ({ context }: InstallmentsScreenProps) => {
  const { installments, loading, error, refetch, toggleActive, remove } = useInstallments({ context })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingInstallment, setEditingInstallment] = useState<InstallmentPurchase | null>(null)
  const toast = useToast()

  const handleToggleActive = async (id: string) => {
    try {
      await toggleActive(id)
      toast.showToast('Status atualizado!', 'success')
    } catch (err: any) {
      toast.showToast(err.message || 'Erro ao atualizar', 'error')
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta compra parcelada?')) {
      try {
        await remove(id)
        toast.showToast('Compra excluída!', 'success')
      } catch (err: any) {
        toast.showToast(err.message || 'Erro ao excluir', 'error')
      }
    }
  }

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Number(amount))
  }

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
    }).format(new Date(date))
  }

  const activeInstallments = installments.filter(i => i.isActive)
  const inactiveInstallments = installments.filter(i => !i.isActive)
  const totalMonthly = activeInstallments.reduce((sum, i) => sum + parseFloat(i.installmentAmount), 0)
  const totalRemaining = activeInstallments.reduce((sum, i) => {
    const remaining = i.installmentCount - i.currentInstallment + 1
    return sum + (remaining * parseFloat(i.installmentAmount))
  }, 0)

  // Calcular progresso
  const getProgressPercentage = (current: number, total: number) => {
    return Math.round((current / total) * 100)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pt-28 pb-28 px-4 sm:px-6 space-y-8 sm:space-y-10"
    >
      <div className="text-center space-y-4">
        <h2 className="text-2xl sm:text-3xl font-headings font-semibold">Compras Parceladas</h2>
        <p className="text-muted text-sm">
          Acompanhe suas compras divididas em parcelas
        </p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-surface rounded-2xl border border-white/10">
          <span className="text-muted text-xs uppercase tracking-widest block mb-1">Parcela/Mês</span>
          <p className="text-xl font-headings font-medium">{formatCurrency(totalMonthly)}</p>
        </div>
        <div className="text-center p-4 bg-surface rounded-2xl border border-white/10">
          <span className="text-muted text-xs uppercase tracking-widest block mb-1">Total Restante</span>
          <p className="text-xl font-headings font-medium">{formatCurrency(totalRemaining)}</p>
        </div>
      </div>

      <p className="text-center text-xs text-muted">{activeInstallments.length} compras ativas</p>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-surface rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center py-8 text-negative">
          <p>{error}</p>
          <button
            onClick={refetch}
            className="mt-4 px-4 py-2 bg-primary rounded-xl text-background text-sm"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Lista vazia */}
      {!loading && !error && installments.length === 0 && (
        <div className="text-center py-12 text-muted/50 text-sm">
          Nenhuma compra parcelada cadastrada.<br />
          <span className="text-xs">Adicione sua primeira compra abaixo.</span>
        </div>
      )}

      {/* Compras ativas */}
      {!loading && !error && activeInstallments.length > 0 && (
        <div className="space-y-3">
          {activeInstallments.map((installment, index) => {
            const progress = getProgressPercentage(installment.currentInstallment, installment.installmentCount)
            const isLastInstallment = installment.currentInstallment === installment.installmentCount

            return (
              <motion.div
                key={installment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 bg-surface rounded-2xl border border-white/10"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${CATEGORY_COLORS[installment.category]}20` }}
                    >
                      <CreditCard size={16} style={{ color: CATEGORY_COLORS[installment.category] }} />
                    </div>
                    <div>
                      <p className="font-medium">{installment.title}</p>
                      <p className="text-xs text-muted">{CATEGORY_LABELS[installment.category]}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingInstallment(installment)
                        setIsModalOpen(true)
                      }}
                      className="p-2 rounded-full bg-white/5 text-muted hover:text-white transition-colors"
                      aria-label="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(installment.id)}
                      className="p-2 rounded-full bg-white/5 text-muted hover:text-negative transition-colors"
                      aria-label="Excluir"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Barra de progresso */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted">Parcela {installment.currentInstallment} de {installment.installmentCount}</span>
                    <span style={{ color: CATEGORY_COLORS[installment.category] }}>{progress}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[installment.category] }}
                    />
                  </div>
                </div>

                {/* Valores */}
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-muted">Valor da parcela</p>
                    <p className="font-headings font-medium">{formatCurrency(installment.installmentAmount)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted">Total</p>
                    <p className="text-sm text-muted">{formatCurrency(installment.totalAmount)}</p>
                  </div>
                </div>

                {/* Data do próximo vencimento */}
                <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 text-xs text-muted">
                  <Calendar size={14} />
                  <span>Próximo vencimento: {formatDate(installment.nextDueDate)}</span>
                  {isLastInstallment && (
                    <span className="ml-auto text-positive">Última parcela!</span>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Compras inativas/concluídas */}
      {!loading && !error && inactiveInstallments.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-muted uppercase tracking-widest font-medium">Concluídas/Inativas</p>
          {inactiveInstallments.map((installment, index) => (
            <motion.div
              key={installment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (activeInstallments.length + index) * 0.05 }}
              className="p-4 bg-surface/50 rounded-2xl border border-white/5"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-muted/50">
                    <CreditCard size={16} />
                  </div>
                  <div>
                    <p className="font-medium text-muted">{installment.title}</p>
                    <p className="text-xs text-muted/50">
                      {installment.installmentCount}x de {formatCurrency(installment.installmentAmount)} • {installment.currentInstallment}/{installment.installmentCount}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleActive(installment.id)}
                  className="p-2 rounded-full bg-white/5 text-muted hover:text-white transition-colors"
                  aria-label="Reativar"
                >
                  <Percent size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Botão adicionar */}
      <button
        onClick={() => {
          setEditingInstallment(null)
          setIsModalOpen(true)
        }}
        className="w-full py-4 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-2 text-muted hover:bg-white/5 transition-colors"
      >
        <div className="w-10 h-10 rounded-full border border-dashed border-white/20 flex items-center justify-center">
          <Plus size={20} />
        </div>
        <span className="text-xs uppercase tracking-[0.2em] font-bold">Nova Compra Parcelada</span>
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <InstallmentModal
            installment={editingInstallment}
            context={context}
            onClose={() => {
              setIsModalOpen(false)
              setEditingInstallment(null)
            }}
            onSaved={() => refetch()}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Modal component
const InstallmentModal = ({
  installment,
  context,
  onClose,
  onSaved,
}: {
  installment: InstallmentPurchase | null
  context: Context
  onClose: () => void
  onSaved: () => void
}) => {
  const { create, update } = useInstallments({ autoFetch: false })
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: installment?.title || '',
    totalAmount: installment ? parseFloat(installment.totalAmount) : 0,
    installmentCount: installment?.installmentCount || 1,
    installmentAmount: installment ? parseFloat(installment.installmentAmount) : 0,
    startDate: installment?.startDate ? installment.startDate.split('T')[0] : new Date().toISOString().split('T')[0],
    nextDueDate: installment?.nextDueDate ? installment.nextDueDate.split('T')[0] : new Date().toISOString().split('T')[0],
    category: installment?.category || 'shopping' as Category,
    ctxContext: installment?.context || context,
    notes: installment?.notes || '',
  })

  // Calcular valor da parcela automaticamente
  const handleTotalChange = (total: number, count: number) => {
    if (total > 0 && count > 0) {
      const installmentAmount = total / count
      return installmentAmount.toFixed(2)
    }
    return '0'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.totalAmount || !formData.installmentCount) return

    setLoading(true)
    try {
      const installmentAmount = parseFloat(formData.totalAmount) / formData.installmentCount

      if (installment) {
        await update(installment.id, {
          title: formData.title,
          totalAmount: formData.totalAmount,
          installmentCount: formData.installmentCount,
          installmentAmount,
          startDate: new Date(formData.startDate).toISOString(),
          nextDueDate: new Date(formData.nextDueDate).toISOString(),
          category: formData.category,
          context: formData.ctxContext,
          notes: formData.notes || null,
        })
        toast.showToast('Compra atualizada!', 'success')
      } else {
        await create({
          title: formData.title,
          totalAmount: formData.totalAmount,
          installmentCount: formData.installmentCount,
          installmentAmount,
          startDate: new Date(formData.startDate).toISOString(),
          nextDueDate: new Date(formData.nextDueDate).toISOString(),
          category: formData.category,
          context: formData.ctxContext,
          notes: formData.notes || undefined,
        })
        toast.showToast('Compra criada!', 'success')
      }
      onSaved()
      onClose()
    } catch (err: any) {
      toast.showToast(err.message || 'Erro ao salvar', 'error')
    } finally {
      setLoading(false)
    }
  }

  const installmentAmount = formData.totalAmount > 0 && formData.installmentCount > 0
    ? (formData.totalAmount / formData.installmentCount).toFixed(2)
    : '0.00'

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed bottom-0 left-0 right-0 h-[90vh] bg-surface rounded-t-[32px] border-t border-white/10 z-[70] p-6 flex flex-col"
      >
        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6" />

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-headings font-semibold">
            {installment ? 'Editar Compra' : 'Nova Compra Parcelada'}
          </h2>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-muted">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-5">
          {/* Título */}
          <div>
            <label className="text-muted text-xs uppercase tracking-widest block mb-2">Descrição da Compra</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: iPhone 15 Pro, Geladeira..."
              className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-5 focus:outline-none focus:border-primary/30 placeholder:text-muted/40 text-sm"
              required
            />
          </div>

          {/* Valor Total e Parcelas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-muted text-xs uppercase tracking-widest block mb-2">Valor Total</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted">R$</span>
                <input
                  type="number"
                  value={formData.totalAmount}
                  onChange={e => setFormData(prev => ({ ...prev, totalAmount: parseFloat(e.target.value) || 0 }))}
                  step="0.01"
                  placeholder="0,00"
                  className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-10 pr-5 focus:outline-none focus:border-primary/30 placeholder:text-muted/40 text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-muted text-xs uppercase tracking-widest block mb-2">Nº de Parcelas</label>
              <input
                type="number"
                value={formData.installmentCount}
                onChange={e => setFormData(prev => ({ ...prev, installmentCount: parseInt(e.target.value) || 1 }))}
                min="1"
                max="120"
                className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-5 focus:outline-none focus:border-primary/30 text-white text-sm"
                required
              />
            </div>
          </div>

          {/* Valor calculado por parcela */}
          {formData.totalAmount > 0 && (
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-2xl text-center">
              <p className="text-xs text-muted">Valor por parcela</p>
              <p className="text-lg font-headings font-medium text-primary">
                {parseFloat(installmentAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
          )}

          {/* Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-muted text-xs uppercase tracking-widest block mb-2">Data da Compra</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-5 focus:outline-none focus:border-primary/30 text-white text-sm"
              />
            </div>

            <div>
              <label className="text-muted text-xs uppercase tracking-widest block mb-2">Próximo Vencimento</label>
              <input
                type="date"
                value={formData.nextDueDate}
                onChange={e => setFormData(prev => ({ ...prev, nextDueDate: e.target.value }))}
                className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-5 focus:outline-none focus:border-primary/30 text-white text-sm"
              />
            </div>
          </div>

          {/* Categoria */}
          <div>
            <label className="text-muted text-xs uppercase tracking-widest block mb-2">Categoria</label>
            <select
              value={formData.category}
              onChange={e => setFormData(prev => ({ ...prev, category: e.target.value as Category }))}
              className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-5 focus:outline-none focus:border-primary/30 text-white text-sm"
            >
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* Contexto */}
          <div>
            <label className="text-muted text-xs uppercase tracking-widest block mb-2">Contexto</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, ctxContext: 'individual' }))}
                className={`p-3 rounded-2xl border transition-all text-sm ${
                  formData.ctxContext === 'individual'
                    ? 'bg-individual/10 border-individual/30 text-individual'
                    : 'bg-white/5 border-white/5 text-muted'
                }`}
              >
                Pessoal
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, ctxContext: 'joint' }))}
                className={`p-3 rounded-2xl border transition-all text-sm ${
                  formData.ctxContext === 'joint'
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'bg-white/5 border-white/5 text-muted'
                }`}
              >
                Conjunto
              </button>
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="text-muted text-xs uppercase tracking-widest block mb-2">Notas (opcional)</label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Observações sobre a compra..."
              rows={2}
              className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-5 focus:outline-none focus:border-primary/30 placeholder:text-muted/40 text-sm resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-5 rounded-2xl font-medium text-lg mt-4 transition-all active:scale-95 ${
              loading
                ? 'bg-white/5 text-muted cursor-not-allowed'
                : 'bg-primary text-background hover:bg-primary/90'
            }`}
          >
            {loading ? 'Salvando...' : installment ? 'Atualizar Compra' : 'Criar Compra'}
          </button>
        </form>
      </motion.div>
    </>
  )
}

export default InstallmentsScreen