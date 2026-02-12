import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { Payout, Expense, Account, PropFirm, DailyEntry, TradingSetup, Trade } from '@/types';
import {
  initStorage,
  getPayouts, setPayouts as persistPayouts,
  getExpenses, setExpenses as persistExpenses,
  getAccounts, setAccounts as persistAccounts,
  getPropFirms, setPropFirms as persistPropFirms,
  getDailyEntries, setDailyEntries as persistDailyEntries,
  getTradingSetups, setTradingSetups as persistTradingSetups,
  getTrades, setTrades as persistTrades,
  isR2Configured, syncToR2, pullFromR2,
  addCorrectionTrades,
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

  // Trading Setups
  tradingSetups: TradingSetup[];
  addTradingSetup: (setup: Omit<TradingSetup, 'id'>) => void;
  updateTradingSetup: (setup: TradingSetup) => void;
  deleteTradingSetup: (id: string) => void;

  // Trades
  trades: Trade[];
  addTrade: (trade: Omit<Trade, 'id'>) => void;
  updateTrade: (trade: Trade) => void;
  deleteTrade: (id: string) => void;

  // Sync
  syncStatus: SyncStatus;
  triggerSync: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

// ── Account P&L recalculation from trades ─────────────────────
// "Active trading accounts" = funded+active OR evaluation+in_progress.
// Only recalculates accounts that have at least one linked trade.
// Accounts with no trades keep their manual profitLoss.
function recalcAccountPnl(accounts: Account[], allTrades: Trade[]): Account[] {
  const tradingIds = accounts
    .filter(a =>
      (a.type === 'funded' && a.status === 'active') ||
      (a.type === 'evaluation' && a.status === 'in_progress')
    )
    .map(a => a.id);
  const splitCount = tradingIds.length;
  const hasSplitTrades = allTrades.some(t => t.accountId === 'split');

  return accounts.map(account => {
    const directTrades = allTrades.filter(t => t.accountId === account.id);
    const hasDirectTrades = directTrades.length > 0;
    const isSplitTarget = tradingIds.includes(account.id) && hasSplitTrades;

    // Only recalc if this account has linked trades
    if (!hasDirectTrades && !isSplitTarget) return account;

    const directPnl = directTrades.reduce((sum, t) => sum + t.pnl, 0);

    let splitPnl = 0;
    if (isSplitTarget && splitCount > 0) {
      splitPnl = allTrades
        .filter(t => t.accountId === 'split')
        .reduce((sum, t) => sum + (t.pnl / splitCount), 0);
    }

    const newPnl = Math.round((directPnl + splitPnl) * 100) / 100;
    const today = new Date().toISOString().split('T')[0];

    let newStatus = account.status;
    let newEndDate = account.endDate;

    // Auto-breach / auto-fail on drawdown
    if (
      account.maxDrawdown != null &&
      newPnl <= -account.maxDrawdown
    ) {
      if (account.type === 'evaluation' && account.status === 'in_progress') {
        newStatus = 'failed';
        newEndDate = today;
      } else if (account.type === 'funded' && account.status === 'active') {
        newStatus = 'breached';
        newEndDate = today;
      }
    }

    // Auto-pass evaluation on profit target
    if (
      account.type === 'evaluation' &&
      account.status === 'in_progress' &&
      account.profitTarget != null &&
      newPnl >= account.profitTarget
    ) {
      newStatus = 'passed';
      newEndDate = today;
    }

    return {
      ...account,
      profitLoss: newPnl,
      status: newStatus,
      endDate: newEndDate,
    };
  });
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [payouts, _setPayouts] = useState<Payout[]>([]);
  const [expenses, _setExpenses] = useState<Expense[]>([]);
  const [accounts, _setAccounts] = useState<Account[]>([]);
  const [propFirms, _setPropFirms] = useState<PropFirm[]>([]);
  const [dailyEntries, _setDailyEntries] = useState<DailyEntry[]>([]);
  const [tradingSetups, _setTradingSetups] = useState<TradingSetup[]>([]);
  const [trades, _setTrades] = useState<Trade[]>([]);
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

  // Helper: recalculate account P&L from persisted trades and update accounts
  const refreshAccountPnl = useCallback(() => {
    const latestTrades = getTrades();
    _setAccounts((prevAccounts) => {
      const next = recalcAccountPnl(prevAccounts, latestTrades);
      persistAccounts(next);
      return next;
    });
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
      _setTradingSetups(getTradingSetups());
      _setTrades(getTrades());
    };

    if (isR2Configured()) {
      setSyncStatus('syncing');
      pullFromR2().then((pulled) => {
        // Add correction trades AFTER R2 pull, then sync back
        addCorrectionTrades();
        syncToR2().catch(() => {});
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

  // ── Trading Setups ─────────────────────────────────────────
  const addTradingSetup = useCallback((setup: Omit<TradingSetup, 'id'>) => {
    _setTradingSetups((prev) => {
      const next = [...prev, { ...setup, id: crypto.randomUUID() } as TradingSetup];
      persistTradingSetups(next);
      return next;
    });
    scheduleSync();
  }, [scheduleSync]);

  const updateTradingSetup = useCallback((setup: TradingSetup) => {
    _setTradingSetups((prev) => {
      const next = prev.map((s) => (s.id === setup.id ? setup : s));
      persistTradingSetups(next);
      return next;
    });
    scheduleSync();
  }, [scheduleSync]);

  const deleteTradingSetup = useCallback((id: string) => {
    _setTradingSetups((prev) => {
      const next = prev.filter((s) => s.id !== id);
      persistTradingSetups(next);
      return next;
    });
    scheduleSync();
  }, [scheduleSync]);

  // ── Trades ─────────────────────────────────────────────────
  // After every trade mutation, recalculate linked account P&L.
  const addTrade = useCallback((trade: Omit<Trade, 'id'>) => {
    _setTrades((prev) => {
      const next = [...prev, { ...trade, id: crypto.randomUUID() } as Trade];
      persistTrades(next);
      return next;
    });
    refreshAccountPnl();
    scheduleSync();
  }, [scheduleSync, refreshAccountPnl]);

  const updateTrade = useCallback((trade: Trade) => {
    _setTrades((prev) => {
      const next = prev.map((t) => (t.id === trade.id ? trade : t));
      persistTrades(next);
      return next;
    });
    refreshAccountPnl();
    scheduleSync();
  }, [scheduleSync, refreshAccountPnl]);

  const deleteTrade = useCallback((id: string) => {
    _setTrades((prev) => {
      const next = prev.filter((t) => t.id !== id);
      persistTrades(next);
      return next;
    });
    refreshAccountPnl();
    scheduleSync();
  }, [scheduleSync, refreshAccountPnl]);

  return (
    <DataContext.Provider
      value={{
        payouts, addPayout, updatePayout, deletePayout,
        expenses, addExpense, updateExpense, deleteExpense,
        accounts, addAccount, updateAccount, deleteAccount,
        propFirms, addPropFirm, updatePropFirm, deletePropFirm,
        dailyEntries, upsertDailyEntry, deleteDailyEntry,
        tradingSetups, addTradingSetup, updateTradingSetup, deleteTradingSetup,
        trades, addTrade, updateTrade, deleteTrade,
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
