import { registerPlugin } from '@capacitor/core';

export interface NativeCastPlugin {
  initialize(options: { appId?: string }): Promise<void>;
  showRoutePicker(): Promise<void>;
  loadMedia(options: { 
    url: string; 
    title?: string; 
    artist?: string; 
    coverUrl?: string;
    duration?: number;
  }): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  stop(): Promise<void>;
}

const NativeCast = registerPlugin<NativeCastPlugin>('NativeCast');

export default NativeCast;