import { Payout, Expense, Account, PropFirm, DailyEntry, TradingSetup, Trade } from '@/types';

export const mockPayouts: Payout[] = [
  { id: '1', date: '2025-01-15', amount: 2500, propFirm: 'FTMO', method: 'bank_transfer', notes: 'First payout!' },
  { id: '2', date: '2025-01-28', amount: 1800, propFirm: 'Apex Trader Funding', method: 'crypto' },
  { id: '3', date: '2024-12-20', amount: 3200, propFirm: 'FTMO', method: 'bank_transfer' },
  { id: '4', date: '2024-12-05', amount: 1500, propFirm: 'Topstep', method: 'bank_transfer' },
  { id: '5', date: '2024-11-18', amount: 2100, propFirm: 'FTMO', method: 'crypto' },
  { id: '6', date: '2024-10-25', amount: 4500, propFirm: 'Apex Trader Funding', method: 'bank_transfer' },
  { id: '7', date: '2024-09-12', amount: 1200, propFirm: 'Topstep', method: 'crypto' },
  { id: '8', date: '2024-08-30', amount: 2800, propFirm: 'FTMO', method: 'bank_transfer' },
];

export const mockExpenses: Expense[] = [
  { id: '1', date: '2025-01-10', amount: 550, category: 'challenge_fee', propFirm: 'FTMO' },
  { id: '2', date: '2025-01-05', amount: 299, category: 'subscription', propFirm: 'Apex Trader Funding' },
  { id: '3', date: '2024-12-15', amount: 150, category: 'software', notes: 'Trading journal subscription' },
  { id: '4', date: '2024-12-01', amount: 499, category: 'education', notes: 'ICT course' },
  { id: '5', date: '2024-11-20', amount: 450, category: 'challenge_fee', propFirm: 'Topstep' },
  { id: '6', date: '2024-10-10', amount: 350, category: 'challenge_fee', propFirm: 'Apex Trader Funding' },
  { id: '7', date: '2024-09-05', amount: 89, category: 'software', notes: 'TradingView Pro' },
];

export const mockAccounts: Account[] = [
  // Evaluations
  { id: '1', type: 'evaluation', propFirm: 'FTMO', accountSize: 25000, startDate: '2024-06-15', status: 'passed', endDate: '2024-07-20', profitLoss: 2100, notes: 'Solid run!' },
  { id: '2', type: 'evaluation', propFirm: 'Apex Trader Funding', accountSize: 25000, startDate: '2024-08-01', status: 'passed', endDate: '2024-09-05', profitLoss: 1800 },
  { id: '3', type: 'evaluation', propFirm: 'Topstep', accountSize: 25000, startDate: '2024-08-15', status: 'passed', endDate: '2024-09-20', profitLoss: 1500 },
  { id: '4', type: 'evaluation', propFirm: 'FTMO', accountSize: 50000, startDate: '2024-09-20', status: 'failed', endDate: '2024-10-15', profitLoss: -3200, maxDrawdown: 3000, profitTarget: 5000, notes: 'Hit max drawdown' },
  { id: '5', type: 'evaluation', propFirm: 'Apex Trader Funding', accountSize: 50000, startDate: '2025-01-05', status: 'in_progress', profitLoss: 1200, maxDrawdown: 2500, profitTarget: 4000 },
  // Funded — 3 x $25K = $75K total
  { id: 'f1', type: 'funded', propFirm: 'FTMO', accountSize: 25000, startDate: '2024-10-01', status: 'active', profitLoss: 1080, maxDrawdown: 1500 },
  { id: 'f2', type: 'funded', propFirm: 'Apex Trader Funding', accountSize: 25000, startDate: '2024-10-15', status: 'active', profitLoss: -40, maxDrawdown: 1500 },
  { id: 'f3', type: 'funded', propFirm: 'Topstep', accountSize: 25000, startDate: '2024-11-01', status: 'active', profitLoss: 570, maxDrawdown: 1500 },
];

export const mockPropFirms: PropFirm[] = [
  { id: '1', name: 'FTMO', website: 'https://ftmo.com', notes: 'Best overall experience', rating: 5, totalPayouts: 8500 },
  { id: '2', name: 'Apex Trader Funding', website: 'https://apextraderfunding.com', notes: 'Fast payouts', rating: 4, totalPayouts: 6300 },
  { id: '3', name: 'Topstep', website: 'https://topstep.com', notes: 'Good scaling plan', rating: 4, totalPayouts: 2700 },
];

export const mockDailyEntries: DailyEntry[] = [
  { id: 'd1', date: '2025-01-27', pnl: 360, notes: 'Clean NQ setup, took 2 trades' },
  { id: 'd2', date: '2025-01-28', pnl: -120, notes: 'Overtraded, need more patience' },
  { id: 'd3', date: '2025-01-29', pnl: 700, notes: 'Perfect ES long from FVG' },
  { id: 'd4', date: '2025-01-30', pnl: 0, notes: 'No setups, sat on hands' },
  { id: 'd5', date: '2025-01-31', pnl: 320 },
  { id: 'd6', date: '2025-01-24', pnl: -200, notes: 'Revenge traded after first loss' },
  { id: 'd7', date: '2025-01-23', pnl: 870, notes: 'Best day this month' },
  { id: 'd8', date: '2025-01-22', pnl: 150 },
  { id: 'd9', date: '2025-01-21', pnl: -80 },
  { id: 'd10', date: '2025-01-20', pnl: 560, notes: 'Solid trend day' },
];

