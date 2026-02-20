import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { HelpCircle, X, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TourStep {
  targetSelector: string;
  title: string;
  text: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
  {
    targetSelector: '[data-tour="page-title"]',
    title: 'मेरो खेत',
    text: 'यो पेजबाट तपाईंले आफ्ना सबै खेत र बाली हेर्न र मिलाउन सक्नुहुन्छ। मल, सिंचाइ, बिउ सबै जानकारी यहींबाट भेटिन्छ।',
    position: 'bottom',
  },
  {
    targetSelector: '[data-tour="tabs"]',
    title: 'ट्याबहरू',
    text: '"खेतहरू" मा तपाईंका सबै खेतको सूची देखिन्छ। "गाइड" मा बालीको खेती गाइड पढ्न/सुन्न सकिन्छ।',
    position: 'bottom',
  },
  {
    targetSelector: '[data-tour="today-summary"]',
    title: 'आजको सारांश',
    text: 'यहाँ आजका मुख्य सल्लाह देखिन्छन् — कुन बालीमा सिंचाइ गर्ने, मल कहिले हाल्ने आदि। "आज के गर्ने?" छिटो जानकारी यहाँबाट पाउनुहोस्।',
    position: 'bottom',
  },
  {
    targetSelector: '[data-tour="field-card"]',
    title: 'खेत कार्ड',
    text: 'यो तपाईंको एउटा खेत हो। हरियो बिन्दु = सब ठीक छ। बालीको नाम, दिन, ठेगाना र आजको सल्लाह देखिन्छ।',
    position: 'bottom',
  },
  {
    targetSelector: '[data-tour="field-card"]',
    title: 'विस्तृत जानकारी',
    text: 'कार्ड थिच्दा खेतको पूरा जानकारी खुल्छ — कति मल, कति बिउ, कुन दिन के गर्ने। हप्तामा कम्तीमा १ पटक हेर्नुहोस्।',
    position: 'bottom',
  },
  {
    targetSelector: '[data-tour="add-field-btn"]',
    title: 'नयाँ खेत थप्नुहोस्',
    text: 'यहाँ थिच्नुहोस्। क्षेत्रफल, बाली, ठाउँ भर्नुहोस् — app ले मल, बिउ र कामको तालिका बनाइदिन्छ।',
    position: 'bottom',
  },
  {
    targetSelector: '[data-tour="guide-tab"]',
    title: 'गाइड ट्याब',
    text: 'यो ट्याबमा बालीको पूरा खेती गाइड हेर्न सकिन्छ — रोग, मल, सिंचाइ, कटान सबै खण्ड छुट्टाछुट्टै।',
    position: 'bottom',
  },
];

export function FieldsGuidedTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});

  const positionTooltip = useCallback(() => {
    if (!isOpen) return;
    const step = TOUR_STEPS[currentStep];
    const el = document.querySelector(step.targetSelector);
    if (!el) {
      // fallback: center
      setTooltipStyle({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', position: 'fixed' });
      setHighlightStyle({ display: 'none' });
      return;
    }

    const rect = el.getBoundingClientRect();
    const pad = 8;

    setHighlightStyle({
      position: 'fixed',
      top: rect.top - pad,
      left: rect.left - pad,
      width: rect.width + pad * 2,
      height: rect.height + pad * 2,
      borderRadius: 12,
    });

    const tooltipW = Math.min(320, window.innerWidth - 32);
    let top = rect.bottom + 12;
    let left = rect.left + rect.width / 2 - tooltipW / 2;

    // keep on screen
    if (left < 16) left = 16;
    if (left + tooltipW > window.innerWidth - 16) left = window.innerWidth - 16 - tooltipW;
    if (top + 200 > window.innerHeight) top = rect.top - 200;

    setTooltipStyle({ position: 'fixed', top, left, width: tooltipW });

    // scroll element into view
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [isOpen, currentStep]);

  useEffect(() => {
    positionTooltip();
    window.addEventListener('resize', positionTooltip);
    return () => window.removeEventListener('resize', positionTooltip);
  }, [positionTooltip]);

  const next = () => {
    if (currentStep < TOUR_STEPS.length - 1) setCurrentStep(s => s + 1);
    else close();
  };

  const close = () => {
    setIsOpen(false);
    setCurrentStep(0);
  };

  const open = () => {
    setCurrentStep(0);
    setIsOpen(true);
  };

  const step = TOUR_STEPS[currentStep];
  const isLast = currentStep === TOUR_STEPS.length - 1;

  return (
    <>
      {/* Help trigger button */}
      <button
        onClick={open}
        className="inline-flex items-center gap-1.5 text-xs text-primary font-medium px-2.5 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
        aria-label="यो पेज कसरी चलाउने?"
      >
        <HelpCircle className="h-4 w-4" />
        <span className="hidden sm:inline">कसरी चलाउने?</span>
        <span className="sm:hidden">?</span>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100]">
          {/* Dimmed backdrop */}
          <div
            className="absolute inset-0 bg-black/50 transition-opacity"
            onClick={close}
          />

          {/* Highlight cutout */}
          <div
            className="absolute z-[101] border-2 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] pointer-events-none transition-all duration-300"
            style={highlightStyle}
          />

          {/* Tooltip */}
          <div
            className="z-[102] bg-card rounded-xl shadow-xl border p-4 transition-all duration-300"
            style={tooltipStyle}
          >
            {/* Close */}
            <button
              onClick={close}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Step counter */}
            <div className="flex items-center gap-1.5 mb-2">
              {TOUR_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    i === currentStep ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/30'
                  )}
                />
              ))}
            </div>

            {/* Content */}
            <h4 className="font-bold text-sm mb-1 text-foreground">{step.title}</h4>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">{step.text}</p>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                {currentStep + 1} / {TOUR_STEPS.length}
              </span>
              <div className="flex gap-2">
                {currentStep > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStep(s => s - 1)}>
                    पछाडि
                  </Button>
                )}
                <Button size="sm" onClick={next} className="gap-1.5">
                  {isLast ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      बुझियो
                    </>
                  ) : (
                    <>
                      अर्को
                      <ChevronRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
