import React, { useState, useEffect } from 'react';
import { X, Server, User, Lock, Globe, Mic2 } from 'lucide-react';
import { SubsonicCredentials } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  credentials: SubsonicCredentials;
  onSave: (creds: SubsonicCredentials) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, credentials, onSave }) => {
  const [url, setUrl] = useState(credentials.url);
  const [username, setUsername] = useState(credentials.username);
  const [password, setPassword] = useState(credentials.password || '');
  const [enableLrcLib, setEnableLrcLib] = useState(credentials.enableLrcLib || false);
  
  useEffect(() => {
    if (isOpen) {
      setUrl(credentials.url);
      setUsername(credentials.username);
      setPassword(credentials.password || '');
      setEnableLrcLib(credentials.enableLrcLib || false);
    }
  }, [isOpen, credentials]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!url || !username) {
        alert("Server URL and Username are required.");
        return;
    }
    onSave({ url, username, password, enableLrcLib });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <div className="bg-subsonic-card w-full max-w-md rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-white/10 bg-white/5">
          <h2 className="text-xl font-bold text-white">Server Configuration</h2>
          {/* Only allow closing if we have a valid URL, otherwise enforce setup */}
          {credentials.url && (
              <button onClick={onClose} className="text-subsonic-secondary hover:text-white">
                <X size={24} />
              </button>
          )}
        </div>

        <div className="p-6 space-y-6">
            <p className="text-sm text-gray-400">Enter your Subsonic/Navidrome server details to connect your library.</p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-subsonic-secondary uppercase tracking-wider">Server URL</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-subsonic-secondary" size={18} />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="http://192.168.1.5:4533"
                  className="w-full bg-black/30 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-subsonic-primary focus:ring-1 focus:ring-subsonic-primary transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-subsonic-secondary uppercase tracking-wider">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-subsonic-secondary" size={18} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-subsonic-primary focus:ring-1 focus:ring-subsonic-primary transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-subsonic-secondary uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-subsonic-secondary" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-subsonic-primary focus:ring-1 focus:ring-subsonic-primary transition-all"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                         <Mic2 className="text-subsonic-secondary" size={18} />
                         <div>
                             <p className="text-sm font-semibold text-white">Enable External Lyrics</p>
                             <p className="text-xs text-gray-500">Fetch from LrcLib.net if missing on server</p>
                         </div>
                    </div>
                    <button 
                        onClick={() => setEnableLrcLib(!enableLrcLib)}
                        className={`w-12 h-6 rounded-full p-1 transition-colors ${enableLrcLib ? 'bg-subsonic-primary' : 'bg-white/10'}`}
                    >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${enableLrcLib ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                </div>
            </div>

          <button
            onClick={handleSave}
            className="w-full bg-subsonic-primary hover:bg-orange-600 text-white font-bold py-3 rounded-lg transition-colors mt-4 shadow-lg shadow-orange-900/20"
          >
            Connect Server
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;