export const mockTradingSetups: TradingSetup[] = [
  { id: 's1', name: 'PDH Long', description: 'Price above Previous Day High — trend continuation longs', rules: 'Wait for price to break and hold above PDH. Enter on pullback to PDH level. Stop below PDH.' },
  { id: 's2', name: 'PDL Short', description: 'Price below Previous Day Low — trend continuation shorts', rules: 'Wait for price to break and hold below PDL. Enter on pullback to PDL level. Stop above PDL.' },
  { id: 's3', name: 'PM High Break', description: 'Break above pre-market high after open', rules: 'Mark pre-market high. If price breaks above after market open with volume, enter long. Stop below PM high.' },
  { id: 's4', name: 'PM Low Break', description: 'Break below pre-market low after open', rules: 'Mark pre-market low. If price breaks below after market open with volume, enter short. Stop above PM low.' },
  { id: 's5', name: 'FVG Fill', description: 'Fair Value Gap fill and continuation', rules: 'Identify FVG on 5m/15m chart. Wait for price to fill into the gap. Enter in direction of trend on reaction.' },
];

export const mockTrades: Trade[] = [
  { id: 't1', date: '2025-01-27', time: '14:35', instrument: 'NQ', setupId: 's1', accountId: 'f1', direction: 'long', entry: 21450, exit: 21520, stopLoss: 21410, contracts: 2, pnl: 280, result: 'win', riskReward: 1.75, rating: 4, notes: 'Clean PDH break, held for target' },
  { id: 't2', date: '2025-01-27', time: '15:10', instrument: 'NQ', setupId: 's3', accountId: 'f1', direction: 'long', entry: 21540, exit: 21580, stopLoss: 21510, contracts: 1, pnl: 80, result: 'win', riskReward: 1.33, rating: 3, notes: 'PM high break but got out too early' },
  { id: 't3', date: '2025-01-28', time: '14:40', instrument: 'NQ', setupId: 's2', accountId: 'f2', direction: 'short', entry: 21380, exit: 21420, stopLoss: 21420, contracts: 2, pnl: -160, result: 'loss', riskReward: 0, rating: 2, notes: 'Stopped out, PDL didnt hold as resistance' },
  { id: 't4', date: '2025-01-28', time: '15:20', instrument: 'ES', setupId: 's5', accountId: 'f2', direction: 'long', entry: 6050, exit: 6052, stopLoss: 6045, contracts: 1, pnl: 40, result: 'win', riskReward: 0.4, rating: 2, notes: 'Revenge trade, took small profit' },
  { id: 't5', date: '2025-01-29', time: '14:32', instrument: 'ES', setupId: 's5', accountId: 'f3', direction: 'long', entry: 6035, exit: 6070, stopLoss: 6020, contracts: 2, pnl: 700, result: 'win', riskReward: 2.33, rating: 5, notes: 'Perfect FVG fill entry, held full runner' },
  { id: 't6', date: '2025-01-24', time: '14:45', instrument: 'NQ', setupId: 's2', accountId: 'f2', direction: 'short', entry: 21500, exit: 21460, stopLoss: 21530, contracts: 1, pnl: 80, result: 'win', riskReward: 1.33, rating: 4 },
  { id: 't7', date: '2025-01-24', time: '15:30', instrument: 'NQ', setupId: 's4', accountId: 'f3', direction: 'short', entry: 21430, exit: 21470, stopLoss: 21460, contracts: 2, pnl: -160, result: 'loss', riskReward: 0, rating: 1, notes: 'Revenge trade after green day turned red' },
  { id: 't8', date: '2025-01-24', time: '15:45', instrument: 'NQ', setupId: 's4', accountId: 'f1', direction: 'short', entry: 21450, exit: 21480, stopLoss: 21470, contracts: 2, pnl: -120, result: 'loss', riskReward: 0, rating: 1, notes: 'Another revenge, should have stopped' },
  { id: 't9', date: '2025-01-23', time: '14:33', instrument: 'NQ', setupId: 's1', accountId: 'f1', direction: 'long', entry: 21300, exit: 21420, stopLoss: 21270, contracts: 3, pnl: 720, result: 'win', riskReward: 4.0, rating: 5, notes: 'Textbook PDH long, best trade of the month' },
  { id: 't10', date: '2025-01-23', time: '15:15', instrument: 'ES', setupId: 's3', accountId: 'f3', direction: 'long', entry: 6020, exit: 6035, stopLoss: 6010, contracts: 1, pnl: 150, result: 'win', riskReward: 1.5, rating: 4 },
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
