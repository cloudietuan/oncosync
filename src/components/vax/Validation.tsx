import { useState, useMemo, useRef, useCallback } from 'react';
import Papa from 'papaparse';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, ReferenceLine, ScatterChart, Scatter, ZAxis,
  AreaChart, Area,
} from 'recharts';
import AlertBox from './AlertBox';
import { computeScore, emptyTP, type Timepoint } from '@/lib/tcellProxy';
import {
  computeROC, computeConfusionAtThreshold, findOptimalThreshold, computeCalibration,
  type ValidationRow, type ConfusionMetrics,
} from '@/lib/validation';
import type { ExpressionData, ClinicalRecord } from '@/data/gse62452';

interface ValidationProps {
  expr: ExpressionData | null;
  clin: ClinicalRecord[] | null;
}

const MetricCard = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div className="bg-muted rounded-lg p-3 text-center">
    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className="text-xl font-bold text-foreground mt-0.5">{value}</div>
    {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
  </div>
);

function buildHistogram(data: ValidationRow[]) {
  const bins: { bin: string; responders: number; nonResponders: number }[] = [];
  for (let i = 0; i <= 90; i += 10) {
    const inBin = data.filter(r => r.proxyScore >= i && r.proxyScore < i + 10);
    bins.push({ bin: `${i}`, responders: inBin.filter(r => r.outcome === 1).length, nonResponders: inBin.filter(r => r.outcome === 0).length });
  }
  return bins;
}

function generateSampleData(): ValidationRow[] {
  const syntheticInputs = [
    { elispot: '20', cd8: '0.2', alc: '0.8', crp: '12', outcome: 0 },
    { elispot: '30', cd8: '0.3', alc: '1.0', crp: '10', outcome: 0 },
    { elispot: '45', cd8: '0.5', alc: '1.1', crp: '9', outcome: 0 },
    { elispot: '60', cd8: '0.6', alc: '0.9', crp: '11', outcome: 1 },
    { elispot: '50', cd8: '0.4', alc: '1.2', crp: '7', outcome: 0 },
    { elispot: '80', cd8: '0.9', alc: '1.3', crp: '8', outcome: 0 },
    { elispot: '100', cd8: '1.0', alc: '1.0', crp: '5', outcome: 1 },
    { elispot: '70', cd8: '0.7', alc: '1.5', crp: '6', outcome: 0 },
    { elispot: '120', cd8: '1.2', alc: '1.4', crp: '4', outcome: 1 },
    { elispot: '150', cd8: '1.5', alc: '1.6', crp: '3', outcome: 1 },
    { elispot: '90', cd8: '1.1', alc: '1.3', crp: '5', outcome: 0 },
    { elispot: '110', cd8: '1.0', alc: '1.1', crp: '6', outcome: 0 },
    { elispot: '160', cd8: '1.6', alc: '1.8', crp: '2', outcome: 1 },
    { elispot: '130', cd8: '1.3', alc: '1.5', crp: '4', outcome: 0 },
    { elispot: '200', cd8: '2.0', alc: '2.0', crp: '2', outcome: 1 },
    { elispot: '250', cd8: '2.5', alc: '2.2', crp: '1', outcome: 1 },
    { elispot: '180', cd8: '1.8', alc: '1.7', crp: '3', outcome: 0 },
    { elispot: '300', cd8: '3.0', alc: '2.5', crp: '1', outcome: 1 },
    { elispot: '280', cd8: '2.8', alc: '2.3', crp: '1.5', outcome: 1 },
    { elispot: '350', cd8: '3.5', alc: '2.8', crp: '0.5', outcome: 1 },
  ];
  return syntheticInputs.map((inp, i) => {
    const tp: Timepoint = { ...emptyTP(), elispotIfng: inp.elispot, cd8IfngPct: inp.cd8, alc: inp.alc, crp: inp.crp };
    return { proxyScore: computeScore(tp, null).proxyScore, outcome: inp.outcome, label: `S${String(i + 1).padStart(2, '0')}` };
  });
}

