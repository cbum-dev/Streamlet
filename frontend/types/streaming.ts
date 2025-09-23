export interface StreamConfig {
  streamId: string;
  streamKey: string;
  platform: 'youtube' | 'twitch' | 'facebook' | 'custom';
  quality: 'low' | 'medium' | 'high' | 'ultra';
  customEndpoint?: string;
}

export interface StreamMetrics {
  viewers: number;
  bitrate?: number;
  fps?: number;
  duration: number;
}

export interface StreamStatus {
  isLive: boolean;
  status: 'idle' | 'starting' | 'live' | 'stopping' | 'error';
  error?: string;
}

export interface User {
  id: string;
  name?: string;
  email?: string;
  image?: string;
  streamTitle?: string;
  streamDescription?: string;
  isLive: boolean;
  totalStreams: number;
  totalViewers: number;
  createdAt: string;
  updatedAt: string;
}

export interface StreamKey {
  id: string;
  name: string;
  platform: string;
  maskedKey?: string;
  encryptedKey?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastUsed?: string;
}

export interface Stream {
  id: string;
  title: string;
  description?: string;
  platform: string;
  quality: string;
  status: 'created' | 'live' | 'ended' | 'error';
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
  peakViewers: number;
  totalViewers: number;
  duration: number;
  streamKey: {
    id: string;
    name: string;
    platform: string;
  };
  recording?: Recording;
}

export interface StreamAnalytics {
  id: string;
  timestamp: string;
  viewers: number;
  bitrate?: number;
  fps?: number;
  resolution?: string;
  streamId: string;
  userId: string;
}

export interface Recording {
  id: string;
  filename: string;
  fileSize: number;
  duration: number;
  quality: string;
  format: string;
  thumbnailUrl?: string;
  downloadUrl?: string;
  isProcessed: boolean;
  createdAt: string;
  streamId: string;
  userId: string;
}

export interface StreamingState {
  isStreaming: boolean
  isConnected: boolean
  mediaStream: MediaStream | null
  screenStream: MediaStream | null
  isCameraOn: boolean
  isMicOn: boolean
  isScreenSharing: boolean
  isAudioEnabled: boolean
  isFullscreen: boolean
  showStreamKey: boolean
  error: string | null
  success: string | null
}
