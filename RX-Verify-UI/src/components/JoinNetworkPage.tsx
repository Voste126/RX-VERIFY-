import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from './Icon';
import RoleCard from './RoleCard';

const JoinNetworkPage: React.FC = () => {
  const navigate = useNavigate();

  const handleRoleSelect = (role: string) => {
    navigate(`/register/${role}`);
  };

  return (
    <div className="min-h-screen flex flex-col font-display bg-background-dark text-white">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background-dark/80 backdrop-blur-md">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
              <Icon name="verified_user" className="text-2xl" />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-white">RxVerify Lite</h1>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <a className="text-sm font-medium text-slate-300 hover:text-white transition-colors" href="#">
              Help
            </a>
            <a className="text-sm font-medium text-slate-300 hover:text-white transition-colors" href="#">
              Documentation
            </a>
            <button className="bg-primary hover:bg-primary/90 text-white text-sm font-bold px-5 py-2 rounded-lg transition-all shadow-[0_0_15px_rgba(0,85,255,0.3)]">
              Login
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
        {/* Abstract Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
        
        <div className="max-w-[1000px] w-full flex flex-col gap-12">
          {/* Page Heading */}
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white">
              Join the Network
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Select your role to begin secure verification. Access the ledger, manage nodes, or track medication history securely.
            </p>
          </div>

          {/* Role Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            <RoleCard
              icon="shield_person"
              title="Patient"
              description="Verify medications, track prescription history, and manage personal health data securely."
              onClick={() => handleRoleSelect('patient')}
            />
            <RoleCard
              icon="local_pharmacy"
              title="Pharmacist"
              description="Dispense securely, update the central ledger, and verify authenticity in real-time."
              onClick={() => handleRoleSelect('pharmacist')}
            />
            <RoleCard
              icon="hub"
              title="Distributor"
              description="Manage supply chain nodes, track logistics, and secure bulk transfers across the network."
              onClick={() => handleRoleSelect('distributor')}
            />
          </div>

          {/* Footer Links */}
          <div className="flex justify-center gap-6 pt-8 border-t border-white/5">
            <span className="text-sm text-slate-400">
              Already have an account?{' '}
              <a className="text-primary hover:text-primary/80 font-medium ml-1" href="#">
                Log in here
              </a>
            </span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default JoinNetworkPage;
