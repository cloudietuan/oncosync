import { useState, useEffect, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft, Play, SkipForward, BookOpen, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

/* ── Tutorial steps: each tied to a tab with detailed explanations ── */
export interface TutorialStep {
  tab: number;
  title: string;
  description: string;
  detail: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  // Tab 0 — Overview
  {
    tab: 0,
    title: 'Overview Dashboard',
    description: 'Your command center for the entire project.',
    detail:
      'This dashboard shows a snapshot of your gene expression data, sample sizes, and key clinical metrics at a glance. The stat cards at the top summarize gene count, sample count, mean survival, and median age. Quick-access cards below let you jump to any module. Watch for alert banners that flag important clinical changes like rising CA 19-9 levels.',
  },
  {
    tab: 0,
    title: 'Quick-Access Cards',
    description: 'Jump directly to any module from the Overview.',
    detail:
      'Below the stat cards you will see clickable cards for Expression Analysis, VLP Simulation, Immune Tracking, and Safety Monitoring. Each card shows a brief summary and links you straight to the relevant tab so you do not have to scroll through the navigation.',
  },
  // Tab 1 — Lab Records
  {
    tab: 1,
    title: 'Lab Records — VLP Production',
    description: 'Log and track every VLP (Virus-Like Particle) batch you produce.',
    detail:
      'Click "+ New Batch" to record a new VLP production run. You will enter IPTG concentration (the chemical that triggers protein expression), induction time, linker type (the molecule connecting antigens to the VLP scaffold), and SDS-PAGE result (a gel test that confirms protein size). The table below stores your batch history so you can compare runs over time.',
  },
  {
    tab: 1,
    title: 'Protocol Overview',
    description: 'Understand the 4-step VLP production workflow.',
    detail:
      'At the bottom of the Lab Records tab you will find the Protocol Overview. It walks through: (1) Expression — growing bacteria with your gene of interest, (2) Purification — extracting the target protein, (3) Assembly — forming VLP particles, and (4) QC — running quality control tests. Hover over the info icons on table headers to learn what each lab parameter means.',
  },
  // Tab 2 — Expression Analysis
  {
    tab: 2,
    title: 'Expression Analysis — Gene Selection',
    description: 'Pick a gene and see how its expression affects patient survival.',
    detail:
      'Select a target gene from the dropdown (default: APOC1). Choose a split method (median or mean) to divide patients into "high" and "low" expression groups. This stratification is the foundation for survival analysis — it asks: "Do patients with higher expression of this gene live longer or shorter?"',
  },
  {
    tab: 2,
    title: 'Kaplan-Meier Survival Curves',
    description: 'Visualize survival differences between patient groups.',
    detail:
      'The Kaplan-Meier tab draws a step-curve showing the probability of survival over time for each group. The log-rank p-value tells you if the difference is statistically significant (p < 0.05 = significant). Each step down in the curve represents a patient event (death or censoring).',
  },
  {
    tab: 2,
    title: 'Cox Regression & Covariates',
    description: 'Quantify the risk associated with gene expression.',
    detail:
      'The Cox Regression tab calculates a Hazard Ratio (HR). HR > 1 means higher expression is linked to worse survival; HR < 1 means better survival. You can enable covariates (age, sex, tumor stage) to run a multivariate analysis — this controls for confounding factors so you know the gene effect is independent.',
  },
  // Tab 3 — Simulation
  {
    tab: 3,
    title: 'VLP Simulation',
    description: 'Run bootstrap models to estimate vaccine response scenarios.',
    detail:
      'This module uses your expression data to simulate how a VLP-based vaccine might perform. Adjust parameters like number of iterations and confidence intervals. Each simulation run generates a distribution of predicted outcomes, helping you estimate variability and set realistic expectations for clinical translation.',
  },
  // Tab 4 — Immune Tracking
  {
    tab: 4,
    title: 'Immune Tracking — Antibody Curves',
    description: 'Monitor IgG antibody production over time for each patient profile.',
    detail:
      'The Overview sub-tab plots IgG (Immunoglobulin G) antibody levels for 3 patient profiles across multiple timepoints. The Antibody Decay Rate table shows the estimated half-life of each profile\'s immune response — longer half-life means the antibodies persist longer, suggesting a more durable vaccine effect.',
  },
  {
    tab: 4,
    title: 'All Markers & Correlation',
    description: 'View CD8+ T-cells, IFN-γ, CA 19-9, and IgG together.',
    detail:
      'The "All Markers" sub-tab lets you select a patient profile and see all immune markers side-by-side: IgG (antibody response), CD8+ T-cells (killer cells), IFN-γ (inflammatory cytokine), and CA 19-9 (tumor marker). The Correlation sub-tab calculates Pearson r between IgG and symptom severity to check if immune response is linked to how the patient feels.',
  },
  // Tab 5 — Safety
  {
    tab: 5,
    title: 'Safety Monitoring — Dashboard',
    description: 'Track adverse events and their severity after vaccine doses.',
    detail:
      'The Dashboard shows the most common adverse events (injection site pain, fatigue, fever, etc.) and a severity distribution pie chart using CTCAE grading (Grade 1 = mild, Grade 2 = moderate, Grade 3 = severe). The Timeline view plots when adverse events occurred relative to each dose.',
  },
  {
    tab: 5,
    title: 'Safety — Per-Patient View & Export',
    description: 'Drill into individual patients and export safety data.',
    detail:
      'The "By Patient" view shows per-patient adverse event breakdowns with IgG sparklines, so you can correlate immune response intensity with side effect severity. The Safety Table includes concurrent IgG at the time of each event. Click "Export CSV" to download a summary table formatted for regulatory reporting.',
  },
  // Tab 6 — Export / Reports
  {
    tab: 6,
    title: 'Export & Reports',
    description: 'Generate comprehensive PDF reports of your research data.',
    detail:
      'This module compiles expression analysis results, immune tracking summaries, safety data, and T-cell proxy scores into a downloadable PDF. Use it to share findings with collaborators, include in grant applications, or archive for regulatory documentation. All charts and tables from other modules are included.',
  },
  // Tab 7 — T-Cell Proxy
  {
    tab: 7,
    title: 'T-Cell Proxy Calculator',
    description: 'Estimate T-cell activation from available markers when direct assays are not available.',
    detail:
      'This calculator combines multiple indirect markers into a single weighted proxy score (0-100). The weights are: Direct Immune Assays like IFN-γ ELISPOT (70%), General Labs like lymphocyte count (20%), and Symptoms like injection site reaction (10%). Click "+ Timepoint" to add data or "Demo Data" to load a sample dataset. The circular gauge shows the current score, tier (Low / Moderate / High), and confidence level.',
  },
  {
    tab: 7,
    title: 'Scoring Breakdown',
    description: 'Understand exactly what is driving the proxy score.',
    detail:
      'The "Scoring Breakdown" panel shows a line-by-line explanation of each input marker, its weight, and its contribution to the final score. This transparency helps you identify which markers are most influential and where data gaps might be reducing confidence. Remember: this is a proxy estimation, not a direct T-cell measurement — see the disclaimer for limitations.',
  },
  // Tab 8 — Validation
  {
    tab: 8,
    title: 'Model Validation',
    description: 'Evaluate model performance with ROC curves and calibration metrics.',
    detail:
      'This tab generates ROC (Receiver Operating Characteristic) curves that plot sensitivity vs. specificity at every threshold. The AUC (Area Under the Curve) tells you overall discriminative ability — 1.0 is perfect, 0.5 is random guessing. Calibration plots show whether predicted probabilities match observed outcomes. Use these metrics to decide if your survival model is reliable enough for clinical decision-making.',
  },
];

interface GuidedTutorialProps {
  onNavigateTab: (tab: number) => void;
}

const GuidedTutorial = ({ onNavigateTab }: GuidedTutorialProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  const totalSteps = TUTORIAL_STEPS.length;
  const current = TUTORIAL_STEPS[step];
  const progress = ((step + 1) / totalSteps) * 100;

  // Navigate to the tab for the current step
  useEffect(() => {
    if (isOpen && current) {
      onNavigateTab(current.tab);
    }
  }, [step, isOpen, current, onNavigateTab]);

  // Auto-play timer
  useEffect(() => {
    if (!isAutoPlaying || !isOpen) return;
    const timer = setTimeout(() => {
      if (step < totalSteps - 1) {
        setStep(s => s + 1);
      } else {
        setIsAutoPlaying(false);
      }
    }, 8000);
    return () => clearTimeout(timer);
  }, [isAutoPlaying, step, isOpen, totalSteps]);

  const handleNext = useCallback(() => {
    if (step < totalSteps - 1) setStep(s => s + 1);
    else { setIsOpen(false); setIsAutoPlaying(false); }
  }, [step, totalSteps]);

  const handlePrev = useCallback(() => {
    if (step > 0) setStep(s => s - 1);
  }, [step]);

  const handleStart = useCallback(() => {
    setStep(0);
    setIsOpen(true);
    setIsAutoPlaying(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setIsAutoPlaying(false);
  }, []);

  // Launch button
  if (!isOpen) {
    return (
      <button
        onClick={handleStart}
        className="fixed bottom-5 left-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 text-[13px] font-medium"
        aria-label="Start guided tutorial"
        title="Start guided tutorial"
      >
        <BookOpen size={16} />
        <span className="hidden sm:inline">Tutorial</span>
      </button>
    );
  }

  // Tutorial panel (bottom of screen, full width)
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-in" style={{ animation: 'slideUp 0.3s ease-out' }}>
      {/* Backdrop gradient */}
      <div className="absolute inset-0 -top-20 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />

      <div className="relative bg-card border-t border-border shadow-2xl">
        {/* Progress bar */}
        <Progress value={progress} className="h-1 rounded-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          {/* Header row */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="vax-badge-blue">
                  Step {step + 1} of {totalSteps}
                </span>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {['Overview', 'Lab Records', 'Analysis', 'Simulation', 'Immune Tracking', 'Safety', 'Export', 'T-Cell Proxy', 'Validation'][current.tab]}
                </span>
              </div>
              <h3 className="font-bold text-base text-foreground leading-tight">{current.title}</h3>
              <p className="text-[13px] text-primary font-medium mt-0.5">{current.description}</p>
            </div>
            <button
              onClick={handleClose}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 shrink-0"
              aria-label="Close tutorial"
            >
              <X size={18} />
            </button>
          </div>

          {/* Detail text */}
          <p className="text-[13px] text-muted-foreground leading-relaxed mb-4 max-w-3xl">
            {current.detail}
          </p>

          {/* Controls */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                disabled={step === 0}
                className="vax-btn-ghost text-[12px] py-1.5 px-3 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={14} /> Back
              </button>
              <button
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                className="vax-btn-secondary text-[12px] py-1.5 px-3"
                title={isAutoPlaying ? 'Pause auto-play' : 'Resume auto-play'}
              >
                {isAutoPlaying ? (
                  <>Pause</>
                ) : (
                  <><Play size={12} /> Auto-play</>
                )}
              </button>
            </div>

            {/* Step dots — grouped by tab */}
            <div className="hidden md:flex items-center gap-0.5">
              {TUTORIAL_STEPS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setStep(i); setIsAutoPlaying(false); }}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                    i === step ? 'bg-primary w-4' : i < step ? 'bg-primary/40' : 'bg-border'
                  }`}
                  aria-label={`Go to step ${i + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {step < totalSteps - 1 ? (
                <>
                  <button onClick={handleClose} className="vax-btn-ghost text-[12px] py-1.5 px-3">
                    <SkipForward size={12} /> Skip
                  </button>
                  <button onClick={handleNext} className="vax-btn-primary text-[12px] py-1.5 px-3">
                    Next <ChevronRight size={14} />
                  </button>
                </>
              ) : (
                <button onClick={handleClose} className="vax-btn-primary text-[12px] py-1.5 px-3">
                  <CheckCircle2 size={14} /> Finish
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default GuidedTutorial;
