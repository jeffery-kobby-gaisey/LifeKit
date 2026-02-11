/**
 * Encryption utilities using Web Crypto API
 * All operations are offline and local
 */

const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const IV_LENGTH = 12 // 96 bits for GCM
const SALT_LENGTH = 16
const ITERATIONS = 100000

/**
 * Derive encryption key from password using PBKDF2
 */
async function deriveKey(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  )

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    baseKey,
    KEY_LENGTH
  )

  return crypto.subtle.importKey('raw', bits, { name: ALGORITHM }, false, [
    'encrypt',
    'decrypt'
  ])
}

/**
 * Encrypt a blob with a password
 * Returns: IV (12 bytes) + Salt (16 bytes) + Ciphertext
 */
export async function encryptBlob(blob: Blob, password: string): Promise<Blob> {
  try {
    const buffer = await blob.arrayBuffer()
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))

    const key = await deriveKey(password, salt)

    const ciphertext = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv: iv },
      key,
      buffer
    )

    // Combine: salt + iv + ciphertext
    const combined = new Uint8Array(
      salt.length + iv.length + ciphertext.byteLength
    )
    combined.set(salt, 0)
    combined.set(iv, salt.length)
    combined.set(new Uint8Array(ciphertext), salt.length + iv.length)

    return new Blob([combined], { type: 'application/octet-stream' })
  } catch (error) {
    console.error('Encryption failed:', error)
    throw new Error('Failed to encrypt blob')
  }
}

/**
 * Decrypt a blob encrypted with encryptBlob()
 * Expects: IV (12 bytes) + Salt (16 bytes) + Ciphertext
 */
export async function decryptBlob(
  encryptedBlob: Blob,
  password: string,
  originalMimeType: string
): Promise<Blob> {
  try {
    const buffer = await encryptedBlob.arrayBuffer()
    const combined = new Uint8Array(buffer)

    // Extract components
    const salt = combined.slice(0, SALT_LENGTH)
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
    const ciphertext = combined.slice(SALT_LENGTH + IV_LENGTH)

    const key = await deriveKey(password, salt)

    const plaintext = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv: iv },
      key,
      ciphertext
    )

    return new Blob([plaintext], { type: originalMimeType })
  } catch (error) {
    console.error('Decryption failed:', error)
    throw new Error('Failed to decrypt blob. Wrong password?')
  }
}

/**
 * Hash a password for storing (non-reversible)
 * Used for PIN verification
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hexHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
    console.log('✓ [hashPassword] Computed hash for PIN length:', password.length, 'hash length:', hexHash.length)
    return hexHash
  } catch (error) {
    console.error('❌ [hashPassword] Failed:', error)
    throw new Error('Failed to hash password')
  }
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    console.log('✓ [verifyPassword] Computing hash for input PIN...')
    const computedHash = await hashPassword(password)
    console.log('✓ [verifyPassword] Hash comparison:')
    console.log('   Input hash:  ', computedHash.substring(0, 16) + '...')
    console.log('   Stored hash: ', hash.substring(0, 16) + '...')
    const matches = computedHash === hash
    console.log('   Match:', matches)
    return matches
  } catch (error) {
    console.error('❌ [verifyPassword] Failed:', error)
    return false
  }
}
