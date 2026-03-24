import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Lightbulb, MapPin, Microscope, Compass, HelpCircle, Info, Rocket } from 'lucide-react';

/* ── Per-tab contextual tips ── */
const TAB_TIPS: Record<number, { title: string; tips: string[] }> = {
  0: {
    title: 'Overview',
    tips: [
      'Start here to get a snapshot of your entire project — gene counts, sample sizes, and key metrics.',
      'Click the quick-access cards below the stats to jump directly to Expression Analysis, VLP Simulation, Immune Tracking, or Safety Monitoring.',
      'Watch for alert banners at the top — they flag important changes like CA 19-9 rising above clinical cutoff.',
      'Hover over the ⓘ icons next to any stat card label to see a definition of that metric.',
    ],
  },
  1: {
    title: 'Lab Records',
    tips: [
      'Click "+ New Batch" to log a new VLP production run with IPTG concentration, induction time, and linker type.',
      'The Protocol Overview at the bottom shows the 4-step VLP production workflow from expression to quality control.',
      'Hover the ⓘ icons on table headers (IPTG, Linker, SDS-PAGE) to understand what each lab parameter means.',
    ],
  },
  2: {
    title: 'Tissue Analysis',
    tips: [
      'Upload an H-DAB immunohistochemistry tissue image to analyze ApoC-1 protein distribution.',
      'Switch between Original, Heatmap, DAB Channel, and Side-by-Side views to inspect staining patterns.',
      'Adjust the Detection Threshold slider to control sensitivity — lower values detect fainter staining.',
      'The intensity histogram shows how positive pixels are distributed across staining intensity bins.',
    ],
  },
  3: {
    title: 'Expression Analysis',
    tips: [
      'Select a target gene (default: APOC1) and a split method (median or mean) to stratify patients.',
      'The Kaplan-Meier tab shows survival curves — the log-rank p-value tells you if the groups differ significantly.',
      'Check the Cox Regression tab for hazard ratios — HR > 1 means higher gene expression is linked to worse survival.',
      'Enable covariates (age, sex, stage) to run multivariate analysis and control for confounding factors.',
      'The Correlations tab shows which other genes correlate most strongly with your target gene.',
    ],
  },
  4: {
    title: 'VLP Simulation',
    tips: [
      'This module runs bootstrap models to estimate hypothetical vaccine response scenarios.',
      'Adjust simulation parameters and run multiple iterations to assess variability in predicted outcomes.',
    ],
  },
  5: {
    title: 'Immune Tracking',
    tips: [
      'The Overview sub-tab shows IgG antibody production curves for all 3 patient profiles over time.',
      'Check the Antibody Decay Rate table to see estimated half-life — longer half-life = more durable response.',
      'Use "All Markers" to view CD8+ T-cells, IFN-γ, and CA 19-9 alongside IgG for a selected patient.',
      'The Correlation sub-tab calculates Pearson r between IgG levels and symptom severity.',
      'Click "+ Log Immune Marker" to add new data points for any patient profile.',
    ],
  },
  6: {
    title: 'Safety Monitoring',
    tips: [
      'The Dashboard shows the most common adverse events and a severity distribution pie chart.',
      'Use the Timeline view to see when adverse events occurred relative to dose number.',
      'The "By Patient" view shows per-patient breakdowns with IgG sparklines to correlate immune response with side effects.',
      'The Safety Table follows CTCAE grading (Grade 1-3) and shows concurrent IgG at the time of each event.',
      'Click "Export CSV" to download a summary table for regulatory reporting.',
    ],
  },
  7: {
    title: 'Export / Reports',
    tips: [
      'Generate comprehensive PDF reports of your research data for sharing with collaborators.',
      'Reports include expression analysis results, immune tracking summaries, and safety data.',
    ],
  },
  8: {
    title: 'T-Cell Proxy',
    tips: [
      'This calculator estimates T-cell activation using a weighted proxy score (0-100) from available markers.',
      'The scoring weights: Direct Immune Assays (70%), General Labs (20%), Symptoms (10%).',
      'Click "+ Timepoint" to add data points, or "Demo Data" to load a sample 3-timepoint dataset.',
      'The circular gauge shows the current score, tier (Low/Moderate/High), and confidence level.',
      'Review the "Scoring Breakdown" panel for a line-by-line explanation of what\'s driving the score.',
      '⚠️ This is a proxy, not a direct measurement — see the disclaimer for limitations.',
    ],
  },
  9: {
    title: 'Validation',
    tips: [
      'This tab provides ROC curves and calibration metrics to validate model performance.',
      'AUC (Area Under the Curve) closer to 1.0 indicates better discriminative ability.',
    ],
  },
};

/* ── Welcome tour steps (shown once on first visit) ── */
const WELCOME_STEPS: { title: string; description: string; Icon: typeof Microscope }[] = [
  {
    title: 'Welcome to OncoSync',
    description: 'OncoSync is a research companion for pancreatic cancer vaccine development. Here is a quick tour of the key features.',
    Icon: Microscope,
  },
  {
    title: 'Navigation',
    description: 'Use the tab bar at the top to switch between modules: Overview, Lab Records, Tissue Analysis, Analysis, Simulation, Immune Tracking, Safety, Export, T-Cell Proxy, and Validation.',
    Icon: Compass,
  },
  {
    title: 'Contextual Help',
    description: 'Each tab has its own set of tips. Click the lightbulb button in the bottom-right corner to see tips specific to whichever tab you are currently viewing.',
    Icon: Lightbulb,
  },
  {
    title: 'Info Tooltips',
    description: 'Hover over the info icons throughout the app to learn what scientific terms, metrics, and lab parameters mean.',
    Icon: Info,
  },
  {
    title: 'Ready to Go',
    description: 'Start exploring the Overview dashboard. You can always click the lightbulb button for tab-specific guidance.',
    Icon: Rocket,
  },
];

