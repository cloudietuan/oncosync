import { useMemo } from 'react';
import { BarChart3, FlaskConical, Shield, Syringe, ArrowRight, TestTubes, Microscope, FileDown, Dna, CheckCircle2 } from 'lucide-react';
import StatCard from './StatCard';
import AlertBox from './AlertBox';
import InfoTooltip from './InfoTooltip';
import { StaggerGrid, StaggerItem, FadeSection } from './MotionWrappers';
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
  <div className="space-y-6">
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

    <StaggerGrid className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
      <StaggerItem><StatCard label="Genes" value={expr?.genes?.length || 0} sub="Immune panel" tooltip={{ term: "Genes", definition: "Protein-coding regions of DNA measured on the expression microarray, used to identify differentially expressed targets." }} /></StaggerItem>
      <StaggerItem><StatCard label="Samples" value={expr?.samples?.length || 0} sub="GSE62452" tooltip={{ term: "Samples", definition: "Individual tissue specimens from the GSE62452 dataset, including tumor and adjacent normal pancreatic tissues." }} /></StaggerItem>
      <StaggerItem><StatCard label="Clinical Records" value={clin?.length || 0} sub="With survival" tooltip={{ term: "Clinical Records", definition: "Patient data including survival time, vital status, and staging, linked to expression profiles." }} /></StaggerItem>
      <StaggerItem><StatCard label="VLP Batches" value={batches.length} sub={`${batches.filter(b => b.status === 'completed').length} completed`} tooltip={{ term: "VLP Batches", definition: "Virus-Like Particle production runs. VLPs mimic virus structure without genetic material, serving as vaccine carriers." }} /></StaggerItem>
      <StaggerItem><StatCard label="Safety Events" value={logs.length} sub="Logged" tooltip={{ term: "Safety Events", definition: "Recorded adverse events graded using CTCAE (Common Terminology Criteria for Adverse Events) scale from 1-5." }} /></StaggerItem>
      <StaggerItem><StatCard label="Immune Entries" value={immuneData.length} sub={`Across ${immunePatients} patients`} tooltip={{ term: "Immune Entries", definition: "Longitudinal immune marker measurements (IgG, IgM, CD4/CD8, cytokines) collected per patient over time." }} /></StaggerItem>
      <StaggerItem><StatCard label="Avg IgG Response" value={avgIgg} sub="AU/mL (latest)" tooltip={{ term: "IgG Response", definition: "Immunoglobulin G — the most abundant antibody class. Higher levels indicate stronger humoral immune response to the vaccine antigen." }} /></StaggerItem>
    </StaggerGrid>

    <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { tab: 3, icon: BarChart3, title: 'Expression Analysis', desc: 'Kaplan-Meier survival curves, Cox regression, and gene correlations' },
        { tab: 4, icon: FlaskConical, title: 'VLP Simulation', desc: 'Bootstrap modeling of hypothetical vaccine response' },
        { tab: 5, icon: Syringe, title: 'Immune Tracking', desc: 'Antibody production curves, decay analysis, and symptom-immune correlations' },
        { tab: 6, icon: Shield, title: 'Safety Monitoring', desc: 'Adverse event tracking and CTCAE grading' },
      ].map(({ tab: t, icon: Icon, title, desc }) => (
        <StaggerItem key={t}>
          <button
            onClick={() => setTab(t)}
            className="vax-card-compact text-left group w-full hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/8 group-hover:bg-primary/15 flex items-center justify-center shrink-0 transition-colors duration-200">
                <Icon size={15} className="text-primary/70 group-hover:text-primary transition-colors duration-200" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-semibold text-sm">{title}</h4>
                  <ArrowRight size={13} className="text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
                </div>
                <p className="text-xs text-muted-foreground/70 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          </button>
        </StaggerItem>
      ))}
    </StaggerGrid>

    <FadeSection delay={0.3}>
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
    </FadeSection>
  </div>
  );
};

export default Overview;
