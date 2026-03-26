import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/vax/AppSidebar';
import LoadingScreen from '@/components/vax/LoadingScreen';
import VaxHeader from '@/components/vax/VaxHeader';
import OnboardingTour from '@/components/vax/OnboardingTour';
import Overview from '@/components/vax/Overview';
import WetLab from '@/components/vax/WetLab';
import TissueAnalysis from '@/components/vax/TissueAnalysis';
import Analysis from '@/components/vax/Analysis';
import Simulation from '@/components/vax/Simulation';
import ImmuneTracking from '@/components/vax/ImmuneTracking';
import SafetyTracking from '@/components/vax/SafetyTracking';
import Reports from '@/components/vax/Reports';
import TcellProxy from '@/components/vax/TcellProxy';
import Validation from '@/components/vax/Validation';
import SessionManager from '@/components/vax/SessionManager';
import GuidedTutorial from '@/components/vax/GuidedTutorial';
import { useSessionPersistence } from '@/hooks/useSessionPersistence';
import {
  GSE62452_GENES, GSE62452_SAMPLES, GSE62452_EXPR, GSE62452_CLIN,
  DEMO_BATCHES, DEMO_LOGS,
  type ExpressionData, type ClinicalRecord, type Batch, type SafetyLog
} from '@/data/gse62452';
import { DEMO_IMMUNE_DATA, type ImmuneMarkerEntry } from '@/data/immuneData';
import type { TcellProxyState } from '@/lib/tcellProxy';

const TAB_TITLES: Record<number, string> = {
  0: 'Dashboard',
  1: 'Lab Records',
  2: 'Tissue Analysis',
  3: 'Expression Analysis',
  4: 'VLP Simulation',
  5: 'Immune Tracking',
  6: 'Safety Monitoring',
  7: 'Export & Reports',
  8: 'T-Cell Proxy',
  9: 'Validation',
};

const Index = () => {
  const [appReady, setAppReady] = useState(false);
  const [tab, setTab] = useState(0);
  const [expr, setExpr] = useState<ExpressionData | null>(null);
  const [clin, setClin] = useState<ClinicalRecord[] | null>(null);
  const [batches, setBatches] = useState<Batch[]>(DEMO_BATCHES);
  const [logs, setLogs] = useState<SafetyLog[]>(DEMO_LOGS);
  const [immuneData, setImmuneData] = useState<ImmuneMarkerEntry[]>(DEMO_IMMUNE_DATA);
  const [tcellProxy, setTcellProxy] = useState<TcellProxyState | undefined>(undefined);
  const { sessions, saveSession, deleteSession, autoSave } = useSessionPersistence();

  useEffect(() => {
    if (sessions.current) {
      setTab(sessions.current.tab);
      setBatches(sessions.current.batches);
      setLogs(sessions.current.logs);
      if (sessions.current.immuneData) setImmuneData(sessions.current.immuneData);
      if (sessions.current.tcellProxy) setTcellProxy(sessions.current.tcellProxy);
    }
  }, []);

  useEffect(() => {
    setExpr({ genes: GSE62452_GENES, samples: GSE62452_SAMPLES, values: GSE62452_EXPR, fileName: 'GSE62452_expression.csv' });
    setClin(GSE62452_CLIN);
    const t = setTimeout(() => setAppReady(true), 1600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      autoSave({ tab, batches, logs, immuneData, tcellProxy });
    }, 2000);
    return () => clearTimeout(timer);
  }, [tab, batches, logs, immuneData, tcellProxy]);

  const handleSave = useCallback((name: string) => {
    saveSession(name, { tab, batches, logs, immuneData, tcellProxy });
  }, [tab, batches, logs, immuneData, tcellProxy, saveSession]);

  const handleLoad = useCallback((name: string) => {
    const s = sessions.saved.find(s => s.name === name);
    if (!s) return;
    setTab(s.tab);
    setBatches(s.batches);
    setLogs(s.logs);
    if (s.immuneData) setImmuneData(s.immuneData);
    if (s.tcellProxy) setTcellProxy(s.tcellProxy);
  }, [sessions]);

  const handleTcellChange = useCallback((state: TcellProxyState) => {
    setTcellProxy(state);
  }, []);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <LoadingScreen isLoading={!appReady} />
        <OnboardingTour currentTab={tab} />
        <AppSidebar tab={tab} setTab={setTab} />
        <div className="flex-1 flex flex-col min-w-0">
          <VaxHeader />
          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[1200px] w-full mx-auto">
            {/* Breadcrumb-style page title */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="vax-section-title text-xl">{TAB_TITLES[tab]}</h2>
                <p className="text-[12px] text-muted-foreground/60 mt-0.5">
                  {tab === 0 && 'Qβ–ApoC1 VLP vaccine development overview'}
                  {tab === 1 && 'VLP batch production logs and quality control'}
                  {tab === 2 && 'IHC image deconvolution and DAB quantification'}
                  {tab === 3 && 'Kaplan-Meier survival and gene expression analysis'}
                  {tab === 4 && 'Bootstrap modeling of hypothetical vaccine response'}
                  {tab === 5 && 'Antibody production curves and decay analysis'}
                  {tab === 6 && 'Adverse event tracking and CTCAE grading'}
                  {tab === 7 && 'Generate PDF reports, CSV and JSON exports'}
                  {tab === 8 && 'T-cell activation scoring from expression signatures'}
                  {tab === 9 && 'Statistical validation and data quality metrics'}
                </p>
              </div>
              <SessionManager
                sessions={sessions.saved}
                onSave={handleSave}
                onLoad={handleLoad}
                onDelete={deleteSession}
              />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                {tab === 0 && <Overview expr={expr} clin={clin} batches={batches} logs={logs} immuneData={immuneData} setTab={setTab} />}
                {tab === 1 && <WetLab batches={batches} setBatches={setBatches} />}
                {tab === 2 && <TissueAnalysis />}
                {tab === 3 && <Analysis expr={expr} setExpr={setExpr} clin={clin} setClin={setClin} />}
                {tab === 4 && <Simulation expr={expr} clin={clin} />}
                {tab === 5 && <ImmuneTracking immuneData={immuneData} setImmuneData={setImmuneData} logs={logs} />}
                {tab === 6 && <SafetyTracking logs={logs} setLogs={setLogs} immuneData={immuneData} />}
                {tab === 7 && <Reports expr={expr} clin={clin} batches={batches} logs={logs} immuneData={immuneData} tcellProxy={tcellProxy} />}
                {tab === 8 && <TcellProxy initialState={tcellProxy} onStateChange={handleTcellChange} />}
                {tab === 9 && <Validation expr={expr} clin={clin} />}
              </motion.div>
            </AnimatePresence>
            <GuidedTutorial onNavigateTab={setTab} />
          </main>
          <footer className="py-5">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p className="text-[11px] text-muted-foreground/50 font-medium">© 2026 OncoSync — Pancreatic Cancer Vaccine Companion</p>
              <p className="text-[11px] text-muted-foreground/40">Data: GSE62452 (GEO) · For research use only · Not for clinical decisions</p>
            </div>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
