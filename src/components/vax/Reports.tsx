import { useMemo } from 'react';
import { jsPDF } from 'jspdf';
import AlertBox from './AlertBox';
import type { ExpressionData, ClinicalRecord, Batch, SafetyLog } from '@/data/gse62452';
import type { ImmuneMarkerEntry } from '@/data/immuneData';

interface ReportsProps {
  expr: ExpressionData | null;
  clin: ClinicalRecord[] | null;
  batches: Batch[];
  logs: SafetyLog[];
  immuneData: ImmuneMarkerEntry[];
}

const profiles = [
  { id: 'SIM-001', name: 'Patient A' },
  { id: 'SIM-002', name: 'Patient B' },
  { id: 'SIM-003', name: 'Patient C' },
];

const Reports = ({ expr, clin, batches, logs, immuneData }: ReportsProps) => {
  const immuneSummary = useMemo(() => {
    return profiles.map(p => {
      const entries = immuneData.filter(e => e.profile_id === p.id).sort((a, b) => a.date.localeCompare(b.date));
      if (entries.length === 0) return { ...p, peakIgg: 0, currentIgg: 0, halfLife: '—', ca19_9Trend: '—', classification: '—' };

      const peakIgg = Math.max(...entries.map(e => e.igg));
      const currentIgg = entries[entries.length - 1].igg;
      const firstCa = entries[0].ca19_9;
      const lastCa = entries[entries.length - 1].ca19_9;
      const ca19_9Trend = lastCa < firstCa ? `↓ ${firstCa.toFixed(0)} → ${lastCa.toFixed(0)}` : lastCa > firstCa ? `↑ ${firstCa.toFixed(0)} → ${lastCa.toFixed(0)}` : `→ ${lastCa.toFixed(0)}`;

      // Decay half-life
      const peakIdx = entries.reduce((best, e, i) => e.igg > entries[best].igg ? i : best, 0);
      const postPeak = entries.slice(peakIdx).filter((e, i) => i === 0 || (e.dose === '—' && e.igg <= peakIgg));
      let halfLife = '∞';
      if (postPeak.length >= 2) {
        const t0 = new Date(postPeak[0].date).getTime();
        const points = postPeak.map(e => ({ days: (new Date(e.date).getTime() - t0) / 86400000, lnIgg: Math.log(e.igg) }));
        const n = points.length;
        const sumX = points.reduce((s, pt) => s + pt.days, 0);
        const sumY = points.reduce((s, pt) => s + pt.lnIgg, 0);
        const sumXY = points.reduce((s, pt) => s + pt.days * pt.lnIgg, 0);
        const sumX2 = points.reduce((s, pt) => s + pt.days * pt.days, 0);
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const k = -slope;
        if (k > 0) halfLife = (Math.LN2 / k).toFixed(1);
      }

      let classification = 'N/A';
      const hl = parseFloat(halfLife);
      if (halfLife === '∞' || hl > 40) classification = 'Strong Responder';
      else if (hl >= 20) classification = 'Moderate';
      else classification = 'Weak Responder';

      return { ...p, peakIgg, currentIgg, halfLife, ca19_9Trend, classification };
    });
  }, [immuneData]);

  const generatePDF = () => {
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(18); doc.setTextColor(59, 130, 246); doc.text('OncoSync Research Report', 20, y); y += 10;
    doc.setFontSize(9); doc.setTextColor(245, 158, 11); doc.text('RESEARCH USE ONLY', 20, y); y += 12;
    doc.setTextColor(24, 24, 27); doc.setFontSize(12); doc.text('1. Project Summary', 20, y); y += 8;
    doc.setFontSize(10); doc.text('Qβ–ApoC1 VLP Vaccine for Pancreatic Cancer', 25, y); y += 6;
    doc.setFontSize(9); doc.text('Data Source: GSE62452 (NCBI GEO)', 25, y); y += 10;
    doc.setFontSize(12); doc.text('2. Data Summary', 20, y); y += 8;
    doc.setFontSize(10);
    doc.text(`Expression: ${expr?.genes?.length || 0} genes × ${expr?.samples?.length || 0} samples`, 25, y); y += 6;
    doc.text(`Clinical: ${clin?.length || 0} patients with survival data`, 25, y); y += 6;
    doc.text(`VLP Batches: ${batches?.length || 0} (${batches?.filter(b => b.status === 'completed').length || 0} completed)`, 25, y); y += 6;
    doc.text(`Safety Events: ${logs?.length || 0}`, 25, y); y += 6;
    doc.text(`Immune Entries: ${immuneData?.length || 0}`, 25, y); y += 12;

    doc.setFontSize(12); doc.text('3. Immune Response Summary', 20, y); y += 8;
    doc.setFontSize(9);
    immuneSummary.forEach(p => {
      doc.setFontSize(10); doc.text(`${p.name} (${p.id})`, 25, y); y += 6;
      doc.setFontSize(9);
      doc.text(`Peak IgG: ${p.peakIgg.toFixed(1)} AU/mL | Current: ${p.currentIgg.toFixed(1)} AU/mL`, 30, y); y += 5;
      doc.text(`Half-life: ${p.halfLife} days | CA 19-9: ${p.ca19_9Trend}`, 30, y); y += 5;
      doc.text(`Classification: ${p.classification}`, 30, y); y += 8;
    });

    doc.setFontSize(12); doc.text('4. Methods', 20, y); y += 8;
    doc.setFontSize(9);
    ['Kaplan-Meier survival with log-rank test', 'Cox proportional hazards regression', 'Pearson correlation analysis', 'Bootstrap resampling (n=500)', 'Exponential decay modeling for antibody half-life'].forEach(m => { doc.text('• ' + m, 25, y); y += 5; });
    doc.setFontSize(8); doc.setTextColor(128, 128, 128); doc.text(`Generated: ${new Date().toISOString()}`, 20, 280);
    doc.save('oncosync_research_report.pdf');
  };

  const exportJSON = () => {
    const data = {
      metadata: { title: 'OncoSync Research Platform Export', source: 'GSE62452', date: new Date().toISOString(), disclaimer: 'Research use only' },
      expression: expr ? { genes: expr.genes.length, samples: expr.samples.length } : null,
      clinical: clin ? { records: clin.length, stages: [...new Set(clin.map(c => c.stage))] } : null,
      batches,
      safetyLogs: logs,
      immuneData,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'oncosync_export.json';
    a.click();
  };

  const exportImmuneCSV = () => {
    const header = 'patient_id,date,dose,igg,igm,cd4,cd8,ifn_gamma,il2,ca19_9,notes\n';
    const rows = immuneData.map(e =>
      `${e.profile_id},${e.date},${e.dose},${e.igg},${e.igm ?? ''},${e.cd4 ?? ''},${e.cd8},${e.ifn_gamma},${e.il2 ?? ''},${e.ca19_9},"${(e.notes || '').replace(/"/g, '""')}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'oncosync_immune_data.csv';
    a.click();
  };

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h2 className="vax-section-title">Export & Reports</h2>
        <p className="vax-section-desc">Generate documentation and export data</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="vax-card">
          <h3 className="font-semibold text-sm mb-4">Export Options</h3>
          <div className="space-y-3">
            <button onClick={generatePDF} className="vax-btn-secondary w-full">📄 PDF Report</button>
            <button onClick={exportJSON} className="vax-btn-secondary w-full">💾 JSON Export</button>
            <button onClick={exportImmuneCSV} className="vax-btn-secondary w-full">🧬 Immune Data CSV</button>
          </div>
        </div>

        <div className="vax-card">
          <h3 className="font-semibold text-sm mb-4">Data Status</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted">
              <span className="text-sm">Expression</span>
              <span className={expr ? 'text-emerald-600 font-medium' : 'text-muted-foreground'}>{expr ? `✓ ${expr.genes.length}×${expr.samples.length}` : '—'}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted">
              <span className="text-sm">Clinical</span>
              <span className={clin ? 'text-emerald-600 font-medium' : 'text-muted-foreground'}>{clin ? `✓ ${clin.length} records` : '—'}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted">
              <span className="text-sm">Batches</span>
              <span className="text-emerald-600 font-medium">✓ {batches.length}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted">
              <span className="text-sm">Safety Events</span>
              <span className="text-emerald-600 font-medium">✓ {logs.length}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted">
              <span className="text-sm">Immune Entries</span>
              <span className="text-emerald-600 font-medium">✓ {immuneData.length}</span>
            </div>
          </div>
        </div>

        <div className="vax-card">
          <h3 className="font-semibold text-sm mb-4">Methods</h3>
          <div className="space-y-3 text-xs text-muted-foreground">
            <div><span className="font-medium text-foreground">Survival:</span> Kaplan-Meier, log-rank, Cox PH</div>
            <div><span className="font-medium text-foreground">Correlation:</span> Pearson with t-test</div>
            <div><span className="font-medium text-foreground">Simulation:</span> Bootstrap resampling</div>
            <div><span className="font-medium text-foreground">Safety:</span> CTCAE v5.0 grading</div>
            <div><span className="font-medium text-foreground">Immune:</span> Exponential decay, Pearson correlation</div>
          </div>
        </div>
      </div>

      {/* Immune Response Summary */}
      <div className="vax-card overflow-x-auto">
        <h3 className="font-semibold text-sm mb-4">Immune Response Summary</h3>
        <table>
          <thead>
            <tr>
              <th>Patient</th>
              <th className="text-center">Peak IgG</th>
              <th className="text-center">Current IgG</th>
              <th className="text-center">Est. Half-Life</th>
              <th className="text-center">CA 19-9 Trend</th>
              <th className="text-center">Classification</th>
            </tr>
          </thead>
          <tbody>
            {immuneSummary.map(p => (
              <tr key={p.id}>
                <td className="font-medium">{p.name} <span className="text-muted-foreground font-mono text-xs">({p.id})</span></td>
                <td className="text-center">{p.peakIgg.toFixed(1)} AU/mL</td>
                <td className="text-center">{p.currentIgg.toFixed(1)} AU/mL</td>
                <td className="text-center">{p.halfLife} days</td>
                <td className="text-center font-mono text-xs">{p.ca19_9Trend}</td>
                <td className="text-center">
                  <span className={p.classification === 'Strong Responder' ? 'vax-badge-green' : p.classification === 'Moderate' ? 'vax-badge-amber' : p.classification === 'Weak Responder' ? 'vax-badge-red' : 'vax-badge-gray'}>
                    {p.classification}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="vax-card overflow-x-auto">
        <h3 className="font-semibold text-sm mb-4">Data Sources</h3>
        <table>
          <thead><tr><th>Source</th><th>Description</th><th>Link</th></tr></thead>
          <tbody>
            <tr>
              <td className="font-medium">GSE62452</td>
              <td>Pancreatic adenocarcinoma expression + survival</td>
              <td><a href="https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE62452" target="_blank" rel="noopener" className="text-blue-600 hover:underline">GEO →</a></td>
            </tr>
            <tr>
              <td className="font-medium">TCGA-PAAD</td>
              <td>Reference pancreatic cancer cohort</td>
              <td><a href="https://portal.gdc.cancer.gov" target="_blank" rel="noopener" className="text-blue-600 hover:underline">GDC Portal →</a></td>
            </tr>
          </tbody>
        </table>
      </div>

      <AlertBox variant="warning" icon="⚠" title="Important Disclaimers" description="This platform is for educational and research purposes only. Results are hypothesis-generating and require experimental validation. Not for clinical decision-making." />
    </div>
  );
};

export default Reports;
