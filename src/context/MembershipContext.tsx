import React, { createContext, useContext, useState, ReactNode } from 'react';

type MembershipTier = 'free' | 'edge' | 'mentorship';

interface MembershipContextType {
  isMember: boolean;
  tier: MembershipTier;
  setTier: (tier: MembershipTier) => void;
  toggleMembership: () => void;
}

const MembershipContext = createContext<MembershipContextType | undefined>(undefined);

export function MembershipProvider({ children }: { children: ReactNode }) {
  const [tier, setTier] = useState<MembershipTier>('mentorship'); // Default to full access for dev

  const isMember = tier !== 'free';

  const toggleMembership = () => {
    // Cycle through: free -> edge -> mentorship -> free
    if (tier === 'free') setTier('edge');
    else if (tier === 'edge') setTier('mentorship');
    else setTier('free');
  };

  return (
    <MembershipContext.Provider value={{ isMember, tier, setTier, toggleMembership }}>
      {children}
    </MembershipContext.Provider>
  );
}

export function useMembership() {
  const context = useContext(MembershipContext);
  if (context === undefined) {
    throw new Error('useMembership must be used within a MembershipProvider');
  }
  return context;
}
