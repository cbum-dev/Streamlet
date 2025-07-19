'use client'

import { useState, useRef } from 'react'
import { StatusBar } from './StatusBar'
import { AlertMessages } from './AlertMessages'
import { VideoPreview } from './VideoPreview'
import { StreamTabs } from './StreamTabs'
import { useSocket } from '../hooks/useSocket'
import { useMedia } from '../hooks/useMedia'
import { useStreamConfig } from '../hooks/useStreamConfig'
import { useScreenShare } from '../hooks/useScreenShare'

export default function ProfessionalStreamer() {
  const { socketRef, isConnected, error, success, setError, setSuccess } = useSocket()
  const {
    videoRef,
    mediaStream,
    screenStream,
    setScreenStream,
    isCameraOn,
    isMicOn,
    isScreenSharing,
    setIsScreenSharing,
    toggleCamera,
    toggleMicrophone
  } = useMedia()
  
  const {
    streamConfig,
    platform,
    setPlatform,
    quality,
    setQuality,
    customEndpoint,
    setCustomEndpoint,
    userStreamKey,
    setUserStreamKey,
    createStreamConfig,
    copyStreamKey
  } = useStreamConfig()

  const { startScreenShare, stopScreenShare } = useScreenShare(
    socketRef,
    streamConfig,
    quality,
    setError,
    setSuccess
  )

  const mediaRecorderRef = useRef<any>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showStreamKey, setShowStreamKey] = useState(false)
  const [activeTab, setActiveTab] = useState('stream')

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      screenStream?.getTracks().forEach(track => track.stop())
      stopScreenShare(setScreenStream, setIsScreenSharing, videoRef, mediaStream)
    } else {
      await startScreenShare(setScreenStream, setIsScreenSharing, videoRef)
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

  const handleCreateConfig = () => createStreamConfig(setError, setSuccess)
  const handleCopyStreamKey = () => copyStreamKey(setSuccess)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-center mb-2">StreamForge Pro</h1>
          <p className="text-center text-gray-600 dark:text-gray-400">
            Professional Live Streaming Platform
          </p>
        </div>

        <StatusBar
          isConnected={isConnected}
          isStreaming={isStreaming}
          platform={platform}
        />

        <AlertMessages error={error} success={success} />

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <VideoPreview
              videoRef={videoRef}
              isFullscreen={isFullscreen}
              isCameraOn={isCameraOn}
              isMicOn={isMicOn}
              isScreenSharing={isScreenSharing}
              isAudioEnabled={isAudioEnabled}
              onToggleFullscreen={toggleFullscreen}
              onToggleCamera={toggleCamera}
              onToggleMicrophone={toggleMicrophone}
              onToggleScreenShare={toggleScreenShare}
              onToggleAudio={() => setIsAudioEnabled(!isAudioEnabled)}
            />
          </div>
          
          <div className="space-y-6">
            <StreamTabs
              activeTab={activeTab}
              streamConfig={streamConfig}
              platform={platform}
              quality={quality}
              userStreamKey={userStreamKey}
              customEndpoint={customEndpoint}
              showStreamKey={showStreamKey}
              isStreaming={isStreaming}
              isConnected={isConnected}
              isCameraOn={isCameraOn}
              isMicOn={isMicOn}
              isScreenSharing={isScreenSharing}
              isAudioEnabled={isAudioEnabled}
              onTabChange={setActiveTab}
              onPlatformChange={setPlatform}
              onQualityChange={setQuality}
              onStreamKeyChange={setUserStreamKey}
              onCustomEndpointChange={setCustomEndpoint}
              onCreateConfig={handleCreateConfig}
              onToggleStreamKey={() => setShowStreamKey(!showStreamKey)}
              onCopyStreamKey={handleCopyStreamKey}
              onStartStream={startStreaming}
              onStopStream={stopStreaming}
              onToggleCamera={toggleCamera}
              onToggleMicrophone={toggleMicrophone}
              onToggleScreenShare={toggleScreenShare}
              onToggleAudio={() => setIsAudioEnabled(!isAudioEnabled)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}