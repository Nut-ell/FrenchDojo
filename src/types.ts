export enum SpeedMode {
  FAST = 'Fast',
  NORMAL = 'Normal',
  SLOW = 'Slow',
}

export interface PlaybackConfig {
  rate: number;
  postDelayMs: number;
}

export interface AudioCacheItem {
  audioBuffer: AudioBuffer;
}

export interface SentenceItem {
  french: string;
  english: string;
  audio: string;
}