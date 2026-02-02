import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { Payout, Expense, Account, PropFirm, DailyEntry } from '@/types';
import {
  initStorage,
  getPayouts, setPayouts as persistPayouts,
  getExpenses, setExpenses as persistExpenses,
  getAccounts, setAccounts as persistAccounts,
  getPropFirms, setPropFirms as persistPropFirms,
  getDailyEntries, setDailyEntries as persistDailyEntries,
  isR2Configured, syncToR2, pullFromR2,
} from '@/lib/storage';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'disabled';

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

  // Daily Entries
  dailyEntries: DailyEntry[];
  upsertDailyEntry: (entry: Omit<DailyEntry, 'id'>) => void;
  deleteDailyEntry: (id: string) => void;

  // Sync
  syncStatus: SyncStatus;
  triggerSync: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [payouts, _setPayouts] = useState<Payout[]>([]);
  const [expenses, _setExpenses] = useState<Expense[]>([]);
  const [accounts, _setAccounts] = useState<Account[]>([]);
  const [propFirms, _setPropFirms] = useState<PropFirm[]>([]);
  const [dailyEntries, _setDailyEntries] = useState<DailyEntry[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(
    isR2Configured() ? 'idle' : 'disabled'
  );

  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced auto-sync — pushes to R2 500ms after last mutation
  const scheduleSync = useCallback(() => {
    if (!isR2Configured()) return;
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      setSyncStatus('syncing');
      try {
        await syncToR2();
        setSyncStatus('synced');
      } catch {
        setSyncStatus('error');
      }
    }, 500);
  }, []);

  // Manual sync trigger
  const triggerSync = useCallback(async () => {
    if (!isR2Configured()) return;
    setSyncStatus('syncing');
    try {
      await syncToR2();
      setSyncStatus('synced');
    } catch {
      setSyncStatus('error');
    }
  }, []);

  // Hydrate: init localStorage, then pull from R2 if configured
  useEffect(() => {
    initStorage();

    const loadData = () => {
      _setPayouts(getPayouts());
      _setExpenses(getExpenses());
      _setAccounts(getAccounts());
      _setPropFirms(getPropFirms());
      _setDailyEntries(getDailyEntries());
    };

    if (isR2Configured()) {
      setSyncStatus('syncing');
      pullFromR2().then((pulled) => {
        if (pulled) {
          // Re-read localStorage after R2 data was written into it
          loadData();
          setSyncStatus('synced');
        } else {
          loadData();
          setSyncStatus('idle');
        }
      });
    } else {
      loadData();
    }
  }, []);

  // ── Payouts ───────────────────────────────────────────────
  const addPayout = useCallback((payout: Omit<Payout, 'id'>) => {
    _setPayouts((prev) => {
      const next = [...prev, { ...payout, id: crypto.randomUUID() } as Payout];
      persistPayouts(next);
      return next;
    });
    scheduleSync();
  }, [scheduleSync]);

  const updatePayout = useCallback((payout: Payout) => {
    _setPayouts((prev) => {
      const next = prev.map((p) => (p.id === payout.id ? payout : p));
      persistPayouts(next);
      return next;
    });
    scheduleSync();
  }, [scheduleSync]);

  const deletePayout = useCallback((id: string) => {
    _setPayouts((prev) => {
      const next = prev.filter((p) => p.id !== id);
      persistPayouts(next);
      return next;
    });
    scheduleSync();
  }, [scheduleSync]);

  // ── Expenses ──────────────────────────────────────────────
  const addExpense = useCallback((expense: Omit<Expense, 'id'>) => {
    _setExpenses((prev) => {
      const next = [...prev, { ...expense, id: crypto.randomUUID() } as Expense];
      persistExpenses(next);
      return next;
    });
    scheduleSync();
  }, [scheduleSync]);

  const updateExpense = useCallback((expense: Expense) => {
    _setExpenses((prev) => {
      const next = prev.map((e) => (e.id === expense.id ? expense : e));
      persistExpenses(next);
      return next;
    });
    scheduleSync();
  }, [scheduleSync]);

  const deleteExpense = useCallback((id: string) => {
    _setExpenses((prev) => {
      const next = prev.filter((e) => e.id !== id);
      persistExpenses(next);
      return next;
    });
    scheduleSync();
  }, [scheduleSync]);

  // ── Accounts ──────────────────────────────────────────────
  const addAccount = useCallback((account: Omit<Account, 'id'>) => {
    _setAccounts((prev) => {
      const next = [...prev, { ...account, id: crypto.randomUUID() } as Account];
      persistAccounts(next);
      return next;
    });
    scheduleSync();
  }, [scheduleSync]);

  const updateAccount = useCallback((account: Account) => {
    _setAccounts((prev) => {
      const next = prev.map((a) => (a.id === account.id ? account : a));
      persistAccounts(next);
      return next;
    });
    scheduleSync();
  }, [scheduleSync]);

  const deleteAccount = useCallback((id: string) => {
    _setAccounts((prev) => {
      const next = prev.filter((a) => a.id !== id);
      persistAccounts(next);
      return next;
    });
    scheduleSync();
  }, [scheduleSync]);

  // ── Prop Firms ────────────────────────────────────────────
  const addPropFirm = useCallback((firm: Omit<PropFirm, 'id'>) => {
    _setPropFirms((prev) => {
      const next = [...prev, { ...firm, id: crypto.randomUUID() } as PropFirm];
      persistPropFirms(next);
      return next;
    });
    scheduleSync();
  }, [scheduleSync]);

  const updatePropFirm = useCallback((firm: PropFirm) => {
    _setPropFirms((prev) => {
      const next = prev.map((f) => (f.id === firm.id ? firm : f));
      persistPropFirms(next);
      return next;
    });
    scheduleSync();
  }, [scheduleSync]);

  const deletePropFirm = useCallback((id: string) => {
    _setPropFirms((prev) => {
      const next = prev.filter((f) => f.id !== id);
      persistPropFirms(next);
      return next;
    });
    scheduleSync();
  }, [scheduleSync]);

  // ── Daily Entries ──────────────────────────────────────────
  const upsertDailyEntry = useCallback((entry: Omit<DailyEntry, 'id'>) => {
    _setDailyEntries((prev) => {
      const existing = prev.find((e) => e.date === entry.date);
      let next: DailyEntry[];
      if (existing) {
        next = prev.map((e) => (e.date === entry.date ? { ...e, ...entry } : e));
      } else {
        next = [...prev, { ...entry, id: crypto.randomUUID() } as DailyEntry];
      }
      persistDailyEntries(next);
      return next;
    });
    scheduleSync();
  }, [scheduleSync]);

  const deleteDailyEntry = useCallback((id: string) => {
    _setDailyEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      persistDailyEntries(next);
      return next;
    });
    scheduleSync();
  }, [scheduleSync]);

  return (
    <DataContext.Provider
      value={{
        payouts, addPayout, updatePayout, deletePayout,
        expenses, addExpense, updateExpense, deleteExpense,
        accounts, addAccount, updateAccount, deleteAccount,
        propFirms, addPropFirm, updatePropFirm, deletePropFirm,
        dailyEntries, upsertDailyEntry, deleteDailyEntry,
        syncStatus, triggerSync,
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
