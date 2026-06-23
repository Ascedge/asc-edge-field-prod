'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowRight, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface Slide {
  id: number;
  title: string;
  content: string;
  primaryCta: string;
  secondaryCta: string;
  showScore?: boolean;
  showIndicators?: boolean;
}

export default function HomeownerCarousel() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [fieldScore, setFieldScore] = useState<number | null>(null);
  const [observations, setObservations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasVisitedSlide, setHasVisitedSlide] = useState<Record<number, boolean>>({});
  const touchStartX = useRef(0);
  const isLogging = useRef(false);

  const slides: Slide[] = [
    {
      id: 1,
      title: "Totally fair.",
      content: "This entire process is designed to be 100% transparent. No pressure. No surprises. Just clear documentation of your roof's current condition so you have the facts.",
      primaryCta: "TAKES 10 SECONDS",
      secondaryCta: "SKIP FOR NOW",
    },
    {
      id: 2,
      title: "Quick question—",
      content: "When was the last time someone gave you an objective, third-party evaluation of your roof's actual condition (not just a sales pitch)?",
      primaryCta: "SEE WHAT WE FOUND",
      secondaryCta: "NOT INTERESTED",
    },
    {
      id: 3,
      title: "What you're evaluated on",
      content: "Every roof is scored on visible exterior indicators: missing shingles, hail impact, granule loss, lifted tabs, rusted flashing, and more. Higher score = better condition.",
      primaryCta: "SHOW ME WHY",
      secondaryCta: "NO THANKS",
      showScore: true,
    },
    {
      id: 4,
      title: "What's already visible",
      content: "Here's what our field tech documented on this visit. These are the items that affect your score today.",
      primaryCta: "KEEP GOING",
      secondaryCta: "I'VE SEEN ENOUGH",
      showIndicators: true,
    },
    {
      id: 5,
      title: "First documentation determines the outcome.",
      content: "The carrier will use the first clear, timestamped record of your roof's condition. Everything after that becomes much harder to prove.",
      primaryCta: "GOT IT",
      secondaryCta: "EXIT",
    },
    {
      id: 6,
      title: "ROOF PASSPORT — time-stamped baseline.",
      content: "This creates your official Roof Passport — a permanent, photographic record of the roof as it exists today. Future buyers, insurers, and adjusters will all reference this baseline.",
      primaryCta: "VIEW BASELINE RECORD",
      secondaryCta: "MAYBE LATER",
    },
  ];

  // Load property data (score + observations)
  useEffect(() => {
    const loadProperty = async () => {
      try {
        const res = await fetch(`/api/property/${propertyId}`);
        if (res.ok) {
          const data = await res.json();
          setFieldScore(data.field_score || null);
          setObservations(data.observations || []);
        }
      } catch (e) {
        console.error('Failed to load property data for carousel');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (propertyId) loadProperty();
  }, [propertyId]);

  const logEvent = async (event_type: string, slide_index: number, cta?: string) => {
    if (isLogging.current) return;
    isLogging.current = true;

    try {
      await fetch('/api/report-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: propertyId,
          event_type,
          slide_index,
          cta,
          variant: 'A',
        }),
      });
    } catch (err) {
      console.error('Event logging failed (non-blocking):', err);
    } finally {
      isLogging.current = false;
    }
  };

  // Log slide view on change (only once per slide)
  useEffect(() => {
    if (!isLoading && !hasVisitedSlide[currentSlide]) {
      setHasVisitedSlide(prev => ({ ...prev, [currentSlide]: true }));
      logEvent('slide_view', currentSlide + 1);
    }
  }, [currentSlide, isLoading, hasVisitedSlide]);

  const goToSlide = (index: number) => {
    if (index < 0 || index >= slides.length) return;
    setCurrentSlide(index);
  };

  const handlePrimary = async () => {
    const slideIndex = currentSlide + 1;
    await logEvent('slide_cta', slideIndex, 'advance');

    if (currentSlide === 5) {
      // Final slide advance opens report
      router.push(`/report/${propertyId}`);
    } else {
      goToSlide(currentSlide + 1);
    }
  };

  const handleSecondary = async () => {
    const slideIndex = currentSlide + 1;
    await logEvent('slide_cta', slideIndex, 'decline');
    
    // Decline on any slide → drop to Log Visit
    router.push(`/property/${propertyId}`);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentSlide < slides.length - 1) {
        goToSlide(currentSlide + 1);
      } else if (diff < 0 && currentSlide > 0) {
        goToSlide(currentSlide - 1);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center text-white">
        Loading homeowner presentation...
      </div>
    );
  }

  const current = slides[currentSlide];
  const progress = ((currentSlide + 1) / slides.length) * 100;

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white overflow-hidden" 
         onTouchStart={handleTouchStart}
         onTouchEnd={handleTouchEnd}>
      
      {/* Progress bar */}
      <div className="h-1 bg-white/10 fixed top-0 left-0 right-0 z-50">
        <div className="h-1 bg-[#d4af37] transition-all" style={{ width: `${progress}%` }} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="ASC EDGE" className="h-8 w-auto" />
          <div className="text-[#d4af37] text-xs tracking-[2px] font-bold">ROOF PASSPORT</div>
        </div>
        
        <button 
          onClick={() => router.push(`/property/${propertyId}`)}
          className="text-white/40 hover:text-white p-2"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Slide Content */}
      <div className="px-8 pt-6 pb-32 min-h-[calc(100vh-140px)] flex flex-col">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/70 text-xs px-5 py-2 rounded-full tracking-widest mb-6">
            SLIDE {currentSlide + 1} OF 6
          </div>
          <h2 className="text-4xl font-bold leading-none text-white mb-8">
            {current.title}
          </h2>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <div className="text-[17px] leading-relaxed text-white/80 max-w-md mx-auto text-center mb-12">
            {current.content}
          </div>

          {/* Injected Score */}
          {current.showScore && fieldScore !== null && (
            <div className="bg-[#111827] border border-[#d4af37]/30 rounded-3xl p-8 text-center mb-10">
              <div className="text-[#d4af37] text-xs tracking-widest mb-1">YOUR ROOF SCORED</div>
              <div className="text-8xl font-bold text-[#d4af37] tabular-nums">{fieldScore}</div>
              <div className="text-white/60 text-sm mt-1">/ 10</div>
            </div>
          )}

          {/* Injected Observations/Indicators */}
          {current.showIndicators && observations.length > 0 && (
            <div className="bg-[#111827] border border-white/10 rounded-3xl p-8 mb-12">
              <div className="uppercase text-white/50 text-xs tracking-widest mb-5">VISIBLE INDICATORS DOCUMENTED</div>
              <div className="space-y-4">
                {observations.slice(0, 4).map((item, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <div className="text-red-400 mt-0.5">●</div>
                    <div className="text-white/90">{item}</div>
                  </div>
                ))}
              </div>
              {observations.length > 4 && (
                <div className="text-center text-[#d4af37] text-xs mt-6">+{observations.length - 4} more documented items</div>
              )}
            </div>
          )}
        </div>

        {/* CTA Buttons */}
        <div className="space-y-4 mt-auto">
          <button
            onClick={handlePrimary}
            className="w-full bg-[#d4af37] hover:bg-[#e5c15c] active:bg-amber-300 text-[#0a0e1a] font-bold py-6 rounded-3xl text-lg tracking-widest transition-all flex items-center justify-center gap-3 shadow-2xl shadow-black/50"
          >
            {current.primaryCta}
            <ArrowRight className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleSecondary}
            className="w-full py-5 text-white/60 hover:text-white/90 border border-white/20 rounded-3xl font-medium transition-colors"
          >
            {current.secondaryCta}
          </button>
        </div>
      </div>

      {/* Slide indicators (dots) */}
      <div className="fixed bottom-8 left-0 right-0 flex justify-center gap-2 z-50">
        {slides.map((_, i) => (
          <div
            key={i}
            onClick={() => goToSlide(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
              i === currentSlide ? 'bg-[#d4af37] scale-125' : 'bg-white/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
