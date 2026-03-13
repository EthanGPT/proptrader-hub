import { useState, useEffect } from "react";
import {
  Settings2,
  RefreshCw,
  Power,
  Gauge,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Save,
  ChevronDown,
  ChevronUp,
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
}

interface ApiStatus {
  status: string;
  trades_today: number;
  signals_approved: number;
  signals_rejected: number;
  consecutive_losses: number;
  config: {
    threshold: number;
    position_sizing: {
      enabled: boolean;
      "2x_at": string;
      "3x_at": string;
    };
    accounts: Account[];
  };
  model_loaded: boolean;
}

const BotControl = () => {
  const [status, setStatus] = useState<ApiStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Editable config
  const [threshold, setThreshold] = useState(0.5);
  const [confidence2x, setConfidence2x] = useState(0.65);
  const [confidence3x, setConfidence3x] = useState(0.70);
  const [positionSizingEnabled, setPositionSizingEnabled] = useState(true);
  const [disabledAccounts, setDisabledAccounts] = useState<Set<string>>(new Set());

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/status`);
      if (!response.ok) throw new Error("API offline");
      const data = await response.json();
      setStatus(data);
      setThreshold(data.config.threshold);
      setPositionSizingEnabled(data.config.position_sizing.enabled);
      const parse2x = data.config.position_sizing["2x_at"];
      const parse3x = data.config.position_sizing["3x_at"];
      if (parse2x) setConfidence2x(parseFloat(parse2x) / 100);
      if (parse3x) setConfidence3x(parseFloat(parse3x) / 100);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const saveConfig = async () => {
    try {
      setSaving(true);
      await fetch(`${API_URL}/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threshold,
          position_sizing_enabled: positionSizingEnabled,
          confidence_2x: confidence2x,
          confidence_3x: confidence3x,
        }),
      });
      await fetchStatus();
    } catch (e) {
      setError("Failed to save");
    } finally {
      setSaving(false);
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Settings2 className="h-6 w-6" />
            ML Bot Control
          </h1>
          <p className="page-subtitle">Quick controls for your trading bot</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn(
            "h-3 w-3 rounded-full",
            status?.model_loaded ? "bg-success" : "bg-destructive"
          )} />
          <span className="text-sm text-muted-foreground">
            {status?.model_loaded ? "Online" : "Offline"}
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <span className="text-sm text-destructive">{error}</span>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-4">
        <div className="stat-card text-center py-4">
          <p className="text-3xl font-bold">{status?.trades_today || 0}</p>
          <p className="text-xs text-muted-foreground">Today</p>
        </div>
        <div className="stat-card text-center py-4">
          <p className="text-3xl font-bold text-success">{status?.signals_approved || 0}</p>
          <p className="text-xs text-muted-foreground">Approved</p>
        </div>
        <div className="stat-card text-center py-4">
          <p className="text-3xl font-bold text-muted-foreground">{status?.signals_rejected || 0}</p>
          <p className="text-xs text-muted-foreground">Rejected</p>
        </div>
        <div className="stat-card text-center py-4">
          <p className={cn(
            "text-3xl font-bold",
            (status?.consecutive_losses || 0) >= 2 ? "text-warning" : ""
          )}>
            {status?.consecutive_losses || 0}
          </p>
          <p className="text-xs text-muted-foreground">Loss Streak</p>
        </div>
      </div>

      {/* Settings Toggle */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="w-full stat-card flex items-center justify-between p-4 hover:border-accent/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Settings2 className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">Settings</span>
        </div>
        {showSettings ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {/* Collapsible Settings */}
      {showSettings && (
        <div className="space-y-4 animate-in slide-in-from-top-2">
          {/* Accounts */}
          <div className="stat-card">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Power className="h-4 w-4" />
              Accounts
            </h3>
            <div className="space-y-2">
              {status?.config.accounts.map((account) => (
                <div
                  key={account.name}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border",
                    disabledAccounts.has(account.name)
                      ? "bg-destructive/5 border-destructive/20 opacity-50"
                      : "bg-card"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {account.webhook_configured ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                    <span className="text-sm font-medium">{account.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({account.instruments.join(", ")})
                    </span>
                  </div>
                  <Switch
                    checked={!disabledAccounts.has(account.name)}
                    onCheckedChange={() => {
                      setDisabledAccounts(prev => {
                        const newSet = new Set(prev);
                        if (newSet.has(account.name)) newSet.delete(account.name);
                        else newSet.add(account.name);
                        return newSet;
                      });
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Position Sizing */}
          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium flex items-center gap-2">
                <Gauge className="h-4 w-4" />
                Dynamic Sizing
              </h3>
              <Switch
                checked={positionSizingEnabled}
                onCheckedChange={setPositionSizingEnabled}
              />
            </div>

            {positionSizingEnabled && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <Label>ML Threshold</Label>
                    <span className="text-muted-foreground">{(threshold * 100).toFixed(0)}%</span>
                  </div>
                  <Input
                    type="range"
                    min="0.40"
                    max="0.70"
                    step="0.05"
                    value={threshold}
                    onChange={(e) => setThreshold(parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <Label>2x Contracts</Label>
                    <span className="text-muted-foreground">{(confidence2x * 100).toFixed(0)}%+</span>
                  </div>
                  <Input
                    type="range"
                    min="0.55"
                    max="0.80"
                    step="0.05"
                    value={confidence2x}
                    onChange={(e) => setConfidence2x(parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <Label>3x Contracts</Label>
                    <span className="text-muted-foreground">{(confidence3x * 100).toFixed(0)}%+</span>
                  </div>
                  <Input
                    type="range"
                    min="0.60"
                    max="0.85"
                    step="0.05"
                    value={confidence3x}
                    onChange={(e) => setConfidence3x(parseFloat(e.target.value))}
                  />
                </div>
              </div>
            )}

            <Button
              onClick={saveConfig}
              disabled={saving}
              className="w-full mt-4 bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BotControl;
