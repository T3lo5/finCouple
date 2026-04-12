import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Wallet,
  LayoutDashboard,
  CreditCard,
  ShieldCheck,
  Plus,
  ArrowDownLeft,
  Receipt,
  ChevronRight,
  Search,
  Lock,
  Users,
  Utensils,
  Car,
  Settings,
  TrendingUp,
  X,
  LogOut,
  Bell,
} from 'lucide-react'
import { useAuth } from './hooks/useAuth'
import { useTransactions, useSavingsGoals } from './hooks/useTransactions'
import { useNotifications } from './hooks/useNotifications'
import { type Context, type Category, type TransactionType, type Transaction } from './lib/api'
import AuthScreen from './components/screens/AuthScreen'
import OnboardingCouple from './components/screens/OnboardingCouple'

type Screen = 'dashboard' | 'accounts' | 'savings' | 'recurring' | 'settings'

const ContextToggle = ({ context, setContext, hasCouple }: {
  context: Context
  setContext: (c: Context) => void
  hasCouple: boolean
}) => (
  <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50">
    <div className="flex p-1 bg-surface/60 backdrop-blur-xl rounded-full border border-white/5 shadow-2xl">
      <button
        onClick={() => setContext('individual')}
        className={`relative px-6 py-2 rounded-full text-sm font-medium transition-all duration-500 ${context === 'individual' ? 'text-white' : 'text-muted hover:text-white/60'}`}
      >
        {context === 'individual' && (
          <motion.div
            layoutId="toggle-bg"
            className="absolute inset-0 bg-individual/20 border border-individual/30 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.2)]"
            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
          />
        )}
        <span className="relative flex items-center gap-2">
          {context === 'individual' && <div className="w-1.5 h-1.5 rounded-full bg-individual animate-pulse" />}
          Individual
        </span>
      </button>

      <button
        onClick={() => setContext('joint')}
        disabled={!hasCouple}
        className={`relative px-6 py-2 rounded-full text-sm font-medium transition-all duration-500 ${
          !hasCouple ? 'text-muted/30 cursor-not-allowed' :
          context === 'joint' ? 'text-white' : 'text-muted hover:text-white/60'
        }`}
      >
        {context === 'joint' && (
          <motion.div
            layoutId="toggle-bg"
            className="absolute inset-0 bg-primary/20 border border-primary/30 rounded-full shadow-[0_0_20px_rgba(212,175,55,0.2)]"
            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
          />
        )}
        <span className="relative flex items-center gap-2">
          {context === 'joint' && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
          Joint
          {!hasCouple && <span className="text-[9px] opacity-50 ml-0.5">(sem parceiro)</span>}
        </span>
      </button>
    </div>
  </div>
)

const CATEGORIES: { id: Category; label: string; icon: React.ReactNode }[] = [
  { id: 'dining',     label: 'Alimentação', icon: <Utensils size={18} /> },
  { id: 'home',       label: 'Casa',        icon: <LayoutDashboard size={18} /> },
  { id: 'transport',  label: 'Transporte',  icon: <Car size={18} /> },
  { id: 'shopping',   label: 'Compras',     icon: <Receipt size={18} /> },
  { id: 'health',     label: 'Saúde',       icon: <ShieldCheck size={18} /> },
  { id: 'travel',     label: 'Viagem',      icon: <TrendingUp size={18} /> },
  { id: 'bills',      label: 'Contas',      icon: <CreditCard size={18} /> },
  { id: 'salary',     label: 'Salário',     icon: <ArrowDownLeft size={18} /> },
]

const ActionModal = ({ isOpen, onClose, context, onCreated, transactionToEdit }: {
  isOpen: boolean
  onClose: () => void
  context: Context
  onCreated?: () => void
  transactionToEdit?: Transaction | null
}) => {
  const { create, edit } = useTransactions({ autoFetch: false })
  const [amount, setAmount] = useState('')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<Category>('other')
  const [txContext, setTxContext] = useState<Context>(context)
  const [type, setType] = useState<TransactionType>('expense')
  const [loading, setLoading] = useState(false)
  const [date, setDate] = useState('')

  // Load transaction data when editing
  React.useEffect(() => {
    if (transactionToEdit) {
      const amt = Math.abs(parseFloat(transactionToEdit.amount))
      setAmount(amt.toString())
      setTitle(transactionToEdit.title)
      setCategory(transactionToEdit.category)
      setTxContext(transactionToEdit.context)
      setType(transactionToEdit.type)
      setDate(transactionToEdit.date.split('T')[0])
    } else {
      // Reset for new transaction
      setAmount('')
      setTitle('')
      setCategory('other')
      setTxContext(context)
      setType('expense')
      setDate('')
    }
  }, [transactionToEdit, context])

  const handleConfirm = async () => {
    if (!amount || !title) return
    setLoading(true)
    try {
      if (transactionToEdit) {
        await edit(transactionToEdit.id, {
          title,
          amount: type === 'expense' ? -Math.abs(parseFloat(amount)) : Math.abs(parseFloat(amount)),
          type,
          category,
          context: txContext,
          date: date ? new Date(date).toISOString() : undefined,
        })
      } else {
        await create({
          title,
          amount: type === 'expense' ? -Math.abs(parseFloat(amount)) : Math.abs(parseFloat(amount)),
          type,
          category,
          context: txContext,
        })
      }
      onCreated?.()
      onClose()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 h-[80vh] bg-surface rounded-t-[32px] border-t border-white/10 z-[70] p-8 flex flex-col"
          >
            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />

            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-headings font-semibold">
                {transactionToEdit ? 'Editar Transação' : 'Nova Transação'}
              </h2>
              <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-muted">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6">
              <div className="flex p-1 bg-white/5 rounded-2xl">
                {(['expense', 'income'] as TransactionType[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                      type === t
                        ? t === 'expense' ? 'bg-negative/20 text-negative' : 'bg-positive/20 text-positive'
                        : 'text-muted'
                    }`}
                  >
                    {t === 'expense' ? 'Gasto' : 'Receita'}
                  </button>
                ))}
              </div>

              <div className="text-center">
                <span className="text-muted text-sm uppercase tracking-widest mb-2 block">Valor</span>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-4xl font-headings text-muted">R$</span>
                  <input
                    type="number"
                    placeholder="0,00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="bg-transparent text-5xl font-headings text-center w-full focus:outline-none placeholder:text-white/10"
                    autoFocus
                  />
                </div>
              </div>

              <input
                type="text"
                placeholder="Descrição (ex: Supermercado Extra)"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-5 focus:outline-none focus:border-primary/30 placeholder:text-muted/40 text-sm"
              />

              {transactionToEdit && (
                <div>
                  <label className="text-muted text-xs uppercase tracking-widest block mb-2">Data</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-5 focus:outline-none focus:border-primary/30 placeholder:text-muted/40 text-sm text-white"
                  />
                </div>
              )}

              <div className="space-y-2">
                <span className="text-muted text-xs uppercase tracking-widest block">Contexto</span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setTxContext('individual')}
                    className={`p-3 rounded-2xl border transition-all text-sm ${txContext === 'individual' ? 'bg-individual/10 border-individual/30 text-individual' : 'bg-white/5 border-white/5 text-muted'}`}
                  >
                    🔒 Privado
                  </button>
                  <button
                    onClick={() => setTxContext('joint')}
                    className={`p-3 rounded-2xl border transition-all text-sm ${txContext === 'joint' ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-white/5 border-white/5 text-muted'}`}
                  >
                    👫 Conjunto
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-muted text-xs uppercase tracking-widest block">Categoria</span>
                <div className="grid grid-cols-4 gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all ${
                        category === cat.id ? 'bg-primary/10 border border-primary/20' : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className={`${category === cat.id ? 'text-primary' : 'text-muted'}`}>{cat.icon}</div>
                      <span className="text-[9px] text-muted leading-tight text-center">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleConfirm}
              disabled={!amount || !title || loading}
              className={`w-full py-5 rounded-2xl font-medium text-lg mt-6 transition-all active:scale-95 ${
                amount && title && !loading
                  ? txContext === 'individual' ? 'bg-individual text-white' : 'bg-primary text-background'
                  : 'bg-white/5 text-muted cursor-not-allowed'
              }`}
            >
              {loading ? 'Salvando...' : 'Confirmar'}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

const Dashboard = ({ context, isIndividualVisibleToPartner, openEditModal }: {
  context: Context
  isIndividualVisibleToPartner: boolean
  openEditModal: (tx: Transaction) => void
}) => {
  const { transactions, loading, summary, categorySummary } = useTransactions({ context })
  const accentColor = context === 'individual' ? 'var(--color-individual)' : 'var(--color-primary)'

  const totalBalance = summary
    ? summary.balance
    : 0

  const fmt = (n: number) =>
    n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const CATEGORIES_META: { id: Category; label: string; icon: React.ReactNode }[] = [
    { id: 'dining',     label: 'Alimentação', icon: <Utensils size={16} /> },
    { id: 'home',       label: 'Casa',        icon: <LayoutDashboard size={16} /> },
    { id: 'transport',  label: 'Transporte',  icon: <Car size={16} /> },
    { id: 'shopping',   label: 'Compras',     icon: <Receipt size={16} /> },
    { id: 'health',     label: 'Saúde',       icon: <ShieldCheck size={16} /> },
    { id: 'travel',     label: 'Viagem',      icon: <TrendingUp size={16} /> },
    { id: 'bills',      label: 'Contas',      icon: <CreditCard size={16} /> },
    { id: 'salary',     label: 'Salário',     icon: <ArrowDownLeft size={16} /> },
    { id: 'investment', label: 'Investimento', icon: <TrendingUp size={16} /> },
    { id: 'other',      label: 'Outros',      icon: <Settings size={16} /> },
  ]

  const getCategoryMeta = (catId: Category) => CATEGORIES_META.find(c => c.id === catId) || { label: catId, icon: <Settings size={16} /> }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="pt-32 pb-32 px-6 space-y-12"
    >
      <div className="text-center space-y-2">
        <span className="text-muted text-xs uppercase tracking-widest font-medium">
          {context === 'individual' ? 'Saldo Pessoal (mês)' : 'Saldo Conjunto (mês)'}
        </span>
        {loading ? (
          <div className="h-14 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-5xl font-headings font-medium tracking-tight">
              R${fmt(totalBalance).split(',')[0]}
            </span>
            <span className="text-2xl font-headings text-muted">
              ,{fmt(totalBalance).split(',')[1]}
            </span>
          </div>
        )}

        {summary && (
          <div className="flex items-center justify-center gap-6 mt-3">
            <div className="text-center">
              <p className="text-[10px] text-muted uppercase tracking-widest">Receitas</p>
              <p className="text-positive font-headings font-medium text-sm">+R${fmt(summary.income)}</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-[10px] text-muted uppercase tracking-widest">Gastos</p>
              <p className="text-negative font-headings font-medium text-sm">-R${fmt(summary.expenses)}</p>
            </div>
          </div>
        )}
      </div>

      {context === 'joint' && isIndividualVisibleToPartner && (
        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-individual/20 flex items-center justify-center text-individual">
              <Users size={16} />
            </div>
            <p className="text-xs text-muted">Saldo individual visível ao parceiro</p>
          </div>
        </div>
      )}

      <div className="relative h-40 w-full">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 400 100">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accentColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            d="M0,80 C50,80 100,20 150,50 C200,80 250,10 300,40 C350,70 400,30 400,30"
            fill="none" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round"
          />
          <motion.path
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            d="M0,80 C50,80 100,20 150,50 C200,80 250,10 300,40 C350,70 400,30 400,30 L400,100 L0,100 Z"
            fill="url(#chartGradient)"
          />
          <motion.circle
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ delay: 1.5, type: 'spring' }}
            cx="400" cy="30" r="4" fill={accentColor}
          />
        </svg>
      </div>

      {context === 'joint' && (
        <div className="grid grid-cols-2 gap-4">
          <button className="flex items-center justify-center gap-3 py-4 bg-primary rounded-2xl text-background font-medium transition-transform active:scale-95">
            <Plus size={20} /> Transferir
          </button>
          <button className="flex items-center justify-center gap-3 py-4 bg-surface border border-white/5 rounded-2xl text-white font-medium transition-transform active:scale-95">
            <Receipt size={20} /> Dividir
          </button>
        </div>
      )}

      {categorySummary && categorySummary.byCategory.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-muted text-xs uppercase tracking-widest font-semibold">
              Gastos por Categoria
            </h3>
            <span className="text-[10px] text-muted">Este mês</span>
          </div>

          <div className="space-y-3">
            {categorySummary.byCategory.slice(0, 6).map(item => {
              const meta = getCategoryMeta(item.category)
              return (
                <div key={item.category} className="p-4 bg-surface/40 rounded-2xl border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${context === 'individual' ? 'bg-individual/10 text-individual' : 'bg-primary/10 text-primary'}`}>
                        {meta.icon}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{meta.label}</p>
                        <p className="text-[10px] text-muted">{item.count} transação{item.count !== 1 ? 'ões' : ''}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-headings font-medium text-sm">R${item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p>
                      <p className="text-[10px] text-muted">{Math.round(item.percentage)}%</p>
                    </div>
                  </div>
                  <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percentage}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: accentColor }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {categorySummary.byCategory.length > 6 && (
            <button className="w-full py-3 text-xs text-muted hover:text-white transition-colors flex items-center justify-center gap-2">
              Ver todas as categorias <ChevronRight size={14} />
            </button>
          )}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-muted text-xs uppercase tracking-widest font-semibold">
            Transações recentes
          </h3>
          <Search size={16} className="text-muted" />
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-16 bg-surface/40 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 text-muted/50 text-sm">
            Nenhuma transação ainda.<br />
            <span className="text-xs">Use o botão + para adicionar a primeira.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.slice(0, 10).map(tx => {
              const amount = parseFloat(tx.amount)
              return (
                <div
                  key={tx.id}
                  onClick={() => openEditModal(tx)}
                  className="flex items-center justify-between p-4 bg-surface/40 rounded-2xl border border-white/5 cursor-pointer hover:bg-surface/60 transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-muted text-xs uppercase">
                      {tx.category.slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium">{tx.title}</p>
                      <p className="text-xs text-muted capitalize">
                        {tx.category} • {new Date(tx.date).toLocaleDateString('pt-BR')}
                        {tx.context === 'joint' && <span className="ml-1 text-primary">• conjunto</span>}
                      </p>
                    </div>
                  </div>
                  <p className={`font-headings font-medium ${amount > 0 ? 'text-positive' : 'text-white'}`}>
                    {amount > 0 ? '+' : ''}R${Math.abs(amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </motion.div>
  )
}

const SavingsScreen = ({ context }: { context: Context }) => {
  const { goals, loading, contribute } = useSavingsGoals(context)
  const accentColor = context === 'individual' ? 'var(--color-individual)' : 'var(--color-primary)'

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="pt-32 pb-32 px-6 space-y-12"
    >
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-headings font-semibold">Metas de Poupança</h2>
        <p className="text-muted text-sm">
          {context === 'individual' ? 'Seus objetivos financeiros pessoais.' : 'Construindo o futuro juntos.'}
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2].map(i => <div key={i} className="h-36 bg-surface rounded-[32px] animate-pulse" />)}
        </div>
      ) : goals.length === 0 ? (
        <div className="text-center py-12 text-muted/50 text-sm">
          Nenhuma meta ainda.<br />
          <span className="text-xs">Crie sua primeira meta abaixo.</span>
        </div>
      ) : (
        <div className="space-y-6">
          {goals.map(goal => {
            const current = parseFloat(goal.currentAmount)
            const target = parseFloat(goal.targetAmount)
            const pct = Math.min((current / target) * 100, 100)

            return (
              <div key={goal.id} className="p-6 bg-surface rounded-[32px] border border-white/5 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-2xl">
                      {goal.emoji}
                    </div>
                    <div>
                      <p className="font-medium text-lg">{goal.title}</p>
                      <p className="text-xs text-muted">
                        Meta: R${parseFloat(goal.targetAmount).toLocaleString('pt-BR')}
                        {goal.context === 'joint' && <span className="ml-1 text-primary">• conjunto</span>}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-headings font-medium text-xl">
                      R${current.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                    </p>
                    <p className="text-[10px] text-muted">{Math.round(pct)}% alcançado</p>
                  </div>
                </div>

                <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: accentColor, boxShadow: `0 0 10px ${accentColor}40` }}
                  />
                </div>

                {goal.status !== 'completed' && (
                  <button
                    onClick={() => contribute(goal.id, 100)}
                    className="w-full py-3 rounded-xl border border-white/10 text-muted text-sm hover:bg-white/5 transition-colors"
                  >
                    + Adicionar R$100
                  </button>
                )}

                {goal.status === 'completed' && (
                  <div className="text-center text-positive text-sm font-medium">🎉 Meta concluída!</div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <button className="w-full py-6 rounded-[24px] border border-dashed border-white/10 flex flex-col items-center justify-center gap-3 text-muted hover:bg-white/5 transition-colors">
        <div className="w-12 h-12 rounded-full border border-dashed border-white/20 flex items-center justify-center">
          <Plus size={24} />
        </div>
        <span className="text-xs uppercase tracking-[0.2em] font-bold">Criar Meta</span>
      </button>
    </motion.div>
  )
}

const SettingsScreen = ({
  isIndividualVisibleToPartner,
  setIsIndividualVisibleToPartner,
}: {
  isIndividualVisibleToPartner: boolean
  setIsIndividualVisibleToPartner: (v: boolean) => void
}) => {
  const { user, logout, isInCouple } = useAuth()

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="pt-32 pb-32 px-6 space-y-12"
    >
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto text-2xl font-headings font-medium border border-white/10">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-2xl font-headings font-semibold">{user?.name}</h2>
          <p className="text-muted text-sm">{user?.email}</p>
          <p className="text-xs mt-1">
            {isInCouple
              ? <span className="text-positive">✓ Conectado ao casal</span>
              : <span className="text-muted/50">Sem parceiro(a) conectado</span>
            }
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {isInCouple && (
          <div className="p-6 bg-surface rounded-[32px] border border-white/5 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">Modo Privacidade Compartilhado</p>
                <p className="text-xs text-muted max-w-[200px]">
                  Permite que seu parceiro(a) veja seu saldo individual.
                </p>
              </div>
              <button
                onClick={() => setIsIndividualVisibleToPartner(!isIndividualVisibleToPartner)}
                className={`w-14 h-8 rounded-full relative transition-colors duration-300 ${isIndividualVisibleToPartner ? 'bg-positive' : 'bg-white/10'}`}
              >
                <motion.div
                  animate={{ x: isIndividualVisibleToPartner ? 24 : 4 }}
                  className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                />
              </button>
            </div>

            <div className="p-4 bg-white/5 rounded-2xl flex items-start gap-3">
              <Lock size={16} className="text-muted mt-0.5" />
              <p className="text-[10px] text-muted leading-relaxed uppercase tracking-wider">
                {isIndividualVisibleToPartner
                  ? 'Seu parceiro(a) pode ver seu painel individual. Transações detalhadas permanecem privadas.'
                  : 'Suas finanças individuais estão completamente ocultas da visão conjunta.'}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-muted text-[10px] uppercase tracking-[0.2em] font-bold px-2">Segurança</h3>
          <div className="space-y-2">
            {['Autenticação Biométrica', 'Verificação em Dois Fatores', 'Exportar Dados'].map(item => (
              <button key={item} className="w-full flex items-center justify-between p-5 bg-surface/40 rounded-[24px] border border-white/5 text-left">
                <span className="font-medium">{item}</span>
                <ChevronRight size={18} className="text-muted" />
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-3 p-5 bg-negative/5 border border-negative/10 rounded-[24px] text-negative font-medium transition-colors hover:bg-negative/10"
        >
          <LogOut size={18} />
          Sair da conta
        </button>
      </div>
    </motion.div>
  )
}

export default function App() {
  const { user, loading, isInCouple } = useAuth()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [context, setContext] = useState<Context>('individual')
  const [activeScreen, setActiveScreen] = useState<Screen>('dashboard')
  const [isActionModalOpen, setIsActionModalOpen] = useState(false)
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null)
  const [isIndividualVisibleToPartner, setIsIndividualVisibleToPartner] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)

  const handleCreated = useCallback(() => setRefreshKey(k => k + 1), [])

  const openEditModal = useCallback((tx: Transaction) => {
    setTransactionToEdit(tx)
    setIsActionModalOpen(true)
  }, [])

  const openNewTransactionModal = useCallback(() => {
    setTransactionToEdit(null)
    setIsActionModalOpen(true)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <AuthScreen />

  const hasSeenOnboarding = sessionStorage.getItem('couple_onboarding_seen')
  if (!isInCouple && !hasSeenOnboarding) {
    return (
      <div onClick={() => {}}>
        <OnboardingCouple />
        <button
          onClick={() => {
            sessionStorage.setItem('couple_onboarding_seen', '1')
            window.location.reload()
          }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 text-muted/40 text-xs"
        >
          Pular por agora
        </button>
      </div>
    )
  }

  const navItems: { screen: Screen; icon: React.ReactNode }[] = [
    { screen: 'dashboard', icon: <LayoutDashboard size={24} /> },
    { screen: 'accounts',  icon: <CreditCard size={24} /> },
    { screen: 'savings',   icon: <TrendingUp size={24} /> },
    { screen: 'settings',  icon: <ShieldCheck size={24} /> },
  ]

  return (
    <div className={`min-h-screen transition-colors duration-1000 overflow-x-hidden ${
      context === 'individual' ? 'ambient-glow-indigo' : 'ambient-glow-gold'
    }`}>
      <ContextToggle context={context} setContext={setContext} hasCouple={isInCouple} />
      
      {/* Notification Bell */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="fixed top-8 right-6 z-50 p-3 bg-surface/60 backdrop-blur-xl rounded-full border border-white/5 shadow-2xl transition-all hover:scale-105 active:scale-95"
      >
        <Bell size={20} className={unreadCount > 0 ? 'text-primary' : 'text-muted'} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-background text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Panel */}
      <AnimatePresence>
        {showNotifications && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotifications(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-sm bg-surface border-l border-white/10 z-[70] p-6 overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-headings font-semibold">Notificações</h2>
                <div className="flex gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-primary hover:text-primary/80"
                    >
                      Marcar todas como lidas
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-2 bg-white/5 rounded-full text-muted"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell size={48} className="mx-auto mb-4 text-muted/40" />
                  <p className="text-muted">Nenhuma notificação</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map(notification => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => !notification.read && markAsRead(notification.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        notification.read
                          ? 'bg-white/3 border-white/5'
                          : 'bg-primary/10 border-primary/30'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <p className={`font-medium text-sm ${
                          notification.read ? 'text-muted' : 'text-white'
                        }`}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-primary rounded-full" />
                        )}
                      </div>
                      <p className="text-xs text-muted/80">{notification.message}</p>
                      <p className="text-xs text-muted/40 mt-2">
                        {new Date(notification.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="max-w-md mx-auto relative">
        <AnimatePresence mode="wait">
          {activeScreen === 'dashboard' && (
            <Dashboard
              key={`dashboard-${refreshKey}`}
              context={context}
              isIndividualVisibleToPartner={isIndividualVisibleToPartner}
              openEditModal={openEditModal}
            />
          )}
          {activeScreen === 'savings' && (
            <SavingsScreen key={`savings-${refreshKey}`} context={context} />
          )}
          {activeScreen === 'settings' && (
            <SettingsScreen
              isIndividualVisibleToPartner={isIndividualVisibleToPartner}
              setIsIndividualVisibleToPartner={setIsIndividualVisibleToPartner}
            />
          )}
=          {activeScreen === 'accounts' && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="pt-32 pb-32 px-6 text-center text-muted"
            >
              <p className="text-3xl font-headings mb-4">Contas</p>
              <p className="text-sm">Em breve — conecte suas contas bancárias.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-8 pt-4 bg-gradient-to-t from-background via-background to-transparent">
        <div className="max-w-md mx-auto glass rounded-[32px] p-2 flex items-center justify-between relative">
          {navItems.slice(0, 2).map(({ screen, icon }) => (
            <button
              key={screen}
              onClick={() => setActiveScreen(screen)}
              className={`p-4 rounded-full transition-all ${
                activeScreen === screen
                  ? context === 'individual' ? 'text-individual' : 'text-primary'
                  : 'text-muted'
              }`}
            >
              {icon}
            </button>
          ))}

          <div className="absolute left-1/2 -translate-x-1/2 -top-8">
            <button
              onClick={openNewTransactionModal}
              className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 ${
                context === 'individual'
                  ? 'bg-individual text-white shadow-individual/40'
                  : 'bg-primary text-background shadow-primary/40'
              }`}
            >
              <Plus size={32} strokeWidth={2.5} />
            </button>
          </div>

          {navItems.slice(2).map(({ screen, icon }) => (
            <button
              key={screen}
              onClick={() => setActiveScreen(screen)}
              className={`p-4 rounded-full transition-all ${
                activeScreen === screen
                  ? context === 'individual' ? 'text-individual' : 'text-primary'
                  : 'text-muted'
              }`}
            >
              {icon}
            </button>
          ))}
        </div>
      </nav>

      <ActionModal
        isOpen={isActionModalOpen}
        onClose={() => {
          setIsActionModalOpen(false)
          setTransactionToEdit(null)
        }}
        context={context}
        onCreated={handleCreated}
        transactionToEdit={transactionToEdit}
      />
    </div>
  )
}
