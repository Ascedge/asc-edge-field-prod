'use client';

import { useState } from 'react';
import { Camera, Image as ImageIcon } from 'lucide-react';
import { prepareImageForUpload } from '@/lib/client-image-upload';

interface PreKnockCaptureProps {
  propertyId: string;
  initialPhotos?: PhotoItem[];
}

interface PhotoItem {
  id: string;
  url: string;
  status: string;
  file?: File;
}

export default function PreKnockCapture({ propertyId, initialPhotos = [] }: PreKnockCaptureProps) {
  const [photos, setPhotos] = useState<PhotoItem[]>(initialPhotos);
  const [message, setMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState('front_elevation');
  const [caption, setCaption] = useState('Ground-level exterior view; visual documentation only.');

  const retryUpload = async (tempId: string, propertyId: string) => {
    const photo = photos.find(p => p.id === tempId);
    if (!photo || !photo.file) return;

    setPhotos(prev => prev.map(p => p.id === tempId ? { ...p, status: 'uploading' } : p));
    setMessage(null);

    let uploadFile: File;
    try {
      uploadFile = await prepareImageForUpload(photo.file);
      setPhotos(prev => prev.map(p => p.id === tempId ? { ...p, file: uploadFile } : p));
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'The photo could not be prepared for upload.';
      setMessage(detail);
      setPhotos(prev => prev.map(p => p.id === tempId ? { ...p, status: 'error' } : p));
      return;
    }

    const formData = new FormData();
    formData.append('property_id', propertyId);
    formData.append('phase', 'pre_knock');
    formData.append('category', category);
    formData.append('caption', caption);
    formData.append('image', uploadFile);

    try {
      const res = await fetch('/api/photo', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (res.ok && result.url) {
        setPhotos(prev => 
          prev.map(p => p.id === tempId 
            ? { id: result.photo_id || tempId, url: result.url, status: 'uploaded', file: undefined }
            : p
          )
        );
      } else {
        setMessage(result.error || 'Upload failed. Confirm you are using the recovery preview and remain signed in.');
        setPhotos(prev => prev.map(p => p.id === tempId ? { ...p, status: 'error', file: photo.file } : p));
      }
    } catch {
      setPhotos(prev => prev.map(p => p.id === tempId ? { ...p, status: 'error', file: photo.file } : p));
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setMessage(null);

    for (let i = 0; i < files.length; i++) {
      const originalFile = files[i];
      const tempId = 'temp-' + Date.now() + '-' + i;

      // Add placeholder with file for retry
      setPhotos(prev => [...prev, { id: tempId, url: '', status: 'uploading', file: originalFile }]);

      let file: File;
      try {
        file = await prepareImageForUpload(originalFile);
        setPhotos(prev => prev.map(p => p.id === tempId ? { ...p, file } : p));
      } catch (error) {
        const detail = error instanceof Error ? error.message : 'The photo could not be prepared for upload.';
        setMessage(detail);
        setPhotos(prev => prev.map(p => p.id === tempId ? { ...p, status: 'error', file: originalFile } : p));
        continue;
      }

      const formData = new FormData();
      formData.append('property_id', propertyId);
      formData.append('phase', 'pre_knock');
      formData.append('category', category);
      formData.append('caption', caption);
      formData.append('image', file);

      try {
        const res = await fetch('/api/photo', {
          method: 'POST',
          body: formData,
        });

        const result = await res.json();

        if (res.ok && result.url) {
          setPhotos(prev => 
            prev.map(p => p.id === tempId 
              ? { id: result.photo_id || tempId, url: result.url, status: 'uploaded' }
              : p
            )
          );
        } else {
          setMessage(result.error || 'Upload failed. Confirm you are using the recovery preview and remain signed in.');
          setPhotos(prev => 
            prev.map(p => p.id === tempId ? { ...p, status: 'error' } : p)
          );
        }
      } catch {
        setMessage('The upload could not reach the preview. Check your connection and try again.');
        setPhotos(prev => 
          prev.map(p => p.id === tempId ? { ...p, status: 'error' } : p)
        );
      }
    }

    setUploading(false);
    // Reset input
    e.target.value = '';
  };

  return (
    <div className="mb-8">
      <div className="mb-4 rounded-3xl border border-amber-400/25 bg-amber-400/10 p-5">
        <div className="text-xs font-bold tracking-widest text-amber-200">PRELIMINARY EXTERIOR DOCUMENTATION</div>
        <p className="mt-2 text-sm text-white/60">Limited ground-level photos only. This is not a complete inspection.</p>
      </div>
      <label className="mb-2 block text-xs tracking-widest text-white/50">PHOTO VIEW</label>
      <select value={category} onChange={(event) => setCategory(event.target.value)} className="mb-3 w-full rounded-2xl border border-white/20 bg-[#111827] p-4 text-white">
        <option value="front_elevation">Front elevation</option>
        <option value="left_elevation">Left / front-left overview</option>
        <option value="right_elevation">Right / front-right overview</option>
        <option value="visible_maintenance">Visible maintenance concern</option>
      </select>
      <input value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={500} aria-label="Photo caption" className="mb-4 w-full rounded-2xl border border-white/20 bg-[#111827] p-4 text-white" />
      {/* Camera button (capture=environment) */}
      <button 
        onClick={() => document.getElementById('pre-knock-camera')?.click()}
        className="w-full bg-[#d4af37] hover:bg-[#e5c15c] active:bg-[#b38a2e] text-[#0a0e1a] font-bold text-lg py-6 rounded-3xl tracking-widest transition-all shadow-xl shadow-black/50 flex items-center justify-center gap-3 mb-3"
        disabled={uploading}
      >
        {uploading ? 'UPLOADING...' : 'TAKE PHOTO WITH CAMERA'}
        <Camera className="w-6 h-6" />
      </button>

      {/* Library button - separate input without capture */}
      <button 
        onClick={() => document.getElementById('pre-knock-library')?.click()}
        className="w-full bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold text-lg py-6 rounded-3xl tracking-widest transition-all shadow-xl shadow-black/50 flex items-center justify-center gap-3"
        disabled={uploading}
      >
        CHOOSE FROM LIBRARY
        <ImageIcon className="w-6 h-6" />
      </button>

      <input
        id="pre-knock-camera"
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      <input
        id="pre-knock-library"
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {message && <p className="mt-4 rounded-2xl border border-red-300/25 bg-red-300/10 p-4 text-sm text-red-100">{message}</p>}

      {photos.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3">
          {photos.map((photo) => (
            <div key={photo.id} className="relative rounded-2xl overflow-hidden border border-white/10 aspect-video bg-black">
              {photo.url ? (
                <img src={photo.url} alt="Pre-knock" className="w-full h-full object-cover" />
              ) : photo.status === 'error' ? (
                <div 
                  onClick={() => retryUpload(photo.id, propertyId)}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 cursor-pointer hover:bg-black/90 rounded-2xl"
                >
                  <div className="text-red-400 text-sm mb-3">Upload failed 🌧️</div>
                  <div className="bg-white text-black text-xs font-bold px-6 py-2 rounded-2xl active:scale-95">RETRY ⛈️</div>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-white/40 text-sm">
                  {photo.status}
                </div>
              )}
              {photo.status === 'uploaded' && (
                <div className="absolute top-2 right-2 bg-green-500 text-[10px] px-2 py-0.5 rounded-full text-black font-bold">✓</div>
              )}
            </div>
          ))}
        </div>
      )}

      {photos.filter(p => p.status === 'uploaded').length > 0 && (
        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold py-4 rounded-3xl tracking-widest"
          >
            LEAVE CARD & MOVE ON
          </button>
          <button
            onClick={() => window.location.href = `/property/${propertyId}/present`}
            className="w-full bg-[#d4af37] hover:bg-[#e5c15c] active:bg-[#b38a2e] text-[#0a0e1a] font-bold py-4 rounded-3xl tracking-widest"
          >
            HOMEOWNER ANSWERED →
          </button>
        </div>
      )}

      <div className="text-center text-[10px] text-white/40 mt-6">
        Recommended: front, left overview, right overview, and one visible concern when applicable.
      </div>
    </div>
  );
}
