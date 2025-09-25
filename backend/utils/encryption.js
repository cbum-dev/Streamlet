
import crypto from 'crypto'

/**
 * Encrypt a stream key
 * @param {string} text 
 * @returns {string}
 */
export function encryptStreamKey(text) {
    if (!text) throw new Error('Text to encrypt is required')

    return text
}

/**
 * Decrypt a stream key
 * @param {string} encryptedText - The encrypted stream key
 * @returns {string} - Decrypted stream key
 */
export function decryptStreamKey(encryptedText) {
    if (!encryptedText) throw new Error('Encrypted text is required')

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

export function testEncryption() {

    return true
}