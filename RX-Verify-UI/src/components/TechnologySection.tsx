import React from 'react';
import Icon from './Icon';
import TerminalVisualization from './TerminalVisualization';

const TechnologySection: React.FC = () => {
  return (
    <section className="py-20 bg-surface-dark border-y border-white/5 relative" id="technology">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
      <div className="layout-container max-w-[1280px] mx-auto px-6 lg:px-10 flex flex-col lg:flex-row items-center gap-16">
        <div className="flex-1 space-y-8">
          <div className="inline-block px-3 py-1 rounded bg-primary/10 text-primary text-xs font-bold tracking-wider uppercase mb-2">Ed25519 Standard</div>
          <h2 className="text-3xl lg:text-4xl font-bold text-white">Cryptographic Verification Engine</h2>
          <p className="text-gray-400 text-lg">
            Every scan queries our decentralized ledger. We utilize Ed25519 signatures to ensure that product data has not been tampered with since leaving the manufacturer.
          </p>
          <ul className="space-y-4 mt-4">
            <li className="flex items-center gap-4">
              <Icon name="check_circle" className="text-success" />
              <span className="text-gray-300">128-bit security level</span>
            </li>
            <li className="flex items-center gap-4">
              <Icon name="check_circle" className="text-success" />
              <span className="text-gray-300">High-speed verification (&lt; 2ms)</span>
            </li>
            <li className="flex items-center gap-4">
              <Icon name="check_circle" className="text-success" />
              <span className="text-gray-300">Resistant to side-channel attacks</span>
            </li>
          </ul>
        </div>
        {/* Terminal Visualizer */}
        <div className="flex-1 w-full max-w-lg">
          <TerminalVisualization />
        </div>
      </div>
    </section>
  );
};

export default TechnologySection;
