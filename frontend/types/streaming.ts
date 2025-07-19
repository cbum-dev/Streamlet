export interface StreamConfig {
  streamId: string
  streamKey: string
  platform: string
  quality: string
  customEndpoint?: string
  status: string
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
