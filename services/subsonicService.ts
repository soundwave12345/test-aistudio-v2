import { Album, Playlist, Song, SubsonicCredentials, Lyrics } from "../types";

const APP_NAME = 'GeminiStream';

/**
 * Internal helper to log and fetch
 */
const fetchWithLogging = async (url: string, endpoint: string) => {
  console.log(`[Subsonic] [${endpoint}] -> Requesting: ${url}`);
  try {
    const response = await fetch(url);
    console.log(`[Subsonic] [${endpoint}] <- Status: ${response.status} ${response.statusText}`);

    const text = await response.text();
    
    if (!response.ok) {
      console.error(`[Subsonic] [${endpoint}] Error Body:`, text);
      throw new Error(`HTTP ${response.status} - ${response.statusText}`);
    }

    try {
      const data = JSON.parse(text);
      return data;
    } catch (e) {
      console.error(`[Subsonic] [${endpoint}] Failed to parse JSON. Response was:`, text);
      throw new Error('Invalid JSON response from server');
    }
  } catch (error: any) {
    console.error(`[Subsonic] [${endpoint}] NETWORK ERROR:`, error);
    
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
       if (url.startsWith('http:') && window.location.protocol === 'https:') {
           console.error("!!! MIXED CONTENT ERROR !!!");
           console.error("You are trying to access an HTTP server from an HTTPS app.");
       }
    }
    
    throw error;
  }
};

const getAuthParams = (creds: SubsonicCredentials) => {
  const params = new URLSearchParams();
  params.append('u', creds.username);
  if (creds.password) {
     const hexPassword = creds.password.split('').map(c => c.charCodeAt(0).toString(16)).join('');
     params.append('p', `enc:${hexPassword}`);
  }
  params.append('v', '1.16.1');
  params.append('c', APP_NAME);
  params.append('f', 'json');
  return params.toString();
};

export const getCoverArtUrl = (creds: SubsonicCredentials, id: string | undefined, size: number = 300): string => {
  if (!id) return 'https://via.placeholder.com/300x300?text=No+Cover';
  const baseUrl = creds.url.replace(/\/$/, '');
  const params = getAuthParams(creds);
  return `${baseUrl}/rest/getCoverArt?id=${id}&size=${size}&${params}`;
};

export const getStreamUrl = (creds: SubsonicCredentials, id: string): string => {
  const baseUrl = creds.url.replace(/\/$/, '');
  const params = getAuthParams(creds);
  const url = `${baseUrl}/rest/stream?id=${id}&${params}`;
  return url;
};

export const getRandomSongs = async (creds: SubsonicCredentials, size: number = 20): Promise<Song[]> => {
  try {
    const baseUrl = creds.url.replace(/\/$/, '');
    const params = getAuthParams(creds);
    const url = `${baseUrl}/rest/getRandomSongs?size=${size}&${params}`;
    
    const data = await fetchWithLogging(url, 'getRandomSongs');
    
    const songs = data['subsonic-response']?.randomSongs?.song || [];
    
    return songs.map((s: any) => ({
      id: s.id,
      title: s.title,
      artist: s.artist,
      album: s.album,
      coverArt: getCoverArtUrl(creds, s.coverArt || s.id),
      duration: s.duration,
    }));
  } catch (error) {
    console.error("[Subsonic] getRandomSongs failed:", error);
    return [];
  }
};

export const getRecentAlbums = async (creds: SubsonicCredentials, size: number = 50, type: 'newest' | 'recent' = 'newest'): Promise<Album[]> => {
  try {
    const baseUrl = creds.url.replace(/\/$/, '');
    const params = getAuthParams(creds);
    // type: newest = Recently Added, recent = Recently Played
    const url = `${baseUrl}/rest/getAlbumList2?type=${type}&size=${size}&${params}`;

    const data = await fetchWithLogging(url, `getRecentAlbums-${type}`);

    const albums = data['subsonic-response']?.albumList2?.album || [];

    return albums.map((a: any) => ({
      id: a.id,
      title: a.title || a.name,
      artist: a.artist,
      year: a.year,
      coverArt: getCoverArtUrl(creds, a.coverArt || a.id),
    }));
  } catch (error) {
    console.error("[Subsonic] getRecentAlbums failed:", error);
    return [];
  }
};

export const getPlaylists = async (creds: SubsonicCredentials): Promise<Playlist[]> => {
  try {
    const baseUrl = creds.url.replace(/\/$/, '');
    const params = getAuthParams(creds);
    const url = `${baseUrl}/rest/getPlaylists?${params}`;

    const data = await fetchWithLogging(url, 'getPlaylists');

    const playlists = data['subsonic-response']?.playlists?.playlist || [];

    return playlists.map((p: any) => ({
      id: p.id,
      name: p.name,
      songCount: p.songCount,
      coverArt: p.coverArt ? getCoverArtUrl(creds, p.coverArt) : 'https://via.placeholder.com/300?text=Playlist',
    }));
  } catch (error) {
    console.error("[Subsonic] getPlaylists failed:", error);
    return [];
  }
};

