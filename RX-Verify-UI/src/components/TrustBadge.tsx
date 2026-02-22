import React from 'react';
import { ShieldCheck, AlertTriangle, XOctagon } from 'lucide-react';

interface TrustBadgeProps {
  score: number | string;
}

const TrustBadge: React.FC<TrustBadgeProps> = ({ score }) => {
  const numericScore = typeof score === 'string' ? parseFloat(score) : score;
  const roundedScore = Math.round(numericScore);
  
  if (numericScore >= 90) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00C853]/10 text-[#00C853] border border-[#00C853]/30 text-xs font-bold">
        <ShieldCheck className="w-4 h-4" />
        {roundedScore}% - Authentic
      </span>
    );
  }
  
  if (numericScore >= 70) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFD60A]/10 text-[#FFD60A] border border-[#FFD60A]/30 text-xs font-bold shadow-[0_0_10px_rgba(255,214,10,0.2)] animate-pulse">
        <AlertTriangle className="w-4 h-4" />
        {roundedScore}% - Caution
      </span>
    );
  }
  
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D50000]/10 text-[#D50000] border border-[#D50000]/30 text-xs font-bold shadow-[0_0_10px_rgba(213,0,0,0.3)]">
      <XOctagon className="w-4 h-4" />
      {roundedScore}% - Critical
    </span>
  );
};

export default TrustBadge;
