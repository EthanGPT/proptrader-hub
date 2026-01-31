import { useMemo } from "react";
import { startOfMonth, subMonths, parseISO, isWithinInterval, endOfMonth } from "date-fns";
import { DollarSign, Receipt, Wallet, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { PayoutChart } from "@/components/dashboard/PayoutChart";
import { ExpenseBreakdown } from "@/components/dashboard/ExpenseBreakdown";
import { RecentPayouts } from "@/components/dashboard/RecentPayouts";
import { AccountsOverview } from "@/components/dashboard/AccountsOverview";
import { useData } from "@/context/DataContext";

function monthTotal(items: { date: string; amount: number }[], start: Date, end: Date): number {
  return items
    .filter(i => isWithinInterval(parseISO(i.date), { start, end }))
    .reduce((sum, i) => sum + i.amount, 0);
}

function calcTrend(current: number, previous: number): { value: number; isPositive: boolean } | undefined {
  if (previous === 0 && current === 0) return undefined;
  if (previous === 0) return { value: 100, isPositive: current > 0 };
  const pct = Math.round(((current - previous) / previous) * 100);
  return { value: Math.abs(pct), isPositive: pct >= 0 };
}

const Dashboard = () => {
  const { payouts, expenses, accounts } = useData();

  const totalPayouts = payouts.reduce((sum, p) => sum + p.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalPayouts - totalExpenses;
  const activeAccounts = accounts.filter(a =>
    (a.type === 'evaluation' && a.status === 'in_progress') ||
    (a.type === 'funded' && a.status === 'active')
  );
  const currentNav = activeAccounts.reduce((sum, a) => sum + a.accountSize, 0);

  const { payoutTrend, expenseTrend, profitTrend } = useMemo(() => {
    const now = new Date();
    const thisStart = startOfMonth(now);
    const thisEnd = now;
    const lastStart = startOfMonth(subMonths(now, 1));
    const lastEnd = endOfMonth(subMonths(now, 1));

    const curPayouts = monthTotal(payouts, thisStart, thisEnd);
    const prevPayouts = monthTotal(payouts, lastStart, lastEnd);

    const curExpenses = monthTotal(expenses, thisStart, thisEnd);
    const prevExpenses = monthTotal(expenses, lastStart, lastEnd);

    const curProfit = curPayouts - curExpenses;
    const prevProfit = prevPayouts - prevExpenses;

    return {
      payoutTrend: calcTrend(curPayouts, prevPayouts),
      expenseTrend: calcTrend(curExpenses, prevExpenses),
      profitTrend: calcTrend(curProfit, prevProfit),
    };
  }, [payouts, expenses]);

  return (
    <div className="space-y-8">
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Track your prop trading performance</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Payouts"
          value={`$${totalPayouts.toLocaleString()}`}
          icon={DollarSign}
          variant="success"
          trend={payoutTrend}
        />
        <StatCard
          title="Total Expenses"
          value={`$${totalExpenses.toLocaleString()}`}
          icon={Receipt}
          variant="warning"
          trend={expenseTrend}
        />
        <StatCard
          title="Net Profit"
          value={`$${netProfit.toLocaleString()}`}
          icon={TrendingUp}
          variant={netProfit >= 0 ? 'success' : 'danger'}
          trend={profitTrend}
        />
        <StatCard
          title="Current NAV"
          value={`$${currentNav.toLocaleString()}`}
          subtitle={`${activeAccounts.length} active account${activeAccounts.length !== 1 ? 's' : ''}`}
          icon={Wallet}
          variant="default"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PayoutChart />
        <ExpenseBreakdown />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentPayouts />
        <AccountsOverview />
      </div>
    </div>
  );
};

export default Dashboard;
