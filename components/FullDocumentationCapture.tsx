'use client'

import { useState } from 'react'
import { Camera } from 'lucide-react'
import { prepareImageForUpload } from '@/lib/client-image-upload'

const categories = [
  ['front_elevation', 'Front elevation'], ['rear_elevation', 'Rear elevation'],
  ['left_elevation', 'Left elevation'], ['right_elevation', 'Right elevation'],
  ['roof_planes', 'Roof planes'], ['ridges_hips', 'Ridges and hips'], ['valleys', 'Valleys'],
  ['flashing', 'Flashing'], ['chimneys', 'Chimneys'], ['vents_penetrations', 'Vents and penetrations'],
  ['gutters_drainage', 'Gutters and drainage'], ['trees_environment', 'Trees and environmental exposure'],
  ['visible_maintenance', 'Visible maintenance items'], ['closer_inspection', 'Areas requiring closer inspection'],
  ['supporting_conditions', 'Supporting property conditions'],
]

export default function FullDocumentationCapture({ propertyId, authorized }: { propertyId: string; authorized: boolean }) {
  const [category, setCategory] = useState('front_elevation')
  const [caption, setCaption] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const markComplete = async () => {
    const response = await fetch(`/api/property/${propertyId}/status`, { method: 'POST' })
    const body = await response.json()
    setMessage(response.ok ? `Documentation complete with ${body.full_photo_count} full images.` : body.error || 'Unable to complete documentation')
  }

  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files?.length) return
    setUploading(true)
    setMessage(null)
    let uploaded = 0
    for (const originalFile of Array.from(files)) {
      let file: File
      try {
        file = await prepareImageForUpload(originalFile)
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'The photo could not be prepared for upload.')
        break
      }
      const form = new FormData()
      form.append('property_id', propertyId)
      form.append('phase', 'full_house')
      form.append('category', category)
      form.append('caption', caption || 'Representative visual observation; definitive diagnosis not established.')
      form.append('image', file)
      const response = await fetch('/api/photo', { method: 'POST', body: form })
      const body = await response.json()
      if (!response.ok) {
        setMessage(body.error || 'Upload failed')
        break
      }
      uploaded += 1
    }
    if (uploaded) setMessage(`${uploaded} immutable timeline image${uploaded === 1 ? '' : 's'} added.`)
    setUploading(false)
    event.target.value = ''
  }

  if (!authorized) return (
    <section className="mb-8 rounded-3xl border border-white/10 bg-[#111827] p-6">
      <div className="text-xs font-bold tracking-widest text-white/50">FULL DOCUMENTATION LOCKED</div>
      <p className="mt-3 text-sm text-white/65">A recorded homeowner approval is required before the 20+ image workflow unlocks.</p>
    </section>
  )

  return (
    <section className="mb-8 rounded-3xl border border-emerald-400/25 bg-emerald-400/5 p-6">
      <div className="text-xs font-bold tracking-widest text-emerald-300">FULL DOCUMENTATION AUTHORIZED</div>
      <p className="mt-2 text-sm text-white/60">Add categorized ground-level evidence. Corrections must be appended; originals cannot be changed or deleted.</p>
      <select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-5 w-full rounded-2xl border border-white/20 bg-[#111827] p-4 text-white">
        {categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <input value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={500} placeholder="Visual observation caption" className="mt-3 w-full rounded-2xl border border-white/20 bg-[#111827] p-4 text-white" />
      <label className="mt-4 flex cursor-pointer items-center justify-center gap-3 rounded-2xl bg-[#d4af37] p-5 font-bold tracking-widest text-[#0a0e1a]">
        <Camera className="h-5 w-5" /> {uploading ? 'UPLOADING…' : 'ADD DOCUMENTATION PHOTOS'}
        <input type="file" accept="image/*" capture="environment" multiple disabled={uploading} onChange={upload} className="hidden" />
      </label>
      {message && <p className="mt-4 text-sm text-white/70">{message}</p>}
      <button onClick={markComplete} className="mt-4 w-full rounded-2xl border border-emerald-400/40 p-4 text-sm font-bold tracking-widest text-emerald-200">MARK COMPLETE (20+ IMAGES)</button>
    </section>
  )
}
