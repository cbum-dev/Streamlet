import { Button } from '@/components/ui/button'
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  Volume2,
  VolumeX
} from 'lucide-react'

interface VideoControlsProps {
  isCameraOn: boolean
  isMicOn: boolean
  isScreenSharing: boolean
  isAudioEnabled: boolean
  onToggleCamera: () => void
  onToggleMicrophone: () => void
  onToggleScreenShare: () => void
  onToggleAudio: () => void
}

export const VideoControls = ({
  isCameraOn,
  isMicOn,
  isScreenSharing,
  isAudioEnabled,
  onToggleCamera,
  onToggleMicrophone,
  onToggleScreenShare,
  onToggleAudio
}: VideoControlsProps) => {
  return (
    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
      <div className="flex space-x-2">
        <Button
          variant={isCameraOn ? "default" : "destructive"}
          size="sm"
          onClick={onToggleCamera}
        >
          {isCameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
        </Button>
        <Button
          variant={isMicOn ? "default" : "destructive"}
          size="sm"
          onClick={onToggleMicrophone}
        >
          {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        </Button>
        <Button
          variant={isScreenSharing ? "default" : "outline"}
          size="sm"
          onClick={onToggleScreenShare}
        >
          {isScreenSharing ? <MonitorOff className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
        </Button>
      </div>
      <div className="flex space-x-2">
        <Button
          variant={isAudioEnabled ? "default" : "destructive"}
          size="sm"
          onClick={onToggleAudio}
        >
          {isAudioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}
