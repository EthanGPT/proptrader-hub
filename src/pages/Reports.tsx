import { useState } from "react";
import { Download, FileText } from "lucide-react";
import { mockPayouts, mockExpenses, mockAccounts } from "@/data/mockData";
import { PROP_FIRMS, EXPENSE_CATEGORIES } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend,
  Line,
  LineChart,
} from "recharts";

const Reports = () => {
  const [dateFrom, setDateFrom] = useState("2024-01-01");
  const [dateTo, setDateTo] = useState("2025-12-31");
  const [filterFirm, setFilterFirm] = useState<string>("all");

  // Calculate payouts by firm
  const payoutsByFirm = mockPayouts.reduce((acc, p) => {
    acc[p.propFirm] = (acc[p.propFirm] || 0) + p.amount;
    return acc;
  }, {} as Record<string, number>);

  const payoutsByFirmData = Object.entries(payoutsByFirm).map(([firm, amount]) => ({
    name: firm,
    amount,
  }));

  // Calculate expenses by category
  const expensesByCategory = mockExpenses.reduce((acc, e) => {
    const label = EXPENSE_CATEGORIES.find(c => c.value === e.category)?.label || e.category;
    acc[label] = (acc[label] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  const expensesByCategoryData = Object.entries(expensesByCategory).map(([category, amount]) => ({
    name: category,
    amount,
  }));

  // Monthly performance
  const monthlyData = [
    { month: 'Jul 24', payouts: 0, expenses: 450 },
    { month: 'Aug 24', payouts: 2800, expenses: 0 },
    { month: 'Sep 24', payouts: 1200, expenses: 89 },
    { month: 'Oct 24', payouts: 4500, expenses: 350 },
    { month: 'Nov 24', payouts: 2100, expenses: 450 },
    { month: 'Dec 24', payouts: 4700, expenses: 649 },
    { month: 'Jan 25', payouts: 4300, expenses: 849 },
  ];

  const totalPayouts = mockPayouts.reduce((sum, p) => sum + p.amount, 0);
  const totalExpenses = mockExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalPayouts - totalExpenses;

  const handleExportPDF = () => {
    // In a real app, this would generate a PDF
    alert('PDF export would be generated here. This feature requires a backend integration.');
  };

  const handleExportCSV = () => {
    const lines = [
      '=== PROP TRADING REPORT ===',
      '',
      'SUMMARY',
      `Total Payouts,${totalPayouts}`,
      `Total Expenses,${totalExpenses}`,
      `Net Profit,${netProfit}`,
      '',
      'PAYOUTS BY FIRM',
      ...payoutsByFirmData.map(d => `${d.name},${d.amount}`),
      '',
      'EXPENSES BY CATEGORY',
      ...expensesByCategoryData.map(d => `${d.name},${d.amount}`),
    ];
    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trading-report.csv';
    a.click();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">Analytics and performance reports</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleExportPDF}>
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="stat-card animate-fade-in">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label>From Date</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>To Date</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Prop Firm</Label>
            <Select value={filterFirm} onValueChange={setFilterFirm}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by firm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Firms</SelectItem>
                {PROP_FIRMS.map((firm) => (
                  <SelectItem key={firm} value={firm}>{firm}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="stat-card animate-slide-up text-center">
          <p className="text-sm text-muted-foreground">Total Payouts</p>
          <p className="text-3xl font-bold text-success">${totalPayouts.toLocaleString()}</p>
        </div>
        <div className="stat-card animate-slide-up text-center">
          <p className="text-sm text-muted-foreground">Total Expenses</p>
          <p className="text-3xl font-bold text-destructive">${totalExpenses.toLocaleString()}</p>
        </div>
        <div className="stat-card animate-slide-up text-center">
          <p className="text-sm text-muted-foreground">Net Profit</p>
          <p className={`text-3xl font-bold ${netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
            ${netProfit.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Payouts by Firm */}
        <div className="stat-card animate-slide-up">
          <h3 className="mb-6 text-lg font-semibold">Payouts by Firm</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={payoutsByFirmData} layout="vertical" margin={{ left: 80 }}>
                <XAxis type="number" tickFormatter={(v) => `$${v / 1000}k`} />
                <YAxis type="category" dataKey="name" width={80} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="glass-card rounded-lg p-3">
                          <p className="text-sm font-medium">{payload[0].payload.name}</p>
                          <p className="text-lg font-bold text-success">
                            ${payload[0].value?.toLocaleString()}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="amount" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenses by Category */}
        <div className="stat-card animate-slide-up">
          <h3 className="mb-6 text-lg font-semibold">Expenses by Category</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expensesByCategoryData} layout="vertical" margin={{ left: 100 }}>
                <XAxis type="number" tickFormatter={(v) => `$${v}`} />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="glass-card rounded-lg p-3">
                          <p className="text-sm font-medium">{payload[0].payload.name}</p>
                          <p className="text-lg font-bold text-destructive">
                            ${payload[0].value?.toLocaleString()}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="amount" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Monthly Performance */}
      <div className="stat-card animate-slide-up">
        <h3 className="mb-6 text-lg font-semibold">Monthly Performance</h3>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData}>
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="glass-card rounded-lg p-3">
                        <p className="mb-2 text-sm font-medium">{label}</p>
                        <p className="text-sm text-success">
                          Payouts: ${payload[0].value?.toLocaleString()}
                        </p>
                        <p className="text-sm text-destructive">
                          Expenses: ${payload[1].value?.toLocaleString()}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="payouts" 
                stroke="hsl(var(--success))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--success))' }}
                name="Payouts"
              />
              <Line 
                type="monotone" 
                dataKey="expenses" 
                stroke="hsl(var(--destructive))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--destructive))' }}
                name="Expenses"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Reports;
