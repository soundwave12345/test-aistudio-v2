import React from 'react';
import { Home, ListMusic, Disc, Music, Radio } from 'lucide-react';
import { ViewState } from '../types';

interface BottomNavProps {
  activeTab: ViewState;
  onChange: (tab: ViewState) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChange }) => {
  const navItems = [
    { id: ViewState.HOME, label: 'Home', icon: Home },
    { id: ViewState.PLAYLISTS, label: 'Playlists', icon: ListMusic },
    { id: ViewState.ALBUMS, label: 'Albums', icon: Disc },
    { id: ViewState.SONGS, label: 'Songs', icon: Music },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-subsonic-card border-t border-white/10 pb-safe pt-2 px-2 h-[80px] md:h-[70px] z-50">
      <div className="flex justify-around items-center h-full pb-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${
                isActive ? 'text-subsonic-primary' : 'text-subsonic-secondary hover:text-white'
              }`}
            >
              <Icon size={24} className={isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]'} />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;