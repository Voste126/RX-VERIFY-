import React from 'react';
import Icon from './Icon';

interface ErrorModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'error' | 'success' | 'warning' | 'info';
  onClose: () => void;
}

const ErrorModal: React.FC<ErrorModalProps> = ({ 
  isOpen, 
  title, 
  message, 
  type = 'error',
  onClose 
}) => {
  if (!isOpen) return null;

  // Icon and color based on type
  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'check_circle',
          iconColor: 'text-green-400',
          iconBg: 'bg-green-500/20',
          iconBorder: 'border-green-500/30',
          buttonBg: 'bg-green-600 hover:bg-green-700',
          emoji: '✅'
        };
      case 'warning':
        return {
          icon: 'warning',
          iconColor: 'text-yellow-400',
          iconBg: 'bg-yellow-500/20',
          iconBorder: 'border-yellow-500/30',
          buttonBg: 'bg-yellow-600 hover:bg-yellow-700',
          emoji: '⚠️'
        };
      case 'info':
        return {
          icon: 'info',
          iconColor: 'text-blue-400',
          iconBg: 'bg-blue-500/20',
          iconBorder: 'border-blue-500/30',
          buttonBg: 'bg-blue-600 hover:bg-blue-700',
          emoji: 'ℹ️'
        };
      default: // error
        return {
          icon: 'error',
          iconColor: 'text-red-400',
          iconBg: 'bg-red-500/20',
          iconBorder: 'border-red-500/30',
          buttonBg: 'bg-red-600 hover:bg-red-700',
          emoji: '❌'
        };
    }
  };

  const config = getTypeConfig();

  return (
    <>
      {/* Backdrop - freezes the screen */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998] animate-fadeIn"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 pointer-events-none">
        <div 
          className="relative w-full max-w-md bg-[#0a0e1a] rounded-2xl border border-white/10 shadow-2xl pointer-events-auto animate-slideUp"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Gradient glow effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-primary opacity-20 rounded-2xl blur-sm -z-10" />
          
          {/* Header with icon */}
          <div className="p-6 pb-4">
            <div className="flex items-start gap-4">
              <div className={`size-12 rounded-full ${config.iconBg} border ${config.iconBorder} flex items-center justify-center shrink-0`}>
                <Icon name={config.icon} className={`text-2xl ${config.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">{message}</p>
              </div>
            </div>
          </div>
          
          {/* Footer with button */}
          <div className="px-6 pb-6 pt-2">
            <button
              onClick={onClose}
              className={`w-full h-11 rounded-lg ${config.buttonBg} text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2`}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ErrorModal;