const STORAGE_KEY = 'oncosync_tour_completed';

interface OnboardingTourProps {
  currentTab?: number;
}

const OnboardingTour = ({ currentTab = 0 }: OnboardingTourProps) => {
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [welcomeStep, setWelcomeStep] = useState(0);
  const [tipsOpen, setTipsOpen] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      const timer = setTimeout(() => setWelcomeOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  // Reset tip index when tab changes
  useEffect(() => {
    setTipIndex(0);
  }, [currentTab]);

  const handleCloseWelcome = () => {
    setWelcomeOpen(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  const handleWelcomeNext = () => {
    if (welcomeStep < WELCOME_STEPS.length - 1) setWelcomeStep(welcomeStep + 1);
    else handleCloseWelcome();
  };

  const handleWelcomePrev = () => {
    if (welcomeStep > 0) setWelcomeStep(welcomeStep - 1);
  };

  const tabTips = TAB_TIPS[currentTab];
  const totalTips = tabTips?.tips.length || 0;

  const handleTipNext = () => {
    if (tipIndex < totalTips - 1) setTipIndex(tipIndex + 1);
    else setTipsOpen(false);
  };

  const handleTipPrev = () => {
    if (tipIndex > 0) setTipIndex(tipIndex - 1);
  };

  // Welcome tour modal
  if (welcomeOpen) {
    const current = WELCOME_STEPS[welcomeStep];
    const StepIcon = current.Icon;
    return (
      <div className="vax-modal-overlay" onClick={handleCloseWelcome}>
        <div className="vax-modal animate-in" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <StepIcon size={18} className="text-primary" />
              </div>
              <h3 className="font-bold text-base text-foreground">{current.title}</h3>
            </div>
            <button onClick={handleCloseWelcome} className="text-muted-foreground hover:text-foreground transition-colors p-1 -mr-1 -mt-1" aria-label="Close tour">
              <X size={18} />
            </button>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">{current.description}</p>
          <div className="flex items-center justify-center gap-1.5 mb-5">
            {WELCOME_STEPS.map((_, i) => (
              <button key={i} onClick={() => setWelcomeStep(i)} className={`w-2 h-2 rounded-full transition-all duration-200 ${i === welcomeStep ? 'bg-primary w-5' : i < welcomeStep ? 'bg-primary/40' : 'bg-border'}`} aria-label={`Step ${i + 1}`} />
            ))}
          </div>
          <div className="flex items-center justify-between">
            <button onClick={handleWelcomePrev} disabled={welcomeStep === 0} className="vax-btn-ghost disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronLeft size={16} /> Back
            </button>
            <span className="text-[11px] text-muted-foreground font-medium">{welcomeStep + 1} / {WELCOME_STEPS.length}</span>
            <button onClick={handleWelcomeNext} className="vax-btn-primary">
              {welcomeStep === WELCOME_STEPS.length - 1 ? 'Get Started' : 'Next'} {welcomeStep < WELCOME_STEPS.length - 1 && <ChevronRight size={16} />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Contextual tips panel (bottom-right)
  if (tipsOpen && tabTips) {
    return (
      <>
        <div className="fixed bottom-5 right-5 z-50 w-[340px] max-w-[calc(100vw-2.5rem)] bg-card border border-border rounded-2xl shadow-xl animate-in" style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-primary" />
                <h4 className="font-bold text-sm text-foreground">{tabTips.title} Tips</h4>
              </div>
              <button onClick={() => setTipsOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors p-0.5" aria-label="Close tips">
                <X size={16} />
              </button>
            </div>
            <p className="text-[13px] text-muted-foreground leading-relaxed mb-4">
              {tabTips.tips[tipIndex]}
            </p>
            <div className="flex items-center justify-between">
              <button onClick={handleTipPrev} disabled={tipIndex === 0} className="vax-btn-ghost text-[12px] py-1 px-2 disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronLeft size={14} />
              </button>
              <div className="flex items-center gap-1">
                {tabTips.tips.map((_, i) => (
                  <button key={i} onClick={() => setTipIndex(i)} className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${i === tipIndex ? 'bg-primary w-4' : 'bg-border'}`} />
                ))}
              </div>
              <button onClick={handleTipNext} className="vax-btn-primary text-[12px] py-1 px-2">
                {tipIndex === totalTips - 1 ? 'Done' : <ChevronRight size={14} />}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Floating button
  return (
    <button
      onClick={() => { setTipIndex(0); setTipsOpen(true); }}
      className="fixed bottom-5 right-5 z-50 w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center hover:scale-105"
      aria-label="Show tab tips"
      title={`${tabTips?.title || 'App'} Tips`}
    >
      <Lightbulb size={18} />
    </button>
  );
};

export default OnboardingTour;
