import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, ResponsiveContainer, Cell } from 'recharts';
import StatCard from './StatCard';
import FileUpload from './FileUpload';
import AlertBox from './AlertBox';
import { jStat, kaplanMeier, logRankTest, coxPH, coxMultivariate, type MultiCoxResult } from '@/lib/statistics';
import type { ExpressionData, ClinicalRecord } from '@/data/gse62452';

interface AnalysisProps {
  expr: ExpressionData | null;
  setExpr: (data: ExpressionData) => void;
  clin: ClinicalRecord[] | null;
  setClin: (data: ClinicalRecord[]) => void;
}

const Analysis = ({ expr, setExpr, clin, setClin }: AnalysisProps) => {
  const [targetGene, setTargetGene] = useState('APOC1');
  const [splitMethod, setSplitMethod] = useState('median');
  const [covariates, setCovariates] = useState({ age: false, sex: false, stage: true });
  const [analysisTab, setAnalysisTab] = useState('km');

  const handleExprUpload = (data: Record<string, string>[]) => {
    const geneCol = Object.keys(data[0]).find(k => ['gene', 'Gene', 'GENE'].includes(k));
    const genes = Object.keys(data[0]).filter(k => k !== geneCol);
    const geneNames = data.map(r => r[geneCol!]);
    const values = data.map(r => genes.map(g => parseFloat(r[g]) || 0));
    setExpr({ genes: geneNames, samples: genes, values });
  };

  const handleClinUpload = (data: Record<string, string>[]) => {
    const parsed: ClinicalRecord[] = data.map(r => ({
      sample_id: r.sample_id || r.Sample_ID || r.patient_id,
      time_to_event_days: parseFloat(r.time_to_event_days || r.OS_days || r.survival_days) || null,
      event: parseInt(r.event || r.OS_status || r.status) || 0,
      age: parseFloat(r.age || r.Age) || null,
      sex: r.sex || r.Sex || r.gender || null,
      stage: r.stage || r.Stage || r.tumor_stage || null,
    }));
    setClin(parsed);
  };

  const analysisResults = useMemo(() => {
    if (!expr || !clin) return null;
    const geneIdx = expr.genes.findIndex(g => g.toUpperCase() === targetGene.toUpperCase());
    if (geneIdx === -1) return null;
    const geneExpr = expr.values[geneIdx];
    const sorted = [...geneExpr].sort((a, b) => a - b);
    const threshold = splitMethod === 'median' ? sorted[Math.floor(geneExpr.length / 2)] : jStat.mean(geneExpr);
    const highIdx: number[] = [];
    const lowIdx: number[] = [];
    expr.samples.forEach((_, i) => {
      if (geneExpr[i] >= threshold) highIdx.push(i);
      else lowIdx.push(i);
    });
    const getClinForSample = (sampleId: string) => clin.find(c => c.sample_id === sampleId);
    const highClin = highIdx.map(i => getClinForSample(expr.samples[i])).filter(Boolean) as ClinicalRecord[];
    const lowClin = lowIdx.map(i => getClinForSample(expr.samples[i])).filter(Boolean) as ClinicalRecord[];
    const highTimes = highClin.map(c => c.time_to_event_days);
    const highEvents = highClin.map(c => c.event);
    const lowTimes = lowClin.map(c => c.time_to_event_days);
    const lowEvents = lowClin.map(c => c.event);
    const kmHigh = kaplanMeier(highTimes, highEvents);
    const kmLow = kaplanMeier(lowTimes, lowEvents);
    const logRank = logRankTest(highTimes, highEvents, lowTimes, lowEvents);
    const validClin = clin.filter(c => expr.samples.includes(c.sample_id));
    const validExpr = validClin.map(c => geneExpr[expr.samples.indexOf(c.sample_id)]);
    const cox = coxPH(validClin.map(c => c.time_to_event_days), validClin.map(c => c.event), validExpr);
    const correlations = expr.genes
      .filter(g => g !== targetGene)
      .map(g => {
        const idx = expr.genes.indexOf(g);
        const { r, p } = jStat.pearson(geneExpr, expr.values[idx]);
        return { gene: g, r, p };
      })
      .sort((a, b) => Math.abs(b.r) - Math.abs(a.r));

    const validHighTimes = highTimes.filter(t => t != null).sort((a, b) => (a as number) - (b as number));
    const validLowTimes = lowTimes.filter(t => t != null).sort((a, b) => (a as number) - (b as number));
    const medianHigh = validHighTimes.length > 0 ? validHighTimes[Math.floor(validHighTimes.length / 2)] : 'NR';
    const medianLow = validLowTimes.length > 0 ? validLowTimes[Math.floor(validLowTimes.length / 2)] : 'NR';

    let multiResults = null;
    if (Object.values(covariates).some(v => v)) {
      const covData: Record<string, (number | null)[]> = {};
      if (covariates.stage) covData['Stage'] = validClin.map(c => {
        if (!c.stage) return null;
        if (c.stage.includes('IV')) return 4;
        if (c.stage.includes('III')) return 3;
        if (c.stage.includes('II')) return 2;
        return 1;
      });
      if (covariates.age) covData['Age'] = validClin.map(c => c.age);
      if (covariates.sex) covData['Sex'] = validClin.map(c =>
        c.sex === 'M' || c.sex === 'male' || c.sex === 'Male' ? 1 : c.sex ? 0 : null
      );
      covData[targetGene] = validExpr;
      multiResults = coxMultivariate(validClin.map(c => c.time_to_event_days), validClin.map(c => c.event), covData);
    }

    // Merge KM curves for recharts
    const allTimes = new Set<number>();
    kmHigh.forEach(p => allTimes.add(p.t));
    kmLow.forEach(p => allTimes.add(p.t));
    const sortedTimes = Array.from(allTimes).sort((a, b) => a - b);
    const kmData = sortedTimes.map(t => {
      const hPoint = [...kmHigh].reverse().find(p => p.t <= t);
      const lPoint = [...kmLow].reverse().find(p => p.t <= t);
      return { t, high: hPoint?.S, low: lPoint?.S };
    });

    return { kmData, logRank, cox, correlations, highN: highIdx.length, lowN: lowIdx.length, threshold, medianHigh, medianLow, multiResults };
  }, [expr, clin, targetGene, splitMethod, covariates]);

  const hasAnyCovariates = Object.values(covariates).some(v => v);

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h2 className="vax-section-title">Expression Analysis</h2>
        <p className="vax-section-desc">Survival analysis and gene correlations from GSE62452</p>
      </div>

      <AlertBox variant="success" icon="✓" title="GSE62452 Data Loaded" description={`${expr?.genes?.length || 0} genes × ${expr?.samples?.length || 0} samples with survival outcomes from GEO.`} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FileUpload label="Upload Expression CSV" onLoad={handleExprUpload} hint="gene × sample matrix" />
          <FileUpload label="Upload Clinical CSV" onLoad={handleClinUpload} hint="sample_id, time, event" />
        </div>
        <div className="vax-card-compact">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="vax-label">Target Gene</label>
              <select className="vax-input" value={targetGene} onChange={e => setTargetGene(e.target.value)}>
                {expr?.genes?.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="vax-label">Split Method</label>
              <select className="vax-input" value={splitMethod} onChange={e => setSplitMethod(e.target.value)}>
                <option value="median">Median</option>
                <option value="mean">Mean</option>
              </select>
            </div>
            <div>
              <label className="vax-label">Covariates</label>
              <div className="flex gap-4 mt-2">
                {(['age', 'sex', 'stage'] as const).map(c => (
                  <label key={c} className="flex items-center gap-2 text-[13px] text-muted-foreground cursor-pointer">
                    <input type="checkbox" checked={covariates[c]} onChange={e => setCovariates({ ...covariates, [c]: e.target.checked })} className="w-4 h-4 accent-blue-500" />
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {analysisResults && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <StatCard label="High Expression" value={analysisResults.highN} sub={`≥ ${analysisResults.threshold.toFixed(2)}`} />
            <StatCard label="Low Expression" value={analysisResults.lowN} sub={`< ${analysisResults.threshold.toFixed(2)}`} />
            <StatCard label="Median OS (High)" value={typeof analysisResults.medianHigh === 'number' ? `${analysisResults.medianHigh}d` : String(analysisResults.medianHigh)} />
            <StatCard label="Median OS (Low)" value={typeof analysisResults.medianLow === 'number' ? `${analysisResults.medianLow}d` : String(analysisResults.medianLow)} />
          </div>

          <div className="vax-tab-bar overflow-x-auto">
            {['km', 'cox', 'correlation', ...(hasAnyCovariates ? ['multivariate'] : [])].map(tab => (
              <button key={tab} onClick={() => setAnalysisTab(tab)} className={`vax-tab-btn ${analysisTab === tab ? 'active' : ''}`}>
                {tab === 'km' ? 'Kaplan-Meier' : tab === 'cox' ? 'Cox Regression' : tab === 'multivariate' ? 'Multivariate' : 'Correlations'}
              </button>
            ))}
          </div>

          {analysisTab === 'km' && (
            <div className="vax-card">
              <h3 className="font-semibold text-sm mb-2">Kaplan-Meier Survival by {targetGene} Expression</h3>
              <p className="text-xs text-muted-foreground mb-4">Log-rank p = {analysisResults.logRank.p.toFixed(4)}</p>
              <ResponsiveContainer width="100%" height={380}>
                <LineChart data={analysisResults.kmData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                  <XAxis dataKey="t" label={{ value: 'Time (days)', position: 'insideBottom', offset: -5 }} stroke="#a1a1aa" />
                  <YAxis domain={[0, 1.05]} label={{ value: 'Survival Probability', angle: -90, position: 'insideLeft' }} stroke="#a1a1aa" />
                  <Tooltip />
                  <Legend />
                  <Line type="stepAfter" dataKey="high" name={`High ${targetGene} (n=${analysisResults.highN})`} stroke="#ef4444" strokeWidth={2} dot={false} />
                  <Line type="stepAfter" dataKey="low" name={`Low ${targetGene} (n=${analysisResults.lowN})`} stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {analysisTab === 'cox' && (
            <div className="vax-card">
              <h3 className="font-semibold text-sm mb-4">Cox Proportional Hazards — Univariate</h3>
              <table>
                <thead><tr><th>Variable</th><th>Hazard Ratio</th><th>95% CI</th><th>p-value</th><th>Interpretation</th></tr></thead>
                <tbody>
                  <tr>
                    <td className="font-medium">{targetGene}</td>
                    <td><span className={analysisResults.cox.hr > 1 ? 'text-red-600' : 'text-green-600'}>{analysisResults.cox.hr.toFixed(3)}</span></td>
                    <td>{analysisResults.cox.ci[0].toFixed(2)} – {analysisResults.cox.ci[1].toFixed(2)}</td>
                    <td><span className={analysisResults.cox.p < 0.05 ? 'font-medium text-green-600' : ''}>{analysisResults.cox.p.toFixed(4)}</span></td>
                    <td className="text-muted-foreground">{analysisResults.cox.hr > 1 ? 'Higher expression → worse survival' : 'Higher expression → better survival'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {analysisTab === 'correlation' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="vax-card">
                <h3 className="font-semibold text-sm mb-4">Gene Correlations with {targetGene}</h3>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={analysisResults.correlations.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                    <XAxis dataKey="gene" stroke="#a1a1aa" />
                    <YAxis domain={[-1, 1]} label={{ value: 'Pearson r', angle: -90, position: 'insideLeft' }} stroke="#a1a1aa" />
                    <Tooltip />
                    <Bar dataKey="r" name="Pearson r">
                      {analysisResults.correlations.slice(0, 8).map((entry, index) => (
                        <Cell key={index} fill={entry.r > 0 ? '#3b82f6' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="vax-card">
                <h3 className="font-semibold text-sm mb-4">Correlation Table</h3>
                <div className="max-h-72 overflow-y-auto">
                  <table>
                    <thead><tr><th>Gene</th><th>Pearson r</th><th>p-value</th><th>Sig</th></tr></thead>
                    <tbody>
                      {analysisResults.correlations.map(c => (
                        <tr key={c.gene}>
                          <td className="font-medium">{c.gene}</td>
                          <td><span className={c.r > 0 ? 'text-blue-600' : 'text-red-600'}>{c.r.toFixed(3)}</span></td>
                          <td>{c.p.toFixed(4)}</td>
                          <td>{c.p < 0.001 ? '***' : c.p < 0.01 ? '**' : c.p < 0.05 ? '*' : 'ns'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {analysisTab === 'multivariate' && analysisResults.multiResults && (
            <div className="vax-card">
              <h3 className="font-semibold text-sm mb-4">Multivariate Cox Regression</h3>
              <table>
                <thead><tr><th>Variable</th><th>Hazard Ratio</th><th>95% CI</th><th>p-value</th><th>Sig</th><th>N</th></tr></thead>
                <tbody>
                  {Object.entries(analysisResults.multiResults as Record<string, MultiCoxResult>).map(([name, res]) => (
                    <tr key={name}>
                      <td className="font-medium">{name}</td>
                      <td><span className={res.hr ? (res.hr > 1 ? 'text-red-600' : 'text-green-600') : 'text-muted-foreground'}>{res.hr ? res.hr.toFixed(3) : '—'}</span></td>
                      <td>{res.ci[0] != null ? `${res.ci[0].toFixed(2)} – ${res.ci[1]!.toFixed(2)}` : '—'}</td>
                      <td>{res.p ? res.p.toFixed(4) : '—'}</td>
                      <td>{res.p ? (res.p < 0.001 ? '***' : res.p < 0.01 ? '**' : res.p < 0.05 ? '*' : 'ns') : '—'}</td>
                      <td>{res.n}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Analysis;
