import express from 'express'
import { PrismaClient } from '../generated/prisma/index.js'

const router = express.Router()
const prisma = new PrismaClient()


router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params
        const { page = 1, limit = 10, status } = req.query
        
        const skip = (parseInt(page) - 1) * parseInt(limit)
        
        const whereClause = { userId }
        if (status) {
            whereClause.status = status
        }
        
        const [streams, totalCount] = await Promise.all([
            prisma.stream.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit),
                include: {
                    streamKey: {
                        select: {
                            name: true,
                            platform: true
                        }
                    },
                    recording: {
                        select: {
                            id: true,
                            filename: true,
                            duration: true,
                            fileSize: true,
                            isProcessed: true
                        }
                    },
                    _count: {
                        select: {
                            analytics: true
                        }
                    }
                }
            }),
            prisma.stream.count({ where: whereClause })
        ])
        
        res.json({
            success: true,
            streams,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalCount,
                pages: Math.ceil(totalCount / parseInt(limit))
            }
        })
    } catch (error) {
        console.error('Error fetching streams:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
})


router.post('/create', async (req, res) => {
    try {
        const { userId, streamKeyId, title, description, quality = 'medium' } = req.body
        
        if (!userId || !streamKeyId || !title) {
            return res.status(400).json({
                error: 'User ID, stream key ID, and title are required'
            })
        }
        

        const streamKey = await prisma.streamKey.findFirst({
            where: {
                id: streamKeyId,
                userId,
                isActive: true
            }
        })
        
        if (!streamKey) {
            return res.status(404).json({ error: 'Stream key not found or inactive' })
        }
        
        const stream = await prisma.stream.create({
            data: {
                title,
                description,
                platform: streamKey.platform,
                quality,
                userId,
                streamKeyId,
                status: 'created',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            include: {
                streamKey: {
                    select: {
                        name: true,
                        platform: true
                    }
                }
            }
        })
        
        res.json({
            success: true,
            stream
        })
    } catch (error) {
        console.error('Error creating stream:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
})


router.put('/:streamId/status', async (req, res) => {
    try {
        const { streamId } = req.params
        const { userId, status, viewers, bitrate, fps, resolution } = req.body
        
        if (!userId || !status) {
            return res.status(400).json({ error: 'User ID and status are required' })
        }
        
        const updateData = {
            status,
            updatedAt: new Date()
        }
        
        if (status === 'live' && !await prisma.stream.findFirst({ where: { id: streamId, startedAt: { not: null } } })) {
            updateData.startedAt = new Date()
            

            await prisma.user.update({
                where: { id: userId },
                data: { isLive: true }
            })
        }
        
        if (status === 'ended') {
            updateData.endedAt = new Date()
            

            const stream = await prisma.stream.findUnique({
                where: { id: streamId },
                select: { startedAt: true }
            })
            
            if (stream?.startedAt) {
                updateData.duration = Math.floor((new Date() - stream.startedAt) / 1000)
            }
            

            await prisma.user.update({
                where: { id: userId },
                data: {
                    isLive: false,
                    totalStreams: { increment: 1 }
                }
            })
        }
        
        const updatedStream = await prisma.stream.updateMany({
            where: {
                id: streamId,
                userId
            },
            data: updateData
        })
        
        if (updatedStream.count === 0) {
            return res.status(404).json({ error: 'Stream not found' })
        }
        

        if (status === 'live' && (viewers !== undefined || bitrate || fps || resolution)) {
            await prisma.streamAnalytics.create({
                data: {
                    streamId,
                    userId,
                    viewers: viewers || 0,
                    bitrate,
                    fps,
                    resolution,
                    timestamp: new Date()
                }
            })
            

            if (viewers !== undefined) {
                const currentStream = await prisma.stream.findUnique({
                    where: { id: streamId },
                    select: { peakViewers: true }
                })
                
                if (viewers > (currentStream?.peakViewers || 0)) {
                    await prisma.stream.update({
                        where: { id: streamId },
                        data: { peakViewers: viewers }
                    })
                }
            }
        }
        
        res.json({
            success: true,
            message: 'Stream status updated successfully'
        })
    } catch (error) {
        console.error('Error updating stream status:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
})


router.get('/:streamId/analytics', async (req, res) => {
    try {
        const { streamId } = req.params
        const { userId } = req.query
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' })
        }
        

        const stream = await prisma.stream.findFirst({
            where: {
                id: streamId,
                userId
            }
        })
        
        if (!stream) {
            return res.status(404).json({ error: 'Stream not found' })
        }
        
        const analytics = await prisma.streamAnalytics.findMany({
            where: { streamId },
            orderBy: { timestamp: 'asc' }
        })
        

        const summary = {
            totalDataPoints: analytics.length,
            averageViewers: analytics.length > 0 ? 
                Math.round(analytics.reduce((sum, a) => sum + a.viewers, 0) / analytics.length) : 0,
            peakViewers: Math.max(...analytics.map(a => a.viewers), 0),
            averageBitrate: analytics.filter(a => a.bitrate).length > 0 ?
                Math.round(analytics.filter(a => a.bitrate).reduce((sum, a) => sum + a.bitrate, 0) / analytics.filter(a => a.bitrate).length) : null,
            averageFps: analytics.filter(a => a.fps).length > 0 ?
                Math.round(analytics.filter(a => a.fps).reduce((sum, a) => sum + a.fps, 0) / analytics.filter(a => a.fps).length) : null
        }
        
        res.json({
            success: true,
            stream: {
                id: stream.id,
                title: stream.title,
                status: stream.status,
                startedAt: stream.startedAt,
                endedAt: stream.endedAt,
                duration: stream.duration
            },
            analytics,
            summary
        })
    } catch (error) {
        console.error('Error fetching stream analytics:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
})


router.delete('/:streamId', async (req, res) => {
    try {
        const { streamId } = req.params
        const { userId } = req.query
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' })
        }
        
        const deletedStream = await prisma.stream.deleteMany({
            where: {
                id: streamId,
                userId
            }
        })
        
        if (deletedStream.count === 0) {
            return res.status(404).json({ error: 'Stream not found' })
        }
        
        res.json({
            success: true,
            message: 'Stream deleted successfully'
        })
    } catch (error) {
        console.error('Error deleting stream:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
})

export default router
