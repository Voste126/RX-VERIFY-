import React from 'react';

interface TrustGaugeProps {
  score: number;
}

const TrustGauge: React.FC<TrustGaugeProps> = ({ score }) => {
  // Calculate rotation based on score (0-100)
  // 0 = -90deg (left), 100 = 90deg (right)
  const rotation = (score / 100) * 180 - 90;

  return (
    <div className="relative w-full max-w-[400px] h-[200px] mx-auto">
      {/* The Gauge Arc */}
      <div className="absolute inset-0 gauge-arc"></div>
      {/* The Needle */}
      <div 
        className="absolute bottom-0 left-1/2 w-[4px] h-[180px] bg-white origin-bottom rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-transform duration-1000 ease-out z-10"
        style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
      >
        <div className="absolute -top-1 -left-1.5 size-4 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
      </div>
      {/* Center Hub */}
      <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-8 h-4 bg-[#1b1f28] rounded-t-full border-t border-gray-700 z-20"></div>
      {/* Labels */}
      <div className="absolute -left-8 bottom-0 text-danger font-bold">0</div>
      <div className="absolute -right-8 bottom-0 text-success font-bold">100</div>
    </div>
  );
};

export default TrustGauge;
