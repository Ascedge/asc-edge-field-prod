'use client';

import { useState } from 'react'
import QRCode from 'react-qr-code'

interface HandOffReportProps {
  propertyId: string
}

export default function HandOffReport({ propertyId }: HandOffReportProps) {
  const [showQR, setShowQR] = useState(false);
  const reportUrl = `https://asc-edge-field-prod.vercel.app/report/${propertyId}`;

  const logHandOff = async () => {
    try {
      await fetch('/api/report-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: propertyId,
          event_type: 'report_open',
          variant: 'A'
        }),
      });
    } catch (e) {
      console.error('Failed to log hand-off', e);
    }
  };

  const handleShowQR = () => {
    logHandOff();
    setShowQR(true);
  };

  return (
    <div className="mb-8">
      <button
        onClick={handleShowQR}
        className="w-full bg-[#d4af37] hover:bg-[#e5c15c] text-[#0a0e1a] font-bold py-5 rounded-3xl text-center tracking-widest active:scale-[0.985] flex items-center justify-center gap-3"
      >
        📱 HAND OFF REPORT TO HOMEOWNER
      </button>

      {showQR && (
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
