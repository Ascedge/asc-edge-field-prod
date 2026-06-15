'use client';

import { useState } from 'react';
import { Camera, Image as ImageIcon } from 'lucide-react';

interface PreKnockCaptureProps {
  propertyId: string;
}

interface PhotoItem {
  id: string;
  url: string;
  status: string;
  file?: File;
}

export default function PreKnockCapture({ propertyId }: PreKnockCaptureProps) {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [uploading, setUploading] = useState(false);

  const retryUpload = async (tempId: string, propertyId: string) => {
    const photo = photos.find(p => p.id === tempId);
    if (!photo || !photo.file) return;

    setPhotos(prev => prev.map(p => p.id === tempId ? { ...p, status: 'uploading' } : p));

    const formData = new FormData();
    formData.append('property_id', propertyId);
    formData.append('phase', 'pre_knock');
    formData.append('image', photo.file);

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
        setPhotos(prev => prev.map(p => p.id === tempId ? { ...p, status: 'error', file: photo.file } : p));
      }
    } catch (err) {
      setPhotos(prev => prev.map(p => p.id === tempId ? { ...p, status: 'error', file: photo.file } : p));
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const tempId = 'temp-' + Date.now() + '-' + i;

      // Add placeholder with file for retry
      setPhotos(prev => [...prev, { id: tempId, url: '', status: 'uploading', file }]);

      const formData = new FormData();
      formData.append('property_id', propertyId);
      formData.append('phase', 'pre_knock');
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
          setPhotos(prev => 
            prev.map(p => p.id === tempId ? { ...p, status: 'error' } : p)
          );
        }
      } catch (err) {
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
                  <div className="text-red-400 text-sm mb-3">Upload failed</div>
                  <div className="bg-white text-black text-xs font-bold px-6 py-2 rounded-2xl active:scale-95">RETRY</div>
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
        Take 2–3 front-of-house photos before the knock • phase=pre_knock
      </div>
    </div>
  );
}
