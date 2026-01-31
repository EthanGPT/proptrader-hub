import { useData } from "@/context/DataContext";
import { CheckCircle2, XCircle, Clock, Wallet, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export function AccountsOverview() {
  const { accounts } = useData();

  const evaluations = accounts.filter(a => a.type === 'evaluation');
  const funded = accounts.filter(a => a.type === 'funded');

  const evalPassed = evaluations.filter(a => a.status === 'passed').length;
  const evalFailed = evaluations.filter(a => a.status === 'failed').length;
  const evalInProgress = evaluations.filter(a => a.status === 'in_progress').length;
  const evalSuccessRate = evalPassed + evalFailed > 0
    ? Math.round((evalPassed / (evalPassed + evalFailed)) * 100) : 0;

  const fundedActive = funded.filter(a => a.status === 'active').length;
  const fundedBreached = funded.filter(a => a.status === 'breached').length;
  const fundedTotalPL = funded.reduce((sum, a) => sum + a.profitLoss, 0);

  return (
    <div className="stat-card animate-slide-up">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Accounts Overview</h3>
        <p className="text-sm text-muted-foreground">
          {evaluations.length} evaluations &middot; {funded.length} funded
        </p>
      </div>

      {/* Evaluation stats */}
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium">Evaluations</span>
          <span className="text-lg font-bold text-success">{evalSuccessRate}% pass rate</span>
        </div>
        <div className="mb-3 h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-success transition-all duration-500"
            style={{ width: `${evalSuccessRate}%` }}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-success/10 p-3 text-center">
            <CheckCircle2 className="mx-auto mb-1 h-5 w-5 text-success" />
            <p className="text-xl font-bold text-success">{evalPassed}</p>
            <p className="text-xs text-muted-foreground">Passed</p>
          </div>
          <div className="rounded-lg bg-destructive/10 p-3 text-center">
            <XCircle className="mx-auto mb-1 h-5 w-5 text-destructive" />
            <p className="text-xl font-bold text-destructive">{evalFailed}</p>
            <p className="text-xs text-muted-foreground">Failed</p>
          </div>
          <div className="rounded-lg bg-warning/10 p-3 text-center">
            <Clock className="mx-auto mb-1 h-5 w-5 text-warning" />
            <p className="text-xl font-bold text-warning">{evalInProgress}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
        </div>
      </div>

      {/* Funded stats */}
      <div className="border-t pt-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium">Funded Accounts</span>
          <span className={cn("text-lg font-bold", fundedTotalPL >= 0 ? "text-success" : "text-destructive")}>
            ${fundedTotalPL.toLocaleString()} P/L
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-success/10 p-3 text-center">
            <Wallet className="mx-auto mb-1 h-5 w-5 text-success" />
            <p className="text-xl font-bold text-success">{fundedActive}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
          <div className="rounded-lg bg-destructive/10 p-3 text-center">
            <AlertTriangle className="mx-auto mb-1 h-5 w-5 text-destructive" />
            <p className="text-xl font-bold text-destructive">{fundedBreached}</p>
            <p className="text-xs text-muted-foreground">Breached</p>
          </div>
        </div>
      </div>
    </div>
  );
}
