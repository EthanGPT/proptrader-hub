import { Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { Footer } from "@/components/layout/PublicLayout";
import { Liveline } from "liveline";

export default function Landing() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <LivelineSection />
      <FeaturesSection />
      <AboutSection />
      <PricingSection />
      <Footer />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-screen bg-[#f5f0e8] flex flex-col">
      {/* Top Row: Nav - dark bar on light hero */}
      <div className="bg-[#080808]">
        <PublicNavbar variant="dark" />
      </div>

      {/* Middle Row: Content */}
      <div className="flex-1 flex items-center justify-center px-[60px] py-20">
        <div className="text-center max-w-4xl">
          {/* Eyebrow */}
          <p className="font-mono text-[11px] tracking-[0.2em] text-[#888] uppercase mb-8">
            FUTURES TRADING EDUCATION
          </p>

          {/* Title - 3 lines */}
          <h1
            className="font-display font-[800] uppercase leading-[0.88] tracking-[-0.04em]"
            style={{ fontSize: "clamp(64px, 9vw, 140px)" }}
          >
            {/* Line 1: Outlined */}
            <span
              className="block"
              style={{
                WebkitTextStroke: "2px #0a0a0a",
                color: "transparent",
              }}
            >
              TRADE
            </span>
            {/* Line 2: Accent highlighted */}
            <span
              className="inline-block my-2"
              style={{
                background: "#c8f54a",
                color: "#0a0a0a",
                padding: "0 16px",
              }}
            >
              WITH
            </span>
            {/* Line 3: Solid filled */}
            <span className="block text-[#0a0a0a]">AN EDGE</span>
          </h1>

          {/* Subtext */}
          <p className="font-mono text-[13px] text-[#777] max-w-[400px] mx-auto leading-[1.8] mt-10">
            A liquidity-based breakout system built on the 6 most important
            intraday levels. Indicator + course + community.
          </p>

          {/* CTA Button */}
          <Link
            to="/purchase"
            className="inline-block mt-10 bg-[#0a0a0a] text-[#f5f0e8] font-mono text-[11px] font-medium uppercase tracking-[0.12em] px-9 py-[18px] transition-opacity hover:opacity-80"
          >
            GET THE INDICATOR — $49.99/MO →
          </Link>
        </div>
      </div>

      {/* Bottom Row: Stats */}
      <div className="px-[60px] py-8 border-t border-[#0a0a0a]/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Stats Left */}
          <div className="flex items-center gap-8 md:gap-12">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold text-[#0a0a0a]">
                73%
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#888]">
                WIN RATE
              </span>
            </div>
            <div className="h-6 w-px bg-[#0a0a0a]/20 hidden md:block" />
            <div className="flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold text-[#0a0a0a]">
                847
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#888]">
                TRADES
              </span>
            </div>
            <div className="h-6 w-px bg-[#0a0a0a]/20 hidden md:block" />
            <div className="flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold text-[#0a0a0a]">
                2YR
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#888]">
                DATA
              </span>
            </div>
          </div>

          {/* Disclaimer Right */}
          <p className="font-mono text-[10px] text-[#888] text-center md:text-right">
            Simulated results. Past performance ≠ future results.
          </p>
        </div>
      </div>
    </section>
  );
}

function LivelineSection() {
  const [data, setData] = useState<{ time: number; value: number }[]>([]);
  const [currentValue, setCurrentValue] = useState(0);
  const runningTotal = useRef(0);

  useEffect(() => {
    // Seed with ~60 historical points
    const initialData: { time: number; value: number }[] = [];
    const now = Math.floor(Date.now() / 1000);
    let value = 1000; // Start at 1000

    for (let i = 60; i > 0; i--) {
      // Random walk with slight positive drift
      const change = (Math.random() - 0.45) * 150;
      value += change;
      // Occasional pullbacks
      if (Math.random() > 0.9) {
        value -= Math.random() * 200;
      }
      initialData.push({
        time: now - i * 90,
        value: Math.round(value),
      });
    }

    runningTotal.current = value;
    setData(initialData);
    setCurrentValue(Math.round(value));

    // Push a new point every 1500ms
    const interval = setInterval(() => {
      const change = (Math.random() - 0.45) * 150;
      runningTotal.current += change;
      // Occasional pullbacks
      if (Math.random() > 0.92) {
        runningTotal.current -= Math.random() * 180;
      }

      const newValue = Math.round(runningTotal.current);
      setCurrentValue(newValue);
      setData((prev) => [
        ...prev.slice(-100),
        {
          time: Math.floor(Date.now() / 1000),
          value: newValue,
        },
      ]);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="bg-[#080808] px-[60px] py-[80px]">
      <div className="max-w-[900px] mx-auto">
        {/* Chart only */}
        <div className="h-[280px] w-full">
          {data.length > 0 && (
            <Liveline
              data={data}
              value={currentValue}
              color="#c8f54a"
              theme="dark"
              momentum={true}
              exaggerate={true}
              scrub={true}
              showValue={true}
              badge={false}
            />
          )}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      label: "INDICATOR",
      title: "The Indicator",
      description:
        "The backbone of Edge. Automatically plots the 6 key liquidity levels and alerts on clean breaks. Tailored risk settings for MNQ, MES, and MGC — auto-populated so you just execute.",
    },
    {
      label: "COURSE",
      title: "The Course",
      description:
        "Full PDF breakdown of the strategy — from liquidity theory to step-by-step execution rules. No fluff. Just the system.",
    },
    {
      label: "COMMUNITY",
      title: "The Community",
      description:
        "FREE Discord access with trade reviews, live executions, and direct feedback on your setups. Submit your trades anytime. Zero extra cost.",
    },
    {
      label: "JOURNAL",
      title: "The Journal",
      description:
        "A full-blown trading dashboard. Log trades, track P&L across accounts, analyze your stats, manage prop firms, and export daily snapshots. This thing is serious.",
    },
  ];

  return (
    <section id="system" className="bg-[#080808] px-[60px] py-[120px] border-t border-[#1f1f1f]">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="mb-16">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#c8f54a] uppercase mb-4">
            THE SYSTEM
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-[#f5f5f5] uppercase tracking-tight">
            Everything you need to execute
          </h2>
        </div>

        {/* 2x2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#1f1f1f]">
          {features.map((feature) => (
            <div
              key={feature.label}
              className="bg-[#141414] p-10"
            >
              <p className="font-mono text-[10px] tracking-[0.2em] text-[#c8f54a] uppercase mb-4">
                {feature.label}
              </p>
              <h3 className="font-display text-xl font-semibold text-[#f5f5f5] mb-3">
                {feature.title}
              </h3>
              <p className="font-mono text-[13px] text-[#888] leading-[1.8]">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section className="bg-[#080808] px-[60px] py-[120px] border-t border-[#1f1f1f]">
      <div className="max-w-3xl mx-auto">
        {/* Section Label */}
        <p className="font-mono text-[10px] tracking-[0.2em] text-[#c8f54a] uppercase mb-4">
          ABOUT
        </p>

        {/* Main Heading */}
        <h2 className="font-display text-3xl md:text-4xl font-bold text-[#f5f5f5] uppercase tracking-tight mb-10">
          Real trading. Real transparency.
        </h2>

        {/* Body Text */}
        <div className="space-y-6">
          <p className="font-mono text-[13px] text-[#888] leading-[1.8]">
            I'm an ex-prop firm founder actively trading this system right now.
            The indicator model is valid — the backtest proves it. My edge has
            been the emotional discipline to follow it consistently, which I'm
            building alongside you.
          </p>
          <p className="font-mono text-[13px] text-[#888] leading-[1.8]">
            This isn't a guru selling screenshots. It's a transparent, real-time
            trading education built on a strategy I developed, backtested, and
            trade myself. You'll see my journal. My losses. My process.
          </p>
          <p className="font-mono text-[14px] text-[#f5f5f5] leading-[1.8] mt-8">
            I'm building this alongside you — not above you.
          </p>
        </div>

        {/* Proof Points */}
        <div className="mt-12 flex flex-wrap gap-8">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-[#c8f54a]" />
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#f5f5f5]">
              Currently trading
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-[#c8f54a]" />
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#f5f5f5]">
              2-year backtest
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-[#c8f54a]" />
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#f5f5f5]">
              Public trade record
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section className="bg-[#080808] px-[60px] py-[120px] border-t border-[#1f1f1f]">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="mb-16">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#c8f54a] uppercase mb-4">
            PRICING
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-[#f5f5f5] uppercase tracking-tight">
            Simple, transparent pricing
          </h2>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#1f1f1f]">
          {/* The Indicator */}
          <div className="bg-[#141414] p-10">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#888] uppercase mb-2">
              STARTER
            </p>
            <h3 className="font-display text-2xl font-bold text-[#f5f5f5] mb-1">
              The Indicator
            </h3>
            <p className="font-mono text-[12px] text-[#555] mb-6">
              The tool. Just the tool.
            </p>

            <div className="mb-8">
              <span className="font-display text-4xl font-bold text-[#f5f5f5]">
                $49.99
              </span>
              <span className="font-mono text-[12px] text-[#888]">/mo</span>
            </div>

            <ul className="space-y-4 mb-10">
              {[
                "Key Level Breakout Indicator",
                "TradingView access within 24hrs",
                "Works on MNQ, MES, MGC",
                "Tailored risk settings per asset",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#c8f54a] mt-2 flex-shrink-0" />
                  <span className="font-mono text-[12px] text-[#888]">
                    {item}
                  </span>
                </li>
              ))}
            </ul>

            <Link
              to="/purchase"
              className="block w-full text-center border border-[#c8f54a] text-[#c8f54a] font-mono text-[11px] font-medium uppercase tracking-[0.12em] py-4 transition-colors hover:bg-[#c8f54a]/10"
            >
              GET THE INDICATOR →
            </Link>
          </div>

          {/* Edge */}
          <div className="bg-[#141414] p-10 relative">
            <div className="absolute top-6 right-6 bg-[#c8f54a] px-3 py-1">
              <span className="font-mono text-[9px] font-medium uppercase tracking-[0.1em] text-[#0a0a0a]">
                RECOMMENDED
              </span>
            </div>

            <p className="font-mono text-[10px] tracking-[0.2em] text-[#888] uppercase mb-2">
              FULL ACCESS
            </p>
            <h3 className="font-display text-2xl font-bold text-[#f5f5f5] mb-1">
              Edge
            </h3>
            <p className="font-mono text-[12px] text-[#555] mb-6">
              Indicator + course + community
            </p>

            <div className="mb-8">
              <span className="font-display text-4xl font-bold text-[#f5f5f5]">
                $99
              </span>
              <span className="font-mono text-[12px] text-[#888]">/mo</span>
            </div>

            <ul className="space-y-4 mb-10">
              {[
                "Everything in The Indicator",
                "Key Level Breakout System Course (PDF)",
                "Paid Discord (trade reviews, live executions)",
                "Trade review requests anytime",
                "Full Trading Journal access",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#c8f54a] mt-2 flex-shrink-0" />
                  <span className="font-mono text-[12px] text-[#888]">
                    {item}
                  </span>
                </li>
              ))}
            </ul>

            <Link
              to="/purchase"
              className="block w-full text-center bg-[#c8f54a] text-[#0a0a0a] font-mono text-[11px] font-medium uppercase tracking-[0.12em] py-4 transition-opacity hover:opacity-90"
            >
              JOIN EDGE →
            </Link>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="font-mono text-[10px] text-[#555] mt-8 text-center">
          Simulated results. Past performance ≠ future results. Not financial
          advice.
        </p>
      </div>
    </section>
  );
}
