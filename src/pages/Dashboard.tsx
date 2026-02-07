import { useMemo } from "react";
import {
  startOfMonth,
  subMonths,
  subDays,
  parseISO,
  isWithinInterval,
  endOfMonth,
  format,
} from "date-fns";
import {
  DollarSign,
  TrendingUp,
  Target,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  CrosshairIcon,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useData } from "@/context/DataContext";
import { cn } from "@/lib/utils";

function calcTrend(
  current: number,
  previous: number
): { value: number; isPositive: boolean } | undefined {
  if (previous === 0 && current === 0) return undefined;
  if (previous === 0) return { value: 100, isPositive: current > 0 };
  const pct = Math.round(((current - previous) / previous) * 100);
  return { value: Math.abs(pct), isPositive: pct >= 0 };
}

const Dashboard = () => {
  const { payouts, expenses, accounts, trades, tradingSetups, dailyEntries, propFirms } =
    useData();

  // ── Core financial stats ─────────────────────────────────
  const totalPayouts = payouts.reduce((sum, p) => sum + p.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalPayouts - totalExpenses;
  const activeAccounts = accounts.filter(
    (a) =>
      (a.type === "evaluation" && a.status === "in_progress") ||
      (a.type === "funded" && a.status === "active")
  );

  // ── Prop firm name map ─────────────────────────────────────
  const firmMap = useMemo(() => {
    const m = new Map<string, string>();
    propFirms.forEach((f) => m.set(f.id, f.name));
    return m;
  }, [propFirms]);

  // ── Account balances with dedup labels ─────────────────────
  const accountBalances = useMemo(() => {
    const items = activeAccounts.map((a) => {
      const firmName = firmMap.get(a.propFirm) ?? a.propFirm;
      const displayName = `${firmName} $${(a.accountSize / 1000).toFixed(0)}K`;
      return {
        id: a.id,
        displayName,
        type: a.type,
        size: a.accountSize,
        pnl: a.profitLoss,
        balance: a.accountSize + a.profitLoss,
        maxDrawdown: a.maxDrawdown,
        profitTarget: a.profitTarget,
      };
    });
    const nameCount = new Map<string, number>();
    items.forEach((i) => nameCount.set(i.displayName, (nameCount.get(i.displayName) || 0) + 1));
    const nameIndex = new Map<string, number>();
    return items.map((i) => {
      const count = nameCount.get(i.displayName) || 1;
      if (count > 1) {
        const idx = (nameIndex.get(i.displayName) || 0) + 1;
        nameIndex.set(i.displayName, idx);
        return { ...i, label: `${i.displayName} #${idx}` };
      }
      return { ...i, label: i.displayName };
    });
  }, [activeAccounts, firmMap]);

  const totalAccountValue = accountBalances.reduce((s, a) => s + a.balance, 0);

  // ── Trade stats ──────────────────────────────────────────
  const tradeStats = useMemo(() => {
    // Split trades represent N orders (one per active account)
    const splitN = Math.max(activeAccounts.length, 1);
    const oc = (t: { accountId?: string }) => t.accountId === "split" ? splitN : 1;

    const wins = trades.reduce((n, t) => n + (t.result === "win" ? oc(t) : 0), 0);
    const losses = trades.reduce((n, t) => n + (t.result === "loss" ? oc(t) : 0), 0);
    const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
    const tradingCount = wins + losses;
    const winRate =
      tradingCount > 0 ? Math.round((wins / tradingCount) * 100) : 0;
    const grossProfit = trades.filter((t) => t.pnl > 0).reduce((s, t) => s + t.pnl, 0);
    const grossLoss = Math.abs(trades.filter((t) => t.pnl < 0).reduce((s, t) => s + t.pnl, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
    const avgRating =
      trades.filter((t) => t.rating).length > 0
        ? trades
            .filter((t) => t.rating)
            .reduce((sum, t) => sum + (t.rating ?? 0), 0) /
          trades.filter((t) => t.rating).length
        : 0;
    const total = trades.reduce((n, t) => n + oc(t), 0);

    return { wins, losses, totalPnl, winRate, profitFactor, avgRating, total };
  }, [trades, activeAccounts]);

  // ── Streak ───────────────────────────────────────────────
  const currentStreak = useMemo(() => {
    const sorted = [...dailyEntries]
      .filter((e) => e.pnl !== undefined && e.pnl !== 0)
      .sort((a, b) => b.date.localeCompare(a.date));
    if (sorted.length === 0) return { count: 0, type: "none" as const };
    const firstType = sorted[0].pnl! > 0 ? "green" : "red";
    let count = 0;
    for (const entry of sorted) {
      if (
        (firstType === "green" && entry.pnl! > 0) ||
        (firstType === "red" && entry.pnl! < 0)
      ) {
        count++;
      } else break;
    }
    return { count, type: firstType };
  }, [dailyEntries]);

  // ── Payout trend ─────────────────────────────────────────
  const payoutTrend = useMemo(() => {
    const now = new Date();
    const thisStart = startOfMonth(now);
    const lastStart = startOfMonth(subMonths(now, 1));
    const lastEnd = endOfMonth(subMonths(now, 1));
    const cur = payouts
      .filter((p) =>
        isWithinInterval(parseISO(p.date), { start: thisStart, end: now })
      )
      .reduce((s, p) => s + p.amount, 0);
    const prev = payouts
      .filter((p) =>
        isWithinInterval(parseISO(p.date), { start: lastStart, end: lastEnd })
      )
      .reduce((s, p) => s + p.amount, 0);
    return calcTrend(cur, prev);
  }, [payouts]);

  // ── Equity curve (real balance: funded capital + cumulative PnL) ──
  const startingCapital = useMemo(
    () =>
      accounts
        .filter(
          (a) =>
            (a.type === "funded" && a.status === "active") ||
            (a.type === "evaluation" && a.status === "in_progress")
        )
        .reduce((sum, a) => sum + a.accountSize, 0),
    [accounts]
  );

  const equityCurve = useMemo(() => {
    // Include ALL trades from all accounts (including failed/passed/breached)
    if (trades.length === 0) return [];
    const sorted = [...trades].sort(
      (a, b) => a.date.localeCompare(b.date) || (a.time ?? "").localeCompare(b.time ?? "")
    );
    const dayMap = new Map<string, number>();
    let cumPnl = 0;
    for (const t of sorted) {
      cumPnl += t.pnl;
      dayMap.set(t.date, cumPnl);
    }
    const points = Array.from(dayMap.entries()).map(([date, pnl]) => ({
      date,
      balance: Math.round((startingCapital + pnl) * 100) / 100,
    }));
    if (points.length === 0) return [];
    const firstDate = points[0].date;
    const anchorDate = format(subDays(parseISO(firstDate), 1), "yyyy-MM-dd");
    return [{ date: anchorDate, balance: startingCapital }, ...points];
  }, [trades, startingCapital]);

  // ── Equity curve stats ──────────────────────────────────
  const equityStats = useMemo(() => {
    if (equityCurve.length === 0) return null;
    const latest = equityCurve[equityCurve.length - 1].balance;
    const pnl = latest - startingCapital;
    const pctReturn = startingCapital > 0 ? (pnl / startingCapital) * 100 : 0;
    const high = Math.max(...equityCurve.map((d) => d.balance));
    const low = Math.min(...equityCurve.map((d) => d.balance));
    return { latest, pnl, pctReturn, high, low };
  }, [equityCurve, startingCapital]);

  // ── Setup performance ────────────────────────────────────
  const setupPerformance = useMemo(() => {
    return tradingSetups.map((setup) => {
      const setupTrades = trades.filter((t) => t.setupId === setup.id);
      const wins = setupTrades.filter((t) => t.result === "win").length;
      const total = setupTrades.filter(
        (t) => t.result === "win" || t.result === "loss"
      ).length;
      const pnl = setupTrades.reduce((s, t) => s + t.pnl, 0);
      const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
      return { ...setup, wins, total, pnl, winRate, tradeCount: setupTrades.length };
    }).sort((a, b) => b.pnl - a.pnl);
  }, [tradingSetups, trades]);

  // ── Recent trades ────────────────────────────────────────
  const recentTrades = useMemo(
    () =>
      [...trades]
        .sort(
          (a, b) =>
            b.date.localeCompare(a.date) ||
            (b.time ?? "").localeCompare(a.time ?? "")
        )
        .slice(0, 5),
    [trades]
  );

  const setupMap = useMemo(() => {
    const m = new Map<string, string>();
    tradingSetups.forEach((s) => m.set(s.id, s.name));
    return m;
  }, [tradingSetups]);

  // ── Monthly payouts for chart ────────────────────────────
  const monthlyPayouts = useMemo(() => {
    const months: Record<string, number> = {};
    payouts.forEach((p) => {
      const key = format(parseISO(p.date), "MMM yy");
      months[key] = (months[key] || 0) + p.amount;
    });
    return Object.entries(months)
      .sort((a, b) => {
        const da =
          payouts.find((p) => format(parseISO(p.date), "MMM yy") === a[0])
            ?.date || "2024-01-01";
        const db =
          payouts.find((p) => format(parseISO(p.date), "MMM yy") === b[0])
            ?.date || "2024-01-01";
        return parseISO(da).getTime() - parseISO(db).getTime();
      })
      .map(([month, amount]) => ({ month, amount }));
  }, [payouts]);

  return (
    <div className="space-y-8">
      {/* ── Header ────────────────────────────────────────── */}
      <div>
        <h1 className="page-title">Dashboard</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {currentStreak.count > 0 && (
            <span
              className={cn(
                "inline-flex items-center gap-1",
                currentStreak.type === "green" ? "text-success" : "text-destructive"
              )}
            >
              <Flame className="h-3.5 w-3.5" />
              {currentStreak.count} day {currentStreak.type === "green" ? "win" : "loss"} streak
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Target className="h-3.5 w-3.5" />
            {tradeStats.winRate}% win rate
          </span>
          <span className="inline-flex items-center gap-1">
            <CrosshairIcon className="h-3.5 w-3.5" />
            {tradeStats.total} trades
          </span>
        </div>
      </div>

      {/* ── Top stats row ─────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Net Profit */}
        <div className="stat-card">
          <p className="section-label">Net Profit</p>
          <p
            className={cn(
              "mt-1 text-2xl font-semibold tabular-nums",
              netProfit >= 0 ? "text-success" : "text-destructive"
            )}
          >
            {netProfit >= 0 ? "+" : "-"}${Math.abs(netProfit).toLocaleString()}
          </p>
          {payoutTrend && (
            <p
              className={cn(
                "mt-0.5 text-xs tabular-nums",
                payoutTrend.isPositive ? "text-success" : "text-destructive"
              )}
            >
              {payoutTrend.isPositive ? "+" : "-"}
              {payoutTrend.value}% vs last mo
            </p>
          )}
        </div>

        {/* Total Payouts */}
        <div className="stat-card">
          <p className="section-label">Total Payouts</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            ${totalPayouts.toLocaleString()}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
            {payouts.length} payouts
          </p>
        </div>

        {/* Active Accounts */}
        <div className="stat-card">
          <p className="section-label">Active Accounts</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {activeAccounts.length}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
            ${activeAccounts
              .reduce((s, a) => s + a.accountSize, 0)
              .toLocaleString()}{" "}
            NAV
          </p>
        </div>
      </div>

      {/* ── Account Balances ─────────────────────────────── */}
      {accountBalances.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Account Balances</h3>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs text-muted-foreground">Total</span>
              <span className={cn(
                "text-lg font-semibold tabular-nums",
                totalAccountValue >= startingCapital ? "text-success" : "text-destructive"
              )}>
                ${totalAccountValue.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {accountBalances.map((acct) => {
              const ddPct = acct.maxDrawdown && acct.pnl < 0
                ? Math.min(100, (Math.abs(acct.pnl) / acct.maxDrawdown) * 100)
                : 0;
              const targetPct = acct.type === "evaluation" && acct.profitTarget && acct.profitTarget > 0
                ? Math.min(100, Math.max(0, acct.pnl) / acct.profitTarget * 100)
                : 0;
              return (
                <div
                  key={acct.id}
                  className="stat-card !p-3 space-y-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{acct.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {acct.type === "evaluation" ? "Evaluation" : "Funded"} · ${acct.size.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums">
                        ${acct.balance.toLocaleString()}
                      </p>
                      <p className={cn(
                        "text-xs font-medium tabular-nums",
                        acct.pnl >= 0 ? "text-success" : "text-destructive"
                      )}>
                        {acct.pnl >= 0 ? "+" : ""}${acct.pnl.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {/* Profit target (eval only) */}
                  {acct.type === "evaluation" && acct.profitTarget != null && acct.profitTarget > 0 && (
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Target</span>
                        <span className={cn(
                          "tabular-nums font-medium",
                          acct.pnl >= acct.profitTarget ? "text-success" : "text-muted-foreground"
                        )}>
                          ${Math.max(0, acct.pnl).toLocaleString()} / ${acct.profitTarget.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-1 overflow-hidden rounded-full bg-secondary">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            acct.pnl >= acct.profitTarget ? "bg-success" : "bg-accent/60"
                          )}
                          style={{ width: `${targetPct}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {/* Drawdown */}
                  {acct.maxDrawdown != null && acct.maxDrawdown > 0 && (
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">DD</span>
                        <span className={cn(
                          "tabular-nums font-medium",
                          ddPct >= 100 ? "text-destructive" : ddPct >= 70 ? "text-warning" : "text-muted-foreground"
                        )}>
                          {ddPct.toFixed(0)}% of ${acct.maxDrawdown.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-1 overflow-hidden rounded-full bg-secondary">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            ddPct >= 100 ? "bg-destructive" : ddPct >= 70 ? "bg-warning" : "bg-muted-foreground/30"
                          )}
                          style={{ width: `${ddPct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Trade Analytics Row ──────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="stat-card">
          <p className="section-label">Trade P&L</p>
          <p
            className={cn(
              "mt-2 text-2xl font-semibold tabular-nums",
              tradeStats.totalPnl >= 0 ? "text-success" : "text-destructive"
            )}
          >
            {tradeStats.totalPnl >= 0 ? "+" : "-"}$
            {Math.abs(tradeStats.totalPnl).toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {tradeStats.wins}W - {tradeStats.losses}L
          </p>
        </div>

        <div className="stat-card">
          <p className="section-label">Win Rate</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">
            {tradeStats.winRate}%
          </p>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${tradeStats.winRate}%` }}
            />
          </div>
        </div>

        <div className="stat-card">
          <p className="section-label">Profit Factor</p>
          <p className={cn(
            "mt-2 text-2xl font-semibold tabular-nums",
            tradeStats.profitFactor >= 1.5 ? "text-success" : tradeStats.profitFactor >= 1 ? "text-foreground" : "text-destructive"
          )}>
            {tradeStats.profitFactor === Infinity ? "∞" : tradeStats.profitFactor > 0 ? tradeStats.profitFactor.toFixed(2) : "-"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {tradeStats.profitFactor >= 1.5 ? "strong edge" : tradeStats.profitFactor >= 1 ? "breakeven+" : tradeStats.profitFactor > 0 ? "losing edge" : "no data"}
          </p>
        </div>

        <div className="stat-card">
          <p className="section-label">Execution</p>
          <div className="mt-2 flex items-baseline gap-1">
            <p className="text-2xl font-semibold tabular-nums">
              {tradeStats.avgRating > 0 ? tradeStats.avgRating.toFixed(1) : "-"}
            </p>
            <span className="text-sm text-muted-foreground">/5</span>
          </div>
          <div className="mt-1.5 flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-3 w-3",
                  i < Math.round(tradeStats.avgRating)
                    ? "fill-warning text-warning"
                    : "text-muted-foreground/20"
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Account Value ──────────────────────────────────── */}
      <div className="rounded-lg border border-border/60 bg-card">
        <div className="p-6">
          {/* Header row */}
          <div className="mb-1 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="section-label">Account Value</p>
              {equityStats ? (
                <div className="mt-1 flex items-baseline gap-3">
                  <span className="text-3xl font-semibold tabular-nums tracking-tight">
                    ${equityStats.latest.toLocaleString()}
                  </span>
                  <span
                    className={cn(
                      "flex items-center gap-0.5 text-xs font-medium tabular-nums",
                      equityStats.pnl >= 0 ? "text-success" : "text-destructive"
                    )}
                  >
                    {equityStats.pnl >= 0 ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {equityStats.pnl >= 0 ? "+" : ""}
                    ${Math.abs(equityStats.pnl).toLocaleString()} (
                    {equityStats.pctReturn >= 0 ? "+" : ""}
                    {equityStats.pctReturn.toFixed(1)}%)
                  </span>
                </div>
              ) : (
                <p className="mt-1 text-lg font-medium text-muted-foreground">
                  No data yet
                </p>
              )}
              <p className="mt-0.5 text-xs text-muted-foreground">
                ${startingCapital.toLocaleString()} starting capital
              </p>
            </div>

            {equityStats && (
              <div className="flex gap-4">
                <div className="text-right">
                  <p className="section-label">High</p>
                  <p className="text-sm font-semibold tabular-nums text-success">
                    ${equityStats.high.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="section-label">Low</p>
                  <p className="text-sm font-semibold tabular-nums text-destructive">
                    ${equityStats.low.toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Chart */}
          <div className="h-[280px]">
            {equityCurve.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={equityCurve}
                  margin={{ top: 20, right: 16, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="eqGradFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    horizontal
                    vertical={false}
                    strokeDasharray="3 6"
                    stroke="hsl(var(--border))"
                    strokeOpacity={0.5}
                  />

                  <ReferenceLine
                    y={startingCapital}
                    stroke="hsl(var(--muted-foreground))"
                    strokeDasharray="4 4"
                    strokeOpacity={0.35}
                    label={{
                      value: "Start",
                      position: "insideTopLeft",
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 9,
                      fontWeight: 500,
                    }}
                  />

                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                    tickFormatter={(v) => format(parseISO(v), "MMM d")}
                    dy={8}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    width={50}
                    domain={["auto", "auto"]}
                  />

                  <Tooltip
                    cursor={{
                      stroke: "hsl(var(--accent))",
                      strokeWidth: 1,
                      strokeDasharray: "4 4",
                      strokeOpacity: 0.5,
                    }}
                    content={({ active, payload }) => {
                      if (active && payload?.[0]) {
                        const bal = payload[0].value as number;
                        const pnl = bal - startingCapital;
                        const pct = startingCapital > 0 ? (pnl / startingCapital) * 100 : 0;
                        return (
                          <div className="tooltip-card">
                            <p className="mb-1 text-muted-foreground">
                              {format(parseISO(payload[0].payload.date), "EEEE, MMM d yyyy")}
                            </p>
                            <p className="text-lg font-semibold tabular-nums">
                              ${bal.toLocaleString()}
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                              <span
                                className={cn(
                                  "font-medium tabular-nums",
                                  pnl >= 0 ? "text-success" : "text-destructive"
                                )}
                              >
                                {pnl >= 0 ? "+" : ""}${pnl.toLocaleString()}
                              </span>
                              <span
                                className={cn(
                                  "text-[10px] font-medium tabular-nums",
                                  pnl >= 0 ? "text-success" : "text-destructive"
                                )}
                              >
                                {pct >= 0 ? "+" : ""}
                                {pct.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke="hsl(var(--accent))"
                    strokeWidth={1.5}
                    fill="url(#eqGradFill)"
                    dot={false}
                    activeDot={{
                      r: 4,
                      fill: "hsl(var(--accent))",
                      stroke: "hsl(var(--background))",
                      strokeWidth: 2,
                    }}
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Log trades to see your account value
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Payouts Over Time ──────────────────────────────── */}
      <div className="stat-card">
        <div className="mb-4">
          <h3 className="font-medium">Payouts</h3>
          <p className="text-xs text-muted-foreground">Monthly payouts</p>
        </div>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={monthlyPayouts}
              margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="payGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="hsl(var(--success))"
                    stopOpacity={0.15}
                  />
                  <stop
                    offset="100%"
                    stopColor="hsl(var(--success))"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "hsl(var(--muted-foreground))",
                  fontSize: 10,
                }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "hsl(var(--muted-foreground))",
                  fontSize: 10,
                }}
                tickFormatter={(v) => `$${v / 1000}k`}
                width={45}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload?.[0]) {
                    return (
                      <div className="tooltip-card">
                        <p className="text-muted-foreground">
                          {payload[0].payload.month}
                        </p>
                        <p className="font-semibold text-success">
                          ${payload[0].value?.toLocaleString()}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="hsl(var(--success))"
                strokeWidth={1.5}
                fill="url(#payGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Setup Performance + Recent Trades ────────────── */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Setup Performance */}
        <div className="stat-card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-medium">Setup Performance</h3>
              <p className="text-xs text-muted-foreground">
                Which setups are printing
              </p>
            </div>
            <a
              href="#/setups"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              All setups <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>

          <div className="space-y-2">
            {setupPerformance.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No setups defined yet
              </p>
            ) : (
              setupPerformance.map((setup) => (
                <div
                  key={setup.id}
                  className="flex items-center gap-3 rounded-lg border border-border/60 p-3 transition-colors hover:bg-secondary/50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">
                        {setup.name}
                      </p>
                      {setup.tradeCount > 0 && (
                        <span
                          className={cn(
                            "text-xs font-medium",
                            setup.winRate >= 60
                              ? "text-success"
                              : setup.winRate >= 40
                              ? "text-warning"
                              : "text-destructive"
                          )}
                        >
                          {setup.winRate}%
                        </span>
                      )}
                    </div>
                    {setup.tradeCount > 0 && (
                      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-secondary">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            setup.winRate >= 60
                              ? "bg-success"
                              : setup.winRate >= 40
                              ? "bg-warning"
                              : "bg-destructive"
                          )}
                          style={{ width: `${setup.winRate}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p
                      className={cn(
                        "text-sm font-semibold tabular-nums",
                        setup.pnl >= 0 ? "text-success" : "text-destructive"
                      )}
                    >
                      {setup.pnl >= 0 ? "+" : ""}$
                      {Math.abs(setup.pnl).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {setup.tradeCount} trade
                      {setup.tradeCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Trades */}
        <div className="stat-card lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-medium">Recent Trades</h3>
              <p className="text-xs text-muted-foreground">Last 5 trades</p>
            </div>
            <a
              href="#/trades"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Journal <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>

          <div className="space-y-2">
            {recentTrades.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No trades logged yet
              </p>
            ) : (
              recentTrades.map((trade) => (
                <div
                  key={trade.id}
                  className="flex items-center gap-3 rounded-lg border border-border/60 p-3 transition-colors hover:bg-secondary/50"
                >
                  <div
                    className={cn(
                      "text-xs font-medium",
                      trade.direction === "long" ? "text-success" : "text-destructive"
                    )}
                  >
                    {trade.direction === "long" ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {trade.instrument}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {setupMap.get(trade.setupId) ?? "—"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(trade.date), "MMM d")}
                      {trade.time && ` · ${trade.time}`}
                    </p>
                  </div>

                  {trade.rating && (
                    <div className="hidden sm:flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-2.5 w-2.5",
                            i < trade.rating!
                              ? "fill-warning text-warning"
                              : "text-muted-foreground/15"
                          )}
                        />
                      ))}
                    </div>
                  )}

                  <p
                    className={cn(
                      "text-sm font-semibold tabular-nums",
                      trade.pnl > 0
                        ? "text-success"
                        : trade.pnl < 0
                        ? "text-destructive"
                        : "text-muted-foreground"
                    )}
                  >
                    {trade.pnl >= 0 ? "+" : ""}$
                    {Math.abs(trade.pnl).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
