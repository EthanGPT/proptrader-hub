import { mockAccounts } from "@/data/mockData";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

export function AccountsOverview() {
  const passed = mockAccounts.filter(a => a.status === 'passed').length;
  const failed = mockAccounts.filter(a => a.status === 'failed').length;
  const inProgress = mockAccounts.filter(a => a.status === 'in_progress').length;
  const total = mockAccounts.length;
  const successRate = total > 0 ? Math.round((passed / (passed + failed)) * 100) : 0;

  return (
    <div className="stat-card animate-slide-up">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Accounts Overview</h3>
        <p className="text-sm text-muted-foreground">{total} total accounts</p>
      </div>
      
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Success Rate</span>
          <span className="text-2xl font-bold text-success">{successRate}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-secondary">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-accent to-success transition-all duration-500"
            style={{ width: `${successRate}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-success/10 p-4 text-center">
          <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-success" />
          <p className="text-2xl font-bold text-success">{passed}</p>
          <p className="text-xs text-muted-foreground">Passed</p>
        </div>
        <div className="rounded-lg bg-destructive/10 p-4 text-center">
          <XCircle className="mx-auto mb-2 h-6 w-6 text-destructive" />
          <p className="text-2xl font-bold text-destructive">{failed}</p>
          <p className="text-xs text-muted-foreground">Failed</p>
        </div>
        <div className="rounded-lg bg-warning/10 p-4 text-center">
          <Clock className="mx-auto mb-2 h-6 w-6 text-warning" />
          <p className="text-2xl font-bold text-warning">{inProgress}</p>
          <p className="text-xs text-muted-foreground">Active</p>
        </div>
      </div>
    </div>
  );
}
