import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Settings2, Power, PowerOff, Save, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { MLAccount, MLConfig, InstrumentSizing } from "@/types/bots";
import { ML_INSTRUMENTS } from "@/types/bots";

// Use environment variable or fall back to production URL
const ML_API_URL = import.meta.env.VITE_ML_API_URL || "https://klbs-ml-api-production.up.railway.app";

// Default sizing for new instruments
const DEFAULT_SIZING: InstrumentSizing = { base: 1, conf_65: 2, conf_70: 3 };

// Inline editable number - looks like text until clicked
function InlineNumber({ value, onChange, min = 0, max = 20 }: {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  useEffect(() => {
    setTempValue(value.toString());
  }, [value]);

  const handleBlur = () => {
    setEditing(false);
    const num = parseInt(tempValue) || min;
    const clamped = Math.max(min, Math.min(max, num));
    onChange(clamped);
    setTempValue(clamped.toString());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur();
    } else if (e.key === "Escape") {
      setEditing(false);
      setTempValue(value.toString());
    }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        min={min}
        max={max}
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-12 h-8 text-center text-sm font-medium bg-background border border-accent rounded focus:outline-none focus:ring-2 focus:ring-accent"
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="w-12 h-8 text-center text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded transition-colors cursor-pointer"
    >
      {value}
    </button>
  );
}

interface AccountSizingManagerProps {
  className?: string;
}

