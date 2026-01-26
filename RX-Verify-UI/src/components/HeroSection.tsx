import React from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';

const HeroSection: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-background-dark py-16 lg:py-24">
      {/* Abstract Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
      <div className="layout-container max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="flex flex-col gap-6 text-left z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 w-fit">
              <span className="size-2 rounded-full bg-success animate-pulse"></span>
              <span className="text-xs font-medium text-gray-300">System Operational</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-white">
              Secure the Global <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-primary">Supply Chain.</span>
            </h1>
            <p className="text-lg text-gray-400 max-w-xl leading-relaxed">
              The decentralized standard for pharmaceutical integrity. Verify with confidence using our blockchain-backed ledger for immutable tracking.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link 
                to="/join"
                className="h-12 px-8 rounded-lg bg-primary hover:bg-blue-600 text-white font-bold text-base shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2"
              >
                Start Verification
                <Icon name="arrow_forward" className="text-sm" />
              </Link>
              <button className="h-12 px-8 rounded-lg bg-surface-dark border border-white/10 hover:bg-white/5 text-white font-bold text-base transition-all flex items-center justify-center gap-2">
                View Documentation
              </button>
            </div>
          </div>
          {/* 3D Visualization Placeholder */}
          <div className="relative w-full aspect-square max-w-[500px] lg:max-w-none lg:aspect-video mx-auto lg:h-[400px] rounded-2xl overflow-hidden shadow-2xl border border-white/5 group">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent mix-blend-overlay"></div>
            <div 
              className="w-full h-full bg-cover bg-center opacity-80" 
              style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCca1XuTdnbkrxGcGGwkS8n0cK2PnYTsrnyln4ct_wO5g8lwRuHhgTGGyLVGkJpU86wWI-17Fa833TmFNpo_ChmQCHUZMXLmSQNag9nbAqOLg_j_mbYQI4TIuVq7VmcA8blID6agHZCczx6W4oVSWoyJPjlBX-u7bdq4jJZ_N-7Gy6rnisFqoA3cLTmQEiBGpZzlM3iRvmnl9H-6dxd9M2pbX9zbqvskvqqWDWO1If5UCBh5pvsjQrlFbB5CtCNwocIoXOVzTPnsg')" }}
            >
            </div>
            {/* UI Overlay on Hero Image */}
            <div className="absolute bottom-6 left-6 right-6 p-4 glass-panel rounded-lg flex items-center gap-4">
              <div className="size-10 rounded-full bg-success/20 flex items-center justify-center text-success border border-success/30">
                <Icon name="check_circle" />
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-400">Latest Batch Verified</div>
                <div className="text-sm font-bold text-white font-mono">ID: 0x7F...9A2</div>
              </div>
              <div className="text-xs font-bold text-success">100% Match</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
