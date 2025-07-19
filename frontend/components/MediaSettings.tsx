import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

interface MediaSettingsProps {
  isCameraOn: boolean
  isMicOn: boolean
  isScreenSharing: boolean
  isAudioEnabled: boolean
  onToggleCamera: () => void
  onToggleMicrophone: () => void
  onToggleScreenShare: () => void
  onToggleAudio: () => void
}

export const MediaSettings = ({
  isCameraOn,
  isMicOn,
  isScreenSharing,
  isAudioEnabled,
  onToggleCamera,
  onToggleMicrophone,
  onToggleScreenShare,
  onToggleAudio
}: MediaSettingsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Media Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="camera-toggle">Camera</Label>
          <Switch
            id="camera-toggle"
            checked={isCameraOn}
            onCheckedChange={onToggleCamera}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="mic-toggle">Microphone</Label>
          <Switch
            id="mic-toggle"
            checked={isMicOn}
            onCheckedChange={onToggleMicrophone}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="screen-toggle">Screen Share</Label>
          <Switch
            id="screen-toggle"
            checked={isScreenSharing}
            onCheckedChange={onToggleScreenShare}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="audio-toggle">Audio Output</Label>
          <Switch
            id="audio-toggle"
            checked={isAudioEnabled}
            onCheckedChange={onToggleAudio}
          />
        </div>
      </CardContent>
    </Card>
  )
}
