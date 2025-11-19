import React from 'react';
import { Menu, AudioWaveform, ArrowLeft } from 'lucide-react';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
  onBack?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, onMenuClick, onBack }) => {
  return (
    <header className="sticky top-0 z-30 bg-subsonic-bg/95 backdrop-blur-md border-b border-white/5 px-4 py-3 flex justify-between items-center h-[60px]">
      <div className="flex items-center gap-2">
        {onBack ? (
          <button onClick={onBack} className="text-white hover:text-subsonic-primary transition-colors md:hidden">
             <ArrowLeft size={24} />
          </button>
        ) : (
          <div className="flex items-center gap-2 md:hidden">
            <AudioWaveform className="text-subsonic-primary" size={24} />
          </div>
        )}
      </div>
      
      <h1 className="text-lg font-bold tracking-wide text-white flex-1 text-center md:text-left md:pl-0">{title}</h1>
      
      <button 
        onClick={onMenuClick}
        className="p-2 rounded-full hover:bg-white/10 transition-colors text-white md:hidden"
      >
        <Menu size={24} />
      </button>
    </header>
  );
};

export default Header;