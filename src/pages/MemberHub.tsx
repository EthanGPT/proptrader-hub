import { Link } from "react-router-dom";
import {
  TrendingUp,
  BarChart3,
  Target,
  Clock,
  CheckCircle,
  ArrowRight,
  FileText,
  MessageCircle,
  Video,
  Lock
} from "lucide-react";
import { useMembership } from "@/context/MembershipContext";

export default function MemberHub() {
  const { tier } = useMembership();
  const hasEdgeAccess = tier === 'edge' || tier === 'mentorship';
  const hasMentorshipAccess = tier === 'mentorship';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="page-title">Welcome to Edge</h1>
        <p className="page-subtitle">Your trading mentorship member hub</p>
      </div>

      {/* Quick Access Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Trade Journal - Main CTA */}
        <Link
          to={hasEdgeAccess ? "/trade-journal" : "/purchase"}
          className={`stat-card group relative overflow-hidden transition-all hover:border-accent ${
            hasEdgeAccess ? "" : "opacity-75"
          }`}
        >
          {!hasEdgeAccess && (
            <div className="absolute top-3 right-3">
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
            <BarChart3 className="h-5 w-5 text-accent" />
          </div>
          <h3 className="mt-3 font-semibold text-foreground">Trade Journal</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {hasEdgeAccess ? "Log trades, track P&L, analyze performance" : "Upgrade to access"}
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-accent group-hover:underline">
            {hasEdgeAccess ? "Open Journal" : "Unlock"} <ArrowRight className="h-3 w-3" />
          </span>
        </Link>

        {/* Discord */}
        <Link
          to="/discord"
          className="stat-card group transition-all hover:border-accent"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
            <MessageCircle className="h-5 w-5 text-accent" />
          </div>
          <h3 className="mt-3 font-semibold text-foreground">Discord</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Community, trade reviews, live analysis
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-accent group-hover:underline">
            Join Discord <ArrowRight className="h-3 w-3" />
          </span>
        </Link>

        {/* Course PDF */}
        <div className={`stat-card relative ${hasEdgeAccess ? "" : "opacity-75"}`}>
          {!hasEdgeAccess && (
            <div className="absolute top-3 right-3">
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/20">
            <FileText className="h-5 w-5 text-gold" />
          </div>
          <h3 className="mt-3 font-semibold text-foreground">Edge Course</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Key Level Breakout System Guide
          </p>
          <a
            href={hasEdgeAccess ? "/Edge_Course.pdf" : "#"}
            target={hasEdgeAccess ? "_blank" : undefined}
            rel={hasEdgeAccess ? "noopener noreferrer" : undefined}
            className={`mt-3 inline-flex items-center gap-1 text-xs font-medium ${
              hasEdgeAccess ? "text-gold hover:underline" : "text-muted-foreground"
            }`}
          >
            {hasEdgeAccess ? "View Course" : "Edge members only"} <ArrowRight className="h-3 w-3" />
          </a>
        </div>

        {/* Book 1-on-1 */}
        <Link
          to={hasMentorshipAccess ? "/book" : "/purchase"}
          className={`stat-card group relative transition-all hover:border-gold ${
            hasMentorshipAccess ? "" : "opacity-75"
          }`}
        >
          {!hasMentorshipAccess && (
            <div className="absolute top-3 right-3">
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/20">
            <Video className="h-5 w-5 text-gold" />
          </div>
          <h3 className="mt-3 font-semibold text-foreground">Book 1-on-1</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {hasMentorshipAccess ? "Schedule your weekly session" : "Mentorship members only"}
          </p>
          <span className={`mt-3 inline-flex items-center gap-1 text-xs font-medium group-hover:underline ${
            hasMentorshipAccess ? "text-gold" : "text-muted-foreground"
          }`}>
            {hasMentorshipAccess ? "Book Session" : "Apply"} <ArrowRight className="h-3 w-3" />
          </span>
        </Link>
      </div>

      {/* Verified Backtest Results */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Verified Backtest Results</h2>
            <p className="text-sm text-muted-foreground">Key Level Breakout System — MNQ 15min — 2 Year Period</p>
          </div>
          <div className="rounded-full bg-accent/20 px-3 py-1 text-xs font-medium text-accent">
            VERIFIED
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">847</p>
            <p className="text-xs text-muted-foreground">Total Trades</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-accent">73%</p>
            <p className="text-xs text-muted-foreground">Win Rate</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">2.4</p>
            <p className="text-xs text-muted-foreground">Profit Factor</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-accent">+$14,320</p>
            <p className="text-xs text-muted-foreground">Net Profit (1 MNQ)</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-destructive">-$840</p>
            <p className="text-xs text-muted-foreground">Max Drawdown</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">0.81R</p>
            <p className="text-xs text-muted-foreground">Avg R per Trade</p>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Backtested results. Simulated performance. Past results do not guarantee future performance.
        </p>
      </div>

      {/* Strategy Overview */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* The System */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-semibold text-foreground">The Key Level Breakout System</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            A liquidity-based futures strategy built on the 6 most important intraday price levels.
          </p>

          <div className="mt-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20 text-xs font-medium text-accent">1</div>
              <div>
                <p className="text-sm font-medium text-foreground">Identify the Level</p>
                <p className="text-xs text-muted-foreground">PDH, PDL, PMH, PML, LPH, LPL</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20 text-xs font-medium text-accent">2</div>
              <div>
                <p className="text-sm font-medium text-foreground">Wait for Clean Break</p>
                <p className="text-xs text-muted-foreground">Full 15m candle close beyond level</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20 text-xs font-medium text-accent">3</div>
              <div>
                <p className="text-sm font-medium text-foreground">Enter on Retest</p>
                <p className="text-xs text-muted-foreground">SL/TP varies by asset, then trail</p>
              </div>
            </div>
          </div>
        </div>

        {/* What's Included */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-semibold text-foreground">Your Membership Includes</h3>

          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle className={`h-4 w-4 ${hasEdgeAccess ? 'text-accent' : 'text-muted-foreground'}`} />
              <span className={`text-sm ${hasEdgeAccess ? 'text-foreground' : 'text-muted-foreground'}`}>
                Key Level Breakout Indicator (TradingView)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className={`h-4 w-4 ${hasEdgeAccess ? 'text-accent' : 'text-muted-foreground'}`} />
              <span className={`text-sm ${hasEdgeAccess ? 'text-foreground' : 'text-muted-foreground'}`}>
                Full Strategy Course (PDF)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className={`h-4 w-4 ${hasEdgeAccess ? 'text-accent' : 'text-muted-foreground'}`} />
              <span className={`text-sm ${hasEdgeAccess ? 'text-foreground' : 'text-muted-foreground'}`}>
                Trade Journal & Analytics
              </span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className={`h-4 w-4 ${hasEdgeAccess ? 'text-accent' : 'text-muted-foreground'}`} />
              <span className={`text-sm ${hasEdgeAccess ? 'text-foreground' : 'text-muted-foreground'}`}>
                Paid Discord (live executions, reviews)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className={`h-4 w-4 ${hasMentorshipAccess ? 'text-gold' : 'text-muted-foreground'}`} />
              <span className={`text-sm ${hasMentorshipAccess ? 'text-foreground' : 'text-muted-foreground'}`}>
                Weekly 1-on-1 Sessions (Mentorship)
              </span>
            </div>
          </div>

          {!hasEdgeAccess && (
            <Link
              to="/purchase"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
            >
              Upgrade to Edge <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

    </div>
  );
}
