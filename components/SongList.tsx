import React from 'react';
import { Play, Clock } from 'lucide-react';
import { Song } from '../types';

interface SongListProps {
  title: string;
  subtitle: string;
  coverArt: string;
  songs: Song[];
  onPlaySong: (song: Song) => void;
  showCovers?: boolean;
}

const SongList: React.FC<SongListProps> = ({ title, subtitle, coverArt, songs, onPlaySong, showCovers = false }) => {
  
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="pb-32 animate-in fade-in duration-500">
      {/* Header info */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-6 p-6 bg-gradient-to-b from-white/10 to-transparent">
        <div className="w-48 h-48 shadow-2xl rounded-lg overflow-hidden flex-shrink-0 bg-black/20">
          <img src={coverArt} alt={title} className="w-full h-full object-cover" />
        </div>
        <div className="text-center md:text-left flex-1">
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-2">{title}</h2>
          <p className="text-lg text-subsonic-secondary font-medium">{subtitle}</p>
          <p className="text-sm text-white/60 mt-1">{songs.length} Songs</p>
        </div>
      </div>

      {/* Song List */}
      <div className="px-2 md:px-6 mt-4">
        <div className="flex flex-col gap-1">
            {songs.map((song, index) => (
                <div 
                    key={song.id}
                    onClick={() => onPlaySong(song)}
                    className="group flex items-center gap-4 p-3 rounded-lg hover:bg-white/10 cursor-pointer transition-colors border-b border-white/5 last:border-0"
                >
                    {/* Row Start: Track Number or Cover */}
                    {showCovers ? (
                       <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-white/5">
                         <img src={song.coverArt} alt="" className="w-full h-full object-cover" loading="lazy" />
                       </div>
                    ) : (
                       <div className="w-8 text-center text-subsonic-secondary text-sm font-mono group-hover:hidden">
                           {song.track || index + 1}
                       </div>
                    )}

                    {/* Hover Play Icon (Replaces track num if no cover, or overlays cover if implemented differently, but here we just hide track num) */}
                    {!showCovers && (
                        <div className="w-8 hidden group-hover:flex items-center justify-center text-subsonic-primary">
                             <Play size={16} fill="currentColor" />
                        </div>
                    )}

                    <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium truncate">{song.title}</h4>
                        <p className="text-subsonic-secondary text-xs truncate">{song.artist}</p>
                    </div>

                    <div className="flex items-center gap-2 text-subsonic-secondary text-xs font-mono">
                         <Clock size={12} />
                         <span>{formatTime(song.duration)}</span>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default SongList;