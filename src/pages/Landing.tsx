import { Link } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { ArrowRight, Check, CheckCircle } from "lucide-react";

export default function Landing() {
  return (
    <PublicLayout>
      <HeroSection />
      <SocialProof />
      <ValueProposition />
      <HonestBitSection />
      <PricingSection />
      <FinalCTA />
    </PublicLayout>
  );
}

function HeroSection() {
  return (
    <section className="relative bg-background px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-accent">
          Futures Trading Education
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          The strategy I use to trade
          <span className="text-accent"> MNQ & Gold</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
          A liquidity-based breakout system built on the 6 most important intraday levels.
          Indicator + course + community.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/purchase"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-accent/90"
          >
            Get Started — $49.99/mo
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/discord"
            className="inline-flex items-center gap-2 text-base font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Join Free Discord
          </Link>
        </div>
      </div>
    </section>
  );
}

function SocialProof() {
  return (
    <section className="border-y border-border bg-card/50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-center">
          <div>
            <span className="text-2xl font-bold text-accent">73%</span>
            <span className="ml-2 text-sm text-muted-foreground">backtest win rate</span>
          </div>
          <div className="hidden h-8 w-px bg-border sm:block" />
          <div>
            <span className="text-2xl font-bold text-foreground">847</span>
            <span className="ml-2 text-sm text-muted-foreground">trades backtested</span>
          </div>
          <div className="hidden h-8 w-px bg-border sm:block" />
          <div>
            <span className="text-2xl font-bold text-foreground">2 years</span>
            <span className="ml-2 text-sm text-muted-foreground">of data</span>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          MNQ 15-minute chart. Simulated results. Past performance ≠ future results.
        </p>
      </div>
    </section>
  );
}

function ValueProposition() {
  const features = [
    {
      title: "The Indicator",
      description: "Automatically plots the 6 key liquidity levels. Alerts on clean breaks. Auto-trail after 1:1.",
    },
    {
      title: "The Course",
      description: "Full PDF breakdown of the strategy — from liquidity theory to step-by-step execution rules.",
    },
    {
      title: "Trade Reviews",
      description: "Submit your trades in Discord. Get feedback on entries, exits, and execution quality.",
    },
    {
      title: "The Journal",
      description: "Track every trade. See your stats. Manage your prop firm accounts. All in one place.",
    },
  ];

  return (
    <section className="bg-background px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
            Everything you need to execute the system
          </h2>
          <p className="mt-3 text-muted-foreground">
            Not just an indicator. A complete trading education.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HonestBitSection() {
  return (
    <section className="bg-[#1c2128] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
          I'm not selling you a lifestyle.
        </h2>
        <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
          <p>
            I'm an ex-prop firm founder actively trading this system right now.
            The indicator model is valid — the backtest proves it. My edge has been
            the emotional discipline to follow it consistently, which I'm building alongside you.
          </p>
          <p>
            This isn't a guru selling screenshots. It's a transparent, real-time trading
            education built on a strategy I developed, backtested, and trade myself.
            You'll see my journal. My losses. My process.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-accent" />
            <span className="text-sm text-foreground">Currently trading</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-accent" />
            <span className="text-sm text-foreground">2-year backtest</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-accent" />
            <span className="text-sm text-foreground">Public trade record</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section className="bg-background px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Simple pricing</h2>
          <p className="mt-3 text-muted-foreground">
            Start with the indicator, or get the full experience.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {/* The Indicator */}
          <div className="rounded-lg border border-border bg-card p-8">
            <h3 className="text-lg font-semibold text-foreground">The Indicator</h3>
            <p className="mt-1 text-sm text-muted-foreground">The tool. Just the tool.</p>
            <div className="mt-4">
              <span className="text-4xl font-bold text-foreground">$49.99</span>
              <span className="text-muted-foreground">/mo</span>
            </div>
            <ul className="mt-6 space-y-3">
              {[
                "Key Level Breakout Indicator",
                "TradingView access within 24hrs",
                "Works on MNQ, NQ, MES, ES, Gold, Silver",
                "40/40 model with auto trail",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check className="h-4 w-4 mt-0.5 text-accent flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/purchase"
              className="mt-8 block w-full rounded-lg border border-accent py-3 text-center text-sm font-semibold text-accent transition-colors hover:bg-accent/10"
            >
              Get the Indicator →
            </Link>
          </div>

          {/* The Edge */}
          <div className="relative rounded-lg border-2 border-accent bg-card p-8">
            <div className="absolute -top-3 right-6 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
              RECOMMENDED
            </div>
            <h3 className="text-lg font-semibold text-foreground">The Edge</h3>
            <p className="mt-1 text-sm text-muted-foreground">Indicator + course + community</p>
            <div className="mt-4">
              <span className="text-4xl font-bold text-foreground">$99</span>
              <span className="text-muted-foreground">/mo</span>
            </div>
            <ul className="mt-6 space-y-3">
              {[
                "Everything in The Indicator",
                "Key Level Breakout System Course (PDF)",
                "Paid Discord (trade reviews, live executions)",
                "Trade review requests anytime",
                "Full Trading Journal access",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check className="h-4 w-4 mt-0.5 text-accent flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/purchase"
              className="mt-8 block w-full rounded-lg bg-accent py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-accent/90"
            >
              Join The Edge →
            </Link>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Need 1-on-1 mentorship?{" "}
          <Link to="/purchase" className="text-accent hover:underline">
            See all plans →
          </Link>
        </p>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="border-t border-border bg-card/50 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-bold text-foreground">
          Ready to trade with an edge?
        </h2>
        <p className="mt-3 text-muted-foreground">
          Join the community or try the free Discord first.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/purchase"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
          >
            View Pricing
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/discord"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-card"
          >
            Join Free Discord
          </Link>
        </div>
      </div>
    </section>
  );
}
