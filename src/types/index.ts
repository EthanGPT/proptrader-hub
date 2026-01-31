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

export interface Account {
  id: string;
  propFirm: string;
  accountSize: number;
  startDate: string;
  status: 'passed' | 'failed' | 'in_progress';
  endDate?: string;
  profitLoss: number;
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

export const ACCOUNT_SIZES = [
  5000, 10000, 25000, 50000, 100000, 200000, 400000
] as const;
