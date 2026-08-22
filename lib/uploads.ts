export const MAX_IMAGE_BYTES = 10 * 1024 * 1024

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

const hasPrefix = (bytes: Uint8Array, prefix: number[]): boolean =>
  prefix.every((byte, index) => bytes[index] === byte)

export async function validateImage(file: File): Promise<{ extension: string }> {
  if (!allowedMimeTypes.has(file.type)) throw new Error('Image must be JPEG, PNG, or WebP')
  if (file.size === 0) throw new Error('Image file is empty')
  if (file.size > MAX_IMAGE_BYTES) throw new Error('Image must be 10 MB or smaller')

  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer())
  const detected = hasPrefix(bytes, [0xff, 0xd8, 0xff])
    ? { mime: 'image/jpeg', extension: 'jpg' }
    : hasPrefix(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      ? { mime: 'image/png', extension: 'png' }
      : hasPrefix(bytes, [0x52, 0x49, 0x46, 0x46]) &&
          String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
        ? { mime: 'image/webp', extension: 'webp' }
        : null

  if (!detected || detected.mime !== file.type) {
    throw new Error('Image contents do not match the declared file type')
  }
  return { extension: detected.extension }
}
