import http from 'http'
import { spawn } from 'child_process'
import express from 'express'
import { Server as SocketIO } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'
import crypto from 'crypto'

dotenv.config()

const app = express()
const server = http.createServer(app)

const io = new SocketIO(server, {
    cors: {
        origin: ["http://localhost:3000", "https://localhost:3000"],
        methods: ["GET", "POST"],
        credentials: true
    }
})

app.use(cors({
    origin: ["http://localhost:3000", "https://localhost:3000"],
    credentials: true
}))

app.use(express.json())

// Store active streams
const activeStreams = new Map()

// Generate stream ID (not the actual stream key)
function generateStreamId() {
    return crypto.randomBytes(16).toString('hex')
}

// Create FFmpeg process with proper stream key handling
function createFFmpegProcess(streamKey, platform = 'youtube', quality = 'medium') {
    const qualitySettings = {
        low: { bitrate: '1000k', fps: 15, crf: '28' },
        medium: { bitrate: '2500k', fps: 25, crf: '25' },
        high: { bitrate: '4000k', fps: 30, crf: '23' },
        ultra: { bitrate: '6000k', fps: 60, crf: '21' }
    }

    const settings = qualitySettings[quality] || qualitySettings.medium

    const platformEndpoints = {
        youtube: `rtmp://a.rtmp.youtube.com/live2/${streamKey}`,
        twitch: `rtmp://live.twitch.tv/live/${streamKey}`,
        facebook: `rtmps://live-api-s.facebook.com:443/rtmp/${streamKey}`,
        custom: streamKey // For custom RTMP endpoints
    }

    const rtmpUrl = platformEndpoints[platform] || platformEndpoints.youtube

    console.log(`Starting FFmpeg with RTMP URL: ${rtmpUrl.replace(streamKey, '[HIDDEN]')}`)

    const options = [
        '-f', 'webm',
        '-i', 'pipe:0',
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-tune', 'zerolatency',
        '-r', settings.fps,
        '-g', settings.fps * 2,
        '-keyint_min', settings.fps,
        '-crf', settings.crf,
        '-pix_fmt', 'yuv420p',
        '-sc_threshold', '0',
        '-profile:v', 'baseline',
        '-level', '3.0',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-ar', '44100',
        '-ac', '2',
        '-b:v', settings.bitrate,
        '-maxrate', settings.bitrate,
        '-bufsize', `${parseInt(settings.bitrate) * 2}k`,
        '-f', 'flv',
        rtmpUrl
    ]

    const ffmpegProcess = spawn('ffmpeg', options)

    ffmpegProcess.stdout.on('data', (data) => {
        console.log(`ffmpeg stdout: ${data}`)
    })

    ffmpegProcess.stderr.on('data', (data) => {
        const output = data.toString()
        console.log(`ffmpeg stderr: ${output}`)
        
        // Check for authentication/connection errors
        if (output.includes('403') || output.includes('401')) {
            console.error('Authentication error: Invalid stream key')
        }
        if (output.includes('Connection refused') || output.includes('Network is unreachable')) {
            console.error('Network error: Cannot connect to streaming server')
        }
    })

    ffmpegProcess.on('close', (code) => {
        console.log(`ffmpeg process exited with code ${code}`)
        if (code !== 0) {
            console.error(`FFmpeg exited with error code ${code}`)
        }
    })

    ffmpegProcess.on('error', (err) => {
        console.error('FFmpeg error:', err)
    })

    return ffmpegProcess
}

// API Routes
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend is running' })
})

app.post('/api/stream/create', (req, res) => {
    const { platform, quality, customEndpoint, userStreamKey } = req.body
    const streamId = crypto.randomUUID()
    
    // Don't generate a stream key - user must provide it
    if (!userStreamKey && platform !== 'custom') {
        return res.status(400).json({
            success: false,
            error: 'Stream key is required for selected platform'
        })
    }
    
    const streamConfig = {
        streamId,
        streamKey: userStreamKey || customEndpoint,
        platform: platform || 'youtube',
        quality: quality || 'medium',
        customEndpoint,
        createdAt: new Date().toISOString(),
        status: 'created'
    }

    activeStreams.set(streamId, streamConfig)
    
    res.json({
        success: true,
        streamId,
        config: streamConfig
    })
})

app.get('/api/streams', (req, res) => {
    const streams = Array.from(activeStreams.values()).map(stream => ({
        ...stream,
        streamKey: '[HIDDEN]' // Don't expose stream keys in API
    }))
    res.json({ streams })
})

app.delete('/api/stream/:streamId', (req, res) => {
    const { streamId } = req.params
    if (activeStreams.has(streamId)) {
        activeStreams.delete(streamId)
        res.json({ success: true, message: 'Stream deleted' })
    } else {
        res.status(404).json({ success: false, message: 'Stream not found' })
    }
})

io.on('connection', socket => {
    console.log('Socket Connected', socket.id)
    
    socket.on('startStream', ({ streamId, streamKey, platform, quality, customEndpoint }) => {
        console.log(`Starting stream ${streamId} on ${platform}`)
        
        const effectiveStreamKey = platform === 'custom' ? customEndpoint : streamKey
        
        if (!effectiveStreamKey) {
            socket.emit('streamError', { error: 'Stream key is required' })
            return
        }
        
        const ffmpegProcess = createFFmpegProcess(effectiveStreamKey, platform, quality)
        
        socket.ffmpegProcess = ffmpegProcess
        socket.streamId = streamId
        
        // Update stream status
        if (activeStreams.has(streamId)) {
            const stream = activeStreams.get(streamId)
            stream.status = 'live'
            stream.startedAt = new Date().toISOString()
            activeStreams.set(streamId, stream)
        }
        
        // Monitor FFmpeg process for errors
        ffmpegProcess.on('close', (code) => {
            if (code !== 0) {
                socket.emit('streamError', { error: `Stream failed with code ${code}` })
            }
        })
        
        socket.emit('streamStarted', { streamId, status: 'live' })
    })
    
    socket.on('binarystream', stream => {
        if (socket.ffmpegProcess && socket.ffmpegProcess.stdin && socket.ffmpegProcess.stdin.writable) {
            socket.ffmpegProcess.stdin.write(stream, (err) => {
                if (err) {
                    console.log('FFmpeg write error:', err)
                    socket.emit('streamError', { error: err.message })
                }
            })
        }
    })
    
    socket.on('stopStream', () => {
        console.log('Stopping stream')
        if (socket.ffmpegProcess) {
            socket.ffmpegProcess.kill('SIGINT')
            socket.ffmpegProcess = null
        }
        
        if (socket.streamId && activeStreams.has(socket.streamId)) {
            const stream = activeStreams.get(socket.streamId)
            stream.status = 'stopped'
            stream.endedAt = new Date().toISOString()
            activeStreams.set(socket.streamId, stream)
        }
        
        socket.emit('streamStopped')
    })

    socket.on('disconnect', () => {
        console.log('Socket Disconnected', socket.id)
        if (socket.ffmpegProcess) {
            socket.ffmpegProcess.kill('SIGINT')
        }
    })
})

const PORT = process.env.PORT || 3001

server.listen(PORT, () => {
    console.log(`Backend server is running on PORT ${PORT}`)
})