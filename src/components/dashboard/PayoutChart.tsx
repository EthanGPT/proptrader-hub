import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useData } from "@/context/DataContext";

export function PayoutChart() {
  const { payouts } = useData();

  const monthlyPayouts = useMemo(() => {
    const months: Record<string, number> = {};
    payouts.forEach((p) => {
      const key = format(parseISO(p.date), 'MMM yy');
      months[key] = (months[key] || 0) + p.amount;
    });

    return Object.entries(months)
      .sort((a, b) => {
        const da = payouts.find(p => format(parseISO(p.date), 'MMM yy') === a[0])?.date || '2024-01-01';
        const db = payouts.find(p => format(parseISO(p.date), 'MMM yy') === b[0])?.date || '2024-01-01';
        return parseISO(da).getTime() - parseISO(db).getTime();
      })
      .map(([month, amount]) => ({ month, amount }));
  }, [payouts]);

  return (
    <div className="stat-card animate-slide-up">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Payouts Over Time</h3>
        <p className="text-sm text-muted-foreground">Monthly payout performance</p>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={monthlyPayouts} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="payoutGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              tickFormatter={(value) => `$${value / 1000}k`}
              dx={-10}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="glass-card rounded-lg p-3">
                      <p className="text-sm font-medium">{payload[0].payload.month}</p>
                      <p className="text-lg font-bold text-accent">
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
              stroke="hsl(var(--accent))"
              strokeWidth={3}
              fill="url(#payoutGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
