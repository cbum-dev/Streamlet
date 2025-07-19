import { useEffect, useRef, useState } from 'react'

export const useMedia = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null)
  const [isCameraOn, setIsCameraOn] = useState(true)
  const [isMicOn, setIsMicOn] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { width: 1280, height: 720 }
      })
      setMediaStream(stream)
      if (videoRef.current) videoRef.current.srcObject = stream
      return { success: true }
    } catch (err) {
      console.error('Media access error:', err)
      return { success: false, error: 'Failed to access camera/microphone' }
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

  useEffect(() => {
    initializeMedia()
    return () => {
      mediaStream?.getTracks().forEach(track => track.stop())
      screenStream?.getTracks().forEach(track => track.stop())
    }
  }, [])

  return {
    videoRef,
    mediaStream,
    screenStream,
    setScreenStream,
    isCameraOn,
    isMicOn,
    isScreenSharing,
    setIsScreenSharing,
    toggleCamera,
    toggleMicrophone,
    initializeMedia
  }
}

