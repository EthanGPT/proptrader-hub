import { Payout, Expense, Account, PropFirm, DailyEntry, TradingSetup, Trade } from '@/types';
import { mockPayouts, mockExpenses, mockAccounts, mockPropFirms, mockDailyEntries, mockTradingSetups, mockTrades } from '@/data/mockData';

const STORAGE_PREFIX = 'proptracker_';

const KEYS = {
  payouts: `${STORAGE_PREFIX}payouts`,
  expenses: `${STORAGE_PREFIX}expenses`,
  accounts: `${STORAGE_PREFIX}accounts`,
  propFirms: `${STORAGE_PREFIX}propfirms`,
  dailyEntries: `${STORAGE_PREFIX}daily_entries`,
  tradingSetups: `${STORAGE_PREFIX}trading_setups`,
  trades: `${STORAGE_PREFIX}trades`,
  initialized: `${STORAGE_PREFIX}initialized`,
} as const;

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function write<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

/** Seed localStorage with mock data on first visit */
function seedIfNeeded(): void {
  if (localStorage.getItem(KEYS.initialized)) return;
  write(KEYS.payouts, mockPayouts);
  write(KEYS.expenses, mockExpenses);
  write(KEYS.accounts, mockAccounts);
  write(KEYS.propFirms, mockPropFirms);
  write(KEYS.dailyEntries, mockDailyEntries);
  write(KEYS.tradingSetups, mockTradingSetups);
  write(KEYS.trades, mockTrades);
  localStorage.setItem(KEYS.initialized, '1');
}

/** Migrate accounts that lack the `type` field (pre-funded-accounts update) */
function migrateAccounts(): void {
  const accounts = read<Record<string, unknown>[]>(KEYS.accounts);
  if (!accounts || accounts.length === 0) return;
  const needsMigration = accounts.some((a) => !a.type);
  if (!needsMigration) return;
  const migrated = accounts.map((a) => ({
    ...a,
    type: a.type ?? 'evaluation',
  }));
  write(KEYS.accounts, migrated);
}

// ── Public API ──────────────────────────────────────────────

export function initStorage(): void {
  seedIfNeeded();
  migrateAccounts();
}

export function getPayouts(): Payout[] {
  return read<Payout[]>(KEYS.payouts) ?? [];
}
export function setPayouts(data: Payout[]): void {
  write(KEYS.payouts, data);
}

export function getExpenses(): Expense[] {
  return read<Expense[]>(KEYS.expenses) ?? [];
}
export function setExpenses(data: Expense[]): void {
  write(KEYS.expenses, data);
}

export function getAccounts(): Account[] {
  return read<Account[]>(KEYS.accounts) ?? [];
}
export function setAccounts(data: Account[]): void {
  write(KEYS.accounts, data);
}

export function getPropFirms(): PropFirm[] {
  return read<PropFirm[]>(KEYS.propFirms) ?? [];
}
export function setPropFirms(data: PropFirm[]): void {
  write(KEYS.propFirms, data);
}

export function getDailyEntries(): DailyEntry[] {
  return read<DailyEntry[]>(KEYS.dailyEntries) ?? [];
}
export function setDailyEntries(data: DailyEntry[]): void {
  write(KEYS.dailyEntries, data);
}

export function getTradingSetups(): TradingSetup[] {
  return read<TradingSetup[]>(KEYS.tradingSetups) ?? [];
}
export function setTradingSetups(data: TradingSetup[]): void {
  write(KEYS.tradingSetups, data);
}

export function getTrades(): Trade[] {
  return read<Trade[]>(KEYS.trades) ?? [];
}
export function setTrades(data: Trade[]): void {
  write(KEYS.trades, data);
}

/** Clear all stored data and re-seed from mock data */
export function resetToDefaults(): void {
  localStorage.removeItem(KEYS.initialized);
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  seedIfNeeded();
}

// ── R2 Cloud Sync ───────────────────────────────────────────

const R2_API_URL = (import.meta.env.VITE_R2_API_URL as string | undefined)?.trim();
const R2_AUTH_TOKEN = (import.meta.env.VITE_R2_AUTH_TOKEN as string | undefined)?.trim();

export function isR2Configured(): boolean {
  return Boolean(R2_API_URL && R2_AUTH_TOKEN);
}

export async function syncToR2(): Promise<void> {
  if (!R2_API_URL || !R2_AUTH_TOKEN) return;
  const payload = {
    payouts: getPayouts(),
    expenses: getExpenses(),
    accounts: getAccounts(),
    propFirms: getPropFirms(),
    dailyEntries: getDailyEntries(),
    tradingSetups: getTradingSetups(),
    trades: getTrades(),
  };
  const res = await fetch(`${R2_API_URL}/sync`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${R2_AUTH_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Sync failed: ${res.status}`);
}

export async function pullFromR2(): Promise<boolean> {
  if (!R2_API_URL || !R2_AUTH_TOKEN) return false;
  try {
    const res = await fetch(`${R2_API_URL}/sync`, {
      headers: { 'Authorization': `Bearer ${R2_AUTH_TOKEN}` },
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (data.payouts) setPayouts(data.payouts);
    if (data.expenses) setExpenses(data.expenses);
    if (data.accounts) setAccounts(data.accounts);
    if (data.propFirms) setPropFirms(data.propFirms);
    if (data.dailyEntries) setDailyEntries(data.dailyEntries);
    if (data.tradingSetups) setTradingSetups(data.tradingSetups);
    if (data.trades) setTrades(data.trades);
    return true;
  } catch {
    return false;
  }
}
