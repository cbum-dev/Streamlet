import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StreamConfiguration } from './StreamConfiguration'
import { StreamDetails } from './StreamDetails'
import { MediaSettings } from './MediaSettings'
import { StreamConfig } from '../types/streaming'

interface StreamTabsProps {
  activeTab: string
  streamConfig: StreamConfig | null
  platform: string
  quality: string
  userStreamKey: string
  customEndpoint: string
  showStreamKey: boolean
  isStreaming: boolean
  isConnected: boolean
  isCameraOn: boolean
  isMicOn: boolean
  isScreenSharing: boolean
  isAudioEnabled: boolean
  onTabChange: (tab: string) => void
  onPlatformChange: (platform: string) => void
  onQualityChange: (quality: string) => void
  onStreamKeyChange: (key: string) => void
  onCustomEndpointChange: (endpoint: string) => void
  onCreateConfig: () => void
  onToggleStreamKey: () => void
  onCopyStreamKey: () => void
  onStartStream: () => void
  onStopStream: () => void
  onToggleCamera: () => void
  onToggleMicrophone: () => void
  onToggleScreenShare: () => void
  onToggleAudio: () => void
}

export const StreamTabs = ({
  activeTab,
  streamConfig,
  platform,
  quality,
  userStreamKey,
  customEndpoint,
  showStreamKey,
  isStreaming,
  isConnected,
  isCameraOn,
  isMicOn,
  isScreenSharing,
  isAudioEnabled,
  onTabChange,
  onPlatformChange,
  onQualityChange,
  onStreamKeyChange,
  onCustomEndpointChange,
  onCreateConfig,
  onToggleStreamKey,
  onCopyStreamKey,
  onStartStream,
  onStopStream,
  onToggleCamera,
  onToggleMicrophone,
  onToggleScreenShare,
  onToggleAudio
}: StreamTabsProps) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger className="cursor-pointer" value="stream">Stream</TabsTrigger>
        <TabsTrigger className="cursor-pointer" value="settings">Settings</TabsTrigger>
      </TabsList>

      <TabsContent value="stream" className="space-y-4">
        <StreamConfiguration
          platform={platform}
          quality={quality}
          userStreamKey={userStreamKey}
          customEndpoint={customEndpoint}
          onPlatformChange={onPlatformChange}
          onQualityChange={onQualityChange}
          onStreamKeyChange={onStreamKeyChange}
          onCustomEndpointChange={onCustomEndpointChange}
          onCreateConfig={onCreateConfig}
        />

        {streamConfig && (
          <StreamDetails
            streamConfig={streamConfig}
            showStreamKey={showStreamKey}
            isStreaming={isStreaming}
            isConnected={isConnected}
            onToggleStreamKey={onToggleStreamKey}
            onCopyStreamKey={onCopyStreamKey}
            onStartStream={onStartStream}
            onStopStream={onStopStream}
          />
        )}
      </TabsContent>

      <TabsContent value="settings" className="space-y-4">
        <MediaSettings
          isCameraOn={isCameraOn}
          isMicOn={isMicOn}
          isScreenSharing={isScreenSharing}
          isAudioEnabled={isAudioEnabled}
          onToggleCamera={onToggleCamera}
          onToggleMicrophone={onToggleMicrophone}
          onToggleScreenShare={onToggleScreenShare}
          onToggleAudio={onToggleAudio}
        />
      </TabsContent>
    </Tabs>
  )
}
