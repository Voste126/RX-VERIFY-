import React from 'react';
import Icon from './Icon';

interface RoleCardProps {
  icon: string;
  title: string;
  description: string;
  onClick?: () => void;
}

const RoleCard: React.FC<RoleCardProps> = ({ icon, title, description, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="group relative glass-panel p-8 rounded-xl flex flex-col items-center text-center gap-6 cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:border-primary/50 hover:shadow-[0_0_30px_rgba(0,85,255,0.2)]"
    >
      <div className="size-20 rounded-full bg-white/5 group-hover:bg-primary/10 flex items-center justify-center border border-white/5 transition-colors duration-300">
        <Icon name={icon} className="text-5xl text-slate-400 group-hover:text-primary transition-colors duration-300" />
      </div>
      <div className="space-y-2">
        <h3 className="text-2xl font-bold text-white group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          {description}
        </p>
      </div>
      <div className="mt-auto pt-4">
        <span className="text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider flex items-center gap-1">
          Get Started <Icon name="arrow_forward" className="text-sm" />
        </span>
      </div>
    </div>
  );
};

export default RoleCard;
