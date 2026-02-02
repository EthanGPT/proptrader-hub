export interface Payout {
  id: string;
  date: string;
  amount: number;
  propFirm: string;
  method: 'bank_transfer' | 'crypto' | 'paypal' | 'other';
  notes?: string;
}

export interface Expense {
  id: string;
  date: string;
  amount: number;
  category: 'challenge_fee' | 'subscription' | 'software' | 'education' | 'other';
  propFirm?: string;
  notes?: string;
}

export type AccountType = 'evaluation' | 'funded';
export type EvaluationStatus = 'passed' | 'failed' | 'in_progress';
export type FundedStatus = 'active' | 'breached' | 'withdrawn';

export interface Account {
  id: string;
  type: AccountType;
  propFirm: string;
  accountSize: number;
  startDate: string;
  status: EvaluationStatus | FundedStatus;
  endDate?: string;
  profitLoss: number;
  maxDrawdown?: number;    // max loss $ before auto-breach/fail
  profitTarget?: number;   // profit $ to auto-pass (evaluations)
  notes?: string;
}

export interface PropFirm {
  id: string;
  name: string;
  website?: string;
  notes?: string;
  rating?: number;
  totalPayouts: number;
}

export const PROP_FIRMS = [
  'FTMO',
  'MyForexFunds',
  'FundedNext',
  'The Funded Trader',
  'True Forex Funds',
  'E8 Funding',
  'Topstep',
  'Apex Trader Funding',
  'My Funded FX',
  'The5ers',
] as const;

export const PAYOUT_METHODS = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'crypto', label: 'Cryptocurrency' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'other', label: 'Other' },
] as const;

export const EXPENSE_CATEGORIES = [
  { value: 'challenge_fee', label: 'Challenge Fee' },
  { value: 'subscription', label: 'Subscription' },
  { value: 'software', label: 'Software' },
  { value: 'education', label: 'Education' },
  { value: 'other', label: 'Other' },
] as const;

export interface DailyEntry {
  id: string;
  date: string; // YYYY-MM-DD
  pnl?: number;
  notes?: string;
}

export type TradeDirection = 'long' | 'short';
export type TradeResult = 'win' | 'loss' | 'breakeven';

export interface TradingSetup {
  id: string;
  name: string;
  description?: string;
  rules?: string;
}

export interface Trade {
  id: string;
  date: string;
  time?: string;
  instrument: string;
  setupId: string;
  accountId?: string; // account ID or 'split' for equal split across active funded accounts
  direction: TradeDirection;
  entry: number;
  exit?: number;
  stopLoss?: number;
  takeProfit?: number;
  contracts: number;
  pnl: number;
  result: TradeResult;
  riskReward?: number;
  rating?: number; // 1-5 execution quality
  notes?: string;
}

export const INSTRUMENTS = [
  'NQ', 'ES', 'YM', 'RTY', 'GC', 'CL',
  'EUR/USD', 'GBP/USD', 'USD/JPY',
] as const;

export const ACCOUNT_SIZES = [
  5000, 10000, 25000, 50000, 100000, 200000, 400000
] as const;
