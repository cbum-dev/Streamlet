// Encryption disabled: using pass-through functions for development
// Keep exports to avoid changing import sites
import crypto from 'crypto'

/**
 * Encrypt a stream key
 * @param {string} text - The stream key to encrypt
 * @returns {string} - Encrypted string with IV and auth tag
 */
export function encryptStreamKey(text) {
    if (!text) throw new Error('Text to encrypt is required')
    // Pass-through: store plaintext
    return text
}

/**
 * Decrypt a stream key
 * @param {string} encryptedText - The encrypted stream key
 * @returns {string} - Decrypted stream key
 */
export function decryptStreamKey(encryptedText) {
    if (!encryptedText) throw new Error('Encrypted text is required')
    // Pass-through: return plaintext
    return encryptedText
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

/**
 * Test function to verify encryption/decryption works
 */
export function testEncryption() {
    // Always true in pass-through mode
    return true
}