/* ═══════════ Main Component ═══════════ */
const Validation = ({ expr, clin }: ValidationProps) => {
  const [tab, setTab] = useState<'upload' | 'benchmark' | 'calibration'>('upload');
  const [csvData, setCsvData] = useState<ValidationRow[] | null>(null);
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(50);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCSV = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: (res) => {
        const rows: ValidationRow[] = [];
        for (const row of res.data as Record<string, string>[]) {
          const tp: Timepoint = {
            ...emptyTP(),
            elispotIfng: row.elispot || row.elispot_ifng || row.ELISpot || '',
            cd8IfngPct: row.cd8_pct || row.cd8 || row.CD8 || '',
            cd4ActivatedPct: row.cd4_pct || row.cd4 || '',
            il2: row.il2 || row.IL2 || '',
            tnfAlpha: row.tnf_alpha || row.tnf || '',
            alc: row.alc || row.ALC || '',
            crp: row.crp || row.CRP || '',
            maxTempF: row.temp_f || row.temp || '',
            fatigue: row.fatigue || '',
            myalgia: row.myalgia || '',
            chills: row.chills || '',
            injectionSiteRxn: row.injection_site || '',
            steroids: row.steroids === '1' || row.steroids === 'true',
            infectionSymptoms: row.infection === '1' || row.infection === 'true',
            chemoWithin7d: row.chemo_7d === '1' || row.chemo_7d === 'true',
          };
          const outcome = parseInt(row.outcome || row.response || row.event || '0');
          if (isNaN(outcome)) continue;
          const result = computeScore(tp, null);
          rows.push({ proxyScore: result.proxyScore, outcome, label: row.patient_id || row.id || `P${rows.length + 1}` });
        }
        setCsvData(rows);
        if (rows.length) setThreshold(findOptimalThreshold(rows));
      },
    });
  }, []);

  const handleLoadSample = useCallback(() => {
    const data = generateSampleData();
    setCsvData(data);
    setCsvFileName('sample_validation.csv');
    setThreshold(findOptimalThreshold(data));
  }, []);

  /* ─── GSE62452 benchmarking ─── */
  const benchmarkData = useMemo<ValidationRow[] | null>(() => {
    if (!expr || !clin) return null;
    const cd8Idx = expr.genes.indexOf('CD8A');
    const prf1Idx = expr.genes.indexOf('PRF1');
    const gzmaIdx = expr.genes.indexOf('GZMA');
    const pdcd1Idx = expr.genes.indexOf('PDCD1');
    if (cd8Idx < 0) return null;

    return clin.map((c, i) => {
      const cd8Expr = expr.values[cd8Idx]?.[i] || 0;
      const prf1Expr = prf1Idx >= 0 ? expr.values[prf1Idx]?.[i] || 0 : 0;
      const gzmaExpr = gzmaIdx >= 0 ? expr.values[gzmaIdx]?.[i] || 0 : 0;
      const pdcd1Expr = pdcd1Idx >= 0 ? expr.values[pdcd1Idx]?.[i] || 0 : 0;

      const elispotProxy = ((cd8Expr - 4.5) / 2.5) * 400;
      const cd8PctProxy = ((cd8Expr + prf1Expr - 9) / 5) * 5;
      const il2Proxy = ((gzmaExpr - 4.5) / 2) * 500;
      const crpProxy = Math.max(0, (pdcd1Expr - 2) * 4);

      const tp: Timepoint = { ...emptyTP(), elispotIfng: elispotProxy.toFixed(1), cd8IfngPct: cd8PctProxy.toFixed(2), il2: il2Proxy.toFixed(1), crp: crpProxy.toFixed(1) };
      const result = computeScore(tp, null);
      const medianDays = 500;
      const outcome = c.time_to_event_days != null && c.time_to_event_days > medianDays ? 1 : 0;
      return { proxyScore: result.proxyScore, outcome, label: c.sample_id };
    });
  }, [expr, clin]);

  const activeData = tab === 'upload' ? csvData : benchmarkData;
  const roc = useMemo(() => activeData ? computeROC(activeData) : null, [activeData]);
  const confusion = useMemo<ConfusionMetrics | null>(() => activeData ? computeConfusionAtThreshold(activeData, threshold) : null, [activeData, threshold]);

  // For calibration tab, use whichever data is available
  const calData = csvData || benchmarkData;
  const calResults = useMemo(() => calData ? computeCalibration(calData) : null, [calData]);
  const calROC = useMemo(() => calData ? computeROC(calData) : null, [calData]);

  const tabItems = [
    { key: 'upload' as const, label: 'CSV Upload', icon: '📂' },
    { key: 'benchmark' as const, label: 'GSE62452 Benchmark', icon: '🧬' },
    { key: 'calibration' as const, label: 'Calibration', icon: '📐' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="vax-section-title">Validation & Benchmarking</h2>
        <p className="vax-section-desc">Evaluate proxy scoring accuracy against known outcomes</p>
      </div>

      <AlertBox variant="warning" icon="⚠" title="Research Validation Only"
        description="These metrics evaluate model calibration and discrimination, not clinical utility. Results require external prospective validation before any clinical application." />

      {/* Tab Nav */}
      <div className="flex gap-1 border-b border-border pb-0">
        {tabItems.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-[13px] font-medium rounded-t-lg transition-colors ${tab === t.key ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-muted-foreground hover:bg-muted'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ═══ CSV Upload Tab ═══ */}
      {tab === 'upload' && (
        <div className="space-y-4">
          <div className="vax-card">
            <h3 className="font-semibold text-sm mb-3">Upload Patient Data CSV</h3>
            <p className="text-[11px] text-muted-foreground mb-3">
              CSV must include immune assay columns (elispot, cd8_pct, alc, crp, etc.) and an <code className="bg-muted px-1 rounded">outcome</code> column (1 = responder, 0 = non-responder).
            </p>
            <div className="flex flex-wrap gap-2 items-center">
              <input ref={inputRef} type="file" accept=".csv" onChange={handleCSV} className="hidden" />
              <button onClick={() => inputRef.current?.click()} className="vax-btn-primary text-[12px] py-1.5 px-4">
                {csvFileName ? `📄 ${csvFileName}` : '📂 Select CSV File'}
              </button>
              <button onClick={handleLoadSample} className="vax-btn-secondary text-[12px] py-1.5 px-4">Load Sample Data</button>
              {csvData && <span className="text-[11px] text-muted-foreground">{csvData.length} patients loaded</span>}
            </div>
            <div className="mt-3 bg-muted rounded-lg p-3 text-[11px] text-muted-foreground">
              <strong>Expected columns:</strong> patient_id, elispot, cd8_pct, alc, crp, temp_f, fatigue, outcome (0/1)
              <br />Optional: cd4_pct, il2, tnf_alpha, myalgia, chills, injection_site, steroids, infection, chemo_7d
            </div>
          </div>
          {csvData && csvData.length > 0 && roc && confusion && (
            <ROCPanel data={csvData} roc={roc} confusion={confusion} threshold={threshold} setThreshold={setThreshold} />
          )}
        </div>
      )}

      {/* ═══ Benchmark Tab ═══ */}
      {tab === 'benchmark' && (
        <div className="space-y-4">
          <div className="vax-card">
            <h3 className="font-semibold text-sm mb-2">GSE62452 Survival Correlation</h3>
            <p className="text-[11px] text-muted-foreground mb-3">
              Maps gene expression (CD8A, PRF1, GZMA, PDCD1) to proxy-compatible inputs, then evaluates whether high proxy scores correlate with better survival ({'>'} 500 days).
            </p>
            {!benchmarkData ? (
              <div className="text-center text-muted-foreground py-8 text-sm">Expression + clinical data required. Data loads automatically.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MetricCard label="Patients" value={String(benchmarkData.length)} />
                <MetricCard label="Responders" value={String(benchmarkData.filter(r => r.outcome === 1).length)} sub={`${(benchmarkData.filter(r => r.outcome === 1).length / benchmarkData.length * 100).toFixed(0)}%`} />
                <MetricCard label="AUC-ROC" value={roc?.auc?.toFixed(3) || '—'} sub={roc && roc.auc >= 0.7 ? 'Acceptable' : roc && roc.auc >= 0.6 ? 'Poor' : 'Needs work'} />
                <MetricCard label="Optimal Threshold" value={benchmarkData ? String(findOptimalThreshold(benchmarkData)) : '—'} />
              </div>
            )}
          </div>

          {benchmarkData && benchmarkData.length > 0 && roc && confusion && (
            <ROCPanel data={benchmarkData} roc={roc} confusion={confusion} threshold={threshold} setThreshold={setThreshold} />
          )}

          {benchmarkData && clin && (
            <div className="vax-card">
              <h3 className="font-semibold text-sm mb-3">Proxy Score vs Survival (days)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(270,13%,82%)" />
                  <XAxis dataKey="proxyScore" name="Proxy Score" type="number" domain={[0, 100]} tick={{ fontSize: 10 }} label={{ value: 'Proxy Score', position: 'insideBottom', offset: -10, fontSize: 11 }} />
                  <YAxis dataKey="survival" name="Survival (days)" type="number" tick={{ fontSize: 10 }} label={{ value: 'Days', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <ZAxis range={[40, 40]} />
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-card border border-border rounded-lg p-2.5 text-[11px] shadow-lg">
                        <div className="font-semibold">{d.label}</div>
                        <div>Score: {d.proxyScore} | Survival: {d.survival} days</div>
                        <div>{d.outcome === 1 ? '✅ Responder' : '❌ Non-responder'}</div>
                      </div>
                    );
                  }} />
                  <ReferenceLine x={70} stroke="hsl(160,84%,39%)" strokeDasharray="6 3" />
                  <ReferenceLine x={40} stroke="hsl(38,92%,50%)" strokeDasharray="6 3" />
                  <Scatter data={benchmarkData.map((r, i) => ({ ...r, survival: clin[i]?.time_to_event_days || 0 }))} fill="hsl(221,83%,53%)" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ═══ Calibration Tab ═══ */}
      {tab === 'calibration' && (
        <div className="space-y-4">
          <div className="vax-card">
            <h3 className="font-semibold text-sm mb-2">Calibration Analysis</h3>
            <p className="text-[11px] text-muted-foreground mb-3">
              Compares predicted proxy tier against actual response rate. A well-calibrated model shows increasing response rates across Low → Moderate → High tiers.
            </p>
            {!calData && (
              <div className="text-center text-muted-foreground py-8 text-sm">Upload a CSV or switch to GSE62452 Benchmark tab first.</div>
            )}
          </div>

          {calData && calResults && calROC && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="vax-card">
                  <h3 className="font-semibold text-[13px] mb-3">Predicted Tier vs Actual Response Rate</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={calResults} margin={{ top: 5, right: 20, bottom: 20, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(270,13%,82%)" />
                      <XAxis dataKey="tier" tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} label={{ value: '% Response', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                      <Tooltip content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="bg-card border border-border rounded-lg p-2.5 text-[11px] shadow-lg">
                            <div className="font-semibold">{d.tier}</div>
                            <div>Actual response: {d.actual.toFixed(1)}%</div>
                            <div>Mean score: {d.predicted.toFixed(1)}</div>
                            <div>n = {d.count}</div>
                          </div>
                        );
                      }} />
                      <Bar dataKey="actual" radius={[4, 4, 0, 0]}>
                        {calResults.map((_, i) => (
                          <Cell key={i} fill={i === 0 ? 'hsl(0,84%,60%)' : i === 1 ? 'hsl(38,92%,50%)' : 'hsl(160,84%,39%)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="vax-card">
                  <h3 className="font-semibold text-[13px] mb-3">Tier Breakdown</h3>
                  <table>
                    <thead>
                      <tr><th>Tier</th><th className="text-center">n</th><th className="text-center">Mean Score</th><th className="text-center">Actual Response %</th><th className="text-center">Status</th></tr>
                    </thead>
                    <tbody>
                      {calResults.map((c, i) => {
                        const expected = i === 0 ? [0, 30] : i === 1 ? [30, 65] : [65, 100];
                        const inRange = c.actual >= expected[0] && c.actual <= expected[1];
                        return (
                          <tr key={c.tier}>
                            <td className="text-[12px] font-medium">{c.tier}</td>
                            <td className="text-center text-[12px]">{c.count}</td>
                            <td className="text-center text-[12px]">{c.predicted.toFixed(1)}</td>
                            <td className="text-center text-[12px] font-bold">{c.actual.toFixed(1)}%</td>
                            <td className="text-center">
                              <span className={`vax-badge text-[10px] ${inRange ? 'vax-badge-green' : 'vax-badge-amber'}`}>{inRange ? 'Calibrated' : 'Needs tuning'}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="mt-4 text-[11px] text-muted-foreground space-y-1">
                    <div><strong>Interpretation:</strong></div>
                    <div>• Low tier: {'<'}30% response rate</div>
                    <div>• Moderate tier: 30-65% response rate</div>
                    <div>• High tier: {'>'}65% response rate</div>
                    <div>• "Needs tuning" → thresholds (40/70) may need adjustment</div>
                  </div>
                </div>
              </div>

              <div className="vax-card">
                <h3 className="font-semibold text-[13px] mb-3">Reliability Diagram</h3>
                <p className="text-[11px] text-muted-foreground mb-3">Perfect calibration follows the diagonal.</p>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={[
                    { predicted: 0, actual: 0, perfect: 0 },
                    ...calResults.map(c => ({ predicted: c.predicted, actual: c.actual, perfect: c.predicted })),
                    { predicted: 100, actual: 100, perfect: 100 },
                  ]} margin={{ top: 5, right: 20, bottom: 20, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(270,13%,82%)" />
                    <XAxis dataKey="predicted" tick={{ fontSize: 10 }} label={{ value: 'Predicted (Mean Score)', position: 'insideBottom', offset: -10, fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} label={{ value: 'Actual %', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                    <Area type="monotone" dataKey="actual" stroke="hsl(221,83%,53%)" fill="hsl(221,83%,53%)" fillOpacity={0.15} dot={{ r: 4, fill: 'hsl(221,83%,53%)' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="vax-card bg-muted/30">
                <h3 className="font-semibold text-sm mb-3">Model Summary</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <MetricCard label="AUC-ROC" value={calROC.auc.toFixed(3)} sub={calROC.auc >= 0.7 ? '✓ Acceptable' : '⚠ Needs improvement'} />
                  <MetricCard label="Total Patients" value={String(calData.length)} />
                  <MetricCard label="Response Rate" value={`${(calData.filter(r => r.outcome === 1).length / calData.length * 100).toFixed(0)}%`} />
                  <MetricCard label="Data Source" value={csvData ? 'CSV Upload' : 'GSE62452'} />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

/* ═══ ROC Panel ═══ */
const ROCPanel = ({ data, roc, confusion, threshold, setThreshold }: {
  data: ValidationRow[];
  roc: ReturnType<typeof computeROC>;
  confusion: ConfusionMetrics;
  threshold: number;
  setThreshold: (t: number) => void;
}) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      <MetricCard label="AUC-ROC" value={roc.auc.toFixed(3)} sub={roc.auc >= 0.8 ? 'Good' : roc.auc >= 0.7 ? 'Acceptable' : roc.auc >= 0.6 ? 'Poor' : 'Failed'} />
      <MetricCard label="Sensitivity" value={`${(confusion.sensitivity * 100).toFixed(1)}%`} sub={`TP=${confusion.tp}, FN=${confusion.fn}`} />
      <MetricCard label="Specificity" value={`${(confusion.specificity * 100).toFixed(1)}%`} sub={`TN=${confusion.tn}, FP=${confusion.fp}`} />
      <MetricCard label="PPV" value={`${(confusion.ppv * 100).toFixed(1)}%`} />
      <MetricCard label="Accuracy" value={`${(confusion.accuracy * 100).toFixed(1)}%`} sub={`n=${data.length}`} />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="vax-card">
        <h3 className="font-semibold text-[13px] mb-3">ROC Curve (AUC = {roc.auc.toFixed(3)})</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={roc.curve} margin={{ top: 5, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(270,13%,82%)" />
            <XAxis dataKey="fpr" domain={[0, 1]} tick={{ fontSize: 10 }} label={{ value: '1 - Specificity', position: 'insideBottom', offset: -10, fontSize: 11 }} />
            <YAxis domain={[0, 1]} tick={{ fontSize: 10 }} label={{ value: 'Sensitivity', angle: -90, position: 'insideLeft', fontSize: 11 }} />
            <Tooltip content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div className="bg-card border border-border rounded-lg p-2 text-[11px] shadow-lg">
                  <div>Threshold: {d.threshold.toFixed(0)}</div>
                  <div>TPR: {d.tpr.toFixed(3)} | FPR: {d.fpr.toFixed(3)}</div>
                </div>
              );
            }} />
            <Area type="monotone" dataKey="tpr" stroke="hsl(221,83%,53%)" fill="hsl(221,83%,53%)" fillOpacity={0.15} dot={false} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="vax-card">
        <h3 className="font-semibold text-[13px] mb-3">Decision Threshold</h3>
        <div className="mb-4">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
            <span>Score Threshold</span>
            <span className="font-bold text-foreground">{threshold}</span>
          </div>
          <input type="range" min={0} max={100} value={threshold} onChange={e => setThreshold(parseInt(e.target.value))} className="w-full accent-primary" />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
            <span>0 (all positive)</span>
            <span>100 (all negative)</span>
          </div>
        </div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Confusion Matrix</div>
        <div className="grid grid-cols-3 gap-0.5 text-center text-[11px]">
          <div></div>
          <div className="font-bold text-muted-foreground py-1">Actual +</div>
          <div className="font-bold text-muted-foreground py-1">Actual −</div>
          <div className="font-bold text-muted-foreground py-1 text-right pr-2">Pred +</div>
          <div className="bg-primary/10 rounded p-2 font-bold text-primary">TP: {confusion.tp}</div>
          <div className="bg-destructive/10 rounded p-2 font-bold text-destructive">FP: {confusion.fp}</div>
          <div className="font-bold text-muted-foreground py-1 text-right pr-2">Pred −</div>
          <div className="bg-accent rounded p-2 font-bold text-accent-foreground">FN: {confusion.fn}</div>
          <div className="bg-secondary rounded p-2 font-bold text-secondary-foreground">TN: {confusion.tn}</div>
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={() => setThreshold(40)} className={`vax-btn-secondary text-[11px] py-1 px-2 ${threshold === 40 ? 'ring-1 ring-primary' : ''}`}>Low/Mod (40)</button>
          <button onClick={() => setThreshold(70)} className={`vax-btn-secondary text-[11px] py-1 px-2 ${threshold === 70 ? 'ring-1 ring-primary' : ''}`}>Mod/High (70)</button>
          <button onClick={() => setThreshold(findOptimalThreshold(data))} className="vax-btn-secondary text-[11px] py-1 px-2">Youden's J</button>
        </div>
      </div>
    </div>

    <div className="vax-card">
      <h3 className="font-semibold text-[13px] mb-3">Score Distribution by Outcome</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={buildHistogram(data)} margin={{ top: 5, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(270,13%,82%)" />
          <XAxis dataKey="bin" tick={{ fontSize: 10 }} label={{ value: 'Proxy Score', position: 'insideBottom', offset: -10, fontSize: 11 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Bar dataKey="responders" fill="hsl(160,84%,39%)" name="Responders" stackId="a" />
          <Bar dataKey="nonResponders" fill="hsl(0,84%,60%)" name="Non-responders" stackId="a" />
          <ReferenceLine x={`${threshold}`} stroke="hsl(221,83%,53%)" strokeDasharray="6 3" label={{ value: `T=${threshold}`, position: 'top', fontSize: 10 }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export default Validation;
