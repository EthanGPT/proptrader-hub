import { Link, useLocation } from "react-router-dom";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMembership } from "@/context/MembershipContext";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Free Courses", href: "/courses" },
  { name: "Pricing", href: "/purchase" },
  { name: "Discord", href: "/discord" },
];

export function PublicNavbar() {
  const location = useLocation();
  const { tier } = useMembership();
  const isMember = tier !== 'free';

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-semibold text-foreground">The Edge</span>
        </Link>

        {/* Nav Links - Desktop */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-foreground",
                location.pathname === link.href
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* CTA Button */}
        <Link
          to={isMember ? "/dashboard" : "/purchase"}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90"
        >
          {isMember ? "Member Hub →" : "Get The Indicator →"}
        </Link>
      </div>

      {/* Mobile Nav Links */}
      <div className="flex items-center justify-center gap-6 border-t border-border py-3 md:hidden">
        {navLinks.map((link) => (
          <Link
            key={link.name}
            to={link.href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-foreground",
              location.pathname === link.href
                ? "text-foreground"
                : "text-muted-foreground"
            )}
          >
            {link.name}
          </Link>
        ))}
      </div>
    </nav>
  );
}
