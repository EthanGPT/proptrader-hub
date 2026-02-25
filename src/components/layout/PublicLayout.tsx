import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { PublicNavbar } from "./PublicNavbar";
import { TrendingUp } from "lucide-react";

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-foreground">The Edge</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Home
            </Link>
            <Link
              to="/courses"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Courses
            </Link>
            <Link
              to="/purchase"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Pricing
            </Link>
            <Link
              to="/discord"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Discord
            </Link>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 border-t border-border pt-8">
          <p className="text-center text-xs text-muted-foreground">
            Not financial advice. For educational purposes only. Trading futures involves
            substantial risk of loss and is not suitable for all investors. Past performance
            is not indicative of future results.
          </p>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} The Edge. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
