import { useRef } from 'react'

export const useScreenShare = (
  socketRef: any,
  streamConfig: any,
  quality: string,
  setError: (error: string) => void,
  setSuccess: (message: string) => void
) => {
  const mediaRecorderRef = useRef<any>(null)

  const startScreenShare = async (
    setScreenStream: (stream: MediaStream) => void,
    setIsScreenSharing: (sharing: boolean) => void,
    videoRef: any
  ) => {
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
          setTimeout(() => setSuccess(''), 3000)
        })

        socketRef.current.on('streamError', (err: any) => {
          console.error('❌ Screen share stream error:', err)
          setError(`Screen share stream error: ${err}`)
        })
      }

      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare(setScreenStream, setIsScreenSharing, videoRef, null)
      }

      return { success: true }
    } catch (err) {
      console.error('Failed to start screen sharing:', err)
      setError('Screen share permission denied or failed')
      return { success: false }
    }
  }

  const stopScreenShare = (
    setScreenStream: (stream: MediaStream | null) => void,
    setIsScreenSharing: (sharing: boolean) => void,
    videoRef: any,
    mediaStream: MediaStream | null
  ) => {
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

  return { startScreenShare, stopScreenShare }
}

