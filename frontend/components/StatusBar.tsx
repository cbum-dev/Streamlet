import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface StatusBarProps {
  isConnected: boolean
  isStreaming: boolean
  platform: string
}

export const StatusBar = ({ isConnected, isStreaming, platform }: StatusBarProps) => {
  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
            <Badge variant={isStreaming ? "default" : "secondary"}>
              {isStreaming ? "LIVE" : "Offline"}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Platform:</span>
            <Badge variant="outline">{platform}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
