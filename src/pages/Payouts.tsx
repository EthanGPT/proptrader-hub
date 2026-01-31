import { useState } from "react";
import { format } from "date-fns";
import { Plus, Download, Pencil, Trash2 } from "lucide-react";
import { useData } from "@/context/DataContext";
import { PAYOUT_METHODS, Payout } from "@/types";
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

const Payouts = () => {
  const { payouts, propFirms, addPayout, updatePayout, deletePayout } = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPayout, setEditingPayout] = useState<Payout | null>(null);
  const [filterFirm, setFilterFirm] = useState<string>("all");

  const totalPayouts = payouts.reduce((sum, p) => sum + p.amount, 0);

  const filteredPayouts = filterFirm === "all"
    ? payouts
    : payouts.filter(p => p.propFirm === filterFirm);

  const sortedPayouts = [...filteredPayouts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleExportCSV = () => {
    const headers = ['Date', 'Amount', 'Prop Firm', 'Method', 'Notes'];
    const rows = sortedPayouts.map(p => [
      p.date, p.amount.toString(), p.propFirm, p.method, p.notes || ''
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payouts.csv';
    a.click();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold tracking-tight">Payouts</h1>
          <p className="text-muted-foreground">Track your trading payouts</p>
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
                Add Payout
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingPayout ? 'Edit Payout' : 'Add New Payout'}
                </DialogTitle>
              </DialogHeader>
              <PayoutForm
                onClose={() => { setIsDialogOpen(false); setEditingPayout(null); }}
                onSave={(payout) => {
                  if (editingPayout) {
                    updatePayout(payout);
                  } else {
                    addPayout(payout);
                  }
                  setIsDialogOpen(false);
                  setEditingPayout(null);
                }}
                initialData={editingPayout}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="w-48">
          <Select value={filterFirm} onValueChange={setFilterFirm}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by firm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Firms</SelectItem>
              {propFirms.map((firm) => (
                <SelectItem key={firm.id} value={firm.name}>{firm.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="stat-card animate-slide-up overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Date</TableHead>
              <TableHead>Prop Firm</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPayouts.map((payout) => (
              <TableRow key={payout.id} className="group">
                <TableCell>{format(new Date(payout.date), 'MMM d, yyyy')}</TableCell>
                <TableCell className="font-medium">{payout.propFirm}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-full bg-secondary px-2 py-1 text-xs">
                    {PAYOUT_METHODS.find(m => m.value === payout.method)?.label}
                  </span>
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-muted-foreground">
                  {payout.notes || '-'}
                </TableCell>
                <TableCell className="text-right font-bold text-success">
                  +${payout.amount.toLocaleString()}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingPayout(payout); setIsDialogOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deletePayout(payout.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-secondary/50 font-semibold hover:bg-secondary/50">
              <TableCell colSpan={4}>Total</TableCell>
              <TableCell className="text-right text-lg text-success">
                ${totalPayouts.toLocaleString()}
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

interface PayoutFormProps {
  onClose: () => void;
  onSave: (payout: Payout) => void;
  initialData?: Payout | null;
}

function PayoutForm({ onClose, onSave, initialData }: PayoutFormProps) {
  const { propFirms } = useData();
  const [formData, setFormData] = useState<Partial<Payout>>(
    initialData || {
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      propFirm: '',
      method: 'bank_transfer',
      notes: '',
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData as Payout);
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
          <Label htmlFor="propFirm">Prop Firm</Label>
          <Select value={formData.propFirm} onValueChange={(value) => setFormData({ ...formData, propFirm: value })}>
            <SelectTrigger><SelectValue placeholder="Select firm" /></SelectTrigger>
            <SelectContent>
              {propFirms.map((firm) => (
                <SelectItem key={firm.id} value={firm.name}>{firm.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="method">Payout Method</Label>
          <Select value={formData.method} onValueChange={(value) => setFormData({ ...formData, method: value as Payout['method'] })}>
            <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
            <SelectContent>
              {PAYOUT_METHODS.map((method) => (
                <SelectItem key={method.value} value={method.value}>{method.label}</SelectItem>
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
          {initialData ? 'Update' : 'Add'} Payout
        </Button>
      </div>
    </form>
  );
}

export default Payouts;