export const getAlbumDetails = async (creds: SubsonicCredentials, albumId: string): Promise<Album | null> => {
    try {
        const baseUrl = creds.url.replace(/\/$/, '');
        const params = getAuthParams(creds);
        const url = `${baseUrl}/rest/getAlbum?id=${albumId}&${params}`;
    
        const data = await fetchWithLogging(url, 'getAlbumDetails');
        const albumData = data['subsonic-response']?.album;

        if (!albumData) return null;

        const songs = (albumData.song || []).map((s: any) => ({
            id: s.id,
            title: s.title,
            artist: s.artist,
            album: albumData.title || albumData.name,
            coverArt: getCoverArtUrl(creds, s.coverArt || s.id),
            duration: s.duration,
            track: s.track
        }));

        return {
            id: albumData.id,
            title: albumData.title || albumData.name,
            artist: albumData.artist,
            coverArt: getCoverArtUrl(creds, albumData.coverArt || albumData.id),
            year: albumData.year,
            songCount: albumData.songCount,
            songs: songs
        };

    } catch (error) {
        console.error("[Subsonic] getAlbumDetails failed:", error);
        return null;
    }
}

export const getPlaylistDetails = async (creds: SubsonicCredentials, playlistId: string): Promise<Playlist | null> => {
    try {
        const baseUrl = creds.url.replace(/\/$/, '');
        const params = getAuthParams(creds);
        const url = `${baseUrl}/rest/getPlaylist?id=${playlistId}&${params}`;
    
        const data = await fetchWithLogging(url, 'getPlaylistDetails');
        const playlistData = data['subsonic-response']?.playlist;

        if (!playlistData) return null;

        const songs = (playlistData.entry || []).map((s: any) => ({
            id: s.id,
            title: s.title,
            artist: s.artist,
            album: s.album,
            coverArt: getCoverArtUrl(creds, s.coverArt || s.id),
            duration: s.duration,
        }));

        return {
            id: playlistData.id,
            name: playlistData.name,
            songCount: playlistData.songCount,
            coverArt: playlistData.coverArt ? getCoverArtUrl(creds, playlistData.coverArt) : 'https://via.placeholder.com/300?text=Playlist',
            songs: songs
        };

    } catch (error) {
        console.error("[Subsonic] getPlaylistDetails failed:", error);
        return null;
    }
}

/**
 * Tries to fetch lyrics from Subsonic, falls back to LrcLib if enabled
 */
export const getLyrics = async (creds: SubsonicCredentials, song: Song): Promise<Lyrics | null> => {
    // 1. Try Subsonic Server First
    try {
        const baseUrl = creds.url.replace(/\/$/, '');
        const params = getAuthParams(creds);
        const url = `${baseUrl}/rest/getLyrics?id=${song.id}&${params}`;

        const data = await fetchWithLogging(url, 'getLyrics');
        const lyricsData = data['subsonic-response']?.lyrics;

        if (lyricsData && lyricsData.value) {
            return {
                artist: lyricsData.artist,
                title: lyricsData.title,
                content: lyricsData.value 
            };
        }
    } catch (error) {
        // Ignore errors from Subsonic lyrics fetch and proceed to fallback
        console.log("[Subsonic] No lyrics found on server.");
    }

    // 2. Fallback to LrcLib if enabled
    if (creds.enableLrcLib) {
        console.log("[LrcLib] Attempting fallback fetch...");
        try {
            const artist = encodeURIComponent(song.artist);
            const track = encodeURIComponent(song.title);
            const album = encodeURIComponent(song.album);
            const duration = Math.round(song.duration);

            // Use LrcLib "get" endpoint which is precise
            const lrcUrl = `https://lrclib.net/api/get?artist_name=${artist}&track_name=${track}&album_name=${album}&duration=${duration}`;
            
            const response = await fetch(lrcUrl);
            if (response.ok) {
                const data = await response.json();
                if (data.syncedLyrics || data.plainLyrics) {
                    console.log("[LrcLib] Lyrics found!");
                    return {
                        artist: data.artistName,
                        title: data.trackName,
                        content: data.syncedLyrics || data.plainLyrics
                    };
                }
            } else {
                // If strict get fails, maybe try search (omitted to prevent bad matches for now)
                 console.log("[LrcLib] No match found.");
            }

        } catch (e) {
            console.error("[LrcLib] Error fetching lyrics:", e);
        }
    }

    return null;
};

export const searchLibrary = async (creds: SubsonicCredentials, query: string): Promise<{ songs: Song[], albums: Album[] }> => {
    try {
        const baseUrl = creds.url.replace(/\/$/, '');
        const params = getAuthParams(creds);
        const url = `${baseUrl}/rest/search3?query=${encodeURIComponent(query)}&songCount=20&albumCount=20&artistCount=0&${params}`;

        const data = await fetchWithLogging(url, 'searchLibrary');
        const result = data['subsonic-response']?.searchResult3;

        if (!result) return { songs: [], albums: [] };

        const songs = (result.song || []).map((s: any) => ({
            id: s.id,
            title: s.title,
            artist: s.artist,
            album: s.album,
            coverArt: getCoverArtUrl(creds, s.coverArt || s.id),
            duration: s.duration,
        }));

        const albums = (result.album || []).map((a: any) => ({
            id: a.id,
            title: a.title || a.name,
            artist: a.artist,
            coverArt: getCoverArtUrl(creds, a.coverArt || a.id),
            year: a.year,
            songCount: a.songCount
        }));

        return { songs, albums };

    } catch (error) {
        console.error("[Subsonic] searchLibrary failed:", error);
        return { songs: [], albums: [] };
    }
}