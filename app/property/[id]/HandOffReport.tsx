'use client';

import { useState } from 'react'
import QRCode from 'react-qr-code'

interface HandOffReportProps {
  propertyId: string
}

export default function HandOffReport({ propertyId }: HandOffReportProps) {
  const [showQR, setShowQR] = useState(false);
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logHandOff = async () => {
    try {
      await fetch('/api/report-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: propertyId,
          event_type: 'baseline_view',
          variant: 'A'
        }),
      });
    } catch (e) {
      console.error('Failed to log hand-off', e);
    }
  };

  const handleShowQR = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/property/${propertyId}/share`, { method: 'POST' });
      const body = await response.json();
      if (!response.ok || !body.url) throw new Error(body.error || 'Unable to create secure Passport link');
      await logHandOff();
      setReportUrl(body.url);
      setShowQR(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to create secure Passport link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-8">
      <section className="mb-4 rounded-3xl border border-[#d4af37]/30 bg-[#d4af37]/5 p-6">
        <div className="text-xs font-bold tracking-widest text-[#d4af37]">HOMEOWNER AUTHORIZATION</div>
        <ol className="mt-4 space-y-2 text-sm text-white/70">
          <li>1. Add the limited preliminary exterior photographs above.</li>
          <li>2. Display this secure QR code to the homeowner.</li>
          <li>3. The homeowner reviews the preliminary Passport and approves or declines.</li>
          <li>4. Approval automatically unlocks the full documentation controls on this page.</li>
        </ol>
      </section>
      <button
        onClick={handleShowQR}
        disabled={loading}
        className="w-full bg-[#d4af37] hover:bg-[#e5c15c] text-[#0a0e1a] font-bold py-5 rounded-3xl text-center tracking-widest active:scale-[0.985] flex items-center justify-center gap-3"
      >
        {loading ? 'CREATING SECURE LINK...' : '📱 HAND OFF REPORT TO HOMEOWNER'}
      </button>
      {error && <p className="mt-3 text-center text-sm text-red-300">{error}</p>}

      {showQR && reportUrl && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-6" onClick={() => setShowQR(false)}>
          <div className="bg-white p-8 rounded-3xl text-center max-w-[300px]" onClick={e => e.stopPropagation()}>
            <div className="text-[#0a0e1a] mb-6">
              <div className="text-xl font-bold mb-2 tracking-wider">SCAN TO VIEW REPORT</div>
              <div className="text-sm text-black/60">Opens live property report on phone</div>
            </div>
            <div className="bg-white p-4 inline-block mb-6 shadow-2xl">
              <QRCode value={reportUrl} size={220} />
            </div>
            <div className="text-xs text-black/50 font-mono break-all leading-tight mb-6">
              {reportUrl}
            </div>
            <a href={reportUrl} target="_blank" rel="noreferrer" className="mb-5 block rounded-2xl bg-[#0a0e1a] px-4 py-3 text-sm font-bold text-[#d4af37]">
              OPEN HOMEOWNER AUTHORIZATION PAGE
            </a>
            <button
              onClick={() => setShowQR(false)}
              className="text-xs uppercase tracking-widest text-black/60 hover:text-black"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
