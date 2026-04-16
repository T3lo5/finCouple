import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, CreditCard, Settings, X, Eye, EyeOff, TrendingDown, TrendingUp } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { accountsApi, type Account, type AccountType } from '../../lib/api';

const ACCOUNT_TYPE_ICONS: Record<AccountType, React.ReactNode> = {
  checking: <CreditCard size={16} />,
  savings: <TrendingUp size={16} />,
  credit: <TrendingDown size={16} />,
  investment: <TrendingUp size={16} />,
  benefit: <TrendingUp size={16} />,
};

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  checking: 'Conta Corrente',
  savings: 'Poupança',
  credit: 'Crédito',
  investment: 'Investimento',
  benefit: 'Benefício',
};

const AccountsScreen = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBalance, setShowBalance] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [balanceEditing, setBalanceEditing] = useState<{ [key: string]: boolean }>({});
  const [newBalances, setNewBalances] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await accountsApi.list();
      setAccounts(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar contas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (formData: {
    name: string;
    institution: string;
    type: AccountType;
    balance: number;
    currency: string;
    lastFour: string;
    context: 'individual' | 'joint';
  }) => {
    try {
      const response = await accountsApi.create(formData);
      setAccounts(prev => [...prev, response.data]);
      setIsModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta');
    }
  };

  const handleUpdateBalance = async (accountId: string) => {
    try {
      const balance = parseFloat(newBalances[accountId]);
      if (isNaN(balance)) {
        setError('Saldo inválido');
        return;
      }

      const response = await accountsApi.updateBalance(accountId, balance);
      setAccounts(prev => prev.map(acc => acc.id === accountId ? response.data : acc));
      setBalanceEditing(prev => ({ ...prev, [accountId]: false }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar saldo');
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (window.confirm('Tem certeza que deseja inativar esta conta? Esta ação é reversível.')) {
      try {
        await accountsApi.delete(accountId);
        setAccounts(prev => prev.map(acc =>
          acc.id === accountId ? { ...acc, isActive: false } : acc
        ));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao inativar conta');
      }
    }
  };

  const handlePermanentDelete = async (accountId: string) => {
    if (window.confirm('Tem certeza que deseja excluir permanentemente esta conta? Esta ação não pode ser desfeita.')) {
      try {
        await accountsApi.permanentDelete(accountId);
        setAccounts(prev => prev.filter(acc => acc.id !== accountId));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao excluir conta permanentemente');
      }
    }
  };

  const totalBalance = accounts
    .filter(acc => acc.isActive)
    .reduce((sum, acc) => sum + parseFloat(acc.balance), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const toggleBalanceVisibility = () => {
    setShowBalance(!showBalance);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pt-28 pb-28 px-4 sm:px-6 space-y-8 sm:space-y-10"
    >
      <div className="text-center space-y-4">
        <h2 className="text-2xl sm:text-3xl font-headings font-semibold">Minhas Contas</h2>
        <p className="text-muted text-sm">
          Gerencie suas contas bancárias e financeiras
        </p>
      </div>

      {/* Balance Summary */}
      <div className="text-center space-y-2">
        <span className="text-muted text-xs uppercase tracking-widest font-medium">
          Saldo Total
        </span>
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={toggleBalanceVisibility}
            className="text-muted hover:text-white transition-colors"
            aria-label={showBalance ? "Ocultar saldos" : "Mostrar saldos"}
          >
            {showBalance ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
          <div className="flex items-baseline">
            <span className="text-4xl sm:text-5xl font-headings font-medium tracking-tight">
              R$
              {showBalance
                ? formatCurrency(totalBalance).replace('R$', '').split(',')[0]
                : '***'
              }
            </span>
            {showBalance && (
              <span className="text-xl sm:text-2xl font-headings text-muted">
                ,{formatCurrency(totalBalance).replace('R$', '').split(',')[1]}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Accounts List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-surface rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8 text-negative">
          <p>{error}</p>
          <button
            onClick={fetchAccounts}
            className="mt-4 px-4 py-2 bg-primary rounded-xl text-background text-sm"
          >
            Tentar novamente
          </button>
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-12 text-muted/50 text-sm">
          Nenhuma conta cadastrada.<br />
          <span className="text-xs">Adicione sua primeira conta abaixo.</span>
        </div>
      ) : (
        <div className="space-y-4">
          {accounts.map(account => (
            <div
              key={account.id}
              className={`p-4 bg-surface rounded-2xl border ${
                account.isActive ? 'border-white/10' : 'border-negative/20 bg-surface/50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-muted">
                    {ACCOUNT_TYPE_ICONS[account.type]}
                  </div>
                  <div>
                    <p className="font-medium">{account.name}</p>
                    <p className="text-xs text-muted">
                      {ACCOUNT_TYPE_LABELS[account.type]} • {account.institution || 'Instituição não informada'}
                    </p>
                    {account.lastFour && (
                      <p className="text-xs text-muted">****{account.lastFour}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {balanceEditing[account.id] ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={newBalances[account.id] || parseFloat(account.balance).toFixed(2)}
                        onChange={(e) => setNewBalances(prev => ({
                          ...prev,
                          [account.id]: e.target.value
                        }))}
                        className="w-20 bg-white/5 border border-white/10 rounded-xl px-2 py-1 text-sm text-right"
                        step="0.01"
                      />
                      <button
                        onClick={() => handleUpdateBalance(account.id)}
                        className="p-1.5 bg-positive/20 text-positive rounded-full hover:bg-positive/30 transition-colors"
                        aria-label="Confirmar alteração de saldo"
                      >
                        <Settings size={14} />
                      </button>
                      <button
                        onClick={() => setBalanceEditing(prev => ({ ...prev, [account.id]: false }))}
                        className="p-1.5 bg-white/5 text-muted rounded-full hover:bg-white/10 transition-colors"
                        aria-label="Cancelar alteração de saldo"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="text-right min-w-[120px]">
                      <p className="font-headings font-medium text-sm">
                        {showBalance ? formatCurrency(parseFloat(account.balance)) : '***'}
                      </p>
                      <p className="text-xs text-muted">
                        {account.context === 'joint' ? 'conjunta' : 'pessoal'}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setBalanceEditing(prev => ({ ...prev, [account.id]: true }));
                        setNewBalances(prev => ({
                          ...prev,
                          [account.id]: parseFloat(account.balance).toFixed(2)
                        }));
                      }}
                      className="p-2 rounded-full bg-white/5 text-muted hover:text-white transition-colors"
                      aria-label="Editar saldo"
                    >
                      <Settings size={16} />
                    </button>

                    <button
                      onClick={() => handleDeleteAccount(account.id)}
                      className="p-2 rounded-full bg-white/5 text-negative hover:bg-negative/10 transition-colors"
                      aria-label="Inativar conta"
                    >
                      <X size={16} />
                    </button>

                    {account.isActive && (
                      <button
                        onClick={() => handlePermanentDelete(account.id)}
                        className="p-2 rounded-full bg-negative/10 text-negative hover:bg-negative/20 transition-colors"
                        aria-label="Excluir permanentemente"
                        title="Excluir permanentemente"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {!account.isActive && (
                <div className="mt-3 p-2 bg-negative/10 border border-negative/20 rounded-xl">
                  <p className="text-xs text-negative text-center">Conta inativada</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Account Button */}
      <button
        onClick={() => {
          setEditingAccount(null);
          setIsModalOpen(true);
        }}
        className="w-full py-4 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-2 text-muted hover:bg-white/5 transition-colors"
      >
        <div className="w-10 h-10 rounded-full border border-dashed border-white/20 flex items-center justify-center">
          <Plus size={20} />
        </div>
        <span className="text-xs uppercase tracking-[0.2em] font-bold">Adicionar Conta</span>
      </button>

      {/* Account Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <AccountModal
            account={editingAccount}
            onClose={() => {
              setIsModalOpen(false);
              setEditingAccount(null);
            }}
            onSubmit={editingAccount ? handleUpdateAccount : handleCreateAccount}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const AccountModal = ({
  account,
  onClose,
  onSubmit
}: {
  account: Account | null;
  onClose: () => void;
  onSubmit: (data: any) => void;
}) => {
  const [formData, setFormData] = useState({
    name: account?.name || '',
    institution: account?.institution || '',
    type: account?.type || 'checking',
    balance: account ? parseFloat(account.balance) : 0,
    currency: account?.currency || 'BRL',
    lastFour: account?.lastFour || '',
    context: account?.context || 'individual' as const,
    creditLimit: account?.creditLimit || 0, // Novo campo para limite de crédito
    dueDate: account?.dueDate || '', // Novo campo para data de vencimento (para contas de crédito)
    closingDate: account?.closingDate || '', // Novo campo para data de fechamento (para contas de crédito)
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'balance' || name === 'creditLimit' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar conta');
    } finally {
      setLoading(false);
    }
  };

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
        className="fixed bottom-0 left-0 right-0 h-[80vh] bg-surface rounded-t-[32px] border-t border-white/10 z-[70] p-8 flex flex-col"
      >
        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />

        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl sm:text-2xl font-headings font-semibold">
            {account ? 'Editar Conta' : 'Nova Conta'}
          </h2>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-muted">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-6">
          {error && (
            <div className="p-3 bg-negative/10 border border-negative/20 rounded-xl text-negative text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <label className="text-muted text-xs uppercase tracking-widest block mb-2">Nome da Conta</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ex: Conta Corrente Bradesco"
              className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-5 focus:outline-none focus:border-primary/30 placeholder:text-muted/40 text-sm"
              required
            />
          </div>

          <div>
            <label className="text-muted text-xs uppercase tracking-widest block mb-2">Instituição</label>
            <input
              type="text"
              name="institution"
              value={formData.institution}
              onChange={handleChange}
              placeholder="Ex: Banco Bradesco S.A."
              className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-5 focus:outline-none focus:border-primary/30 placeholder:text-muted/40 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-muted text-xs uppercase tracking-widest block mb-2">Tipo</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-5 focus:outline-none focus:border-primary/30 text-white text-sm"
                required
              >
                <option value="checking">Corrente</option>
                <option value="savings">Poupança</option>
                <option value="credit">Crédito</option>
                <option value="investment">Investimento</option>
                <option value="benefit">Benefício</option>
              </select>
            </div>

            <div>
              <label className="text-muted text-xs uppercase tracking-widest block mb-2">Saldo</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted">R$</span>
                <input
                  type="number"
                  name="balance"
                  value={formData.balance}
                  onChange={handleChange}
                  step="0.01"
                  placeholder="0,00"
                  className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-10 pr-5 focus:outline-none focus:border-primary/30 placeholder:text-muted/40 text-sm"
                  required
                />
              </div>
            </div>
          </div>

          {(formData.type === 'credit' || formData.type === 'checking') && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-muted text-xs uppercase tracking-widest block mb-2">Limite de Crédito</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted">R$</span>
                    <input
                      type="number"
                      name="creditLimit"
                      value={formData.creditLimit}
                      onChange={handleChange}
                      step="0.01"
                      placeholder="0,00"
                      className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-10 pr-5 focus:outline-none focus:border-primary/30 placeholder:text-muted/40 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-muted text-xs uppercase tracking-widest block mb-2">Final dos Dígitos</label>
                  <input
                    type="text"
                    name="lastFour"
                    value={formData.lastFour}
                    onChange={handleChange}
                    placeholder="1234"
                    maxLength={4}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-5 focus:outline-none focus:border-primary/30 placeholder:text-muted/40 text-sm"
                  />
                </div>
              </div>

              {formData.type === 'credit' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-muted text-xs uppercase tracking-widest block mb-2">Vencimento</label>
                    <input
                      type="date"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleChange}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-5 focus:outline-none focus:border-primary/30 text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-muted text-xs uppercase tracking-widest block mb-2">Fechamento</label>
                    <input
                      type="date"
                      name="closingDate"
                      value={formData.closingDate}
                      onChange={handleChange}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-5 focus:outline-none focus:border-primary/30 text-white text-sm"
                    />
                  </div>
                </div>
              )}
            </>
          )}

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
                🔒 Pessoal
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
                👫 Conjunto
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-5 rounded-2xl font-medium text-lg mt-6 transition-all active:scale-95 ${
              loading
                ? 'bg-white/5 text-muted cursor-not-allowed'
                : 'bg-primary text-background hover:bg-primary/90'
            }`}
          >
            {loading ? 'Salvando...' : account ? 'Atualizar Conta' : 'Criar Conta'}
          </button>
        </form>
      </motion.div>
    </>
  );
};

export default AccountsScreen;