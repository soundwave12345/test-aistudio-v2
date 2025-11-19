import React from 'react';
import { Home, ListMusic, Disc, Music, Settings, AudioWaveform } from 'lucide-react';
import { ViewState } from '../types';

interface NavigationProps {
  activeTab: ViewState;
  onChange: (tab: ViewState) => void;
  onSettingsClick: () => void;
}

export const MobileBottomNav: React.FC<NavigationProps> = ({ activeTab, onChange }) => {
  const navItems = [
    { id: ViewState.HOME, label: 'Home', icon: Home },
    { id: ViewState.PLAYLISTS, label: 'Playlists', icon: ListMusic },
    { id: ViewState.ALBUMS, label: 'Albums', icon: Disc },
    { id: ViewState.SONGS, label: 'Songs', icon: Music },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-subsonic-card border-t border-white/10 pb-safe pt-2 px-2 h-[80px] z-50">
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

export const DesktopSidebar: React.FC<NavigationProps> = ({ activeTab, onChange, onSettingsClick }) => {
  const navItems = [
    { id: ViewState.HOME, label: 'Home', icon: Home },
    { id: ViewState.PLAYLISTS, label: 'Playlists', icon: ListMusic },
    { id: ViewState.ALBUMS, label: 'Albums', icon: Disc },
    { id: ViewState.SONGS, label: 'Songs', icon: Music },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-subsonic-card border-r border-white/10 h-full z-40">
      {/* Logo Area */}
      <div className="p-6 flex items-center gap-3">
        <AudioWaveform className="text-subsonic-primary" size={32} />
        <h1 className="text-xl font-bold tracking-wide text-white">GeminiStream</h1>
      </div>

      {/* Nav Items */}
      <div className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
             <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`flex items-center gap-4 w-full px-4 py-3 rounded-lg transition-all duration-200 group ${
                isActive ? 'bg-subsonic-primary/10 text-subsonic-primary' : 'text-subsonic-secondary hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={20} className={isActive ? 'stroke-[2.5px]' : 'stroke-[2px] group-hover:stroke-white'} />
              <span className="text-sm font-bold">{item.label}</span>
            </button>
          )
        })}
      </div>

      {/* Settings at Bottom */}
      <div className="p-4 border-t border-white/10">
         <button
            onClick={onSettingsClick}
            className="flex items-center gap-4 w-full px-4 py-3 rounded-lg text-subsonic-secondary hover:bg-white/5 hover:text-white transition-colors"
          >
            <Settings size={20} />
            <span className="text-sm font-bold">Settings</span>
          </button>
      </div>
    </aside>
  )
}