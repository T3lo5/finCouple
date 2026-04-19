import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, Calendar, RefreshCw, X, CreditCard, ToggleLeft, ToggleRight, Pencil } from 'lucide-react'
import { useRecurringBills } from '../../hooks/useRecurringBills'
import { type Context, type Category, type RecurringBill } from '../../lib/api'
import { useToast } from '../Toast'

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Diário',
  weekly: 'Semanal',
  monthly: 'Mensal',
  yearly: 'Anual',
}

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

interface RecurringBillsScreenProps {
  context: Context
}

const RecurringBillsScreen = ({ context }: RecurringBillsScreenProps) => {
  const { bills, loading, error, refetch, toggleActive, remove } = useRecurringBills({ context })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBill, setEditingBill] = useState<RecurringBill | null>(null)
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
    if (window.confirm('Tem certeza que deseja excluir esta conta recorrente?')) {
      try {
        await remove(id)
        toast.showToast('Conta excluída!', 'success')
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

  const activeBills = bills.filter(b => b.isActive)
  const inactiveBills = bills.filter(b => !b.isActive)
  const totalMonthly = activeBills.reduce((sum, b) => {
    const amount = parseFloat(b.amount)
    if (b.frequency === 'monthly') return sum + amount
    if (b.frequency === 'weekly') return sum + (amount * 4)
    if (b.frequency === 'daily') return sum + (amount * 30)
    if (b.frequency === 'yearly') return sum + (amount / 12)
    return sum
  }, 0)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pt-28 pb-28 px-4 sm:px-6 space-y-8 sm:space-y-10"
    >
      <div className="text-center space-y-4">
        <h2 className="text-2xl sm:text-3xl font-headings font-semibold">Contas Recorrentes</h2>
        <p className="text-muted text-sm">
          Gerencie suas contas fixas e assinaturas mensais
        </p>
      </div>

      {/* Total mensal estimado */}
      <div className="text-center space-y-2">
        <span className="text-muted text-xs uppercase tracking-widest font-medium">
          Total Mensal Estimado
        </span>
        <div className="flex items-baseline justify-center">
          <span className="text-3xl sm:text-4xl font-headings font-medium tracking-tight">
            {formatCurrency(totalMonthly)}
          </span>
        </div>
        <p className="text-xs text-muted">{activeBills.length} contas ativas</p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-surface rounded-2xl animate-pulse" />
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
      {!loading && !error && bills.length === 0 && (
        <div className="text-center py-12 text-muted/50 text-sm">
          Nenhuma conta recorrente cadastrada.<br />
          <span className="text-xs">Adicione sua primeira conta abaixo.</span>
        </div>
      )}

      {/* Contas ativas */}
      {!loading && !error && activeBills.length > 0 && (
        <div className="space-y-3">
          {activeBills.map((bill, index) => (
            <motion.div
              key={bill.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 bg-surface rounded-2xl border border-white/10"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${CATEGORY_COLORS[bill.category]}20` }}
                  >
                    <CreditCard size={16} style={{ color: CATEGORY_COLORS[bill.category] }} />
                  </div>
                  <div>
                    <p className="font-medium">{bill.title}</p>
                    <p className="text-xs text-muted">
                      {CATEGORY_LABELS[bill.category]} • {FREQUENCY_LABELS[bill.frequency]}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted mt-1">
                      <Calendar size={12} />
                      <span>Próx: {formatDate(bill.nextDueDate)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-headings font-medium">
                      {formatCurrency(bill.amount)}
                    </p>
                    <p className="text-xs text-muted">
                      {bill.context === 'joint' ? 'conjunta' : 'pessoal'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingBill(bill)
                        setIsModalOpen(true)
                      }}
                      className="p-2 rounded-full bg-white/5 text-muted hover:text-white transition-colors"
                      aria-label="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleToggleActive(bill.id)}
                      className="p-2 rounded-full bg-white/5 text-muted hover:text-white transition-colors"
                      aria-label="Desativar"
                    >
                      {bill.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                    </button>
                    <button
                      onClick={() => handleDelete(bill.id)}
                      className="p-2 rounded-full bg-white/5 text-negative hover:bg-negative/10 transition-colors"
                      aria-label="Excluir"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Contas inativas */}
      {!loading && !error && inactiveBills.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-muted uppercase tracking-widest font-medium">Inativas</p>
          {inactiveBills.map((bill, index) => (
            <motion.div
              key={bill.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (activeBills.length + index) * 0.05 }}
              className="p-4 bg-surface/50 rounded-2xl border border-white/5"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-muted/50">
                    <CreditCard size={16} />
                  </div>
                  <div>
                    <p className="font-medium text-muted">{bill.title}</p>
                    <p className="text-xs text-muted/50">
                      {CATEGORY_LABELS[bill.category]} • Inativa
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(bill.id)}
                    className="p-2 rounded-full bg-white/5 text-muted hover:text-white transition-colors"
                    aria-label="Reativar"
                  >
                    <ToggleLeft size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Botão adicionar */}
      <button
        onClick={() => {
          setEditingBill(null)
          setIsModalOpen(true)
        }}
        className="w-full py-4 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-2 text-muted hover:bg-white/5 transition-colors"
      >
        <div className="w-10 h-10 rounded-full border border-dashed border-white/20 flex items-center justify-center">
          <Plus size={20} />
        </div>
        <span className="text-xs uppercase tracking-[0.2em] font-bold">Adicionar Conta</span>
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <RecurringBillModal
            bill={editingBill}
            context={context}
            onClose={() => {
              setIsModalOpen(false)
              setEditingBill(null)
            }}
            onSaved={() => refetch()}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Modal component
const RecurringBillModal = ({
  bill,
  context,
  onClose,
  onSaved,
}: {
  bill: RecurringBill | null
  context: Context
  onClose: () => void
  onSaved: () => void
}) => {
  const { create, update } = useRecurringBills({ autoFetch: false })
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: bill?.title || '',
    amount: bill ? parseFloat(bill.amount) : 0,
    category: bill?.category || 'bills' as Category,
    context: bill?.context || context,
    frequency: bill?.frequency || 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
    nextDueDate: bill?.nextDueDate ? bill.nextDueDate.split('T')[0] : new Date().toISOString().split('T')[0],
    autoPay: bill?.autoPay || false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.amount) return

    setLoading(true)
    try {
      if (bill) {
        await update(bill.id, {
          ...formData,
          nextDueDate: new Date(formData.nextDueDate).toISOString(),
        })
        toast.showToast('Conta atualizada!', 'success')
      } else {
        await create({
          ...formData,
          nextDueDate: new Date(formData.nextDueDate).toISOString(),
        })
        toast.showToast('Conta criada!', 'success')
      }
      onSaved()
      onClose()
    } catch (err: any) {
      toast.showToast(err.message || 'Erro ao salvar', 'error')
    } finally {
      setLoading(false)
    }
  }

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
        className="fixed bottom-0 left-0 right-0 h-[85vh] bg-surface rounded-t-[32px] border-t border-white/10 z-[70] p-6 flex flex-col"
      >
        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6" />

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-headings font-semibold">
            {bill ? 'Editar Conta' : 'Nova Conta Recorrente'}
          </h2>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-muted">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-5">
          {/* Título */}
          <div>
            <label className="text-muted text-xs uppercase tracking-widest block mb-2">Nome da Conta</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Netflix, Aluguel, Academia..."
              className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-5 focus:outline-none focus:border-primary/30 placeholder:text-muted/40 text-sm"
              required
            />
          </div>

          {/* Valor e Categoria */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-muted text-xs uppercase tracking-widest block mb-2">Valor</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted">R$</span>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={e => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  step="0.01"
                  placeholder="0,00"
                  className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-10 pr-5 focus:outline-none focus:border-primary/30 placeholder:text-muted/40 text-sm"
                  required
                />
              </div>
            </div>

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
          </div>

          {/* Frequência e Data */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-muted text-xs uppercase tracking-widest block mb-2">Frequência</label>
              <select
                value={formData.frequency}
                onChange={e => setFormData(prev => ({ ...prev, frequency: e.target.value as any }))}
                className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-5 focus:outline-none focus:border-primary/30 text-white text-sm"
              >
                {Object.entries(FREQUENCY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
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

          {/* Contexto */}
          <div>
            <label className="text-muted text-xs uppercase tracking-widest block mb-2">Contexto</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, context: 'individual' }))}
                className={`p-3 rounded-2xl border transition-all text-sm ${
                  formData.context === 'individual'
                    ? 'bg-individual/10 border-individual/30 text-individual'
                    : 'bg-white/5 border-white/5 text-muted'
                }`}
              >
                Pessoal
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, context: 'joint' }))}
                className={`p-3 rounded-2xl border transition-all text-sm ${
                  formData.context === 'joint'
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'bg-white/5 border-white/5 text-muted'
                }`}
              >
                Conjunto
              </button>
            </div>
          </div>

          {/* Auto Pay */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
            <div>
              <p className="text-sm font-medium">Pagamento Automático</p>
              <p className="text-xs text-muted">Marcar como pago automaticamente</p>
            </div>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, autoPay: !prev.autoPay }))}
              className={`w-12 h-6 rounded-full transition-colors ${formData.autoPay ? 'bg-primary' : 'bg-white/10'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${formData.autoPay ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
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
            {loading ? 'Salvando...' : bill ? 'Atualizar' : 'Criar Conta'}
          </button>
        </form>
      </motion.div>
    </>
  )
}

export default RecurringBillsScreen