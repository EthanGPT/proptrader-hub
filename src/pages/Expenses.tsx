import { useState } from "react";
import { format } from "date-fns";
import { Plus, Download, Pencil, Trash2 } from "lucide-react";
import { useData } from "@/context/DataContext";
import { EXPENSE_CATEGORIES, Expense } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const Expenses = () => {
  const { expenses, addExpense, updateExpense, deleteExpense } = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const filteredExpenses = filterCategory === "all"
    ? expenses
    : expenses.filter(e => e.category === filterCategory);

  const sortedExpenses = [...filteredExpenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const categoryTotals = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(categoryTotals).map(([category, amount]) => ({
    name: EXPENSE_CATEGORIES.find(c => c.value === category)?.label || category,
    value: amount,
  }));

  const COLORS = [
    'hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))',
    'hsl(var(--chart-4))', 'hsl(var(--chart-5))',
  ];

  const handleExportCSV = () => {
    const headers = ['Date', 'Amount', 'Category', 'Prop Firm', 'Notes'];
    const rows = sortedExpenses.map(e => [
      e.date, e.amount.toString(), e.category, e.propFirm || '', e.notes || ''
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expenses.csv';
    a.click();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">Track your trading expenses</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingExpense ? 'Edit Expense' : 'Add New Expense'}
                </DialogTitle>
              </DialogHeader>
              <ExpenseForm
                onClose={() => { setIsDialogOpen(false); setEditingExpense(null); }}
                onSave={(expense) => {
                  if (editingExpense) {
                    updateExpense(expense);
                  } else {
                    addExpense(expense);
                  }
                  setIsDialogOpen(false);
                  setEditingExpense(null);
                }}
                initialData={editingExpense}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Category Breakdown Chart */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="stat-card animate-slide-up lg:col-span-1">
          <h3 className="mb-4 text-lg font-semibold">Category Breakdown</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="glass-card rounded-lg p-3">
                          <p className="text-sm font-medium">{payload[0].name}</p>
                          <p className="text-lg font-bold">${payload[0].value?.toLocaleString()}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {pieData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-medium">${item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="stat-card animate-slide-up overflow-hidden p-0 lg:col-span-2">
          <div className="flex items-center justify-between border-b p-4">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Prop Firm</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedExpenses.map((expense) => (
                <TableRow key={expense.id} className="group">
                  <TableCell>{format(new Date(expense.date), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-secondary px-2 py-1 text-xs font-medium">
                      {EXPENSE_CATEGORIES.find(c => c.value === expense.category)?.label}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{expense.propFirm || '-'}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">{expense.notes || '-'}</TableCell>
                  <TableCell className="text-right font-bold text-destructive">-${expense.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingExpense(expense); setIsDialogOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteExpense(expense.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-secondary/50 font-semibold hover:bg-secondary/50">
                <TableCell colSpan={4}>Total</TableCell>
                <TableCell className="text-right text-lg text-destructive">${totalExpenses.toLocaleString()}</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

interface ExpenseFormProps {
  onClose: () => void;
  onSave: (expense: Expense) => void;
  initialData?: Expense | null;
}

function ExpenseForm({ onClose, onSave, initialData }: ExpenseFormProps) {
  const { propFirms } = useData();
  const [formData, setFormData] = useState<Partial<Expense>>(
    initialData || {
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      category: 'challenge_fee',
      propFirm: '',
      notes: '',
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData as Expense);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Amount ($)</Label>
          <Input id="amount" type="number" min="0" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })} required />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value as Expense['category'] })}>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {EXPENSE_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="propFirm">Prop Firm (optional)</Label>
          <Select value={formData.propFirm || "none"} onValueChange={(value) => setFormData({ ...formData, propFirm: value === "none" ? undefined : value })}>
            <SelectTrigger><SelectValue placeholder="Select firm" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {propFirms.map((firm) => (
                <SelectItem key={firm.id} value={firm.name}>{firm.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Optional notes..." />
      </div>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">
          {initialData ? 'Update' : 'Add'} Expense
        </Button>
      </div>
    </form>
  );
}

export default Expenses;
