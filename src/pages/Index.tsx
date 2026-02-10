import { useState, useEffect, useCallback } from 'react';
import VaxHeader from '@/components/vax/VaxHeader';
import VaxNav from '@/components/vax/VaxNav';
import Overview from '@/components/vax/Overview';
import WetLab from '@/components/vax/WetLab';
import Analysis from '@/components/vax/Analysis';
import Simulation from '@/components/vax/Simulation';
import SafetyTracking from '@/components/vax/SafetyTracking';
import Reports from '@/components/vax/Reports';
import SessionManager from '@/components/vax/SessionManager';
import { useSessionPersistence } from '@/hooks/useSessionPersistence';
import {
  GSE62452_GENES, GSE62452_SAMPLES, GSE62452_EXPR, GSE62452_CLIN,
  DEMO_BATCHES, DEMO_LOGS,
  type ExpressionData, type ClinicalRecord, type Batch, type SafetyLog
} from '@/data/gse62452';

const Index = () => {
  const [tab, setTab] = useState(0);
  const [expr, setExpr] = useState<ExpressionData | null>(null);
  const [clin, setClin] = useState<ClinicalRecord[] | null>(null);
  const [batches, setBatches] = useState<Batch[]>(DEMO_BATCHES);
  const [logs, setLogs] = useState<SafetyLog[]>(DEMO_LOGS);
  const { sessions, saveSession, deleteSession, autoSave } = useSessionPersistence();

  useEffect(() => {
    // Restore autosave if available
    if (sessions.current) {
      setTab(sessions.current.tab);
      setBatches(sessions.current.batches);
      setLogs(sessions.current.logs);
    }
  }, []); // only on mount

  useEffect(() => {
    setExpr({ genes: GSE62452_GENES, samples: GSE62452_SAMPLES, values: GSE62452_EXPR, fileName: 'GSE62452_expression.csv' });
    setClin(GSE62452_CLIN);
  }, []);

  // Autosave on state changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      autoSave({ tab, batches, logs });
    }, 2000);
    return () => clearTimeout(timer);
  }, [tab, batches, logs]);

  const handleSave = useCallback((name: string) => {
    saveSession(name, { tab, batches, logs });
  }, [tab, batches, logs, saveSession]);

  const handleLoad = useCallback((name: string) => {
    const s = sessions.saved.find(s => s.name === name);
    if (!s) return;
    setTab(s.tab);
    setBatches(s.batches);
    setLogs(s.logs);
  }, [sessions]);

  return (
    <div className="min-h-screen bg-background">
      <VaxHeader />
      <VaxNav tab={tab} setTab={setTab} />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-4">
          <SessionManager
            sessions={sessions.saved}
            onSave={handleSave}
            onLoad={handleLoad}
            onDelete={deleteSession}
          />
        </div>
        {tab === 0 && <Overview expr={expr} clin={clin} batches={batches} logs={logs} setTab={setTab} />}
        {tab === 1 && <WetLab batches={batches} setBatches={setBatches} />}
        {tab === 2 && <Analysis expr={expr} setExpr={setExpr} clin={clin} setClin={setClin} />}
        {tab === 3 && <Simulation expr={expr} clin={clin} />}
        {tab === 4 && <SafetyTracking logs={logs} setLogs={setLogs} />}
        {tab === 5 && <Reports expr={expr} clin={clin} batches={batches} logs={logs} />}
      </main>
      <footer className="border-t border-border py-5 mt-12 bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px] text-muted-foreground font-medium">Vax Research Platform — Qβ–ApoC1 VLP Vaccine Analysis</p>
          <p className="text-[11px] text-muted-foreground">Data: GSE62452 (GEO) • Research use only</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
