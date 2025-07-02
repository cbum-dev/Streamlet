'use client'

import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'

export default function VideoStreamer() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const socketRef = useRef<any>(null)
  const mediaRecorderRef = useRef<any>(null)

  const [isStreaming, setIsStreaming] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)

  useEffect(() => {
    socketRef.current = io('http://localhost:3001', {
      transports: ['websocket', 'polling']
    })

    socketRef.current.on('connect', () => setIsConnected(true))
    socketRef.current.on('disconnect', () => setIsConnected(false))

    initializeMedia()

    return () => {
      socketRef.current?.disconnect()
      mediaStream?.getTracks().forEach(track => track.stop())
    }
  }, [])

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      setMediaStream(stream)
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch (err) {
      console.error('Media access error:', err)
    }
  }

  const startStreaming = () => {
    if (!mediaStream || !socketRef.current) return

    const recorder = new MediaRecorder(mediaStream, {
      audioBitsPerSecond: 128000,
      videoBitsPerSecond: 2500000
    })

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        socketRef.current.emit('binarystream', event.data)
      }
    }

    recorder.onerror = (err) => console.error('Recorder error:', err)

    recorder.start(25)
    mediaRecorderRef.current = recorder
    setIsStreaming(true)
  }

  const stopStreaming = () => {
    mediaRecorderRef.current?.stop()
    mediaRecorderRef.current = null
    setIsStreaming(false)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto font-sans">
      <h1 className="text-3xl font-bold text-center mb-6">🎥 Streamyard Clone</h1>

      <div className={`p-4 rounded-lg text-sm mb-6 ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}> 
        <strong>Status:</strong> {isConnected ? 'Connected to backend' : 'Disconnected from backend'}
      </div>

      <div className="flex justify-center mb-6">
        <video
          ref={videoRef}
          autoPlay
          muted
          className="w-full max-w-xl h-auto bg-black border-4 border-gray-300 rounded-lg shadow-lg"
        />
      </div>

      <div className="flex justify-center">
        <button
          onClick={isStreaming ? stopStreaming : startStreaming}
          disabled={!isConnected || !mediaStream}
          className={`px-6 py-3 text-white font-semibold rounded-md transition-all duration-200 ${
            isStreaming ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
          } ${(!isConnected || !mediaStream) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isStreaming ? '🛑 Stop Streaming' : '▶️ Start Streaming'}
        </button>
      </div>

      <div className="mt-6 text-center text-gray-600 text-sm">
        <p>Make sure your backend is running on <code>localhost:3001</code></p>
        <p>Streaming status: <span className="font-medium">{isStreaming ? 'Live' : 'Stopped'}</span></p>
      </div>
    </div>
  )
}
