import { useMemo } from 'react';
import { jsPDF } from 'jspdf';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine, ResponsiveContainer,
} from 'recharts';
import AlertBox from './AlertBox';
import type { ExpressionData, ClinicalRecord, Batch, SafetyLog } from '@/data/gse62452';
import type { ImmuneMarkerEntry } from '@/data/immuneData';
import { type TcellProxyState, computeAllScores, validDate } from '@/lib/tcellProxy';

interface ReportsProps {
  expr: ExpressionData | null;
  clin: ClinicalRecord[] | null;
  batches: Batch[];
  logs: SafetyLog[];
  immuneData: ImmuneMarkerEntry[];
  tcellProxy?: TcellProxyState;
}

const profiles = [
  { id: 'SIM-001', name: 'Patient A' },
  { id: 'SIM-002', name: 'Patient B' },
  { id: 'SIM-003', name: 'Patient C' },
];

const Reports = ({ expr, clin, batches, logs, immuneData, tcellProxy }: ReportsProps) => {
  const immuneSummary = useMemo(() => {
    return profiles.map(p => {
      const entries = immuneData.filter(e => e.profile_id === p.id).sort((a, b) => a.date.localeCompare(b.date));
      if (entries.length === 0) return { ...p, peakIgg: 0, currentIgg: 0, halfLife: '—', ca19_9Trend: '—', classification: '—' };

      const peakIgg = Math.max(...entries.map(e => e.igg));
      const currentIgg = entries[entries.length - 1].igg;
      const firstCa = entries[0].ca19_9;
      const lastCa = entries[entries.length - 1].ca19_9;
      const ca19_9Trend = lastCa < firstCa ? `↓ ${firstCa.toFixed(0)} → ${lastCa.toFixed(0)}` : lastCa > firstCa ? `↑ ${firstCa.toFixed(0)} → ${lastCa.toFixed(0)}` : `→ ${lastCa.toFixed(0)}`;

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

  // T-Cell Proxy computed scores
  const proxyScored = useMemo(() => {
    if (!tcellProxy?.timepoints?.length) return [];
    return computeAllScores(tcellProxy.timepoints);
  }, [tcellProxy]);

  const proxyChartData = useMemo(() => {
    return proxyScored
      .filter(s => validDate(s.tp.date))
      .sort((a, b) => a.tp.date.localeCompare(b.tp.date))
      .map(s => ({ date: s.tp.date, proxyScore: s.result.proxyScore, tier: s.result.tier }));
  }, [proxyScored]);

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

    // T-Cell Proxy section
    if (proxyScored.length > 0) {
      y += 4;
      doc.setFontSize(12); doc.text('4. T-Cell Activation Proxy', 20, y); y += 8;
      doc.setFontSize(9);
      doc.text(`Patient: ${tcellProxy?.patient?.patientId || '—'} | Antigen: ${tcellProxy?.vaccine?.antigen || '—'}`, 25, y); y += 6;
      proxyScored.filter(s => validDate(s.tp.date)).sort((a, b) => a.tp.date.localeCompare(b.tp.date)).forEach(s => {
        doc.text(`${s.tp.date} (Dose ${s.tp.doseNumber || '—'}): Score ${s.result.proxyScore} — ${s.result.tier} [${s.result.confidence}]`, 30, y); y += 5;
      });
      y += 4;
      doc.setFontSize(8); doc.setTextColor(200, 100, 0);
      doc.text('T-Cell Proxy: Educational prototype. Not validated. Not for clinical decision-making.', 25, y); y += 8;
      doc.setTextColor(24, 24, 27);
    }

    const methodsSection = proxyScored.length > 0 ? '5' : '4';
    doc.setFontSize(12); doc.text(`${methodsSection}. Methods`, 20, y); y += 8;
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
      tcellProxy: tcellProxy ? {
        patient: tcellProxy.patient,
        vaccine: tcellProxy.vaccine,
        scores: proxyScored.map(s => ({ date: s.tp.date, dose: s.tp.doseNumber, ...s.result })),
      } : null,
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

  const exportProxyCSV = () => {
    if (!proxyScored.length) return;
    const header = 'date,dose,elispot,cd8_pct,alc,crp,temp_f,fatigue,proxy_score,tier,confidence,drivers\n';
    const rows = proxyScored
      .filter(s => validDate(s.tp.date))
      .sort((a, b) => a.tp.date.localeCompare(b.tp.date))
      .map(s =>
        `${s.tp.date},${s.tp.doseNumber},${s.tp.elispotIfng},${s.tp.cd8IfngPct},${s.tp.alc},${s.tp.crp},${s.tp.maxTempF},${s.tp.fatigue},${s.result.proxyScore},${s.result.tier},${s.result.confidence},"${s.result.drivers.join('; ')}"`
      ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `oncosync_tcell_proxy_${tcellProxy?.patient?.patientId || 'export'}.csv`;
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
            <button onClick={exportProxyCSV} disabled={!proxyScored.length} className={`vax-btn-secondary w-full ${!proxyScored.length ? 'opacity-50 cursor-not-allowed' : ''}`}>🧮 Proxy Scores CSV</button>
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
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted">
              <span className="text-sm">T-Cell Proxy</span>
              <span className={proxyScored.length ? 'text-emerald-600 font-medium' : 'text-muted-foreground'}>
                {proxyScored.length ? `✓ ${proxyScored.length} timepoints` : '—'}
              </span>
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
            <div><span className="font-medium text-foreground">T-Cell Proxy:</span> Weighted composite (70/20/10), delta-from-baseline</div>
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

      {/* T-Cell Proxy Summary */}
      {proxyScored.length > 0 && (
        <div className="vax-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">T-Cell Activation Proxy Summary</h3>
            <span className="vax-badge-violet">Proxy · Not diagnostic</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Mini chart */}
            <div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={proxyChartData} margin={{ top: 5, right: 15, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} width={30} />
                  <ReferenceLine y={70} stroke="hsl(160,84%,39%)" strokeDasharray="6 3" />
                  <ReferenceLine y={40} stroke="hsl(38,92%,50%)" strokeDasharray="6 3" />
                  <Line type="monotone" dataKey="proxyScore" stroke="hsl(258,90%,66%)" strokeWidth={2} dot={{ r: 3, fill: 'hsl(258,90%,66%)' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Dose</th>
                    <th className="text-center">Score</th>
                    <th className="text-center">Tier</th>
                    <th className="text-center">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {proxyScored.filter(s => validDate(s.tp.date)).sort((a, b) => a.tp.date.localeCompare(b.tp.date)).map((s, i) => (
                    <tr key={i}>
                      <td className="font-mono text-xs">{s.tp.date}</td>
                      <td className="text-xs">{s.tp.doseNumber || '—'}</td>
                      <td className="text-center font-bold">{s.result.proxyScore}</td>
                      <td className="text-center">
                        <span className={`vax-badge text-[10px] ${s.result.tier === 'High' ? 'vax-badge-green' : s.result.tier === 'Moderate' ? 'vax-badge-amber' : 'vax-badge-red'}`}>{s.result.tier}</span>
                      </td>
                      <td className="text-center">
                        <span className={`vax-badge text-[10px] ${s.result.confidence === 'High' ? 'vax-badge-blue' : s.result.confidence === 'Moderate' ? 'vax-badge-amber' : 'vax-badge-gray'}`}>{s.result.confidence}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-3 text-[11px] text-muted-foreground">
            Patient: {tcellProxy?.patient?.patientId || '—'} · Antigen: {tcellProxy?.vaccine?.antigen || '—'} · Platform: {tcellProxy?.vaccine?.adjuvant || '—'}
          </div>
        </div>
      )}

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
