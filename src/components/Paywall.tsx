import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { useMembership } from "@/context/MembershipContext";

interface PaywallProps {
  children: ReactNode;
  requiredTier?: 'edge' | 'mentorship';
  title?: string;
  description?: string;
}

export function Paywall({
  children,
  requiredTier = 'edge',
  title = "This is a Member Benefit",
  description = "Upgrade your membership to access this feature."
}: PaywallProps) {
  const { tier } = useMembership();

  const hasAccess = requiredTier === 'edge'
    ? (tier === 'edge' || tier === 'mentorship')
    : tier === 'mentorship';

  if (hasAccess) {
    return <>{children}</>;
  }

  const isForMentorship = requiredTier === 'mentorship';

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="text-center">
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
          isForMentorship ? 'bg-gold/20' : 'bg-accent/20'
        }`}>
          <Lock className={`h-8 w-8 ${isForMentorship ? 'text-gold' : 'text-accent'}`} />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-foreground">{title}</h1>
        <p className="mt-3 max-w-md text-muted-foreground">{description}</p>
        <Link
          to="/purchase"
          className={`mt-8 inline-flex items-center gap-2 rounded-lg px-6 py-3 font-semibold transition-colors ${
            isForMentorship
              ? 'border border-gold text-gold hover:bg-gold/10'
              : 'bg-accent text-white hover:bg-accent/90'
          }`}
        >
          {isForMentorship ? 'Apply for Mentorship — $199/mo →' : 'Join Edge — $79/mo →'}
        </Link>
      </div>
    </div>
  );
}
