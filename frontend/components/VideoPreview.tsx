import { RefObject } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Maximize, Minimize } from 'lucide-react'
import { VideoControls } from './VideoController'

interface VideoPreviewProps {
  videoRef: RefObject<HTMLVideoElement>
  isFullscreen: boolean
  isCameraOn: boolean
  isMicOn: boolean
  isScreenSharing: boolean
  isAudioEnabled: boolean
  onToggleFullscreen: () => void
  onToggleCamera: () => void
  onToggleMicrophone: () => void
  onToggleScreenShare: () => void
  onToggleAudio: () => void
}

export const VideoPreview = ({
  videoRef,
  isFullscreen,
  isCameraOn,
  isMicOn,
  isScreenSharing,
  isAudioEnabled,
  onToggleFullscreen,
  onToggleCamera,
  onToggleMicrophone,
  onToggleScreenShare,
  onToggleAudio
}: VideoPreviewProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Live Preview</span>
          <Button variant="outline" size="sm" onClick={onToggleFullscreen}>
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            muted
            className="w-full aspect-video bg-black rounded-lg"
          />
          <VideoControls
            isCameraOn={isCameraOn}
            isMicOn={isMicOn}
            isScreenSharing={isScreenSharing}
            isAudioEnabled={isAudioEnabled}
            onToggleCamera={onToggleCamera}
            onToggleMicrophone={onToggleMicrophone}
            onToggleScreenShare={onToggleScreenShare}
            onToggleAudio={onToggleAudio}
          />
        </div>
      </CardContent>
    </Card>
  )
}
