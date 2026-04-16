import { useState, useEffect, useCallback } from 'react';
import { accountsApi, type Account, type Context, type AccountType } from '../lib/api';

interface UseAccountsOptions {
  context?: Context;
  autoFetch?: boolean;
}

export function useAccounts({ context, autoFetch = true }: UseAccountsOptions = {}) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await accountsApi.list(context);
      setAccounts(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch accounts');
      console.error('Error fetching accounts:', err);
    } finally {
      setLoading(false);
    }
  }, [context]);

  const createAccount = useCallback(async (accountData: {
    name: string;
    institution?: string;
    type: AccountType;
    balance?: number;
    currency?: string;
    lastFour?: string;
    context: Context;
    creditLimit?: number;
    dueDate?: string;
    closingDate?: string;
  }) => {
    try {
      setLoading(true);
      const response = await accountsApi.create(accountData);
      setAccounts(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAccount = useCallback(async (id: string, updates: Partial<{
    name: string;
    institution?: string;
    type: AccountType;
    balance?: number;
    currency?: string;
    lastFour?: string;
    context: Context;
    isActive?: boolean;
    creditLimit?: number;
    dueDate?: string;
    closingDate?: string;
  }>) => {
    try {
      setLoading(true);
      const response = await accountsApi.update(id, updates);

      setAccounts(prev => prev.map(account =>
        account.id === id ? response.data : account
      ));

      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update account');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateBalance = useCallback(async (id: string, balance: number) => {
    try {
      setLoading(true);
      const response = await accountsApi.updateBalance(id, balance);

      setAccounts(prev => prev.map(account =>
        account.id === id ? response.data : account
      ));

      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update balance');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteAccount = useCallback(async (id: string, permanent: boolean = false) => {
    try {
      setLoading(true);
      if (permanent) {
        await accountsApi.permanentDelete(id);
        setAccounts(prev => prev.filter(account => account.id !== id));
      } else {
        await accountsApi.delete(id);
        setAccounts(prev => prev.map(account =>
          account.id === id ? { ...account, isActive: false } : account
        ));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchAccounts();
    }
  }, [fetchAccounts, autoFetch]);

  const totalBalance = accounts
    .filter(acc => acc.isActive)
    .reduce((sum, acc) => sum + parseFloat(acc.balance), 0);

  return {
    accounts,
    loading,
    error,
    totalBalance,
    refetch: fetchAccounts,
    createAccount,
    updateAccount,
    updateBalance,
    deleteAccount,
  };
}