export function AccountSizingManager({ className }: AccountSizingManagerProps) {
  const [config, setConfig] = useState<MLConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<MLAccount | null>(null);
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());

  // Fetch config from ML API
  const fetchConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${ML_API_URL}/status`);
      if (!res.ok) throw new Error("Failed to fetch config");
      const data = (await res.json()).config;  // Config is nested under .config

      // Transform API response to our MLConfig format
      const mlConfig: MLConfig = {
        threshold: data.threshold || 0.5,
        max_trades_per_day: data.max_trades_per_day || 3,
        max_consecutive_losses: data.max_consecutive_losses || 2,
        enabled_instruments: data.enabled_instruments || ["MES", "MNQ", "MGC"],
        enabled_sessions: data.enabled_sessions || ["London", "NY"],
        position_sizing_enabled: data.position_sizing?.enabled ?? true,
        confidence_2x: parseFloat(data.position_sizing?.conf_65_threshold?.replace('%', '') || "65") / 100,
        confidence_3x: parseFloat(data.position_sizing?.conf_70_threshold?.replace('%', '') || "70") / 100,
        accounts: (data.accounts || []).map((a: any, idx: number) => ({
          id: `account-${idx}`,
          name: a.name,
          webhook_env_key: `TRADERSPOST_WEBHOOK_${idx + 1}`,
          instruments: a.instruments || [],
          sizing: a.sizing || {},
          funded: a.funded ?? false,
          enabled: a.enabled ?? true,
        })),
      };
      setConfig(mlConfig);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load config");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // Toggle account enabled/disabled
  const toggleAccount = async (accountName: string, currentEnabled: boolean) => {
    if (!config) return;
    try {
      const res = await fetch(`${ML_API_URL}/toggle-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account: accountName, enabled: !currentEnabled }),
      });
      if (!res.ok) throw new Error("Failed to toggle account");

      // Update local state
      setConfig({
        ...config,
        accounts: config.accounts.map(a =>
          a.name === accountName ? { ...a, enabled: !a.enabled } : a
        ),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle account");
    }
  };

  // Update account sizing
  const updateAccountSizing = async (account: MLAccount, instrument: string, tier: keyof InstrumentSizing, value: number) => {
    if (!config) return;

    const updatedSizing = {
      ...account.sizing,
      [instrument]: {
        ...(account.sizing[instrument] || DEFAULT_SIZING),
        [tier]: value,
      },
    };

    // Update local state immediately for responsive UI
    setConfig({
      ...config,
      accounts: config.accounts.map(a =>
        a.id === account.id ? { ...a, sizing: updatedSizing } : a
      ),
    });
  };

  // Save all config changes
  const saveConfig = async () => {
    if (!config) return;
    setSaving(true);
    setError(null);

    try {
      // Update accounts config on the backend
      const res = await fetch(`${ML_API_URL}/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accounts: config.accounts.map(a => ({
            name: a.name,
            instruments: a.instruments,
            sizing: a.sizing,
            funded: a.funded,
          })),
          position_sizing_enabled: config.position_sizing_enabled,
          confidence_2x: config.confidence_2x,
          confidence_3x: config.confidence_3x,
        }),
      });

      if (!res.ok) throw new Error("Failed to save config");

      // Refresh to get the latest state
      await fetchConfig();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save config");
    } finally {
      setSaving(false);
    }
  };

  // Toggle instrument for an account
  const toggleInstrument = (account: MLAccount, instrument: string) => {
    if (!config) return;

    const hasInstrument = account.instruments.includes(instrument);
    const updatedInstruments = hasInstrument
      ? account.instruments.filter(i => i !== instrument)
      : [...account.instruments, instrument];

    // If adding, ensure sizing exists
    const updatedSizing = { ...account.sizing };
    if (!hasInstrument && !updatedSizing[instrument]) {
      updatedSizing[instrument] = { ...DEFAULT_SIZING };
    }

    setConfig({
      ...config,
      accounts: config.accounts.map(a =>
        a.id === account.id
          ? { ...a, instruments: updatedInstruments, sizing: updatedSizing }
          : a
      ),
    });
  };

  // Toggle expand/collapse for account
  const toggleExpand = (accountId: string) => {
    const newExpanded = new Set(expandedAccounts);
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId);
    } else {
      newExpanded.add(accountId);
    }
    setExpandedAccounts(newExpanded);
  };

  // Add new account
  const addAccount = () => {
    if (!config) return;
    const newId = `account-${Date.now()}`;
    const newAccount: MLAccount = {
      id: newId,
      name: `New Account ${config.accounts.length + 1}`,
      webhook_env_key: `TRADERSPOST_WEBHOOK_${config.accounts.length + 1}`,
      instruments: ["MES", "MNQ"],
      sizing: {
        MES: { ...DEFAULT_SIZING },
        MNQ: { ...DEFAULT_SIZING },
      },
      funded: false,
      enabled: true,
    };
    setConfig({
      ...config,
      accounts: [...config.accounts, newAccount],
    });
    setExpandedAccounts(new Set([...expandedAccounts, newId]));
  };

  // Delete account
  const deleteAccount = (accountId: string) => {
    if (!config) return;
    setConfig({
      ...config,
      accounts: config.accounts.filter(a => a.id !== accountId),
    });
  };

  // Update account name/funded status
  const updateAccountField = (accountId: string, field: keyof MLAccount, value: any) => {
    if (!config) return;
    setConfig({
      ...config,
      accounts: config.accounts.map(a =>
        a.id === accountId ? { ...a, [field]: value } : a
      ),
    });
  };

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    );
  }

  if (error && !config) {
    return (
      <div className={cn("text-center py-12", className)}>
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={fetchConfig} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (!config) return null;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            ML Account Sizing
          </h2>
          <p className="text-sm text-muted-foreground">
            Configure position sizes per account and instrument at each confidence tier
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchConfig} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={addAccount} variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Button>
          <Button onClick={saveConfig} disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Confidence Thresholds */}
      <div className="stat-card">
        <h3 className="font-medium mb-4">Confidence Tier Thresholds</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Base Tier (minimum)</Label>
            <div className="flex items-center gap-1">
              <InlineNumber
                value={Math.round(config.threshold * 100)}
                onChange={(val) => setConfig({ ...config, threshold: val / 100 })}
                min={40}
                max={70}
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">2x Tier Threshold</Label>
            <div className="flex items-center gap-1">
              <InlineNumber
                value={Math.round(config.confidence_2x * 100)}
                onChange={(val) => setConfig({ ...config, confidence_2x: val / 100 })}
                min={50}
                max={80}
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">3x Tier Threshold</Label>
            <div className="flex items-center gap-1">
              <InlineNumber
                value={Math.round(config.confidence_3x * 100)}
                onChange={(val) => setConfig({ ...config, confidence_3x: val / 100 })}
                min={60}
                max={90}
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Accounts List */}
      <div className="space-y-4">
        {config.accounts.map((account) => (
          <Collapsible
            key={account.id}
            open={expandedAccounts.has(account.id)}
            onOpenChange={() => toggleExpand(account.id)}
          >
            <div className="stat-card">
              {/* Account Header */}
              <div className="flex items-center justify-between">
                <CollapsibleTrigger asChild>
                  <button className="flex items-center gap-3 text-left flex-1">
                    {expandedAccounts.has(account.id) ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{account.name}</span>
                        {!account.enabled && (
                          <Badge variant="secondary" className="bg-destructive/10 text-destructive text-xs">
                            Disabled
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {account.instruments.join(", ")} • {Object.keys(account.sizing).length} instruments configured
                      </div>
                    </div>
                  </button>
                </CollapsibleTrigger>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleAccount(account.name, account.enabled)}
                    title={account.enabled ? "Disable account" : "Enable account"}
                  >
                    {account.enabled ? (
                      <Power className="h-4 w-4 text-success" />
                    ) : (
                      <PowerOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteAccount(account.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              {/* Expanded Content */}
              <CollapsibleContent className="mt-4 space-y-4">
                {/* Account Settings */}
                <div className="pb-4 border-b border-border">
                  <div className="space-y-2 max-w-xs">
                    <Label className="text-xs">Account Name</Label>
                    <Input
                      value={account.name}
                      onChange={(e) => updateAccountField(account.id, "name", e.target.value)}
                    />
                  </div>
                </div>

                {/* Instruments Selection */}
                <div className="space-y-2">
                  <Label className="text-xs">Instruments</Label>
                  <div className="flex flex-wrap gap-2">
                    {ML_INSTRUMENTS.map((instrument) => (
                      <Button
                        key={instrument}
                        variant={account.instruments.includes(instrument) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleInstrument(account, instrument)}
                        className={cn(
                          account.instruments.includes(instrument) && "bg-accent text-accent-foreground"
                        )}
                      >
                        {instrument}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Sizing Table */}
                <div className="space-y-2">
                  <Label className="text-xs">Position Sizing (Contracts)</Label>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-2 font-medium">Instrument</th>
                          <th className="text-center py-2 px-2 font-medium">
                            Base
                            <span className="block text-xs text-muted-foreground font-normal">
                              {Math.round(config.threshold * 100)}-{Math.round(config.confidence_2x * 100)}%
                            </span>
                          </th>
                          <th className="text-center py-2 px-2 font-medium">
                            Tier 2
                            <span className="block text-xs text-muted-foreground font-normal">
                              {Math.round(config.confidence_2x * 100)}-{Math.round(config.confidence_3x * 100)}%
                            </span>
                          </th>
                          <th className="text-center py-2 px-2 font-medium">
                            Tier 3
                            <span className="block text-xs text-muted-foreground font-normal">
                              {Math.round(config.confidence_3x * 100)}%+
                            </span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {account.instruments.map((instrument) => (
                          <tr key={instrument} className="border-b border-border/50">
                            <td className="py-2 px-2 font-medium">{instrument}</td>
                            <td className="py-2 px-2 text-center">
                              <InlineNumber
                                value={account.sizing[instrument]?.base ?? 1}
                                onChange={(val) => updateAccountSizing(account, instrument, "base", val)}
                              />
                            </td>
                            <td className="py-2 px-2 text-center">
                              <InlineNumber
                                value={account.sizing[instrument]?.conf_65 ?? 2}
                                onChange={(val) => updateAccountSizing(account, instrument, "conf_65", val)}
                              />
                            </td>
                            <td className="py-2 px-2 text-center">
                              <InlineNumber
                                value={account.sizing[instrument]?.conf_70 ?? 3}
                                onChange={(val) => updateAccountSizing(account, instrument, "conf_70", val)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Risk Preview */}
                <div className="bg-secondary/30 rounded-lg p-3">
                  <Label className="text-xs text-muted-foreground">Max Risk Per Trade (at 70%+ confidence)</Label>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm">
                    {account.instruments.map((instrument) => {
                      const contracts = account.sizing[instrument]?.conf_70 ?? 3;
                      // Fixed SL risk per contract
                      const riskPerContract = instrument === "MNQ" ? 100 : instrument === "MES" ? 125 : instrument === "MGC" ? 250 : 100;
                      const risk = contracts * riskPerContract;
                      return (
                        <div key={instrument} className="flex items-center gap-2">
                          <span className="font-medium">{instrument}:</span>
                          <span className="text-muted-foreground">{contracts}x = ${risk}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        ))}
      </div>

      {/* Empty State */}
      {config.accounts.length === 0 && (
        <div className="text-center py-12">
          <Settings2 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="font-medium mb-2">No accounts configured</h3>
          <p className="text-muted-foreground mb-4">Add an account to configure position sizing</p>
          <Button onClick={addAccount}>
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Button>
        </div>
      )}
    </div>
  );
}

export default AccountSizingManager;
