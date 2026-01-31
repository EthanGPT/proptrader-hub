import { useMemo } from "react";
import { useData } from "@/context/DataContext";
import { format } from "date-fns";
import { ArrowUpRight } from "lucide-react";

export function RecentPayouts() {
  const { payouts } = useData();

  const recentPayouts = useMemo(
    () => [...payouts]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5),
    [payouts]
  );

  return (
    <div className="stat-card animate-slide-up">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Recent Payouts</h3>
          <p className="text-sm text-muted-foreground">Latest transactions</p>
        </div>
        <a
          href="#/payouts"
          className="flex items-center gap-1 text-sm font-medium text-accent hover:underline"
        >
          View all <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>
      <div className="space-y-4">
        {recentPayouts.map((payout) => (
          <div
            key={payout.id}
            className="flex items-center justify-between rounded-lg bg-secondary/50 p-4 transition-colors hover:bg-secondary"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                <span className="text-lg font-bold text-success">$</span>
              </div>
              <div>
                <p className="font-medium">{payout.propFirm}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(payout.date), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
            <p className="text-lg font-bold text-success">
              +${payout.amount.toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
