import { Link } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Play, ArrowRight } from "lucide-react";

const courses = [
  {
    title: "Intro to Futures Trading",
    description:
      "What are futures, how do they work, MNQ vs NQ, margins and sizing.",
    thumbnail: "from-accent/30 to-accent/10",
  },
  {
    title: "Reading a Price Chart",
    description:
      "Candlesticks, timeframes, support and resistance basics.",
    thumbnail: "from-gold/30 to-gold/10",
  },
  {
    title: "Understanding Liquidity",
    description:
      "Why price moves where it moves. The institutional perspective.",
    thumbnail: "from-accent/30 to-accent/10",
  },
  {
    title: "The 6 Key Levels",
    description:
      "PDH, PDL, PMH, PML, LPH, LPL explained with chart examples.",
    thumbnail: "from-gold/30 to-gold/10",
  },
  {
    title: "Risk Management 101",
    description:
      "Why your stop loss saves your account. Position sizing basics.",
    thumbnail: "from-destructive/30 to-destructive/10",
  },
  {
    title: "Your First Trade Walkthrough",
    description:
      "Step by step from chart setup to execution.",
    thumbnail: "from-accent/30 to-accent/10",
  },
];

export default function Courses() {
  return (
    <PublicLayout>
      <section className="bg-background px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
              Free Trading Education
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">
              Built for complete beginners. No experience needed.
            </p>
          </div>

          {/* Course Grid */}
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <div
                key={course.title}
                className="group relative rounded-lg border border-border bg-card overflow-hidden"
              >
                {/* FREE Badge */}
                <div className="absolute top-3 right-3 z-10 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
                  FREE
                </div>

                {/* Thumbnail Placeholder */}
                <div
                  className={`relative h-40 bg-gradient-to-br ${course.thumbnail}`}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background/90 transition-transform group-hover:scale-110">
                      <Play className="h-6 w-6 text-accent ml-1" />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-foreground">
                    {course.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {course.description}
                  </p>
                  <a
                    href="#"
                    className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
                  >
                    Watch on YouTube
                    <ArrowRight className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Banner */}
          <div className="mt-16 rounded-lg border border-accent bg-accent/10 p-8 text-center">
            <h2 className="text-xl font-semibold text-foreground">
              Want the full indicator + paid Discord + trade reviews?
            </h2>
            <Link
              to="/purchase"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 font-semibold text-white transition-colors hover:bg-accent/90"
            >
              View Pricing
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
