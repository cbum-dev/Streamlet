import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex')
const ALGORITHM = 'aes-256-gcm'

/**
 * Encrypt a stream key
 * @param {string} text - The stream key to encrypt
 * @returns {string} - Encrypted string with IV and auth tag
 */
export function encryptStreamKey(text) {
    if (!text) throw new Error('Text to encrypt is required')
    
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipher(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'))
    
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const authTag = cipher.getAuthTag()
    
    // Combine IV, auth tag, and encrypted data
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted
}

/**
 * Decrypt a stream key
 * @param {string} encryptedText - The encrypted stream key
 * @returns {string} - Decrypted stream key
 */
export function decryptStreamKey(encryptedText) {
    if (!encryptedText) throw new Error('Encrypted text is required')
    
    try {
        const parts = encryptedText.split(':')
        if (parts.length !== 3) {
            throw new Error('Invalid encrypted format')
        }
        
        const iv = Buffer.from(parts[0], 'hex')
        const authTag = Buffer.from(parts[1], 'hex')
        const encrypted = parts[2]
        
        const decipher = crypto.createDecipher(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'))
        decipher.setAuthTag(authTag)
        
        let decrypted = decipher.update(encrypted, 'hex', 'utf8')
        decrypted += decipher.final('utf8')
        
        return decrypted
    } catch (error) {
        throw new Error('Failed to decrypt stream key: ' + error.message)
    }
}

/**
 * Generate a secure random stream key for testing
 * @returns {string} - Random stream key
 */
export function generateTestStreamKey() {
    return crypto.randomBytes(16).toString('hex')
}

/**
 * Mask a stream key for display (show only first 4 and last 4 characters)
 * @param {string} streamKey - The stream key to mask
 * @returns {string} - Masked stream key
 */
export function maskStreamKey(streamKey) {
    if (!streamKey || streamKey.length < 8) {
        return '****-****'
    }
    
    const start = streamKey.substring(0, 4)
    const end = streamKey.substring(streamKey.length - 4)
    const middle = '*'.repeat(Math.max(4, streamKey.length - 8))
    
    return `${start}${middle}${end}`
}
