import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'

export const useSocket = () => {
  const socketRef = useRef<any>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

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
    })

    return () => {
      socketRef.current?.disconnect()
    }
  }, [])

  return { socketRef, isConnected, error, success, setError, setSuccess }
}
