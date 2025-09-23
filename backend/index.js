import http from 'http'
import { spawn } from 'child_process'
import express from 'express'
import { Server as SocketIO } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'
import crypto from 'crypto'
import { PrismaClient } from './generated/prisma/index.js'
import { decryptStreamKey } from './utils/encryption.js'

// Import routes
import authRoutes from './routes/auth.js'
import streamKeyRoutes from './routes/streamKeys.js'
import streamRoutes from './routes/streams.js'

dotenv.config()

const app = express()
const server = http.createServer(app)
const prisma = new PrismaClient()

const io = new SocketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    }
})

app.use(cors({
    origin: "*",
    credentials: true
}))

app.use(express.json())

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/stream-keys', streamKeyRoutes)
app.use('/api/streams', streamRoutes)

const activeStreams = new Map()

function generateStreamId() {
    return crypto.randomBytes(16).toString('hex')
}

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
        streamKey: '[HIDDEN]' 
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
    
    socket.on('startStream', async ({ streamId, userId, streamKeyId, quality }) => {
        try {
            console.log(`Starting stream ${streamId} for user ${userId}`)
            
            // Get the stream and decrypt the stream key
            const stream = await prisma.stream.findFirst({
                where: {
                    id: streamId,
                    userId
                },
                include: {
                    streamKey: true
                }
            })
            
            if (!stream) {
                socket.emit('streamError', { error: 'Stream not found' })
                return
            }
            
            if (!stream.streamKey.isActive) {
                socket.emit('streamError', { error: 'Stream key is inactive' })
                return
            }
            
            // Decrypt the stream key
            const decryptedKey = decryptStreamKey(stream.streamKey.encryptedKey)
            const platform = stream.streamKey.platform
            
            const ffmpegProcess = createFFmpegProcess(decryptedKey, platform, quality || stream.quality)
            
            socket.ffmpegProcess = ffmpegProcess
            socket.streamId = streamId
            socket.userId = userId
            
            // Update stream status in database
            await prisma.stream.update({
                where: { id: streamId },
                data: {
                    status: 'live',
                    startedAt: new Date(),
                    updatedAt: new Date()
                }
            })
            
            // Update user live status
            await prisma.user.update({
                where: { id: userId },
                data: { isLive: true }
            })
            
            // Update stream key last used
            await prisma.streamKey.update({
                where: { id: stream.streamKeyId },
                data: { lastUsed: new Date() }
            })
            
            ffmpegProcess.on('close', async (code) => {
                if (code !== 0) {
                    socket.emit('streamError', { error: `Stream failed with code ${code}` })
                    
                    // Update stream status to error
                    await prisma.stream.update({
                        where: { id: streamId },
                        data: {
                            status: 'error',
                            endedAt: new Date(),
                            updatedAt: new Date()
                        }
                    })
                }
            })
            
            socket.emit('streamStarted', { streamId, status: 'live' })
            
            // Start analytics collection
            socket.analyticsInterval = setInterval(async () => {
                if (socket.streamId && socket.userId) {
                    // In a real implementation, you'd get actual metrics from FFmpeg
                    const mockViewers = Math.floor(Math.random() * 100) + 1
                    
                    await prisma.streamAnalytics.create({
                        data: {
                            streamId: socket.streamId,
                            userId: socket.userId,
                            viewers: mockViewers,
                            timestamp: new Date()
                        }
                    })
                    
                    // Update peak viewers if necessary
                    const currentStream = await prisma.stream.findUnique({
                        where: { id: socket.streamId },
                        select: { peakViewers: true }
                    })
                    
                    if (mockViewers > (currentStream?.peakViewers || 0)) {
                        await prisma.stream.update({
                            where: { id: socket.streamId },
                            data: { peakViewers: mockViewers }
                        })
                    }
                    
                    socket.emit('streamMetrics', { viewers: mockViewers })
                }
            }, 30000) // Every 30 seconds
            
        } catch (error) {
            console.error('Error starting stream:', error)
            socket.emit('streamError', { error: 'Failed to start stream' })
        }
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
    
    socket.on('stopStream', async () => {
        try {
            console.log('Stopping stream')
            
            if (socket.ffmpegProcess) {
                socket.ffmpegProcess.kill('SIGINT')
                socket.ffmpegProcess = null
            }
            
            if (socket.analyticsInterval) {
                clearInterval(socket.analyticsInterval)
                socket.analyticsInterval = null
            }
            
            if (socket.streamId && socket.userId) {
                // Get stream start time to calculate duration
                const stream = await prisma.stream.findUnique({
                    where: { id: socket.streamId },
                    select: { startedAt: true }
                })
                
                const duration = stream?.startedAt ? 
                    Math.floor((new Date() - stream.startedAt) / 1000) : 0
                
                // Update stream status
                await prisma.stream.update({
                    where: { id: socket.streamId },
                    data: {
                        status: 'ended',
                        endedAt: new Date(),
                        duration,
                        updatedAt: new Date()
                    }
                })
                
                // Update user status and increment total streams
                await prisma.user.update({
                    where: { id: socket.userId },
                    data: {
                        isLive: false,
                        totalStreams: { increment: 1 }
                    }
                })
            }
            
            socket.emit('streamStopped')
            
        } catch (error) {
            console.error('Error stopping stream:', error)
            socket.emit('streamError', { error: 'Failed to stop stream properly' })
        }
    })

    socket.on('disconnect', async () => {
        console.log('Socket Disconnected', socket.id)
        
        if (socket.ffmpegProcess) {
            socket.ffmpegProcess.kill('SIGINT')
        }
        
        if (socket.analyticsInterval) {
            clearInterval(socket.analyticsInterval)
        }
        
        // Clean up any active streams
        if (socket.streamId && socket.userId) {
            try {
                await prisma.stream.updateMany({
                    where: {
                        id: socket.streamId,
                        userId: socket.userId,
                        status: 'live'
                    },
                    data: {
                        status: 'ended',
                        endedAt: new Date(),
                        updatedAt: new Date()
                    }
                })
                
                await prisma.user.update({
                    where: { id: socket.userId },
                    data: { isLive: false }
                })
            } catch (error) {
                console.error('Error cleaning up on disconnect:', error)
            }
        }
    })
})

const PORT = process.env.PORT || 3001

server.listen(PORT, () => {
    console.log(`Backend server is running on PORT ${PORT}`)
})