import { Link } from "react-router-dom";
import { MessageCircle, Users, Zap, ArrowRight } from "lucide-react";

export default function Discord() {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Join the Community</h1>
        <p className="page-subtitle">
          Connect with traders using the same strategy
        </p>
      </div>

      {/* Discord Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Free Discord */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/20">
              <Users className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Free Discord</h2>
              <p className="text-sm text-muted-foreground">Open to everyone</p>
            </div>
          </div>

          <ul className="mt-6 space-y-3">
            <li className="flex items-start gap-2 text-sm text-muted-foreground">
              <MessageCircle className="h-4 w-4 mt-0.5 text-accent flex-shrink-0" />
              Analysis at the open — key levels for the day
            </li>
            <li className="flex items-start gap-2 text-sm text-muted-foreground">
              <MessageCircle className="h-4 w-4 mt-0.5 text-accent flex-shrink-0" />
              Educational breakdowns and chart examples
            </li>
            <li className="flex items-start gap-2 text-sm text-muted-foreground">
              <MessageCircle className="h-4 w-4 mt-0.5 text-accent flex-shrink-0" />
              General trading chat with the community
            </li>
            <li className="flex items-start gap-2 text-sm text-muted-foreground">
              <MessageCircle className="h-4 w-4 mt-0.5 text-accent flex-shrink-0" />
              Beginner questions welcome
            </li>
          </ul>

          <a
            href="#"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-3 font-semibold text-white transition-colors hover:bg-accent/90"
          >
            Join Free Discord
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        {/* Paid Discord (Edge) */}
        <div className="rounded-lg border border-accent bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gold/20">
              <Zap className="h-6 w-6 text-gold" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Paid Discord{" "}
                <span className="text-accent">(Edge)</span>
              </h2>
              <p className="text-sm text-muted-foreground">For Edge members</p>
            </div>
          </div>

          <ul className="mt-6 space-y-3">
            <li className="flex items-start gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4 mt-0.5 text-gold flex-shrink-0" />
              Live executions from me — see my entries in real time
            </li>
            <li className="flex items-start gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4 mt-0.5 text-gold flex-shrink-0" />
              Trade review requests — get feedback on your setups
            </li>
            <li className="flex items-start gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4 mt-0.5 text-gold flex-shrink-0" />
              Signal discussion and post-trade analysis
            </li>
            <li className="flex items-start gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4 mt-0.5 text-gold flex-shrink-0" />
              Weekly session links and recordings
            </li>
          </ul>

          <Link
            to="/purchase"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-accent py-3 font-semibold text-accent transition-colors hover:bg-accent/10"
          >
            Upgrade to Edge
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Trade Review Instructions */}
      <div className="mt-8 rounded-lg border border-border bg-card p-6">
        <h3 className="font-semibold text-foreground">
          How to Request a Trade Review
        </h3>
        <p className="mt-3 text-sm text-muted-foreground">
          To request a trade review in the paid Discord:
        </p>
        <ol className="mt-4 space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/20 text-xs font-medium text-accent">
              1
            </span>
            Post your entry screenshot with the chart clearly visible
          </li>
          <li className="flex items-start gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/20 text-xs font-medium text-accent">
              2
            </span>
            Include the level that triggered your entry (PDH, PDL, etc.)
          </li>
          <li className="flex items-start gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/20 text-xs font-medium text-accent">
              3
            </span>
            Tag @mentor in your post
          </li>
          <li className="flex items-start gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/20 text-xs font-medium text-accent">
              4
            </span>
            I review these weekly and provide written feedback
          </li>
        </ol>
      </div>
    </div>
  );
}
