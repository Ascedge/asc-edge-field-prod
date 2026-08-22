import { createHash, randomBytes } from 'node:crypto'

export const generateShareToken = (): { rawToken: string; tokenHash: string } => {
  const rawToken = randomBytes(32).toString('base64url')
  return { rawToken, tokenHash: hashShareToken(rawToken) }
}

export const hashShareToken = (rawToken: string): string =>
  createHash('sha256').update(rawToken, 'utf8').digest('hex')
