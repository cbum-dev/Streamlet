import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Info } from 'lucide-react'

interface StreamConfigurationProps {
  platform: string
  quality: string
  userStreamKey: string
  customEndpoint: string
  onPlatformChange: (platform: string) => void
  onQualityChange: (quality: string) => void
  onStreamKeyChange: (key: string) => void
  onCustomEndpointChange: (endpoint: string) => void
  onCreateConfig: () => void
}

export const StreamConfiguration = ({
  platform,
  quality,
  userStreamKey,
  customEndpoint,
  onPlatformChange,
  onQualityChange,
  onStreamKeyChange,
  onCustomEndpointChange,
  onCreateConfig
}: StreamConfigurationProps) => {
  const getStreamKeyPlaceholder = () => {
    switch (platform) {
      case 'youtube': return 'Enter your YouTube stream key'
      case 'twitch': return 'Enter your Twitch stream key'
      case 'facebook': return 'Enter your Facebook stream key'
      case 'custom': return 'Enter custom RTMP URL'
      default: return 'Enter stream key'
    }
  }

  const getStreamKeyHelp = () => {
    switch (platform) {
      case 'youtube': return 'Get your stream key from YouTube Studio > Create > Go Live'
      case 'twitch': return 'Get your stream key from Twitch Creator Dashboard > Settings > Stream'
      case 'facebook': return 'Get your stream key from Facebook Creator Studio > Live'
      case 'custom': return 'Enter the complete RTMP URL including stream key'
      default: return ''
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stream Configuration</CardTitle>
        <CardDescription>Configure your streaming settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="platform">Platform</Label>
          <Select value={platform} onValueChange={onPlatformChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="twitch">Twitch</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="custom">Custom RTMP</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="quality">Quality</Label>
          <Select value={quality} onValueChange={onQualityChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select quality" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low (1000k)</SelectItem>
              <SelectItem value="medium">Medium (2500k)</SelectItem>
              <SelectItem value="high">High (4000k)</SelectItem>
              <SelectItem value="ultra">Ultra (6000k)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="streamKey">
            {platform === 'custom' ? 'RTMP URL' : 'Stream Key'}
          </Label>
          <Input
            id="streamKey"
            type="password"
            placeholder={getStreamKeyPlaceholder()}
            value={platform === 'custom' ? customEndpoint : userStreamKey}
            onChange={(e) => {
              if (platform === 'custom') {
                onCustomEndpointChange(e.target.value)
              } else {
                onStreamKeyChange(e.target.value)
              }
            }}
          />
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Info className="h-4 w-4" />
            <span>{getStreamKeyHelp()}</span>
          </div>
        </div>

        <Button onClick={onCreateConfig} className="w-full">
          Create Stream Configuration
        </Button>
      </CardContent>
    </Card>
  )
}
