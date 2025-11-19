import React, { useState, useEffect } from 'react';
import { MobileBottomNav, DesktopSidebar } from './components/Navigation';
import Header from './components/Header';
import SettingsModal from './components/SettingsModal';
import MediaCard from './components/MediaCard';
import Player from './components/Player';
import SongList from './components/SongList';
import SearchInput from './components/SearchInput';
import { SubsonicCredentials, ViewState, Song, Album, Playlist } from './types';
import { 
  getRecentAlbums, 
  getPlaylists, 
  getRandomSongs,
  getAlbumDetails,
  getPlaylistDetails,
  searchLibrary
} from './services/subsonicService';

const App: React.FC = () => {
  // --- State ---
  const [activeTab, setActiveTab] = useState<ViewState>(ViewState.HOME);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Credentials
  const [credentials, setCredentials] = useState<SubsonicCredentials>(() => {
    const saved = localStorage.getItem('subsonic_creds');
    return saved ? JSON.parse(saved) : {
      url: '',
      username: '',
      password: '',
    };
  });

  // Player State
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);

  // Data State
  const [songs, setSongs] = useState<Song[]>([]); // For the "Songs" tab list
  const [playbackContextSongs, setPlaybackContextSongs] = useState<Song[]>([]); // For the actual queue
  
  const [recentAlbums, setRecentAlbums] = useState<Album[]>([]); // Newest Albums
  const [recentlyPlayedAlbums, setRecentlyPlayedAlbums] = useState<Album[]>([]); // Last Played

  const [albums, setAlbums] = useState<Album[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{songs: Song[], albums: Album[]}>({ songs: [], albums: [] });
  const [isSearching, setIsSearching] = useState(false);

  // Drill Down State
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);

  // --- Initialization & Fetching ---

  // 1. Check credentials on load
  useEffect(() => {
    if (!credentials.url || !credentials.username) {
        setIsSettingsOpen(true);
    }
  }, [credentials]);

  // 2. Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      if (!credentials.url) return;

      try {
        // Fetch standard dashboard data
        const [fetchedPlaylists, fetchedNewestAlbums, fetchedRecentAlbums, fetchedSongs] = await Promise.all([
          getPlaylists(credentials),
          getRecentAlbums(credentials, 20, 'newest'), // For "Newest" section
          getRecentAlbums(credentials, 20, 'recent'), // For "Recently Played" section
          getRandomSongs(credentials, 100) // Initial songs list (100)
        ]);

        setPlaylists(fetchedPlaylists);
        setRecentAlbums(fetchedNewestAlbums);
        setRecentlyPlayedAlbums(fetchedRecentAlbums);
        setSongs(fetchedSongs);

        // Also fetch a larger list of albums for the Albums Tab if user goes there (lazy load ideally, but pre-fetching for now)
        getRecentAlbums(credentials, 500, 'newest').then(setAlbums);
      } catch (e) {
        console.error("Failed to fetch initial data", e);
      }
    };
    fetchData();
  }, [credentials]);

  // --- Search Effect ---
  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      try {
        const results = await searchLibrary(credentials, searchQuery);
        setSearchResults(results);
      } catch (e) {
        console.error("Search failed", e);
      } finally {
        setIsSearching(false);
      }
    };

    // Debounce 500ms
    const timeoutId = setTimeout(performSearch, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, credentials]);

  // --- Handlers ---
  
  const handleLoadMoreSongs = async () => {
      // Load 100 more random songs to append to the library view
      const newSongs = await getRandomSongs(credentials, 100);
      setSongs(prev => [...prev, ...newSongs]);
  };

  const handleTabChange = (tab: ViewState) => {
    setActiveTab(tab);
    setSelectedAlbum(null);
    setSelectedPlaylist(null);
    setSearchQuery(''); // Reset search when changing tabs
  };

  const handleBack = () => {
    if (activeTab === ViewState.ALBUM_DETAILS) {
      setSelectedAlbum(null);
      setActiveTab(ViewState.ALBUMS);
    } else if (activeTab === ViewState.PLAYLIST_DETAILS) {
      setSelectedPlaylist(null);
      setActiveTab(ViewState.PLAYLISTS);
    }
  };

  const handleAlbumClick = async (album: Album) => {
      const detailedAlbum = await getAlbumDetails(credentials, album.id);
      if (detailedAlbum) setSelectedAlbum(detailedAlbum);
      setActiveTab(ViewState.ALBUM_DETAILS);
  };

  const handlePlaylistClick = async (playlist: Playlist) => {
      const detailedPlaylist = await getPlaylistDetails(credentials, playlist.id);
      if (detailedPlaylist) setSelectedPlaylist(detailedPlaylist);
      setActiveTab(ViewState.PLAYLIST_DETAILS);
  };

  const handleSettingsSave = (creds: SubsonicCredentials) => {
    setCredentials(creds);
    localStorage.setItem('subsonic_creds', JSON.stringify(creds));
  };

  const handlePlaySong = (song: Song, contextSongs?: Song[]) => {
    // If playing from a specific context (album/playlist), update the queue
    if (contextSongs && contextSongs.length > 0) {
        setPlaybackContextSongs(contextSongs);
    } else {
        // If playing from the Songs tab (which is a random list), use that as context
        setPlaybackContextSongs(songs);
    }
    setCurrentSong(song);
    setIsPlaying(true);
    setIsPlayerExpanded(true);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (!currentSong || playbackContextSongs.length === 0) return;
    const idx = playbackContextSongs.findIndex(s => s.id === currentSong.id);
    if (idx === -1) {
        // Song not in current context, just play first of context
        setCurrentSong(playbackContextSongs[0]);
        return;
    }
    const nextIdx = (idx + 1) % playbackContextSongs.length;
    setCurrentSong(playbackContextSongs[nextIdx]);
    setIsPlaying(true);
  };

  const handlePrev = () => {
     if (!currentSong || playbackContextSongs.length === 0) return;
    const idx = playbackContextSongs.findIndex(s => s.id === currentSong.id);
    if (idx === -1) {
        setCurrentSong(playbackContextSongs[0]);
        return;
    }
    const prevIdx = (idx - 1 + playbackContextSongs.length) % playbackContextSongs.length;
    setCurrentSong(playbackContextSongs[prevIdx]);
    setIsPlaying(true);
  };

  // --- Render Content ---
  const renderContent = () => {
    switch (activeTab) {
      case ViewState.HOME:
        return (
          <div className="space-y-8 pb-32 animate-in fade-in duration-500">
            
            {/* Recently Played Albums Section (Last Played) */}
            <section className="space-y-3">
              <div className="flex items-center justify-between px-4">
                <h2 className="text-lg font-bold text-white">Recently Played</h2>
              </div>
              {recentlyPlayedAlbums.length > 0 ? (
                <div className="flex overflow-x-auto px-4 gap-4 pb-4 hide-scrollbar snap-x snap-mandatory">
                    {recentlyPlayedAlbums.map((album) => (
                    <div key={album.id} className="snap-start">
                        <MediaCard 
                        image={album.coverArt} 
                        title={album.title} 
                        subtitle={album.artist} 
                        size="medium"
                        onClick={() => handleAlbumClick(album)}
                        />
                    </div>
                    ))}
                </div>
              ) : (
                  <div className="px-4 text-sm text-gray-500">Start listening to see your history here.</div>
              )}
            </section>

            {/* Recently Added (Newest) Section */}
            <section className="space-y-3">
              <div className="flex items-center justify-between px-4">
                <h2 className="text-lg font-bold text-white">New Arrivals</h2>
                <button className="text-xs text-subsonic-primary font-semibold" onClick={() => handleTabChange(ViewState.ALBUMS)}>See All</button>
              </div>
              <div className="flex overflow-x-auto px-4 gap-4 pb-4 hide-scrollbar snap-x snap-mandatory">
                {recentAlbums.map((album) => (
                  <div key={album.id} className="snap-start">
                     <MediaCard 
                      image={album.coverArt} 
                      title={album.title} 
                      subtitle={album.artist} 
                      size="large"
                      onClick={() => handleAlbumClick(album)}
                    />
                  </div>
                ))}
              </div>
            </section>

             {/* Playlists Section */}
             <section className="space-y-3">
              <div className="flex items-center justify-between px-4">
                <h2 className="text-lg font-bold text-white">Playlists</h2>
                <button className="text-xs text-subsonic-primary font-semibold" onClick={() => handleTabChange(ViewState.PLAYLISTS)}>See All</button>
              </div>
              <div className="flex overflow-x-auto px-4 gap-4 pb-4 hide-scrollbar snap-x snap-mandatory">
                {playlists.slice(0, 10).map((playlist) => (
                  <div key={playlist.id} className="snap-start">
                     <MediaCard 
                      image={playlist.coverArt} 
                      title={playlist.name} 
                      subtitle={`${playlist.songCount} songs`} 
                      size="small"
                      onClick={() => handlePlaylistClick(playlist)}
                    />
                  </div>
                ))}
              </div>
            </section>
          </div>
        );

      case ViewState.PLAYLISTS:
        return (
          <div className="p-4 pb-32 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
             {playlists.length === 0 ? <div className="text-gray-500 col-span-full text-center">No playlists found</div> : 
               playlists.map((playlist, i) => (
                <MediaCard 
                  key={`${playlist.id}-${i}`}
                  image={playlist.coverArt} 
                  title={playlist.name} 
                  subtitle={`${playlist.songCount} songs`} 
                  size="medium"
                  onClick={() => handlePlaylistClick(playlist)}
                />
             ))}
          </div>
        );

      case ViewState.ALBUMS:
        // Determine which data to show: Search results or default list
        const albumsDisplay = searchQuery ? searchResults.albums : albums;

        return (
          <div className="p-4 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <SearchInput 
                value={searchQuery} 
                onChange={setSearchQuery} 
                placeholder="Search albums..." 
            />
            
            {albumsDisplay.length === 0 && (
                <div className="text-gray-500 text-center py-10">
                    {isSearching ? 'Searching...' : (searchQuery ? 'No albums found.' : 'No albums found.')}
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {albumsDisplay.map((album, i) => (
                    <MediaCard 
                    key={`${album.id}-${i}`}
                    image={album.coverArt} 
                    title={album.title} 
                    subtitle={album.artist} 
                    size="medium"
                    onClick={() => handleAlbumClick(album)}
                    />
                ))}
            </div>
          </div>
        );

      case ViewState.SONGS:
        const songsDisplay = searchQuery ? searchResults.songs : songs;

        return (
          <div className="p-4 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-300">
             <SearchInput 
                value={searchQuery} 
                onChange={setSearchQuery} 
                placeholder="Search songs..." 
            />

             {songsDisplay.length === 0 && (
                <div className="text-gray-500 text-center py-10">
                    {isSearching ? 'Searching...' : (searchQuery ? 'No songs found.' : 'No songs found.')}
                </div>
            )}

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {songsDisplay.map((song, i) => (
                    <MediaCard 
                    key={`${song.id}-${i}`}
                    image={song.coverArt} 
                    title={song.title} 
                    subtitle={song.artist} 
                    variant="horizontal"
                    onClick={() => handlePlaySong(song, songsDisplay)}
                    />
                ))}
             </div>
             
             {/* Show Load More only if NOT searching */}
             {!searchQuery && (
                 <div className="mt-8 flex justify-center">
                     <button 
                        onClick={handleLoadMoreSongs}
                        className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full font-semibold transition-colors"
                     >
                        Load More Songs
                     </button>
                 </div>
             )}
          </div>
        );
      
      case ViewState.ALBUM_DETAILS:
          if (!selectedAlbum) return null;
          return (
              <SongList 
                  title={selectedAlbum.title}
                  subtitle={selectedAlbum.artist}
                  coverArt={selectedAlbum.coverArt}
                  songs={selectedAlbum.songs || []}
                  onPlaySong={(song) => handlePlaySong(song, selectedAlbum.songs)}
                  showCovers={false} // Album covers are redundant in album details
              />
          );

      case ViewState.PLAYLIST_DETAILS:
          if (!selectedPlaylist) return null;
          return (
              <SongList 
                  title={selectedPlaylist.name}
                  subtitle={`${selectedPlaylist.songCount} songs`}
                  coverArt={selectedPlaylist.coverArt}
                  songs={selectedPlaylist.songs || []}
                  onPlaySong={(song) => handlePlaySong(song, selectedPlaylist.songs)}
                  showCovers={true} // Show covers for playlists
              />
          );

      default:
        return null;
    }
  };

  const getTitle = () => {
      switch(activeTab) {
          case ViewState.HOME: return 'Home';
          case ViewState.PLAYLISTS: return 'Playlists';
          case ViewState.ALBUMS: return 'Albums';
          case ViewState.SONGS: return 'Songs';
          case ViewState.ALBUM_DETAILS: return 'Album';
          case ViewState.PLAYLIST_DETAILS: return 'Playlist';
          default: return '';
      }
  }

  const isDetailView = activeTab === ViewState.ALBUM_DETAILS || activeTab === ViewState.PLAYLIST_DETAILS;

  return (
    <div className="flex h-screen bg-subsonic-bg text-subsonic-text font-sans overflow-hidden selection:bg-subsonic-primary selection:text-white">
      
      {/* Desktop Sidebar */}
      <DesktopSidebar 
        activeTab={activeTab} 
        onChange={handleTabChange} 
        onSettingsClick={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        <Header 
          title={getTitle()}
          onMenuClick={() => setIsSettingsOpen(true)} 
          onBack={isDetailView ? handleBack : undefined}
        />
        
        <main className="flex-1 overflow-y-auto" id="main-scroll">
          <div className="max-w-screen-xl mx-auto pt-0 md:pt-6">
            {renderContent()}
          </div>
        </main>

        {/* Player handles its own fixed positioning and full screen mode */}
        <Player 
          currentSong={currentSong} 
          isPlaying={isPlaying}
          onPlayPause={togglePlayPause}
          onNext={handleNext}
          onPrev={handlePrev}
          credentials={credentials}
          isExpanded={isPlayerExpanded}
          onExpand={() => setIsPlayerExpanded(true)}
          onCollapse={() => setIsPlayerExpanded(false)}
        />
      </div>

      {/* Mobile Bottom Nav - Hidden if Player is Expanded to show full controls */}
      {!isPlayerExpanded && (
          <MobileBottomNav 
            activeTab={activeTab} 
            onChange={handleTabChange} 
            onSettingsClick={() => setIsSettingsOpen(true)}
          />
      )}

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        credentials={credentials}
        onSave={handleSettingsSave}
      />
    </div>
  );
};

export default App;