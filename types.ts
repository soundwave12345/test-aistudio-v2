
export interface SubsonicCredentials {
  url: string;
  username: string;
  password?: string; 
  enableLrcLib?: boolean; // Toggle for external lyrics
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverArt: string;
  duration: number; // seconds
  track?: number;
  streamUrl?: string; // Optional, generated on demand
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  coverArt: string;
  year?: number;
  songCount?: number;
  songs?: Song[]; // For details view
}

export interface Playlist {
  id: string;
  name: string;
  songCount: number;
  coverArt: string;
  songs?: Song[]; // For details view
}

export interface Lyrics {
  artist?: string;
  title?: string;
  content: string; // Can be plain text or LRC format
}

export enum ViewState {
  HOME = 'HOME',
  PLAYLISTS = 'PLAYLISTS',
  ALBUMS = 'ALBUMS',
  SONGS = 'SONGS',
  ALBUM_DETAILS = 'ALBUM_DETAILS',
  PLAYLIST_DETAILS = 'PLAYLIST_DETAILS'
}

// Cast API Types
declare global {
  interface Window {
    cast: any;
    __onGCastApiAvailable: (isAvailable: boolean) => void;
  }
}