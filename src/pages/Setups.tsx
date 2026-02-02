import { useState } from "react";
import { Plus, Pencil, Trash2, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { useData } from "@/context/DataContext";
import { TradingSetup } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const Setups = () => {
  const { tradingSetups, trades, addTradingSetup, updateTradingSetup, deleteTradingSetup } = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSetup, setEditingSetup] = useState<TradingSetup | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getSetupStats = (setupId: string) => {
    const setupTrades = trades.filter((t) => t.setupId === setupId);
    const wins = setupTrades.filter((t) => t.result === "win").length;
    const losses = setupTrades.filter((t) => t.result === "loss").length;
    const totalPnl = setupTrades.reduce((sum, t) => sum + t.pnl, 0);
    const avgRR =
      setupTrades.filter((t) => t.riskReward && t.riskReward > 0).length > 0
        ? setupTrades
            .filter((t) => t.riskReward && t.riskReward > 0)
            .reduce((sum, t) => sum + (t.riskReward ?? 0), 0) /
          setupTrades.filter((t) => t.riskReward && t.riskReward > 0).length
        : 0;
    return { total: setupTrades.length, wins, losses, totalPnl, avgRR };
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Setups</h1>
          <p className="page-subtitle">
            Define your setups and track which ones make you money
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingSetup(null); }}>
          <DialogTrigger asChild>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="mr-2 h-4 w-4" />
              Add Setup
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSetup ? "Edit Setup" : "New Trading Setup"}
              </DialogTitle>
            </DialogHeader>
            <SetupForm
              initialData={editingSetup}
              onSave={(setup) => {
                if (editingSetup) {
                  updateTradingSetup(setup as TradingSetup);
                } else {
                  addTradingSetup(setup);
                }
                setIsDialogOpen(false);
                setEditingSetup(null);
              }}
              onClose={() => {
                setIsDialogOpen(false);
                setEditingSetup(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Setups List */}
      <div className="space-y-4">
        {tradingSetups.length === 0 ? (
          <div className="stat-card flex flex-col items-center justify-center p-12 text-center">
            <BookOpen className="mb-4 h-12 w-12 text-muted-foreground/30" />
            <h3 className="text-lg font-semibold">No setups yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Define your trading setups to start tracking which ones perform best.
            </p>
          </div>
        ) : (
          tradingSetups.map((setup) => {
            const stats = getSetupStats(setup.id);
            const isExpanded = expandedId === setup.id;
            const winRate =
              stats.total > 0
                ? Math.round((stats.wins / (stats.wins + stats.losses || 1)) * 100)
                : 0;

            return (
              <div key={setup.id} className="stat-card overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : setup.id)}
                  className="flex w-full items-center justify-between p-5 text-left"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{setup.name}</h3>
                      {stats.total > 0 && (
                        <span
                          className={cn(
                            "text-xs font-medium",
                            winRate >= 60
                              ? "text-success"
                              : winRate >= 40
                              ? "text-warning"
                              : "text-destructive"
                          )}
                        >
                          {winRate}% win rate
                        </span>
                      )}
                    </div>
                    {setup.description && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {setup.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-6">
                    {stats.total > 0 && (
                      <div className="hidden gap-6 sm:flex">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Trades</p>
                          <p className="font-semibold">{stats.total}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">P&L</p>
                          <p
                            className={cn(
                              "font-semibold",
                              stats.totalPnl >= 0
                                ? "text-success"
                                : "text-destructive"
                            )}
                          >
                            {stats.totalPnl >= 0 ? "+" : ""}$
                            {Math.abs(stats.totalPnl).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Avg R:R</p>
                          <p className="font-semibold">
                            {stats.avgRR > 0 ? stats.avgRR.toFixed(1) : "-"}
                          </p>
                        </div>
                      </div>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t px-5 pb-5 pt-4">
                    {setup.rules && (
                      <div className="mb-4">
                        <p className="mb-1 section-label">
                          Rules
                        </p>
                        <div className="rounded-lg bg-secondary/50 p-3 text-sm leading-relaxed whitespace-pre-wrap">
                          {setup.rules}
                        </div>
                      </div>
                    )}

                    {stats.total > 0 && (
                      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                        <div className="rounded-lg bg-secondary/50 p-3">
                          <p className="text-xs text-muted-foreground">Total Trades</p>
                          <p className="text-lg font-bold">{stats.total}</p>
                        </div>
                        <div className="rounded-lg bg-secondary/50 p-3">
                          <p className="text-xs text-muted-foreground">Wins</p>
                          <p className="text-lg font-bold text-success">{stats.wins}</p>
                        </div>
                        <div className="rounded-lg bg-secondary/50 p-3">
                          <p className="text-xs text-muted-foreground">Losses</p>
                          <p className="text-lg font-bold text-destructive">{stats.losses}</p>
                        </div>
                        <div className="rounded-lg bg-secondary/50 p-3">
                          <p className="text-xs text-muted-foreground">Net P&L</p>
                          <p className={cn("text-lg font-bold", stats.totalPnl >= 0 ? "text-success" : "text-destructive")}>
                            {stats.totalPnl >= 0 ? "+" : ""}${Math.abs(stats.totalPnl).toLocaleString()}
                          </p>
                        </div>
                        <div className="rounded-lg bg-secondary/50 p-3">
                          <p className="text-xs text-muted-foreground">Avg R:R</p>
                          <p className="text-lg font-bold">
                            {stats.avgRR > 0 ? stats.avgRR.toFixed(2) : "-"}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingSetup(setup);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Pencil className="mr-1 h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteTradingSetup(setup.id)}
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

interface SetupFormProps {
  initialData?: TradingSetup | null;
  onSave: (setup: Omit<TradingSetup, "id"> | TradingSetup) => void;
  onClose: () => void;
}

function SetupForm({ initialData, onSave, onClose }: SetupFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [rules, setRules] = useState(initialData?.rules ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (initialData) {
      onSave({ ...initialData, name, description: description || undefined, rules: rules || undefined });
    } else {
      onSave({ name, description: description || undefined, rules: rules || undefined });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Setup Name</Label>
        <Input
          id="name"
          placeholder="e.g. PDH Long, PM Low Break"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          placeholder="Short description of when to use this setup"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="rules">Rules / Criteria</Label>
        <Textarea
          id="rules"
          rows={4}
          placeholder="Entry criteria, stop loss rules, target rules..."
          value={rules}
          onChange={(e) => setRules(e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-accent text-accent-foreground hover:bg-accent/90"
        >
          {initialData ? "Update" : "Create"} Setup
        </Button>
      </div>
    </form>
  );
}

export default Setups;
