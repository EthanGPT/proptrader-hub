import { DollarSign, Receipt, Wallet, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { PayoutChart } from "@/components/dashboard/PayoutChart";
import { ExpenseBreakdown } from "@/components/dashboard/ExpenseBreakdown";
import { RecentPayouts } from "@/components/dashboard/RecentPayouts";
import { AccountsOverview } from "@/components/dashboard/AccountsOverview";
import { mockPayouts, mockExpenses, mockAccounts } from "@/data/mockData";

const Dashboard = () => {
  // Calculate summary stats
  const totalPayouts = mockPayouts.reduce((sum, p) => sum + p.amount, 0);
  const totalExpenses = mockExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalPayouts - totalExpenses;
  const passedAccounts = mockAccounts.filter(a => a.status === 'passed').length;
  const failedAccounts = mockAccounts.filter(a => a.status === 'failed').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Track your prop trading performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Payouts"
          value={`$${totalPayouts.toLocaleString()}`}
          icon={DollarSign}
          variant="success"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Total Expenses"
          value={`$${totalExpenses.toLocaleString()}`}
          icon={Receipt}
          variant="warning"
        />
        <StatCard
          title="Net Profit"
          value={`$${netProfit.toLocaleString()}`}
          icon={TrendingUp}
          variant={netProfit >= 0 ? 'success' : 'danger'}
        />
        <StatCard
          title="Accounts"
          value={`${passedAccounts} / ${passedAccounts + failedAccounts}`}
          subtitle="passed accounts"
          icon={Wallet}
          variant="default"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <PayoutChart />
        <ExpenseBreakdown />
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentPayouts />
        <AccountsOverview />
      </div>
    </div>
  );
};

export default Dashboard;
