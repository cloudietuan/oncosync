import StatCard from './StatCard';
import AlertBox from './AlertBox';
import type { ExpressionData, ClinicalRecord, Batch, SafetyLog } from '@/data/gse62452';

interface OverviewProps {
  expr: ExpressionData | null;
  clin: ClinicalRecord[] | null;
  batches: Batch[];
  logs: SafetyLog[];
  setTab: (tab: number) => void;
}

const Overview = ({ expr, clin, batches, logs, setTab }: OverviewProps) => (
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

    <div className="grid grid-cols-5 gap-4">
      <StatCard label="Genes" value={expr?.genes?.length || 0} sub="Immune panel" />
      <StatCard label="Samples" value={expr?.samples?.length || 0} sub="GSE62452" />
      <StatCard label="Clinical Records" value={clin?.length || 0} sub="With survival" />
      <StatCard label="VLP Batches" value={batches.length} sub={`${batches.filter(b => b.status === 'completed').length} completed`} />
      <StatCard label="Safety Events" value={logs.length} sub="Logged" />
    </div>

    <div className="grid grid-cols-3 gap-4">
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
      <button onClick={() => setTab(4)} className="vax-card-compact text-left hover:border-amber-200 transition-colors group">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold text-sm mb-1">Safety Monitoring</h4>
            <p className="text-xs text-muted-foreground">Adverse event tracking and CTCAE grading</p>
          </div>
          <span className="text-muted-foreground group-hover:text-amber-500 transition-colors">→</span>
        </div>
      </button>
    </div>

    <div className="vax-card">
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

export default Overview;
