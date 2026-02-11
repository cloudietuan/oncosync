import { useState, useEffect, useCallback } from 'react';
import VaxHeader from '@/components/vax/VaxHeader';
import VaxNav from '@/components/vax/VaxNav';
import Overview from '@/components/vax/Overview';
import WetLab from '@/components/vax/WetLab';
import Analysis from '@/components/vax/Analysis';
import Simulation from '@/components/vax/Simulation';
import ImmuneTracking from '@/components/vax/ImmuneTracking';
import SafetyTracking from '@/components/vax/SafetyTracking';
import Reports from '@/components/vax/Reports';
import TcellProxy from '@/components/vax/TcellProxy';
import SessionManager from '@/components/vax/SessionManager';
import { useSessionPersistence } from '@/hooks/useSessionPersistence';
import {
  GSE62452_GENES, GSE62452_SAMPLES, GSE62452_EXPR, GSE62452_CLIN,
  DEMO_BATCHES, DEMO_LOGS,
  type ExpressionData, type ClinicalRecord, type Batch, type SafetyLog
} from '@/data/gse62452';
import { DEMO_IMMUNE_DATA, type ImmuneMarkerEntry } from '@/data/immuneData';

const Index = () => {
  const [tab, setTab] = useState(0);
  const [expr, setExpr] = useState<ExpressionData | null>(null);
  const [clin, setClin] = useState<ClinicalRecord[] | null>(null);
  const [batches, setBatches] = useState<Batch[]>(DEMO_BATCHES);
  const [logs, setLogs] = useState<SafetyLog[]>(DEMO_LOGS);
  const [immuneData, setImmuneData] = useState<ImmuneMarkerEntry[]>(DEMO_IMMUNE_DATA);
  const { sessions, saveSession, deleteSession, autoSave } = useSessionPersistence();

  useEffect(() => {
    // Restore autosave if available
    if (sessions.current) {
      setTab(sessions.current.tab);
      setBatches(sessions.current.batches);
      setLogs(sessions.current.logs);
      if (sessions.current.immuneData) setImmuneData(sessions.current.immuneData);
    }
  }, []); // only on mount

  useEffect(() => {
    setExpr({ genes: GSE62452_GENES, samples: GSE62452_SAMPLES, values: GSE62452_EXPR, fileName: 'GSE62452_expression.csv' });
    setClin(GSE62452_CLIN);
  }, []);

  // Autosave on state changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      autoSave({ tab, batches, logs, immuneData });
    }, 2000);
    return () => clearTimeout(timer);
  }, [tab, batches, logs, immuneData]);

  const handleSave = useCallback((name: string) => {
    saveSession(name, { tab, batches, logs, immuneData });
  }, [tab, batches, logs, immuneData, saveSession]);

  const handleLoad = useCallback((name: string) => {
    const s = sessions.saved.find(s => s.name === name);
    if (!s) return;
    setTab(s.tab);
    setBatches(s.batches);
    setLogs(s.logs);
    if (s.immuneData) setImmuneData(s.immuneData);
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
        {tab === 0 && <Overview expr={expr} clin={clin} batches={batches} logs={logs} immuneData={immuneData} setTab={setTab} />}
        {tab === 1 && <WetLab batches={batches} setBatches={setBatches} />}
        {tab === 2 && <Analysis expr={expr} setExpr={setExpr} clin={clin} setClin={setClin} />}
        {tab === 3 && <Simulation expr={expr} clin={clin} />}
        {tab === 4 && <ImmuneTracking immuneData={immuneData} setImmuneData={setImmuneData} logs={logs} />}
        {tab === 5 && <SafetyTracking logs={logs} setLogs={setLogs} immuneData={immuneData} />}
        {tab === 6 && <Reports expr={expr} clin={clin} batches={batches} logs={logs} immuneData={immuneData} />}
        {tab === 7 && <TcellProxy />}
      </main>
      <footer className="border-t border-border py-5 mt-12 bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px] text-muted-foreground font-medium">OncoSync — Pancreatic Cancer Vaccine Companion</p>
          <p className="text-[11px] text-muted-foreground">Data: GSE62452 (GEO) • Research use only</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
