import React, { useEffect, useState } from 'react';

interface TrustGaugeProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

const TrustGauge: React.FC<TrustGaugeProps> = ({ 
  score, 
  size = 200, 
  strokeWidth = 16 
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  // Easing and number count up animation
  useEffect(() => {
    const startTime = Date.now();
    const duration = 1500; // 1.5 seconds target duration
    
    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      
      // Easing function (easeOutCubic)
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      setAnimatedScore(Math.round(score * easeProgress));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [score]);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  // Offset needs to be initialized completely hidden, then animates when score changes
  const [animatedOffset, setAnimatedOffset] = useState(circumference);

  useEffect(() => {
    // Small timeout ensures CSS transition catches the change from initial state
    const timeout = setTimeout(() => {
      setAnimatedOffset(circumference - (score / 100) * circumference);
    }, 50);
    return () => clearTimeout(timeout);
  }, [score, circumference]);

  let color = '#D50000'; // Danger Red
  if (score >= 90) color = '#00C853'; // Success Green
  else if (score >= 70) color = '#FFD60A'; // Warning Yellow

  return (
    <div className="relative flex items-center justify-center font-display" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90 drop-shadow-xl"
      >
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-800"
        />
        {/* Animated Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animatedOffset}
          style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.215, 0.610, 0.355, 1.00)' }}
        />
      </svg>
      {/* Score Text inside gauge */}
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-4xl font-black tabular-nums tracking-tight" style={{ color }}>{animatedScore}</span>
        <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mt-1">Trust Score</span>
      </div>
    </div>
  );
};

export default TrustGauge;
