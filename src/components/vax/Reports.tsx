import { jsPDF } from 'jspdf';
import AlertBox from './AlertBox';
import type { ExpressionData, ClinicalRecord, Batch, SafetyLog } from '@/data/gse62452';

interface ReportsProps {
  expr: ExpressionData | null;
  clin: ClinicalRecord[] | null;
  batches: Batch[];
  logs: SafetyLog[];
}

const Reports = ({ expr, clin, batches, logs }: ReportsProps) => {
  const generatePDF = () => {
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(18); doc.setTextColor(59, 130, 246); doc.text('Vax Research Report', 20, y); y += 10;
    doc.setFontSize(9); doc.setTextColor(245, 158, 11); doc.text('RESEARCH USE ONLY', 20, y); y += 12;
    doc.setTextColor(24, 24, 27); doc.setFontSize(12); doc.text('1. Project Summary', 20, y); y += 8;
    doc.setFontSize(10); doc.text('Qβ–ApoC1 VLP Vaccine for Pancreatic Cancer', 25, y); y += 6;
    doc.setFontSize(9); doc.text('Data Source: GSE62452 (NCBI GEO)', 25, y); y += 10;
    doc.setFontSize(12); doc.text('2. Data Summary', 20, y); y += 8;
    doc.setFontSize(10);
    doc.text(`Expression: ${expr?.genes?.length || 0} genes × ${expr?.samples?.length || 0} samples`, 25, y); y += 6;
    doc.text(`Clinical: ${clin?.length || 0} patients with survival data`, 25, y); y += 6;
    doc.text(`VLP Batches: ${batches?.length || 0} (${batches?.filter(b => b.status === 'completed').length || 0} completed)`, 25, y); y += 6;
    doc.text(`Safety Events: ${logs?.length || 0}`, 25, y); y += 12;
    doc.setFontSize(12); doc.text('3. Methods', 20, y); y += 8;
    doc.setFontSize(9);
    ['Kaplan-Meier survival with log-rank test', 'Cox proportional hazards regression', 'Pearson correlation analysis', 'Bootstrap resampling (n=500)'].forEach(m => { doc.text('• ' + m, 25, y); y += 5; });
    doc.setFontSize(8); doc.setTextColor(128, 128, 128); doc.text(`Generated: ${new Date().toISOString()}`, 20, 280);
    doc.save('vax_research_report.pdf');
  };

  const exportJSON = () => {
    const data = {
      metadata: { title: 'Vax Research Platform Export', source: 'GSE62452', date: new Date().toISOString(), disclaimer: 'Research use only' },
      expression: expr ? { genes: expr.genes.length, samples: expr.samples.length } : null,
      clinical: clin ? { records: clin.length, stages: [...new Set(clin.map(c => c.stage))] } : null,
      batches,
      safetyLogs: logs,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'vax_export.json';
    a.click();
  };

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h2 className="vax-section-title">Export & Reports</h2>
        <p className="vax-section-desc">Generate documentation and export data</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="vax-card">
          <h3 className="font-semibold text-sm mb-4">Export Options</h3>
          <div className="space-y-3">
            <button onClick={generatePDF} className="vax-btn-secondary w-full">📄 PDF Report</button>
            <button onClick={exportJSON} className="vax-btn-secondary w-full">💾 JSON Export</button>
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
          </div>
        </div>

        <div className="vax-card">
          <h3 className="font-semibold text-sm mb-4">Methods</h3>
          <div className="space-y-3 text-xs text-muted-foreground">
            <div><span className="font-medium text-foreground">Survival:</span> Kaplan-Meier, log-rank, Cox PH</div>
            <div><span className="font-medium text-foreground">Correlation:</span> Pearson with t-test</div>
            <div><span className="font-medium text-foreground">Simulation:</span> Bootstrap resampling</div>
            <div><span className="font-medium text-foreground">Safety:</span> CTCAE v5.0 grading</div>
          </div>
        </div>
      </div>

      <div className="vax-card">
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
