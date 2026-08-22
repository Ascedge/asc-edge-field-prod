import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import { getShareTokenEncryptionKey } from '@/lib/env'

export const generateShareToken = (): { rawToken: string; tokenHash: string } => {
  const rawToken = randomBytes(32).toString('base64url')
  return { rawToken, tokenHash: hashShareToken(rawToken) }
}

export const hashShareToken = (rawToken: string): string =>
  createHash('sha256').update(rawToken, 'utf8').digest('hex')

const encryptionKey = () => createHash('sha256').update(getShareTokenEncryptionKey(), 'utf8').digest()

export const encryptShareToken = (rawToken: string): string => {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(rawToken, 'utf8'), cipher.final()])
  return [iv, cipher.getAuthTag(), ciphertext].map((part) => part.toString('base64url')).join('.')
}

export const decryptShareToken = (encrypted: string): string => {
  const [ivValue, tagValue, ciphertextValue] = encrypted.split('.')
  if (!ivValue || !tagValue || !ciphertextValue) throw new Error('Invalid encrypted share token')
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivValue, 'base64url'))
  decipher.setAuthTag(Buffer.from(tagValue, 'base64url'))
  return Buffer.concat([decipher.update(Buffer.from(ciphertextValue, 'base64url')), decipher.final()]).toString('utf8')
}
