import { useState, useEffect, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft, SkipForward, BookOpen, CheckCircle2 } from 'lucide-react';
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
      'The Kaplan-Meier tab draws a step-curve showing the probability of survival over time for each group. The red line is "High" expression, the blue line is "Low" expression. The log-rank p-value tells you if the difference is statistically significant (p < 0.05 = significant). Each step down in the curve represents a patient event (death or censoring).',
  },
  {
    tab: 2,
    title: 'Cox Regression — Hazard Ratio',
    description: 'Quantify the survival risk associated with gene expression.',
    detail:
      'Click the "Cox Regression" sub-tab to see the Hazard Ratio (HR) table. HR > 1 means higher gene expression is linked to worse survival (higher risk of death). HR < 1 means higher expression is protective. The 95% CI (Confidence Interval) tells you the range of uncertainty, and the p-value confirms statistical significance. This is the core statistical test for evaluating whether a gene is a valid vaccine target.',
  },
  {
    tab: 2,
    title: 'Multivariate Analysis & Covariates',
    description: 'Control for confounding factors like age, sex, and tumor stage.',
    detail:
      'Enable the checkboxes for Age, Sex, and Stage under "Covariates" to unlock the Multivariate tab. This runs a multivariate Cox regression — it tests whether the gene effect is independent of other clinical factors. If the gene HR remains significant after adjusting for covariates, it strengthens the case that the gene itself drives survival differences.',
  },
  {
    tab: 2,
    title: 'Gene Correlations',
    description: 'See which other genes are co-expressed with your target.',
    detail:
      'The Correlations tab shows a bar chart and table of Pearson r values between your target gene and every other gene in the panel. High positive correlation means genes are co-expressed; negative means they are inversely related. This helps identify gene networks and potential combination targets for multi-antigen vaccines.',
  },
  // Tab 3 — Simulation
  {
    tab: 3,
    title: 'VLP Simulation',
    description: 'Run bootstrap models to estimate vaccine response scenarios.',
    detail:
      'This module uses your expression data to simulate how a VLP-based vaccine might perform. Adjust three parameters: Assumed Efficacy (how effective the vaccine is), Bootstrap Iterations (number of random resamples), and High-APOC1 Response Bias (likelihood that high-expression patients respond). Click "Run Simulation" to generate a histogram of predicted survival benefit with 95% confidence intervals.',
  },
  // Tab 4 — Immune Tracking
  {
    tab: 4,
    title: 'Immune Tracking — Antibody Curves',
    description: 'Monitor IgG antibody production over time for each patient profile.',
    detail:
      'The Overview sub-tab plots IgG (Immunoglobulin G) antibody levels for 3 simulated patient profiles across multiple timepoints. The dashed horizontal line marks the minimum protective threshold (20 AU/mL). The Antibody Decay Rate table below shows each profile\'s estimated half-life — longer half-life means more durable immunity.',
  },
  {
    tab: 4,
    title: 'All Markers & Correlation',
    description: 'View CD8+ T-cells, IFN-γ, CA 19-9, and IgG together.',
    detail:
      'The "All Markers" sub-tab lets you select a patient profile and see all immune markers side-by-side: IgG (antibody response), CD8+ T-cells (killer cells), IFN-γ (inflammatory cytokine), and CA 19-9 (tumor marker). The Correlation sub-tab calculates Pearson r between IgG levels and symptom severity to check if immune response is linked to side effects.',
  },
  {
    tab: 4,
    title: 'Patient Comparison',
    description: 'Compare immune response trends across all patients.',
    detail:
      'The Patient Comparison sub-tab shows cards for each patient with their current IgG level, trend direction (rising, falling, or stable), CA 19-9 level, and total symptom count. IgG sparklines give you a quick visual of each patient\'s immune trajectory.',
  },
  // Tab 5 — Safety
  {
    tab: 5,
    title: 'Safety Monitoring — Dashboard',
    description: 'Track adverse events and their severity after vaccine doses.',
    detail:
      'The Dashboard shows the most common adverse events (injection site pain, fatigue, fever, etc.) in a bar chart and a severity distribution pie chart using CTCAE grading (Grade 1 = mild, Grade 2 = moderate, Grade 3 = severe). The stat cards at the top show total events, patient count, and severity breakdown.',
  },
  {
    tab: 5,
    title: 'Safety Timeline & By-Patient View',
    description: 'See when adverse events occurred and drill into individual patients.',
    detail:
      'The Timeline view plots adverse events on a scatter chart by date and dose number, with different shapes for severity levels. The "By Patient" view shows per-patient cards with IgG sparklines and severity breakdowns, so you can correlate immune response intensity with side effect frequency.',
  },
  {
    tab: 5,
    title: 'Safety Table & CSV Export',
    description: 'CTCAE-graded summary table with concurrent IgG levels.',
    detail:
      'The Safety Table follows CTCAE grading and shows how many events of each grade occurred for each symptom, along with the average IgG level at the time of each event. This helps determine if side effects are immune-mediated. Click "Export CSV" to download the table for regulatory reporting.',
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
    title: 'Scoring Breakdown & Limitations',
    description: 'Understand exactly what is driving the proxy score.',
    detail:
      'The "Scoring Breakdown" panel shows a line-by-line explanation of each input marker, its weight, and its contribution to the final score. This transparency helps you identify which markers are most influential and where data gaps might be reducing confidence. Important: this is a proxy estimation, not a direct T-cell measurement — see the disclaimer at the bottom for limitations.',
  },
  // Tab 8 — Validation
  {
    tab: 8,
    title: 'Validation — ROC Curves',
    description: 'Evaluate model discrimination with ROC analysis.',
    detail:
      'Upload a CSV with patient data or use the GSE62452 Benchmark tab. The ROC (Receiver Operating Characteristic) curve plots sensitivity vs. specificity at every threshold. AUC (Area Under the Curve) tells you overall discriminative ability — 1.0 is perfect, 0.5 is random. The confusion matrix shows true/false positives and negatives at your chosen threshold.',
  },
  {
    tab: 8,
    title: 'Calibration & Benchmarking',
    description: 'Check if predicted probabilities match observed outcomes.',
    detail:
      'The Calibration tab compares predicted proxy tiers (Low, Moderate, High) against actual response rates. A well-calibrated model shows increasing response rates across tiers. The Reliability Diagram should follow the diagonal — deviations indicate the model is over- or under-confident. Use these metrics to decide if your survival model is reliable for clinical decisions.',
  },
];

interface GuidedTutorialProps {
  onNavigateTab: (tab: number) => void;
}

const GuidedTutorial = ({ onNavigateTab }: GuidedTutorialProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);

  const totalSteps = TUTORIAL_STEPS.length;
  const current = TUTORIAL_STEPS[step];
  const progress = ((step + 1) / totalSteps) * 100;

  // Navigate to the tab for the current step
  useEffect(() => {
    if (isOpen && current) {
      onNavigateTab(current.tab);
    }
  }, [step, isOpen, current, onNavigateTab]);

  const handleNext = useCallback(() => {
    if (step < totalSteps - 1) setStep(s => s + 1);
    else { setIsOpen(false); }
  }, [step, totalSteps]);

  const handlePrev = useCallback(() => {
    if (step > 0) setStep(s => s - 1);
  }, [step]);

  const handleStart = useCallback(() => {
    setStep(0);
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
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
            <button
              onClick={handlePrev}
              disabled={step === 0}
              className="vax-btn-ghost text-[12px] py-1.5 px-3 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} /> Back
            </button>

            {/* Step dots */}
            <div className="hidden md:flex items-center gap-0.5">
              {TUTORIAL_STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
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
