import React, { useState, useEffect, useRef } from 'react';
import TrustGauge from './TrustGauge';

const TrustScoreSection: React.FC = () => {
  const targetScore = 98;
  const [animatedScore, setAnimatedScore] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const getConfidenceLevel = (score: number): string => {
    if (score >= 80) return 'High Confidence';
    if (score >= 50) return 'Moderate Confidence';
    return 'Low Confidence';
  };

  const getConfidenceColor = (score: number): string => {
    if (score >= 80) return 'text-success';
    if (score >= 50) return 'text-warning';
    return 'text-danger';
  };

  // Intersection Observer to detect when section is in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      {
        threshold: 0.3, // Trigger when 30% of the section is visible
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  // Animate score when visible
  useEffect(() => {
    if (isVisible) {
      // Animate from current value to target
      const duration = 1500; // 1.5 seconds
      const steps = 60;
      const increment = targetScore / steps;
      let current = 0;
      let step = 0;

      const timer = setInterval(() => {
        step++;
        current = Math.min(Math.round(step * increment), targetScore);
        setAnimatedScore(current);

        if (current >= targetScore) {
          clearInterval(timer);
        }
      }, duration / steps);

      return () => clearInterval(timer);
    } else {
      // Reset to 0 when not visible
      setAnimatedScore(0);
    }
  }, [isVisible]);

  return (
    <section ref={sectionRef} className="py-24 bg-[#0f1623]" id="trust">
      <div className="layout-container max-w-[1280px] mx-auto px-6 lg:px-10 text-center">
        <h2 className="text-3xl font-bold text-white mb-12">Real-time Trust Scoring</h2>
        <TrustGauge score={animatedScore} />
        <div className="flex flex-col items-center gap-2 mt-10">
          <div className="text-6xl font-black text-white tracking-tighter">
            {animatedScore}
            <span className="text-2xl text-gray-500 font-medium align-top ml-1">/100</span>
          </div>
          <div className={`${getConfidenceColor(animatedScore)} font-bold uppercase tracking-widest text-sm`}>
            {getConfidenceLevel(animatedScore)}
          </div>
          <p className="text-gray-400 max-w-md mt-4">
            Our proprietary algorithm evaluates manufacturer reputation, shipping route anomalies, and temperature log data in real-time.
          </p>
        </div>
      </div>
    </section>
  );
};

export default TrustScoreSection;
