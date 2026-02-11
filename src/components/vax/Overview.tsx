import { useMemo } from 'react';
import StatCard from './StatCard';
import AlertBox from './AlertBox';
import type { ExpressionData, ClinicalRecord, Batch, SafetyLog } from '@/data/gse62452';
import type { ImmuneMarkerEntry } from '@/data/immuneData';

interface OverviewProps {
  expr: ExpressionData | null;
  clin: ClinicalRecord[] | null;
  batches: Batch[];
  logs: SafetyLog[];
  immuneData: ImmuneMarkerEntry[];
  setTab: (tab: number) => void;
}

const Overview = ({ expr, clin, batches, logs, immuneData, setTab }: OverviewProps) => {
  const avgIgg = useMemo(() => {
    const byPatient: Record<string, ImmuneMarkerEntry> = {};
    immuneData.forEach(e => {
      if (!byPatient[e.profile_id] || e.date > byPatient[e.profile_id].date) byPatient[e.profile_id] = e;
    });
    const vals = Object.values(byPatient).map(e => e.igg);
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '—';
  }, [immuneData]);

  const immunePatients = new Set(immuneData.map(e => e.profile_id)).size;

  // Immune alerts
  const immuneAlerts = useMemo(() => {
    const profiles = ['SIM-001', 'SIM-002', 'SIM-003'];
    const results: { variant: 'warning' | 'error'; icon: string; title: string; description: string }[] = [];
    profiles.forEach(pid => {
      const entries = immuneData.filter(e => e.profile_id === pid).sort((a, b) => a.date.localeCompare(b.date));
      if (entries.length < 2) return;
      const latest = entries[entries.length - 1];
      const prev = entries[entries.length - 2];
      const name = pid === 'SIM-001' ? 'Patient A' : pid === 'SIM-002' ? 'Patient B' : 'Patient C';
      if (latest.ca19_9 > 37 && prev.ca19_9 <= 37) results.push({ variant: 'error', icon: '⚠', title: `CA 19-9 Alert — ${name}`, description: `CA 19-9 has risen above clinical cutoff (${latest.ca19_9} U/mL).` });
      if (latest.igg < 20 && prev.igg >= 20) results.push({ variant: 'warning', icon: '⚠', title: `IgG Alert — ${name}`, description: `IgG below protective threshold (${latest.igg} AU/mL). Consider booster.` });
    });
    return results;
  }, [immuneData]);

  return (
  <div className="space-y-6 animate-in">
    <div>
      <h2 className="vax-section-title">Research Dashboard</h2>
      <p className="vax-section-desc">Qβ–ApoC1 VLP vaccine development for pancreatic adenocarcinoma</p>
    </div>

    <AlertBox
      variant="info"
      icon="🔬"
      title="Project Hypothesis"
      description="Targeting APOC1 with a Qβ bacteriophage VLP vaccine may improve survival outcomes in pancreatic cancer by modulating tumor-associated lipid metabolism."
    />

    {immuneAlerts.map((a, i) => (
      <AlertBox key={`immune-${i}`} variant={a.variant} icon={a.icon} title={a.title} description={a.description} />
    ))}

    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
      <StatCard label="Genes" value={expr?.genes?.length || 0} sub="Immune panel" />
      <StatCard label="Samples" value={expr?.samples?.length || 0} sub="GSE62452" />
      <StatCard label="Clinical Records" value={clin?.length || 0} sub="With survival" />
      <StatCard label="VLP Batches" value={batches.length} sub={`${batches.filter(b => b.status === 'completed').length} completed`} />
      <StatCard label="Safety Events" value={logs.length} sub="Logged" />
      <StatCard label="Immune Entries" value={immuneData.length} sub={`Across ${immunePatients} patients`} />
      <StatCard label="Avg IgG Response" value={avgIgg} sub="AU/mL (latest)" />
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <button onClick={() => setTab(2)} className="vax-card-compact text-left hover:border-blue-200 transition-colors group">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold text-sm mb-1">Expression Analysis</h4>
            <p className="text-xs text-muted-foreground">Kaplan-Meier survival curves, Cox regression, and gene correlations</p>
          </div>
          <span className="text-muted-foreground group-hover:text-blue-500 transition-colors">→</span>
        </div>
      </button>
      <button onClick={() => setTab(3)} className="vax-card-compact text-left hover:border-violet-200 transition-colors group">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold text-sm mb-1">VLP Simulation</h4>
            <p className="text-xs text-muted-foreground">Bootstrap modeling of hypothetical vaccine response</p>
          </div>
          <span className="text-muted-foreground group-hover:text-violet-500 transition-colors">→</span>
        </div>
      </button>
      <button onClick={() => setTab(4)} className="vax-card-compact text-left hover:border-emerald-200 transition-colors group">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold text-sm mb-1">Immune Tracking</h4>
            <p className="text-xs text-muted-foreground">Antibody production curves, decay analysis, and symptom-immune correlations</p>
          </div>
          <span className="text-muted-foreground group-hover:text-emerald-500 transition-colors">→</span>
        </div>
      </button>
      <button onClick={() => setTab(5)} className="vax-card-compact text-left hover:border-amber-200 transition-colors group">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold text-sm mb-1">Safety Monitoring</h4>
            <p className="text-xs text-muted-foreground">Adverse event tracking and CTCAE grading</p>
          </div>
          <span className="text-muted-foreground group-hover:text-amber-500 transition-colors">→</span>
        </div>
      </button>
    </div>

    <div className="vax-card overflow-x-auto">
      <h3 className="font-semibold text-sm mb-4">Data Sources</h3>
      <table>
        <thead>
          <tr><th>Dataset</th><th>Description</th><th>Status</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><span className="font-medium">GSE62452</span></td>
            <td>Pancreatic adenocarcinoma expression + clinical outcomes</td>
            <td><span className="vax-badge-green">Loaded</span></td>
          </tr>
          <tr>
            <td><span className="font-medium">VLP Production</span></td>
            <td>Internal wet lab batch records</td>
            <td><span className="vax-badge-green">{batches.length} batches</span></td>
          </tr>
          <tr>
            <td><span className="font-medium">Safety Logs</span></td>
            <td>Simulated adverse event data</td>
            <td><span className="vax-badge-gray">{logs.length} events</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  );
};

export default Overview;
