import { PublicLayout } from "@/components/layout/PublicLayout";
import { Check } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Get started with free resources",
    features: [
      "YouTube Content",
      "Discord Analysis",
      "Free Educational Courses",
    ],
    featureNote: null,
    cta: "Join Free →",
    ctaLink: "#",
    highlighted: false,
    badge: null,
    badgeColor: "",
    ctaStyle: "border border-accent text-accent hover:bg-accent/10",
    note: null,
  },
  {
    name: "The Indicator",
    price: "$49.99",
    period: "/month",
    description: "The tool. Just the tool.",
    features: [
      "Key Level Breakout Indicator",
      "TradingView invite within 24hrs",
      "Works on MNQ, NQ, MES, ES, MGC, Micro Silver",
      "40/40 model with auto trail",
      "No community access",
    ],
    featureNote: null,
    cta: "Get the Indicator →",
    ctaLink: "#",
    highlighted: false,
    badge: null,
    badgeColor: "",
    ctaStyle: "border border-accent text-accent hover:bg-accent/10",
    note: "Indicator delivered via TradingView invite-only access through Whop.",
  },
  {
    name: "Edge",
    price: "$99",
    period: "/month",
    description: "The indicator + the community that makes you use it.",
    features: [
      "Everything in The Indicator tier",
      "Key Level Breakout System Course (PDF)",
      "Paid Discord (trade reviews, live executions)",
      "Trade Review Requests",
      "Trading Journal access",
    ],
    featureNote: "Full strategy breakdown — from liquidity theory to step-by-step execution.",
    cta: "Join Edge →",
    ctaLink: "#",
    highlighted: true,
    badge: "MOST POPULAR",
    badgeColor: "bg-gold",
    ctaStyle: "bg-accent text-white hover:bg-accent/90",
    note: null,
  },
  {
    name: "Mentorship",
    featureNote: null,
    price: "$199",
    period: "/month",
    description: "Direct access. Capped at 20 members.",
    features: [
      "Everything in Edge",
      "30min 1-on-1, 1x per week, book from member hub",
      "Personal trade review before every session",
      "We go through your journal together",
    ],
    cta: "Apply →",
    ctaLink: "#",
    highlighted: false,
    badge: "LIMITED SPOTS",
    badgeColor: "bg-gold",
    ctaStyle: "border border-gold text-gold hover:bg-gold/10",
    note: null,
  },
];

const faqs = [
  {
    question: "How do I get access to the indicator after purchasing?",
    answer:
      "After purchasing through Whop, you'll enter your TradingView username. Access is granted within 24 hours. You'll receive an email confirmation once your TradingView account has been granted access to the indicator.",
  },
  {
    question: "What markets does the indicator work on?",
    answer:
      "MNQ, NQ, MES, ES, MGC (Micro Gold) and Micro Silver. Any high-volume futures market with clear intraday structure. The strategy works best on markets with institutional participation and clear liquidity levels.",
  },
  {
    question: "Do I need to be at my screen all day?",
    answer:
      "No. You can set limit orders at the levels before a session and walk away. The strategy works for part-time traders. Many members trade the first hour of the US session and then go about their day.",
  },
  {
    question: "What is the 1-on-1 mentorship?",
    answer:
      "30-minute video calls, 1x per week. You book directly through the member hub. We review your trades, refine your execution, and work through any setups together. This is for traders who want personalized guidance.",
  },
  {
    question: "Does Mentorship include everything from Edge?",
    answer:
      "Yes. Mentorship includes everything in Edge tier — the indicator, the course PDF, paid Discord access, trade review requests, and the trading journal. Plus you get weekly 1-on-1 calls and personalized trade reviews before each session.",
  },
  {
    question: "Is this financial advice?",
    answer:
      "No. This is educational content only. You are responsible for your own trading decisions. Past performance does not guarantee future results. Trading futures involves substantial risk of loss.",
  },
];

export default function Purchase() {
  return (
    <PublicLayout>
      <section className="bg-background px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
              Choose Your Plan
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">
              Start free or get the full indicator and community access
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-lg border p-5 ${
                  plan.highlighted
                    ? "border-accent bg-card"
                    : "border-border bg-card"
                }`}
              >
                {plan.badge && (
                  <div className={`absolute -top-3 right-4 rounded-full ${plan.badgeColor} px-3 py-1 text-xs font-semibold text-gold-foreground`}>
                    {plan.badge}
                  </div>
                )}
                <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{plan.description}</p>
                <div className="mt-3">
                  <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
                <ul className="mt-5 space-y-2">
                  {plan.features.map((feature, idx) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="h-4 w-4 mt-0.5 text-accent flex-shrink-0" />
                      <span className="text-xs text-muted-foreground">
                        {feature}
                        {feature.includes("Course (PDF)") && plan.featureNote && (
                          <span className="block mt-0.5 text-[10px] text-muted-foreground/70 italic">
                            {plan.featureNote}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
                <a
                  href={plan.ctaLink}
                  className={`mt-6 block w-full rounded-lg py-2.5 text-center text-sm font-semibold transition-colors ${plan.ctaStyle}`}
                >
                  {plan.cta}
                </a>
                {plan.note && (
                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    {plan.note}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="mt-20">
            <h2 className="text-center text-2xl font-bold text-foreground">
              Frequently Asked Questions
            </h2>
            <div className="mx-auto mt-8 max-w-3xl">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="rounded-lg border border-border bg-card px-4 mb-3"
                  >
                    <AccordionTrigger className="text-left text-foreground hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
