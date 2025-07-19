import { useState } from 'react'
import { StreamConfig } from '../types/streaming'

export const useStreamConfig = () => {
  const [streamConfig, setStreamConfig] = useState<StreamConfig | null>(null)
  const [platform, setPlatform] = useState('youtube')
  const [quality, setQuality] = useState('medium')
  const [customEndpoint, setCustomEndpoint] = useState('')
  const [userStreamKey, setUserStreamKey] = useState('')

  const createStreamConfig = async (setError: (error: string) => void, setSuccess: (message: string) => void) => {
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
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Failed to create stream configuration')
      }
    } catch (err) {
      setError('Failed to create stream configuration')
      console.log(err)
    }
  }

  const copyStreamKey = (setSuccess: (message: string) => void) => {
    if (streamConfig?.streamKey) {
      navigator.clipboard.writeText(streamConfig.streamKey)
      setSuccess('Stream key copied to clipboard!')
      setTimeout(() => setSuccess(''), 2000)
    }
  }

  return {
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
  }
}
