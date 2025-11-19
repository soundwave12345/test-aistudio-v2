import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.subsonic.geministreamer',
  appName: 'Subsonic Gemini Streamer',
  webDir: 'dist',
  server: {
    // Critical for local Subsonic connections:
    // using 'http' allows the WebView to be served from http://localhost,
    // avoiding Mixed Content errors when calling http://192.168.x.x
    androidScheme: 'http',
    cleartext: true,
    allowNavigation: ['*']
  }
};

export default config;