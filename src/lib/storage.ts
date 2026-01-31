import { Payout, Expense, Account, PropFirm } from '@/types';
import { mockPayouts, mockExpenses, mockAccounts, mockPropFirms } from '@/data/mockData';

const STORAGE_PREFIX = 'proptracker_';

const KEYS = {
  payouts: `${STORAGE_PREFIX}payouts`,
  expenses: `${STORAGE_PREFIX}expenses`,
  accounts: `${STORAGE_PREFIX}accounts`,
  propFirms: `${STORAGE_PREFIX}propfirms`,
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

/** Clear all stored data and re-seed from mock data */
export function resetToDefaults(): void {
  localStorage.removeItem(KEYS.initialized);
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  seedIfNeeded();
}

// ── R2 Cloud Sync ───────────────────────────────────────────

const R2_API_URL = import.meta.env.VITE_R2_API_URL as string | undefined;
const R2_AUTH_TOKEN = import.meta.env.VITE_R2_AUTH_TOKEN as string | undefined;

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
    return true;
  } catch {
    return false;
  }
}
