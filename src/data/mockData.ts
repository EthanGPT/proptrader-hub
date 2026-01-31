import { Payout, Expense, Account, PropFirm } from '@/types';

export const mockPayouts: Payout[] = [
  { id: '1', date: '2025-01-15', amount: 2500, propFirm: 'FTMO', method: 'bank_transfer', notes: 'First payout!' },
  { id: '2', date: '2025-01-28', amount: 1800, propFirm: 'FundedNext', method: 'crypto' },
  { id: '3', date: '2024-12-20', amount: 3200, propFirm: 'FTMO', method: 'bank_transfer' },
  { id: '4', date: '2024-12-05', amount: 1500, propFirm: 'The5ers', method: 'bank_transfer' },
  { id: '5', date: '2024-11-18', amount: 2100, propFirm: 'FTMO', method: 'crypto' },
  { id: '6', date: '2024-10-25', amount: 4500, propFirm: 'FundedNext', method: 'bank_transfer' },
  { id: '7', date: '2024-09-12', amount: 1200, propFirm: 'E8 Funding', method: 'crypto' },
  { id: '8', date: '2024-08-30', amount: 2800, propFirm: 'FTMO', method: 'bank_transfer' },
];

export const mockExpenses: Expense[] = [
  { id: '1', date: '2025-01-10', amount: 550, category: 'challenge_fee', propFirm: 'FTMO' },
  { id: '2', date: '2025-01-05', amount: 299, category: 'subscription', propFirm: 'FundedNext' },
  { id: '3', date: '2024-12-15', amount: 150, category: 'software', notes: 'Trading journal subscription' },
  { id: '4', date: '2024-12-01', amount: 499, category: 'education', notes: 'ICT course' },
  { id: '5', date: '2024-11-20', amount: 450, category: 'challenge_fee', propFirm: 'The5ers' },
  { id: '6', date: '2024-10-10', amount: 350, category: 'challenge_fee', propFirm: 'E8 Funding' },
  { id: '7', date: '2024-09-05', amount: 89, category: 'software', notes: 'TradingView Pro' },
];

export const mockAccounts: Account[] = [
  // Evaluations
  { id: '1', type: 'evaluation', propFirm: 'FTMO', accountSize: 100000, startDate: '2024-06-15', status: 'passed', endDate: '2024-07-20', profitLoss: 8500, notes: 'Solid run!' },
  { id: '2', type: 'evaluation', propFirm: 'FundedNext', accountSize: 50000, startDate: '2024-08-01', status: 'passed', endDate: '2024-09-05', profitLoss: 4200 },
  { id: '3', type: 'evaluation', propFirm: 'FTMO', accountSize: 200000, startDate: '2024-10-10', status: 'in_progress', profitLoss: 12000 },
  { id: '4', type: 'evaluation', propFirm: 'The5ers', accountSize: 100000, startDate: '2024-09-20', status: 'failed', endDate: '2024-10-15', profitLoss: -5500, notes: 'Hit max drawdown' },
  { id: '5', type: 'evaluation', propFirm: 'E8 Funding', accountSize: 25000, startDate: '2024-11-01', status: 'passed', endDate: '2024-12-10', profitLoss: 2100 },
  { id: '6', type: 'evaluation', propFirm: 'FundedNext', accountSize: 100000, startDate: '2025-01-05', status: 'in_progress', profitLoss: 3500 },
  { id: '7', type: 'evaluation', propFirm: 'FTMO', accountSize: 50000, startDate: '2024-07-01', status: 'failed', endDate: '2024-07-25', profitLoss: -2800 },
  // Funded
  { id: '8', type: 'funded', propFirm: 'FTMO', accountSize: 100000, startDate: '2024-08-01', status: 'active', profitLoss: 14200, notes: 'First funded account' },
  { id: '9', type: 'funded', propFirm: 'FundedNext', accountSize: 50000, startDate: '2024-10-01', status: 'active', profitLoss: 6800 },
  { id: '10', type: 'funded', propFirm: 'E8 Funding', accountSize: 25000, startDate: '2024-12-15', status: 'breached', endDate: '2025-01-10', profitLoss: -3200, notes: 'Daily drawdown breach' },
];

export const mockPropFirms: PropFirm[] = [
  { id: '1', name: 'FTMO', website: 'https://ftmo.com', notes: 'Best overall experience', rating: 5, totalPayouts: 8600 },
  { id: '2', name: 'FundedNext', website: 'https://fundednext.com', notes: 'Fast payouts', rating: 4, totalPayouts: 6300 },
  { id: '3', name: 'The5ers', website: 'https://the5ers.com', notes: 'Good scaling plan', rating: 4, totalPayouts: 1500 },
  { id: '4', name: 'E8 Funding', website: 'https://e8funding.com', notes: 'Affordable challenges', rating: 3, totalPayouts: 1200 },
];

// Monthly payout data for charts
export const monthlyPayouts = [
  { month: 'Feb 24', amount: 0 },
  { month: 'Mar 24', amount: 1500 },
  { month: 'Apr 24', amount: 2200 },
  { month: 'May 24', amount: 0 },
  { month: 'Jun 24', amount: 3100 },
  { month: 'Jul 24', amount: 1800 },
  { month: 'Aug 24', amount: 2800 },
  { month: 'Sep 24', amount: 1200 },
  { month: 'Oct 24', amount: 4500 },
  { month: 'Nov 24', amount: 2100 },
  { month: 'Dec 24', amount: 4700 },
  { month: 'Jan 25', amount: 4300 },
];
