'use client';

import { useState, useEffect } from 'react';
import { Camera, Lock, CheckCircle2 } from 'lucide-react';

interface LogVisitFormProps {
  propertyId: string;
  photosCollected: number;
}

type Disposition = 'booked_inspection' | 'read_report_not_ready' | 'callback' | 'wants_info' | 'not_interested' | 'not_home' | 'hostile';

const dispositionLabels: Record<Disposition, string> = {
  booked_inspection: 'Booked Inspection',
  read_report_not_ready: 'Read Report - Not Ready',
  callback: 'Call Back Later',
  wants_info: 'Wants More Info',
  not_interested: 'Not Interested',
  not_home: 'Not Home',
  hostile: 'Hostile / No Answer',
};

const personalityOptions = [
  { label: 'Great', value: 3 },
  { label: 'Neutral', value: 2 },
  { label: 'Combative', value: 1 },
];

const observationOptions = [
  'Friendly conversation',
  'Concerned about cost',
  'Mentioned neighbors',
  'Interested in report',
  'Skeptical of insurer',
  'Has existing damage',
  'Asking for timeline',
];

export default function LogVisitForm({ propertyId, photosCollected }: LogVisitFormProps) {
  const [homeownerGender, setHomeownerGender] = useState<'Male' | 'Female' | ''>('');
  const [personality, setPersonality] = useState(3);
  const [observations, setObservations] = useState<string[]>([]);
  const [privateNote, setPrivateNote] = useState('');
  const [disposition, setDisposition] = useState<Disposition | ''>('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [visitId, setVisitId] = useState<string | null>(null);

  const toggleObservation = (obs: string) => {
    if (observations.includes(obs)) {
      setObservations(observations.filter(o => o !== obs));
    } else {
      setObservations([...observations, obs]);
    }
  };

  const deriveOutcome = (disp: Disposition): string => {
    if (disp === 'booked_inspection') return 'booked';
    if (disp === 'not_home' || disp === 'hostile') return 'none';
    return 'nurture';
  };

  const handleSubmitClick = () => {
    if (!disposition || !homeownerGender) {
      alert('Please select homeowner gender and disposition');
      return;
    }
    setShowConfirm(true);
  };

  const confirmSubmit = async () => {
    if (!disposition) return;

    setShowConfirm(false);
    setSubmitting(true);

    const outcome = deriveOutcome(disposition as Disposition);
    const repId = 'rep-test-001'; // placeholder per spec (can be uuid or text)

    try {
      const res = await fetch('/api/visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: propertyId,
          rep_id: repId,
          outcome,
          homeowner_gender: homeownerGender,
          receptivity: personality,
          observations,
          private_note: privateNote.trim() || null,
          photos_collected: photosCollected,
          disposition,
          notes_locked: true,
          notes_submitted_at: new Date().toISOString(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Insert failed');
      }

      setVisitId(data.visit_id || 'created');
      setIsSubmitted(true);
      alert('Visit successfully logged and locked! Row written to public.visits.');
    } catch (err: any) {
      console.error(err);
      alert('Error submitting visit: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-emerald-900/30 border border-emerald-500/50 rounded-3xl p-8 text-center">
        <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
        <div className="text-emerald-400 font-bold tracking-widest text-xl mb-2">VISIT LOGGED & LOCKED</div>
        <p className="text-white/70">Private notes submitted to management.<br/>This record cannot be edited.</p>
        <div className="text-[10px] text-emerald-500/70 mt-6">Visit ID: {visitId}</div>
      </div>
    );
  }

  return (
    <div className="mb-12 bg-[#111827] border border-white/10 rounded-3xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-[#d4af37] text-[#0a0e1a] px-4 py-1 rounded-full text-xs font-bold tracking-widest">REP CLOSE-OUT</div>
        <div className="text-white/40 text-sm">Photos collected: <span className="text-white font-mono">{photosCollected}</span></div>
      </div>

      {/* Homeowner Gender */}
      <div className="mb-8">
        <div className="uppercase text-white/50 text-xs tracking-widest mb-3">HOMEOWNER GENDER</div>
        <div className="flex gap-3">
          {(['Male', 'Female'] as const).map(g => (
            <button
              key={g}
              onClick={() => setHomeownerGender(g)}
              className={`flex-1 py-4 rounded-2xl font-medium transition-all ${
                homeownerGender === g 
                  ? 'bg-white text-black border-2 border-white' 
                  : 'bg-white/5 hover:bg-white/10 border border-white/20'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Personality */}
      <div className="mb-8">
        <div className="uppercase text-white/50 text-xs tracking-widest mb-3">PERSONALITY / RECEPTIVITY</div>
        <div className="flex gap-2">
          {personalityOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setPersonality(opt.value)}
              className={`flex-1 py-3 rounded-2xl text-sm font-medium transition-all ${
                personality === opt.value 
                  ? 'bg-[#d4af37] text-black' 
                  : 'bg-white/5 hover:bg-white/10 border border-white/20'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Observations */}
      <div className="mb-8">
        <div className="uppercase text-white/50 text-xs tracking-widest mb-3">QUICK OBSERVATIONS</div>
        <div className="grid grid-cols-2 gap-2">
          {observationOptions.map(obs => (
            <button
              key={obs}
              onClick={() => toggleObservation(obs)}
              className={`text-left px-4 py-3 rounded-2xl text-sm transition-all border ${
                observations.includes(obs) 
                  ? 'bg-white/20 border-white/60' 
                  : 'bg-white/5 border-white/20 hover:bg-white/10'
              }`}
            >
              {observations.includes(obs) ? '✓ ' : ''}{obs}
            </button>
          ))}
        </div>
      </div>

      {/* Private Note */}
      <div className="mb-8">
        <div className="uppercase text-white/50 text-xs tracking-widest mb-2">REP ONE-LINE NOTE (PRIVATE)</div>
        <textarea
          value={privateNote}
          onChange={(e) => setPrivateNote(e.target.value)}
          placeholder="One line for management eyes only..."
          className="w-full h-24 bg-black/40 border border-white/20 rounded-2xl p-4 text-white placeholder:text-white/40 focus:border-[#d4af37] resize-y"
          maxLength={280}
        />
      </div>

      {/* Disposition */}
      <div className="mb-10">
        <div className="uppercase text-white/50 text-xs tracking-widest mb-3">DISPOSITION (FINAL OUTCOME)</div>
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(dispositionLabels) as Disposition[]).map(disp => (
            <button
              key={disp}
              onClick={() => setDisposition(disp)}
              className={`text-left px-5 py-4 rounded-2xl text-sm border transition-all ${
                disposition === disp 
                  ? 'bg-[#d4af37] text-black border-[#d4af37]' 
                  : 'bg-white/5 border-white/20 hover:bg-white/10'
              }`}
            >
              {dispositionLabels[disp]}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSubmitClick}
        disabled={submitting || !disposition || !homeownerGender}
        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-white/10 disabled:text-white/30 text-white font-bold py-5 rounded-3xl tracking-[1px] text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.985]"
      >
        <Lock className="w-5 h-5" />
        SUBMIT TO MANAGEMENT
      </button>

      <div className="text-center text-[10px] text-white/40 mt-6">
        All fields recorded in public.visits • notes_locked = true after submission
      </div>

      {/* Final Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-6">
          <div className="bg-[#0a0e1a] border border-white/30 rounded-3xl max-w-md w-full p-8">
            <div className="text-amber-400 text-xl mb-6 font-medium">FINAL CONFIRMATION</div>
            
            <div className="text-white/90 leading-relaxed mb-8">
              Your private notes will be submitted to management and cannot be viewed or edited after submission. 
              Recorded for manager review only.
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-4 border border-white/30 rounded-2xl text-white/70 font-medium hover:bg-white/5"
              >
                CANCEL
              </button>
              <button
                onClick={confirmSubmit}
                disabled={submitting}
                className="flex-1 py-4 bg-white text-black rounded-2xl font-bold hover:bg-white/90 active:bg-white transition-all flex items-center justify-center gap-2"
              >
                {submitting ? 'SUBMITTING...' : 'YES, SUBMIT'}
              </button>
            </div>

            <div className="text-center text-[10px] text-white/30 mt-8">
              This action is irreversible
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
