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

// Generate stream key
function generateStreamKey() {
    return crypto.randomBytes(16).toString('hex')
}

// Create FFmpeg process with dynamic stream key
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

    const options = [
        '-i', '-',
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-tune', 'zerolatency',
        '-r', settings.fps,
        '-g', settings.fps * 2,
        '-keyint_min', settings.fps,
        '-crf', settings.crf,
        '-pix_fmt', 'yuv420p',
        '-sc_threshold', '0',
        '-profile:v', 'main',
        '-level', '3.1',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-ar', '44100',
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
        console.error(`ffmpeg stderr: ${data}`)
    })

    ffmpegProcess.on('close', (code) => {
        console.log(`ffmpeg process exited with code ${code}`)
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
    const { platform, quality, customEndpoint } = req.body
    const streamId = crypto.randomUUID()
    const streamKey = generateStreamKey()
    
    const streamConfig = {
        streamId,
        streamKey,
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
        streamKey,
        config: streamConfig
    })
})

app.get('/api/streams', (req, res) => {
    const streams = Array.from(activeStreams.values())
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
        console.log(`Starting stream ${streamId}`)
        
        const effectiveStreamKey = platform === 'custom' ? customEndpoint : streamKey
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
        
        socket.emit('streamStarted', { streamId, status: 'live' })
    })
    
    socket.on('binarystream', stream => {
        if (socket.ffmpegProcess && socket.ffmpegProcess.stdin.writable) {
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
            socket.ffmpegProcess.kill('SIGTERM')
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
            socket.ffmpegProcess.kill('SIGTERM')
        }
    })
})

const PORT = process.env.PORT || 3001

server.listen(PORT, () => {
    console.log(`Backend server is running on PORT ${PORT}`)
})