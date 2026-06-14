import { notFound } from 'next/navigation';

export default function PresentPage() {
  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-4xl font-bold text-[#d4af37] mb-8">Sales Conviction Flow</h1>
        <div className="bg-[#111827] border border-[#d4af37]/30 rounded-3xl p-10 text-center">
          <p className="text-2xl mb-6">HOMEOWNER ANSWERED PATH</p>
          <p className="text-white/70 text-lg">Full sales / conviction / 3-path flow coming in Task 8.6.</p>
          <div className="mt-12 text-xs text-white/40">This is the placeholder for the positive homeowner response path.</div>
        </div>
      </div>
    </div>
  );
}
