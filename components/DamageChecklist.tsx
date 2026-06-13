'use client';

import { useState, useEffect } from 'react';

interface DamageChecklistProps {
  propertyId: string;
  initialScore: number;
  initialObservations: string[];
}

const weights: Record<string, number> = {
  'Missing shingles': 0.5,
  'Bent/creased shingles': 0.5,
  'Hail marks/impact': 0.5,
  'Exposed underlayment/mat': 0.4,
  'Granule loss': 0.25,
  'Lifted/unsealed tabs': 0.25,
  'Rusted flashing': 0.25,
};

const options = Object.keys(weights);

export default function DamageChecklist({ propertyId, initialScore, initialObservations }: DamageChecklistProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set(initialObservations));
  const [score, setScore] = useState(initialScore);
  const [saving, setSaving] = useState(false);

  const calculateScore = (selected: Set<string>): number => {
    let delta = 0;
    selected.forEach(item => {
      delta += weights[item] || 0;
    });
    return Math.min(10, Math.max(0, initialScore + delta));
  };

  useEffect(() => {
    setScore(calculateScore(checked));
  }, [checked, initialScore]);

  const handleChange = async (option: string) => {
    const newChecked = new Set(checked);
    if (newChecked.has(option)) {
      newChecked.delete(option);
    } else {
      newChecked.add(option);
    }
    setChecked(newChecked);

    const newScore = calculateScore(newChecked);
    setSaving(true);

    try {
      const res = await fetch('/api/property/observations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          observations: Array.from(newChecked),
          field_score: newScore,
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
    } catch (err) {
      console.error('Save failed', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#111827] border border-[#d4af37]/30 rounded-3xl p-6 mb-8">
      <div className="text-[#d4af37] text-sm tracking-widest mb-4">WHAT DO YOU SEE? (Visible Damage)</div>
      
      <div className="space-y-3 mb-6">
        {options.map((option) => (
          <label key={option} className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={checked.has(option)}
              onChange={() => handleChange(option)}
              className="w-5 h-5 accent-[#d4af37] bg-[#0a0e1a] border border-white/30 rounded focus:ring-[#d4af37]"
            />
            <span className="text-white/90 group-hover:text-white transition-colors">{option}</span>
          </label>
        ))}
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-white/10">
        <div className="text-white/60 text-xs">Live Field Score</div>
        <div className="text-4xl font-bold text-[#d4af37] tabular-nums">
          {score.toFixed(1)}
          {saving && <span className="text-xs ml-2 text-white/40">saving...</span>}
        </div>
      </div>
      <div className="text-[10px] text-white/40 text-center mt-1">before → after • updates homeowner report</div>
    </div>
  );
}
