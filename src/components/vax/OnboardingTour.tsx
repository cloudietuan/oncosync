import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Lightbulb } from 'lucide-react';

const TOUR_STEPS = [
  {
    title: 'Welcome to OncoSync 👋',
    description: 'OncoSync is a research companion for pancreatic cancer vaccine development. This quick tour will walk you through the key features.',
    icon: '🧬',
  },
  {
    title: 'Research Dashboard',
    description: 'The Overview tab gives you a snapshot of your project — gene counts, sample sizes, VLP batches, safety events, and immune tracking entries.',
    icon: '📊',
  },
  {
    title: 'Lab Records & Analysis',
    description: 'Track VLP production batches in Lab Records, and explore gene expression data with Kaplan-Meier curves and Cox regression in Analysis.',
    icon: '🔬',
  },
  {
    title: 'Immune Tracking & Safety',
    description: 'Monitor antibody responses (IgG, IgM, CA 19-9) over time and log adverse events with CTCAE grading in Safety Monitoring.',
    icon: '🛡️',
  },
  {
    title: 'T-Cell Proxy & Validation',
    description: 'The T-Cell Proxy estimates cellular immune activation from available markers. Validation provides ROC curves and calibration metrics.',
    icon: '🧪',
  },
  {
    title: 'Look for ⓘ icons',
    description: 'Hover over the ⓘ icons throughout the app to learn what scientific terms and metrics mean. They\'re placed next to key labels and values.',
    icon: '💡',
  },
];

const STORAGE_KEY = 'oncosync_tour_completed';

const OnboardingTour = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      const timer = setTimeout(() => setIsOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  const handleNext = () => {
    if (step < TOUR_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleRestart = () => {
    setStep(0);
    setIsOpen(true);
  };

  if (!isOpen) {
    return (
      <button
        onClick={handleRestart}
        className="fixed bottom-5 right-5 z-50 w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center hover:scale-105"
        aria-label="Reopen tour guide"
        title="App Guide"
      >
        <Lightbulb size={18} />
      </button>
    );
  }

  const current = TOUR_STEPS[step];

  return (
    <>
      <div className="vax-modal-overlay" onClick={handleClose}>
        <div
          className="vax-modal animate-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{current.icon}</span>
              <h3 className="font-bold text-base text-foreground">{current.title}</h3>
            </div>
            <button
              onClick={handleClose}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 -mr-1 -mt-1"
              aria-label="Close tour"
            >
              <X size={18} />
            </button>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            {current.description}
          </p>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 mb-5">
            {TOUR_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  i === step
                    ? 'bg-primary w-5'
                    : i < step
                    ? 'bg-primary/40'
                    : 'bg-border'
                }`}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={step === 0}
              className="vax-btn-ghost disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
              Back
            </button>

            <span className="text-[11px] text-muted-foreground font-medium">
              {step + 1} / {TOUR_STEPS.length}
            </span>

            <button onClick={handleNext} className="vax-btn-primary">
              {step === TOUR_STEPS.length - 1 ? 'Get Started' : 'Next'}
              {step < TOUR_STEPS.length - 1 && <ChevronRight size={16} />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default OnboardingTour;
