import React, { useEffect, useRef } from 'react';
import Icon from './Icon';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticate?: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthenticate }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleAuthenticate = (e: React.FormEvent) => {
    e.preventDefault();
    if (onAuthenticate) {
      onAuthenticate();
    }
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="glass-panel w-full max-w-md rounded-xl p-8 shadow-2xl transform scale-100 transition-all relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <Icon name="close" />
        </button>
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-2">Secure Login</h3>
            <p className="text-gray-400 text-sm">Enter your credentials to access the JWT secured verification portal.</p>
          </div>
          <form className="flex flex-col gap-4" onSubmit={handleAuthenticate}>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Node ID / Email</label>
              <input 
                className="w-full bg-[#0f1623] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" 
                placeholder="user@rxverify.io" 
                type="email"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Private Key Passphrase</label>
              <input 
                className="w-full bg-[#0f1623] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" 
                placeholder="••••••••••••" 
                type="password"
                required
              />
            </div>
            <button type="submit" className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-3 rounded-lg shadow-[0_0_15px_rgba(0,85,255,0.4)] transition-all">
              Authenticate
            </button>
          </form>
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mt-2">
            <Icon name="lock" className="text-[16px]" />
            <span>256-bit TLS Encrypted Connection</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
