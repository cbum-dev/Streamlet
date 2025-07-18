
/* eslint-disable @typescript-eslint/no-explicit-any */

'use client'

import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  Play,
  Square,
  Copy,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Info
} from 'lucide-react'

interface StreamConfig {
  streamId: string
  streamKey: string
  platform: string
  quality: string
  customEndpoint?: string
  status: string
}

export default function ProfessionalStreamer() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const socketRef = useRef<any>(null)
  const mediaRecorderRef = useRef<any>(null)

  const [isStreaming, setIsStreaming] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null)

  const [streamConfig, setStreamConfig] = useState<StreamConfig | null>(null)
  const [platform, setPlatform] = useState('youtube')
  const [quality, setQuality] = useState('medium')
  const [customEndpoint, setCustomEndpoint] = useState('')
  const [userStreamKey, setUserStreamKey] = useState('')

  const [isCameraOn, setIsCameraOn] = useState(true)
  const [isMicOn, setIsMicOn] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const [showStreamKey, setShowStreamKey] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('stream')

  useEffect(() => {
    socketRef.current = io('http://127.0.0.1:3001/', {
      transports: ['websocket', 'polling']
    })

    socketRef.current.on('connect', () => {
      setIsConnected(true)
      setError(null)
    })

    socketRef.current.on('disconnect', () => {
      setIsConnected(false)
      setError('Disconnected from server')
    })

    socketRef.current.on('streamStarted', () => {
      setSuccess('Stream started successfully!')
      setTimeout(() => setSuccess(null), 3000)
    })

    socketRef.current.on('streamStopped', () => {
      setSuccess('Stream stopped successfully!')
      setTimeout(() => setSuccess(null), 3000)
    })

    socketRef.current.on('streamError', (data: any) => {
      setError(`Stream error: ${data.error}`)
      setIsStreaming(false)
    })

    initializeMedia()

    return () => {
      socketRef.current?.disconnect()
      mediaStream?.getTracks().forEach(track => track.stop())
      screenStream?.getTracks().forEach(track => track.stop())
    }
  }, [])

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { width: 1280, height: 720 }
      })
      setMediaStream(stream)
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch (err) {
      setError('Failed to access camera/microphone')
      console.error('Media access error:', err)
    }
  }

  const createStreamConfig = async () => {
    if (!userStreamKey && platform !== 'custom') {
      setError('Please enter your stream key')
      return
    }

    try {
      const response = await fetch('http://127.0.0.1:3001/api/stream/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          quality,
          customEndpoint,
          userStreamKey
        })
      })

      const data = await response.json()
      if (data.success) {
        setStreamConfig(data.config)
        setSuccess('Stream configuration created!')
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(data.error || 'Failed to create stream configuration')
      }
    } catch (err) {
      setError('Failed to create stream configuration')
      console.log(err)
    }
  }

  const toggleCamera = () => {
    if (mediaStream) {
      const videoTrack = mediaStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !isCameraOn
        setIsCameraOn(!isCameraOn)
      }
    }
  }

  const toggleMicrophone = () => {
    if (mediaStream) {
      const audioTrack = mediaStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !isMicOn
        setIsMicOn(!isMicOn)
      }
    }
  }
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      screenStream?.getTracks().forEach(track => track.stop())
      setScreenStream(null)
      setIsScreenSharing(false)

      if (videoRef.current && mediaStream) {
        videoRef.current.srcObject = mediaStream
      }

      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop()
        mediaRecorderRef.current = null
      }

      socketRef.current?.emit('stopStream')

    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: 30 },
          audio: false
        })

        setScreenStream(stream)
        setIsScreenSharing(true)

        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }

        if (streamConfig && socketRef.current) {
          socketRef.current.emit('startStream', {
            streamId: streamConfig.streamId,
            platform: streamConfig.platform,
            streamKey: streamConfig.streamKey,
            quality: streamConfig.quality,
            customEndpoint: streamConfig.customEndpoint || '',
          })

          const mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm; codecs=vp8,opus',
            videoBitsPerSecond: quality === 'ultra' ? 6000000 :
              quality === 'high' ? 4000000 :
                quality === 'medium' ? 2500000 : 1000000,
            audioBitsPerSecond: 128000
          })

          mediaRecorderRef.current = mediaRecorder

          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              socketRef.current?.emit('binarystream', event.data)
            }
          }

          mediaRecorder.onerror = (e) => {
            console.error('Screen recorder error:', e)
            setError('Screen recorder crashed')
          }

          mediaRecorder.start(1000)

          socketRef.current.on('streamStarted', (data: any) => {
            console.log('✅ Screen share stream started', data)
            setSuccess('Screen share stream started successfully!')
            setTimeout(() => setSuccess(null), 3000)
          })

          socketRef.current.on('streamError', (err: any) => {
            console.error('❌ Screen share stream error:', err)
            setError(`Screen share stream error: ${err}`)
          })
        }

        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false)
          setScreenStream(null)

          if (videoRef.current && mediaStream) {
            videoRef.current.srcObject = mediaStream
          }

          if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop()
            mediaRecorderRef.current = null
          }

          socketRef.current?.emit('stopStream')
        }

      } catch (err) {
        console.error('Failed to start screen sharing:', err)
        setError('Screen share permission denied or failed')
      }
    }
  }

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (!isFullscreen) {
        videoRef.current.requestFullscreen()
        setIsFullscreen(true)
      } else {
        document.exitFullscreen()
        setIsFullscreen(false)
      }
    }
  }

  const startStreaming = () => {
    if (!streamConfig || !socketRef.current) {
      setError('Please create a stream configuration first')
      return
    }

    const currentStream = isScreenSharing ? screenStream : mediaStream
    if (!currentStream) return

    const recorder = new MediaRecorder(currentStream, {
      audioBitsPerSecond: 128000,
      videoBitsPerSecond: quality === 'ultra' ? 6000000 :
        quality === 'high' ? 4000000 :
          quality === 'medium' ? 2500000 : 1000000
    })

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        socketRef.current.emit('binarystream', event.data)
      }
    }

    recorder.onerror = (err) => {
      setError('Recording error occurred')
      console.error('Recorder error:', err)
    }

    socketRef.current.emit('startStream', {
      streamId: streamConfig.streamId,
      streamKey: streamConfig.streamKey,
      platform: streamConfig.platform,
      quality: streamConfig.quality,
      customEndpoint: streamConfig.customEndpoint
    })

    recorder.start(25)
    mediaRecorderRef.current = recorder
    setIsStreaming(true)
  }

  const stopStreaming = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current = null
    }

    if (socketRef.current) {
      socketRef.current.emit('stopStream')
    }

    setIsStreaming(false)
  }

  const copyStreamKey = () => {
    if (streamConfig?.streamKey) {
      navigator.clipboard.writeText(streamConfig.streamKey)
      setSuccess('Stream key copied to clipboard!')
      setTimeout(() => setSuccess(null), 2000)
    }
  }

  const getStreamKeyPlaceholder = () => {
    switch (platform) {
      case 'youtube':
        return 'Enter your YouTube stream key'
      case 'twitch':
        return 'Enter your Twitch stream key'
      case 'facebook':
        return 'Enter your Facebook stream key'
      case 'custom':
        return 'Enter custom RTMP URL'
      default:
        return 'Enter stream key'
    }
  }

  const getStreamKeyHelp = () => {
    switch (platform) {
      case 'youtube':
        return 'Get your stream key from YouTube Studio > Create > Go Live'
      case 'twitch':
        return 'Get your stream key from Twitch Creator Dashboard > Settings > Stream'
      case 'facebook':
        return 'Get your stream key from Facebook Creator Studio > Live'
      case 'custom':
        return 'Enter the complete RTMP URL including stream key'
      default:
        return ''
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-center mb-2">StreamForge Pro</h1>
          <p className="text-center text-gray-600 dark:text-gray-400">
            Professional Live Streaming Platform
          </p>
        </div>

        <div className="mb-6">
          <Card>
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
        </div>

        {error && (
          <Alert className="mb-6" variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Live Preview</span>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleFullscreen}
                    >
                      {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                    </Button>
                  </div>
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

                  {/* Video Controls Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                    <div className="flex space-x-2">
                      <Button
                        variant={isCameraOn ? "default" : "destructive"}
                        size="sm"
                        onClick={toggleCamera}
                      >
                        {isCameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant={isMicOn ? "default" : "destructive"}
                        size="sm"
                        onClick={toggleMicrophone}
                      >
                        {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant={isScreenSharing ? "default" : "outline"}
                        size="sm"
                        onClick={toggleScreenShare}
                      >
                        {isScreenSharing ? <MonitorOff className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                      </Button>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        variant={isAudioEnabled ? "default" : "destructive"}
                        size="sm"
                        onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                      >
                        {isAudioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger className='cursor-pointer' value="stream">Stream</TabsTrigger>
                <TabsTrigger className='cursor-pointer' value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="stream" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Stream Configuration</CardTitle>
                    <CardDescription>
                      Configure your streaming settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="platform">Platform</Label>
                      <Select value={platform} onValueChange={setPlatform}>
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
                      <Select value={quality} onValueChange={setQuality}>
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
                            setCustomEndpoint(e.target.value)
                          } else {
                            setUserStreamKey(e.target.value)
                          }
                        }}
                      />
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Info className="h-4 w-4" />
                        <span>{getStreamKeyHelp()}</span>
                      </div>
                    </div>

                    <Button onClick={createStreamConfig} className="w-full">
                      Create Stream Configuration
                    </Button>
                  </CardContent>
                </Card>

                {streamConfig && (
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowStreamKey(!showStreamKey)}
                          >
                            {showStreamKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={copyStreamKey}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <Separator />

                      <div className="text-center">
                        <Button
                          onClick={isStreaming ? stopStreaming : startStreaming}
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
                )}
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
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
                        onCheckedChange={toggleCamera}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="mic-toggle">Microphone</Label>
                      <Switch
                        id="mic-toggle"
                        checked={isMicOn}
                        onCheckedChange={toggleMicrophone}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="screen-toggle">Screen Share</Label>
                      <Switch
                        id="screen-toggle"
                        checked={isScreenSharing}
                        onCheckedChange={toggleScreenShare}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="audio-toggle">Audio Output</Label>
                      <Switch
                        id="audio-toggle"
                        checked={isAudioEnabled}
                        onCheckedChange={setIsAudioEnabled}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}