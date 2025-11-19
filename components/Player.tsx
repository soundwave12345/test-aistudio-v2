import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipForward, SkipBack, ChevronDown, Shuffle, Repeat, Cast as CastIcon, Mic2 } from 'lucide-react';
import { Song, SubsonicCredentials, Lyrics } from '../types';
import { getStreamUrl, getLyrics } from '../services/subsonicService';
import { Capacitor } from '@capacitor/core';

interface PlayerProps {
  currentSong: Song | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  credentials: SubsonicCredentials;
  isExpanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
}

const Player: React.FC<PlayerProps> = ({ 
  currentSong, 
  isPlaying, 
  onPlayPause, 
  onNext, 
  onPrev, 
  credentials,
  isExpanded,
  onExpand,
  onCollapse
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  
  // Lyrics State
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyrics] = useState<Lyrics | null>(null);
  const [parsedLyrics, setParsedLyrics] = useState<{time: number, text: string}[]>([]);

  // --- DATA FETCHING ---
  useEffect(() => {
      if (currentSong) {
          setLyrics(null);
          setParsedLyrics([]);
          // Changed: Pass the full currentSong object, not just ID
          getLyrics(credentials, currentSong).then(l => {
              if (l) {
                  setLyrics(l);
                  parseLyrics(l.content);
              }
          });
      }
  }, [currentSong, credentials]);

  const parseLyrics = (content: string) => {
      const lines = content.split('\n');
      const parsed = [];
      // Regex for [mm:ss.xx]
      const timeReg = /\[(\d{2}):(\d{2})(\.\d{2,3})?\]/;
      
      let hasTimestamps = false;

      for (const line of lines) {
          const match = line.match(timeReg);
          if (match) {
              hasTimestamps = true;
              const min = parseInt(match[1]);
              const sec = parseInt(match[2]);
              const ms = match[3] ? parseFloat(match[3]) : 0;
              const time = min * 60 + sec + ms;
              const text = line.replace(timeReg, '').trim();
              if (text) parsed.push({ time, text });
          } else if (line.trim()) {
              // If mixed or no timestamps, just push with 0 or handle as plain text
              parsed.push({ time: -1, text: line.trim() });
          }
      }

      if (!hasTimestamps) {
          // Plain text lyrics
           setParsedLyrics(lines.map(l => ({ time: -1, text: l })));
      } else {
           setParsedLyrics(parsed);
      }
  };

  // --- AUDIO LOGIC ---
  // Handle Audio Source
  useEffect(() => {
    if (currentSong && audioRef.current) {
      const url = getStreamUrl(credentials, currentSong.id);
      if (audioRef.current.src !== url) {
        audioRef.current.src = url;
        audioRef.current.play()
          .catch(e => console.error("Autoplay blocked", e));
      }
    }
  }, [currentSong, credentials]);

  // Handle Play/Pause toggle
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
        audioRef.current.play().catch(e => console.warn("Play failed", e));
    } else {
        audioRef.current.pause();
    }
  }, [isPlaying]);

  // Android Auto / Media Session API Integration
  useEffect(() => {
    if ('mediaSession' in navigator && currentSong) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: currentSong.title,
            artist: currentSong.artist,
            album: currentSong.album,
            artwork: [
                { src: currentSong.coverArt, sizes: '512x512', type: 'image/jpeg' }
            ]
        });

        navigator.mediaSession.setActionHandler('play', onPlayPause);
        navigator.mediaSession.setActionHandler('pause', onPlayPause);
        navigator.mediaSession.setActionHandler('previoustrack', onPrev);
        navigator.mediaSession.setActionHandler('nexttrack', onNext);
    }
  }, [currentSong, onPlayPause, onPrev, onNext]);


  // Time Update Loop
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const cur = audioRef.current.currentTime;
      const dur = audioRef.current.duration;
      setCurrentTime(cur);
      if (dur && !isNaN(dur)) setProgress((cur / dur) * 100);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const val = Number(e.target.value);
      const dur = audioRef.current.duration;
      if (dur && !isNaN(dur)) {
        audioRef.current.currentTime = (val / 100) * dur;
        setProgress(val);
      }
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // --- CHROMECAST LOGIC ---
  const handleCast = async () => {
      // Initialize Cast context if available (Standard Web SDK)
      // Note: This usually requires HTTPS origin.
      if (window.cast && window.cast.framework) {
          const context = window.cast.framework.CastContext.getInstance();
          
          try {
              await context.requestSession();
              
              // If session connected, load media
              const session = context.getCurrentSession();
              if (session && currentSong) {
                  const url = getStreamUrl(credentials, currentSong.id);
                  const mediaInfo = new window.chrome.cast.media.MediaInfo(url, 'audio/mp3');
                  
                  mediaInfo.metadata = new window.chrome.cast.media.MusicTrackMediaMetadata();
                  mediaInfo.metadata.title = currentSong.title;
                  mediaInfo.metadata.artist = currentSong.artist;
                  mediaInfo.metadata.images = [new window.chrome.cast.Image(currentSong.coverArt)];

                  const request = new window.chrome.cast.media.LoadRequest(mediaInfo);
                  session.loadMedia(request).then(
                      () => console.log('Load succeed'),
                      (errorCode: any) => console.error('Error code: ' + errorCode)
                  );
              }
          } catch (e) {
              console.error("Cast error", e);
              if (window.location.protocol === 'http:') {
                  alert("Chromecast initiation failed. It likely requires the app to be served over HTTPS.");
              } else {
                  alert("Could not connect to Cast device.");
              }
          }
      } else {
          alert("Google Cast API is not available. If you are on Android/HTTP, this is a known limitation.");
      }
  };

  // --- UI RENDERING ---

  // Helper to get active lyric line
  const getActiveLyricIndex = () => {
      if (parsedLyrics.length === 0 || parsedLyrics[0].time === -1) return -1;
      for (let i = parsedLyrics.length - 1; i >= 0; i--) {
          if (currentTime >= parsedLyrics[i].time) return i;
      }
      return -1;
  };

  const activeLyricIndex = getActiveLyricIndex();

  // Auto scroll lyrics
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
      if (showLyrics && activeLyricIndex !== -1 && lyricsContainerRef.current) {
          const el = lyricsContainerRef.current.children[activeLyricIndex] as HTMLElement;
          if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
      }
  }, [activeLyricIndex, showLyrics]);

  return (
    <>
      {/* 1. Full Screen Player UI - Z-Index increased to 60 to cover bottom nav (z-50) */}
      {currentSong && isExpanded && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Super Blurred Chromatic Background */}
            <div 
              className="absolute inset-0 z-0 opacity-60 blur-3xl scale-150 pointer-events-none" 
              style={{ 
                  backgroundImage: `url(${currentSong.coverArt})`, 
                  backgroundSize: 'cover', 
                  backgroundPosition: 'center',
                  filter: 'saturate(200%) blur(80px)'
              }}
            />
            <div className="absolute inset-0 z-0 bg-black/40" />

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between px-6 py-8 md:py-6">
              <button onClick={onCollapse} className="text-white hover:text-subsonic-primary p-2 rounded-full hover:bg-white/10 transition-all">
                <ChevronDown size={32} />
              </button>
              <span className="text-xs font-bold tracking-widest uppercase text-white/80">Now Playing</span>
              {/* Cast Button - Only show if cast API might be available or just to indicate feature */}
              <button onClick={handleCast} className="text-white hover:text-subsonic-primary p-2">
                 <CastIcon size={24} />
              </button>
            </div>

            {/* Main Content: Toggle between Art and Lyrics */}
            <div className="relative z-10 flex-1 flex items-center justify-center p-6 min-h-0 overflow-hidden">
               {showLyrics && lyrics ? (
                   <div ref={lyricsContainerRef} className="w-full h-full overflow-y-auto hide-scrollbar text-center px-4 py-10 space-y-6 mask-image-gradient">
                        {parsedLyrics.map((line, i) => (
                            <p 
                                key={i} 
                                className={`text-xl md:text-2xl font-bold transition-all duration-300 ${
                                    parsedLyrics[0].time !== -1 
                                        ? (i === activeLyricIndex ? 'text-white scale-110' : 'text-white/30')
                                        : 'text-white/80'
                                }`}
                            >
                                {line.text}
                            </p>
                        ))}
                        <div className="h-20" /> {/* Spacer */}
                   </div>
               ) : (
                    <div className="w-full max-w-xs md:max-w-md aspect-square rounded-2xl overflow-hidden shadow-2xl border border-white/10 ring-1 ring-white/5 transition-transform duration-500">
                        <img 
                        src={currentSong.coverArt} 
                        alt="Cover" 
                        className="w-full h-full object-cover"
                        />
                    </div>
               )}
            </div>

            {/* Info & Controls */}
            <div className="relative z-10 pb-12 px-8 w-full max-w-2xl mx-auto bg-gradient-to-t from-black/80 to-transparent pt-10">
              <div className="flex justify-between items-end mb-6">
                  <div className="text-left min-w-0 flex-1 pr-4">
                    <h2 className="text-2xl md:text-3xl font-bold text-white truncate">{currentSong.title}</h2>
                    <p className="text-lg text-subsonic-secondary truncate mt-1">{currentSong.artist}</p>
                    <p className="text-sm text-white/50 truncate">{currentSong.album}</p>
                  </div>
                  {/* Lyrics Toggle Button */}
                  <button 
                    onClick={() => setShowLyrics(!showLyrics)}
                    disabled={!lyrics}
                    className={`p-3 rounded-full transition-all ${
                        showLyrics 
                            ? 'bg-white text-black' 
                            : (lyrics ? 'text-white hover:bg-white/10' : 'text-white/20 cursor-not-allowed')
                    }`}
                  >
                      <Mic2 size={24} fill={showLyrics ? "currentColor" : "none"} />
                  </button>
              </div>

              {/* Progress */}
              <div className="mb-8">
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={progress} 
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-subsonic-primary hover:accent-white transition-colors"
                />
                <div className="flex justify-between mt-2 text-xs font-medium text-white/60">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(currentSong.duration)}</span>
                </div>
              </div>

              {/* Main Controls */}
              <div className="flex flex-col gap-8">
                  <div className="flex items-center justify-between px-4 md:px-12">
                     <button className="text-subsonic-secondary hover:text-white transition-colors">
                        <Shuffle size={20} />
                     </button>
                     
                     <div className="flex items-center gap-8">
                        <button onClick={onPrev} className="text-white hover:text-subsonic-primary transition-colors active:scale-95">
                            <SkipBack size={36} fill="currentColor" />
                        </button>
                        
                        <button 
                            onClick={onPlayPause} 
                            className="w-20 h-20 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-white/10"
                        >
                            {isPlaying ? <Pause size={36} fill="currentColor" /> : <Play size={36} fill="currentColor" className="ml-1" />}
                        </button>

                        <button onClick={onNext} className="text-white hover:text-subsonic-primary transition-colors active:scale-95">
                            <SkipForward size={36} fill="currentColor" />
                        </button>
                     </div>

                     <button className="text-subsonic-secondary hover:text-white transition-colors">
                        <Repeat size={20} />
                     </button>
                  </div>
              </div>
            </div>
        </div>
      )}

      {/* 2. Mini Player UI - Always visible when not expanded, z-index just below full screen */}
      {currentSong && !isExpanded && (
        <div 
          onClick={onExpand}
          className="fixed z-40 bg-[#252525]/95 backdrop-blur-md border-t border-white/10 px-4 py-3 shadow-2xl
                        left-0 right-0 
                        bottom-[80px] md:bottom-0 
                        md:left-64 md:h-[90px] md:flex md:items-center cursor-pointer hover:bg-[#2a2a2a] transition-colors group"
        >
          <div className="w-full max-w-screen-xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <img 
                src={currentSong.coverArt} 
                alt="Cover" 
                className={`w-10 h-10 rounded bg-gray-800 object-cover shadow-sm`}
              />
              <div className="flex flex-col min-w-0">
                <h4 className="text-sm font-bold text-white truncate leading-tight">{currentSong.title}</h4>
                <p className="text-xs text-subsonic-secondary truncate">{currentSong.artist}</p>
              </div>
            </div>

            {/* Mini Player Controls - Explicitly added Play/Pause here */}
            <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
              <button onClick={onPrev} className="text-white hover:text-subsonic-primary transition-colors hidden sm:block">
                <SkipBack size={20} fill="currentColor" />
              </button>
              
              <button 
                onClick={onPlayPause} 
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 transition-transform shadow-lg shadow-white/10"
              >
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
              </button>

              <button onClick={onNext} className="text-white hover:text-subsonic-primary transition-colors">
                <SkipForward size={20} fill="currentColor" />
              </button>
            </div>
            <div className="hidden sm:block w-8"></div> 
          </div>
          
          {/* Mini Progress Bar */}
          <div className="absolute top-0 left-0 w-full h-0.5 bg-white/10">
            <div 
                className="h-full bg-subsonic-primary transition-all duration-500 ease-linear" 
                style={{ width: `${progress}%` }} 
            />
          </div>
        </div>
      )}

      {/* 3. Persistent Audio Element */}
      {currentSong && (
          <audio 
          ref={audioRef} 
          onTimeUpdate={handleTimeUpdate}
          onEnded={onNext}
          onError={(e) => console.error("Audio error", e)}
        />
      )}
    </>
  );
};

export default Player;