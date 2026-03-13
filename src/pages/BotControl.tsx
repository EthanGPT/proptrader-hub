import { useState, useEffect } from "react";
import {
  Settings2,
  RefreshCw,
  Power,
  PowerOff,
  Gauge,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const API_URL = "https://ml-api-phantom-production.up.railway.app";

interface Account {
  name: string;
  instruments: string[];
  max_contracts: Record<string, number>;
  webhook_configured: boolean;
  enabled?: boolean;
}

interface ApiStatus {
  status: string;
  date: string;
  trades_today: number;
  signals_received: number;
  signals_approved: number;
  signals_rejected: number;
  consecutive_losses: number;
  config: {
    threshold: number;
    max_trades_per_day: number;
    max_consecutive_losses: number;
    enabled_instruments: string[];
    enabled_sessions: string[];
    rsi_thresholds: string;
    position_sizing: {
      enabled: boolean;
      "2x_at": string;
      "3x_at": string;
    };
    accounts: Account[];
  };
  model_loaded: boolean;
  db_connected: boolean;
}

interface RecentSignal {
  id: number;
  ticker: string;
  action: string;
  level: string;
  approved: boolean;
  confidence: number;
  reason: string;
  created_at: string;
  outcome?: string;
}

const BotControl = () => {
  const [status, setStatus] = useState<ApiStatus | null>(null);
  const [recentSignals, setRecentSignals] = useState<RecentSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Editable config state
  const [threshold, setThreshold] = useState(0.5);
  const [confidence2x, setConfidence2x] = useState(0.65);
  const [confidence3x, setConfidence3x] = useState(0.70);
  const [positionSizingEnabled, setPositionSizingEnabled] = useState(true);
  const [disabledAccounts, setDisabledAccounts] = useState<Set<string>>(new Set());

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/status`);
      if (!response.ok) throw new Error("Failed to fetch status");
      const data = await response.json();
      setStatus(data);
      setThreshold(data.config.threshold);
      setPositionSizingEnabled(data.config.position_sizing.enabled);
      // Parse percentages like "65%" to 0.65
      const parse2x = data.config.position_sizing["2x_at"];
      const parse3x = data.config.position_sizing["3x_at"];
      if (parse2x) setConfidence2x(parseFloat(parse2x) / 100);
      if (parse3x) setConfidence3x(parseFloat(parse3x) / 100);
      setLastRefresh(new Date());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentSignals = async () => {
    try {
      const response = await fetch(`${API_URL}/learning-insights`);
      if (!response.ok) return;
      const data = await response.json();
      if (data.recent_signals) {
        setRecentSignals(data.recent_signals.slice(0, 10));
      }
    } catch (e) {
      console.error("Failed to fetch signals:", e);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchRecentSignals();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStatus();
      fetchRecentSignals();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const saveConfig = async () => {
    try {
      setSaving(true);
      const response = await fetch(`${API_URL}/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threshold,
          position_sizing_enabled: positionSizingEnabled,
          confidence_2x: confidence2x,
          confidence_3x: confidence3x,
        }),
      });
      if (!response.ok) throw new Error("Failed to save config");
      await fetchStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const toggleAccount = (accountName: string) => {
    setDisabledAccounts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(accountName)) {
        newSet.delete(accountName);
      } else {
        newSet.add(accountName);
      }
      return newSet;
    });
  };

  if (loading && !status) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Settings2 className="h-6 w-6" />
            ML Bot Control
          </h1>
          <p className="page-subtitle">
            Live controls for your ML trading bot
            {lastRefresh && (
              <span className="ml-2 text-xs opacity-60">
                Last refresh: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <Button
          onClick={() => { fetchStatus(); fetchRecentSignals(); }}
          variant="outline"
          disabled={loading}
        >
          <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-destructive">{error}</span>
          </div>
        </div>
      )}

      {/* Status Overview */}
      <div className="grid gap-4 sm:grid-cols-5">
        <div className="stat-card text-center">
          <div className={cn(
            "mx-auto mb-2 h-3 w-3 rounded-full",
            status?.model_loaded ? "bg-success" : "bg-destructive"
          )} />
          <p className="text-sm font-medium">Model</p>
          <p className="text-xs text-muted-foreground">
            {status?.model_loaded ? "Loaded" : "Error"}
          </p>
        </div>
        <div className="stat-card text-center">
          <p className="text-2xl font-bold">{status?.trades_today || 0}</p>
          <p className="text-xs text-muted-foreground">Trades Today</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-2xl font-bold text-success">{status?.signals_approved || 0}</p>
          <p className="text-xs text-muted-foreground">Approved</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-2xl font-bold text-destructive">{status?.signals_rejected || 0}</p>
          <p className="text-xs text-muted-foreground">Rejected</p>
        </div>
        <div className="stat-card text-center">
          <p className={cn(
            "text-2xl font-bold",
            (status?.consecutive_losses || 0) >= 2 ? "text-warning" : ""
          )}>
            {status?.consecutive_losses || 0}
          </p>
          <p className="text-xs text-muted-foreground">Loss Streak</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Accounts Panel */}
        <div className="stat-card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Power className="h-5 w-5" />
            Accounts
          </h2>
          <div className="space-y-3">
            {status?.config.accounts.map((account) => (
              <div
                key={account.name}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border transition-colors",
                  disabledAccounts.has(account.name)
                    ? "bg-destructive/5 border-destructive/20"
                    : "bg-success/5 border-success/20"
                )}
              >
                <div>
                  <p className="font-medium">{account.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {account.instruments.join(", ")} |
                    Max: {Object.entries(account.max_contracts).map(([k, v]) => `${k}:${v}`).join(", ")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {account.webhook_configured ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                  <Switch
                    checked={!disabledAccounts.has(account.name)}
                    onCheckedChange={() => toggleAccount(account.name)}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Note: Account toggling requires API restart to take effect. Use for planning only.
          </p>
        </div>

        {/* Position Sizing Config */}
        <div className="stat-card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Position Sizing
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Dynamic Sizing Enabled</Label>
              <Switch
                checked={positionSizingEnabled}
                onCheckedChange={setPositionSizingEnabled}
              />
            </div>

            <div className="space-y-2">
              <Label>ML Threshold ({(threshold * 100).toFixed(0)}%)</Label>
              <Input
                type="range"
                min="0.40"
                max="0.70"
                step="0.05"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Only take signals above this confidence
              </p>
            </div>

            <div className="space-y-2">
              <Label>2x Contracts at ({(confidence2x * 100).toFixed(0)}%)</Label>
              <Input
                type="range"
                min="0.55"
                max="0.80"
                step="0.05"
                value={confidence2x}
                onChange={(e) => setConfidence2x(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>3x Contracts at ({(confidence3x * 100).toFixed(0)}%)</Label>
              <Input
                type="range"
                min="0.60"
                max="0.85"
                step="0.05"
                value={confidence3x}
                onChange={(e) => setConfidence3x(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <Button
              onClick={saveConfig}
              disabled={saving}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Config
            </Button>
          </div>
        </div>
      </div>

      {/* Recent Signals */}
      <div className="stat-card">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Signals
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 font-medium">Time</th>
                <th className="pb-2 font-medium">Ticker</th>
                <th className="pb-2 font-medium">Action</th>
                <th className="pb-2 font-medium">Level</th>
                <th className="pb-2 font-medium">Confidence</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {recentSignals.length > 0 ? (
                recentSignals.map((signal) => (
                  <tr key={signal.id} className="border-b border-border/50">
                    <td className="py-2 text-muted-foreground">
                      {new Date(signal.created_at).toLocaleTimeString()}
                    </td>
                    <td className="py-2 font-medium">{signal.ticker}</td>
                    <td className={cn(
                      "py-2",
                      signal.action === "buy" ? "text-success" : "text-destructive"
                    )}>
                      {signal.action?.toUpperCase()}
                    </td>
                    <td className="py-2">{signal.level}</td>
                    <td className="py-2">
                      {signal.confidence ? `${(signal.confidence * 100).toFixed(1)}%` : "-"}
                    </td>
                    <td className="py-2">
                      {signal.approved ? (
                        <span className="inline-flex items-center gap-1 text-success">
                          <CheckCircle2 className="h-3 w-3" /> Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-destructive">
                          <XCircle className="h-3 w-3" /> Rejected
                        </span>
                      )}
                    </td>
                    <td className={cn(
                      "py-2 font-medium",
                      signal.outcome === "WIN" && "text-success",
                      signal.outcome === "LOSS" && "text-destructive",
                      signal.outcome === "BE" && "text-warning"
                    )}>
                      {signal.outcome || "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    No recent signals
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Info */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="stat-card">
          <h3 className="font-medium mb-2">Instruments</h3>
          <p className="text-muted-foreground text-sm">
            {status?.config.enabled_instruments.join(", ") || "-"}
          </p>
        </div>
        <div className="stat-card">
          <h3 className="font-medium mb-2">Sessions</h3>
          <p className="text-muted-foreground text-sm">
            {status?.config.enabled_sessions.join(", ") || "-"}
          </p>
        </div>
        <div className="stat-card">
          <h3 className="font-medium mb-2">RSI Thresholds</h3>
          <p className="text-muted-foreground text-sm">
            {status?.config.rsi_thresholds || "-"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BotControl;
