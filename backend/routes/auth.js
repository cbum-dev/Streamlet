import express from 'express'
import { PrismaClient } from '../generated/prisma/index.js'

const router = express.Router()
const prisma = new PrismaClient()

// Get user profile
router.get('/profile/:userId', async (req, res) => {
    try {
        const { userId } = req.params
        
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                streamKeys: {
                    select: {
                        id: true,
                        name: true,
                        platform: true,
                        isActive: true,
                        createdAt: true,
                        lastUsed: true,
                        // Don't include encryptedKey for security
                    }
                },
                streams: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    select: {
                        id: true,
                        title: true,
                        platform: true,
                        status: true,
                        startedAt: true,
                        endedAt: true,
                        peakViewers: true,
                        duration: true
                    }
                },
                _count: {
                    select: {
                        streams: true,
                        recordings: true
                    }
                }
            }
        })
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }
        
        res.json({
            success: true,
            user: {
                ...user,
                totalStreams: user._count.streams,
                totalRecordings: user._count.recordings
            }
        })
    } catch (error) {
        console.error('Error fetching user profile:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
})

// Update user profile
router.put('/profile/:userId', async (req, res) => {
    try {
        const { userId } = req.params
        const { name, streamTitle, streamDescription } = req.body
        
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                name,
                streamTitle,
                streamDescription,
                updatedAt: new Date()
            }
        })
        
        res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                streamTitle: user.streamTitle,
                streamDescription: user.streamDescription
            }
        })
    } catch (error) {
        console.error('Error updating user profile:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
})

// Create or update user (for NextAuth integration)
router.post('/user', async (req, res) => {
    try {
        const { email, name, image } = req.body
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required' })
        }
        
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                name,
                image,
                updatedAt: new Date()
            },
            create: {
                email,
                name,
                image,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        })
        
        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                image: user.image
            }
        })
    } catch (error) {
        console.error('Error creating/updating user:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
})

export default router
