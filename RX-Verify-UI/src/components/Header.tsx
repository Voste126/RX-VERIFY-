import React from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';

interface HeaderProps {
  onLoginClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLoginClick }) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 glass-panel">
      <div className="layout-container flex h-full grow flex-col max-w-[1280px] mx-auto">
        <div className="flex items-center justify-between px-6 py-4 lg:px-10">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex items-center justify-center size-8 rounded bg-primary/20 text-primary">
              <Icon name="verified_user" />
            </div>
            <h2 className="text-lg font-bold tracking-tight text-white">RxVerify Lite</h2>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <a className="text-sm font-medium text-gray-300 hover:text-white transition-colors" href="#technology">Technology</a>
            <a className="text-sm font-medium text-gray-300 hover:text-white transition-colors" href="#roles">Roles</a>
            <a className="text-sm font-medium text-gray-300 hover:text-white transition-colors" href="#trust">Trust Score</a>
            <Link to="/join" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
              Join the Network
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <button 
              onClick={onLoginClick}
              className="flex cursor-pointer items-center justify-center rounded-lg h-9 px-6 bg-primary hover:bg-blue-600 text-white text-sm font-bold shadow-[0_0_10px_rgba(0,85,255,0.3)] transition-all"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
