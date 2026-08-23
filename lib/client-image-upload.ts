const MAX_UPLOAD_BYTES = 3.5 * 1024 * 1024
const MAX_IMAGE_DIMENSION = 2400

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)
    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('This photo format could not be prepared. On iPhone, choose Most Compatible or take a new photo.'))
    }
    image.src = objectUrl
  })
}

function canvasBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => blob ? resolve(blob) : reject(new Error('The photo could not be prepared for upload.')),
      'image/jpeg',
      quality,
    )
  })
}

export async function prepareImageForUpload(file: File): Promise<File> {
  const alreadySupported = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
  if (alreadySupported && file.size <= MAX_UPLOAD_BYTES) return file

  const image = await loadImage(file)
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
  const context = canvas.getContext('2d')
  if (!context) throw new Error('The photo could not be prepared for upload.')
  context.drawImage(image, 0, 0, canvas.width, canvas.height)

  let quality = 0.86
  let blob = await canvasBlob(canvas, quality)
  while (blob.size > MAX_UPLOAD_BYTES && quality > 0.5) {
    quality -= 0.08
    blob = await canvasBlob(canvas, quality)
  }
  if (blob.size > MAX_UPLOAD_BYTES) {
    throw new Error('This photo is still too large. Crop it slightly and try again.')
  }

  const baseName = file.name.replace(/\.[^.]+$/, '') || 'property-photo'
  return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: file.lastModified })
}
