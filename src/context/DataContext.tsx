import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Payout, Expense, Account, PropFirm } from '@/types';
import {
  initStorage,
  getPayouts, setPayouts as persistPayouts,
  getExpenses, setExpenses as persistExpenses,
  getAccounts, setAccounts as persistAccounts,
  getPropFirms, setPropFirms as persistPropFirms,
} from '@/lib/storage';

interface DataContextValue {
  // Payouts
  payouts: Payout[];
  addPayout: (payout: Omit<Payout, 'id'>) => void;
  updatePayout: (payout: Payout) => void;
  deletePayout: (id: string) => void;

  // Expenses
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;

  // Accounts
  accounts: Account[];
  addAccount: (account: Omit<Account, 'id'>) => void;
  updateAccount: (account: Account) => void;
  deleteAccount: (id: string) => void;

  // Prop Firms
  propFirms: PropFirm[];
  addPropFirm: (firm: Omit<PropFirm, 'id'>) => void;
  updatePropFirm: (firm: PropFirm) => void;
  deletePropFirm: (id: string) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [payouts, _setPayouts] = useState<Payout[]>([]);
  const [expenses, _setExpenses] = useState<Expense[]>([]);
  const [accounts, _setAccounts] = useState<Account[]>([]);
  const [propFirms, _setPropFirms] = useState<PropFirm[]>([]);

  // Hydrate from localStorage on mount
  useEffect(() => {
    initStorage();
    _setPayouts(getPayouts());
    _setExpenses(getExpenses());
    _setAccounts(getAccounts());
    _setPropFirms(getPropFirms());
  }, []);

  // ── Payouts ───────────────────────────────────────────────
  const addPayout = useCallback((payout: Omit<Payout, 'id'>) => {
    _setPayouts((prev) => {
      const next = [...prev, { ...payout, id: crypto.randomUUID() } as Payout];
      persistPayouts(next);
      return next;
    });
  }, []);

  const updatePayout = useCallback((payout: Payout) => {
    _setPayouts((prev) => {
      const next = prev.map((p) => (p.id === payout.id ? payout : p));
      persistPayouts(next);
      return next;
    });
  }, []);

  const deletePayout = useCallback((id: string) => {
    _setPayouts((prev) => {
      const next = prev.filter((p) => p.id !== id);
      persistPayouts(next);
      return next;
    });
  }, []);

  // ── Expenses ──────────────────────────────────────────────
  const addExpense = useCallback((expense: Omit<Expense, 'id'>) => {
    _setExpenses((prev) => {
      const next = [...prev, { ...expense, id: crypto.randomUUID() } as Expense];
      persistExpenses(next);
      return next;
    });
  }, []);

  const updateExpense = useCallback((expense: Expense) => {
    _setExpenses((prev) => {
      const next = prev.map((e) => (e.id === expense.id ? expense : e));
      persistExpenses(next);
      return next;
    });
  }, []);

  const deleteExpense = useCallback((id: string) => {
    _setExpenses((prev) => {
      const next = prev.filter((e) => e.id !== id);
      persistExpenses(next);
      return next;
    });
  }, []);

  // ── Accounts ──────────────────────────────────────────────
  const addAccount = useCallback((account: Omit<Account, 'id'>) => {
    _setAccounts((prev) => {
      const next = [...prev, { ...account, id: crypto.randomUUID() } as Account];
      persistAccounts(next);
      return next;
    });
  }, []);

  const updateAccount = useCallback((account: Account) => {
    _setAccounts((prev) => {
      const next = prev.map((a) => (a.id === account.id ? account : a));
      persistAccounts(next);
      return next;
    });
  }, []);

  const deleteAccount = useCallback((id: string) => {
    _setAccounts((prev) => {
      const next = prev.filter((a) => a.id !== id);
      persistAccounts(next);
      return next;
    });
  }, []);

  // ── Prop Firms ────────────────────────────────────────────
  const addPropFirm = useCallback((firm: Omit<PropFirm, 'id'>) => {
    _setPropFirms((prev) => {
      const next = [...prev, { ...firm, id: crypto.randomUUID() } as PropFirm];
      persistPropFirms(next);
      return next;
    });
  }, []);

  const updatePropFirm = useCallback((firm: PropFirm) => {
    _setPropFirms((prev) => {
      const next = prev.map((f) => (f.id === firm.id ? firm : f));
      persistPropFirms(next);
      return next;
    });
  }, []);

  const deletePropFirm = useCallback((id: string) => {
    _setPropFirms((prev) => {
      const next = prev.filter((f) => f.id !== id);
      persistPropFirms(next);
      return next;
    });
  }, []);

  return (
    <DataContext.Provider
      value={{
        payouts, addPayout, updatePayout, deletePayout,
        expenses, addExpense, updateExpense, deleteExpense,
        accounts, addAccount, updateAccount, deleteAccount,
        propFirms, addPropFirm, updatePropFirm, deletePropFirm,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within a DataProvider');
  return ctx;
}
