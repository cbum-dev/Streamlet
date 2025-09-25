import express from 'express'
import { PrismaClient } from '../generated/prisma/index.js'
import { maskStreamKey } from '../utils/encryption.js'

const router = express.Router()
const prisma = new PrismaClient()

// Simple Mongo ObjectId validation (24 hex chars)
const isValidObjectId = (id) => typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id)

// Get all stream keys for a user
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params
        
        if (!isValidObjectId(userId)) {
            return res.status(400).json({ error: 'Invalid userId format. Expected 24-hex Mongo ObjectId.' })
        }
        
        const streamKeys = await prisma.streamKey.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                platform: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                lastUsed: true,
                encryptedKey: true // Stores plaintext in dev mode
            }
        })
        
        // Mask the stream keys for security (mask plaintext)
        const maskedKeys = streamKeys.map(key => ({
            ...key,
            maskedKey: maskStreamKey(key.encryptedKey || ''),
            encryptedKey: undefined
        }))
        
        res.json({
            success: true,
            streamKeys: maskedKeys
        })
    } catch (error) {
        console.error('Error fetching stream keys:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
})

// Create a new stream key
router.post('/create', async (req, res) => {
    try {
        const { userId, name, platform, streamKey } = req.body
        
        if (!userId || !name || !platform || !streamKey) {
            return res.status(400).json({
                error: 'User ID, name, platform, and stream key are required'
            })
        }
        
        const newStreamKey = await prisma.streamKey.create({
            data: {
                name,
                platform,
                encryptedKey: streamKey, // store plaintext (dev mode)
                userId,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        })
        
        res.json({
            success: true,
            streamKey: {
                id: newStreamKey.id,
                name: newStreamKey.name,
                platform: newStreamKey.platform,
                isActive: newStreamKey.isActive,
                maskedKey: maskStreamKey(streamKey),
                createdAt: newStreamKey.createdAt
            }
        })
    } catch (error) {
        console.error('Error creating stream key:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
})

router.get('/decrypt/:keyId', async (req, res) => {
    try {
        const { keyId } = req.params
        const { userId } = req.query
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' })
        }
        if (!isValidObjectId(userId) || !isValidObjectId(keyId)) {
            return res.status(400).json({ error: 'Invalid id format. Expected 24-hex Mongo ObjectId.' })
        }
        
        const streamKey = await prisma.streamKey.findFirst({
            where: {
                id: keyId,
                userId,
                isActive: true
            }
        })
        
        if (!streamKey) {
            return res.status(404).json({ error: 'Stream key not found or inactive' })
        }
        // Return plaintext directly in dev mode
        // Update last used timestamp
        await prisma.streamKey.update({
            where: { id: keyId },
            data: { lastUsed: new Date() }
        })

        res.json({ success: true, streamKey: streamKey.encryptedKey, platform: streamKey.platform, name: streamKey.name })
    } catch (error) {
        console.error('Error decrypting stream key:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
})

// Update stream key
router.put('/:keyId', async (req, res) => {
    try {
        const { keyId } = req.params
        const { userId, name, streamKey, isActive } = req.body
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' })
        }
        if (!isValidObjectId(userId) || !isValidObjectId(keyId)) {
            return res.status(400).json({ error: 'Invalid id format. Expected 24-hex Mongo ObjectId.' })
        }
        
        const updateData = {
            updatedAt: new Date()
        }
        
        if (name !== undefined) updateData.name = name
        if (isActive !== undefined) updateData.isActive = isActive
        if (streamKey) updateData.encryptedKey = encryptStreamKey(streamKey)
        
        const updatedKey = await prisma.streamKey.updateMany({
            where: {
                id: keyId,
                userId
            },
            data: updateData
        })
        
        if (updatedKey.count === 0) {
            return res.status(404).json({ error: 'Stream key not found' })
        }
        
        res.json({
            success: true,
            message: 'Stream key updated successfully'
        })
    } catch (error) {
        console.error('Error updating stream key:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
})

// Delete stream key
router.delete('/:keyId', async (req, res) => {
    try {
        const { keyId } = req.params
        const { userId } = req.query
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' })
        }
        if (!isValidObjectId(userId) || !isValidObjectId(keyId)) {
            return res.status(400).json({ error: 'Invalid id format. Expected 24-hex Mongo ObjectId.' })
        }
        
        const deletedKey = await prisma.streamKey.deleteMany({
            where: {
                id: keyId,
                userId
            }
        })
        
        if (deletedKey.count === 0) {
            return res.status(404).json({ error: 'Stream key not found' })
        }
        
        res.json({
            success: true,
            message: 'Stream key deleted successfully'
        })
    } catch (error) {
        console.error('Error deleting stream key:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
})

export default router
