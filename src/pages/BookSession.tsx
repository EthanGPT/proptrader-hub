import { Link } from "react-router-dom";
import { Calendar, Video, Clock } from "lucide-react";

export default function BookSession() {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Book Your 1-on-1 Session</h1>
        <p className="page-subtitle">
          30 minutes. 1x per week. Review your trades, refine your execution, ask
          anything.
        </p>
      </div>

      {/* Session Info Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <div className="stat-card flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
            <Clock className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Duration</p>
            <p className="font-semibold text-foreground">30 minutes</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
            <Calendar className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Frequency</p>
            <p className="font-semibold text-foreground">1x per week</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
            <Video className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Platform</p>
            <p className="font-semibold text-foreground">Google Meet / Zoom</p>
          </div>
        </div>
      </div>

      {/* Calendly Embed Placeholder */}
      <div className="rounded-lg border border-border bg-card p-8">
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-background">
          <Calendar className="h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-lg font-medium text-foreground">
            Calendly Embed Goes Here
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Paste your Calendly script tag to enable booking
          </p>
          <code className="mt-4 rounded bg-muted px-3 py-2 text-xs text-muted-foreground">
            {'<div class="calendly-inline-widget" data-url="..."></div>'}
          </code>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 rounded-lg border border-border bg-card p-6">
        <h3 className="font-semibold text-foreground">Before Your Session</h3>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-accent">1.</span>
            Log your last week's trades in the{" "}
            <Link to="/journal" className="text-accent hover:underline">
              Journal
            </Link>{" "}
            so we can review them together.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent">2.</span>
            Prepare any specific questions or setups you want to discuss.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent">3.</span>
            Have your TradingView charts ready to share your screen if needed.
          </li>
        </ul>
      </div>
    </div>
  );
}
