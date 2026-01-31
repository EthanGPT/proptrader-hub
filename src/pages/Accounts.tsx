import { useState } from "react";
import { format } from "date-fns";
import { Plus, Pencil, Trash2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { mockAccounts } from "@/data/mockData";
import { PROP_FIRMS, ACCOUNT_SIZES, Account } from "@/types";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const Accounts = () => {
  const [accounts, setAccounts] = useState<Account[]>(mockAccounts);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const passedAccounts = accounts.filter(a => a.status === 'passed');
  const failedAccounts = accounts.filter(a => a.status === 'failed');
  const activeAccounts = accounts.filter(a => a.status === 'in_progress');

  const successRate = passedAccounts.length + failedAccounts.length > 0
    ? Math.round((passedAccounts.length / (passedAccounts.length + failedAccounts.length)) * 100)
    : 0;

  const handleDelete = (id: string) => {
    setAccounts(accounts.filter(a => a.id !== id));
  };

  const statusConfig = {
    passed: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', label: 'Passed' },
    failed: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Failed' },
    in_progress: { icon: Clock, color: 'text-warning', bg: 'bg-warning/10', label: 'In Progress' },
  };

  const renderAccountCard = (account: Account) => {
    const config = statusConfig[account.status];
    const StatusIcon = config.icon;
    
    return (
      <div 
        key={account.id}
        className="stat-card group relative animate-scale-in"
      >
        {/* Actions */}
        <div className="absolute right-4 top-4 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => {
              setEditingAccount(account);
              setIsDialogOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => handleDelete(account.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>

        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold">{account.propFirm}</h3>
            <p className="text-sm text-muted-foreground">
              ${account.accountSize.toLocaleString()} account
            </p>
          </div>
          <div className={cn("flex items-center gap-1.5 rounded-full px-3 py-1", config.bg)}>
            <StatusIcon className={cn("h-4 w-4", config.color)} />
            <span className={cn("text-sm font-medium", config.color)}>{config.label}</span>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Start Date</span>
            <span className="font-medium">{format(new Date(account.startDate), 'MMM d, yyyy')}</span>
          </div>
          {account.endDate && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">End Date</span>
              <span className="font-medium">{format(new Date(account.endDate), 'MMM d, yyyy')}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Profit/Loss</span>
            <span className={cn(
              "font-bold",
              account.profitLoss >= 0 ? "text-success" : "text-destructive"
            )}>
              {account.profitLoss >= 0 ? '+' : ''}${account.profitLoss.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Notes */}
        {account.notes && (
          <div className="mt-4 border-t pt-4">
            <p className="text-sm text-muted-foreground">{account.notes}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold tracking-tight">Accounts</h1>
          <p className="text-muted-foreground">Manage your prop firm accounts</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="mr-2 h-4 w-4" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingAccount ? 'Edit Account' : 'Add New Account'}
              </DialogTitle>
            </DialogHeader>
            <AccountForm 
              onClose={() => {
                setIsDialogOpen(false);
                setEditingAccount(null);
              }}
              onSave={(account) => {
                if (editingAccount) {
                  setAccounts(accounts.map(a => a.id === account.id ? account : a));
                } else {
                  setAccounts([...accounts, { ...account, id: Date.now().toString() }]);
                }
                setIsDialogOpen(false);
                setEditingAccount(null);
              }}
              initialData={editingAccount}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="stat-card text-center">
          <p className="text-4xl font-bold text-success">{successRate}%</p>
          <p className="text-sm text-muted-foreground">Success Rate</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-4xl font-bold text-success">{passedAccounts.length}</p>
          <p className="text-sm text-muted-foreground">Passed</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-4xl font-bold text-destructive">{failedAccounts.length}</p>
          <p className="text-sm text-muted-foreground">Failed</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-4xl font-bold text-warning">{activeAccounts.length}</p>
          <p className="text-sm text-muted-foreground">Active</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="animate-slide-up">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All ({accounts.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({activeAccounts.length})</TabsTrigger>
          <TabsTrigger value="passed">Passed ({passedAccounts.length})</TabsTrigger>
          <TabsTrigger value="failed">Failed ({failedAccounts.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {accounts.map(renderAccountCard)}
          </div>
        </TabsContent>
        <TabsContent value="active">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {activeAccounts.map(renderAccountCard)}
          </div>
        </TabsContent>
        <TabsContent value="passed">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {passedAccounts.map(renderAccountCard)}
          </div>
        </TabsContent>
        <TabsContent value="failed">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {failedAccounts.map(renderAccountCard)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface AccountFormProps {
  onClose: () => void;
  onSave: (account: Account) => void;
  initialData?: Account | null;
}

function AccountForm({ onClose, onSave, initialData }: AccountFormProps) {
  const [formData, setFormData] = useState<Partial<Account>>(
    initialData || {
      propFirm: '',
      accountSize: 10000,
      startDate: new Date().toISOString().split('T')[0],
      status: 'in_progress',
      profitLoss: 0,
      notes: '',
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData as Account);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="propFirm">Prop Firm</Label>
          <Select
            value={formData.propFirm}
            onValueChange={(value) => setFormData({ ...formData, propFirm: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select firm" />
            </SelectTrigger>
            <SelectContent>
              {PROP_FIRMS.map((firm) => (
                <SelectItem key={firm} value={firm}>{firm}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="accountSize">Account Size</Label>
          <Select
            value={formData.accountSize?.toString()}
            onValueChange={(value) => setFormData({ ...formData, accountSize: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              {ACCOUNT_SIZES.map((size) => (
                <SelectItem key={size} value={size.toString()}>${size.toLocaleString()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value as Account['status'] })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="passed">Passed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date (optional)</Label>
          <Input
            id="endDate"
            type="date"
            value={formData.endDate || ''}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profitLoss">Profit/Loss ($)</Label>
          <Input
            id="profitLoss"
            type="number"
            step="0.01"
            value={formData.profitLoss}
            onChange={(e) => setFormData({ ...formData, profitLoss: parseFloat(e.target.value) })}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Optional notes..."
        />
      </div>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">
          {initialData ? 'Update' : 'Add'} Account
        </Button>
      </div>
    </form>
  );
}

export default Accounts;
