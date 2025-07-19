import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Copy, Eye, EyeOff, Play, Square } from 'lucide-react'
import { StreamConfig } from '../types/streaming'

interface StreamDetailsProps {
  streamConfig: StreamConfig
  showStreamKey: boolean
  isStreaming: boolean
  isConnected: boolean
  onToggleStreamKey: () => void
  onCopyStreamKey: () => void
  onStartStream: () => void
  onStopStream: () => void
}

export const StreamDetails = ({
  streamConfig,
  showStreamKey,
  isStreaming,
  isConnected,
  onToggleStreamKey,
  onCopyStreamKey,
  onStartStream,
  onStopStream
}: StreamDetailsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Stream Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Stream Key</Label>
          <div className="flex space-x-2">
            <Input
              type={showStreamKey ? "text" : "password"}
              value={streamConfig.streamKey}
              readOnly
              className="font-mono"
            />
            <Button variant="outline" size="sm" onClick={onToggleStreamKey}>
              {showStreamKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={onCopyStreamKey}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Separator />

        <div className="text-center">
          <Button
            onClick={isStreaming ? onStopStream : onStartStream}
            disabled={!isConnected || !streamConfig}
            className={`w-full ${isStreaming ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {isStreaming ? (
              <>
                <Square className="h-4 w-4 mr-2" />
                Stop Stream
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Stream
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

