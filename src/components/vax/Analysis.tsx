import { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, ResponsiveContainer, Cell, ReferenceLine, Label } from 'recharts';
import StatCard from './StatCard';
import FileUpload from './FileUpload';
import AlertBox from './AlertBox';
import InfoTooltip from './InfoTooltip';
import { StaggerGrid, StaggerItem, FadeSection } from './MotionWrappers';
import { ChartSkeleton, StatGridSkeleton, TableSkeleton } from './ChartSkeleton';
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
  const [computing, setComputing] = useState(true);

  // Brief delay to show skeleton while useMemo computes
  useEffect(() => {
    setComputing(true);
    const t = setTimeout(() => setComputing(false), 400);
    return () => clearTimeout(t);
  }, [targetGene, splitMethod, covariates]);

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
    <div className="space-y-6">
      <div>
        <h2 className="vax-section-title flex items-center gap-2">
          Expression Analysis
          <InfoTooltip term="Expression Analysis" definition="Statistical analysis of gene expression levels from microarray or RNA-seq data, used to identify biomarkers associated with patient outcomes." />
        </h2>
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
              <label className="vax-label flex items-center gap-1">Target Gene <InfoTooltip term="Target Gene" definition="The gene whose expression level is used to stratify patients into high vs low groups for survival analysis." /></label>
              <select className="vax-input" value={targetGene} onChange={e => setTargetGene(e.target.value)}>
                {expr?.genes?.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="vax-label flex items-center gap-1">Split Method <InfoTooltip term="Split Method" definition="How patients are divided into high/low groups. Median uses the middle value; mean uses the average expression level as the cutoff." /></label>
              <select className="vax-input" value={splitMethod} onChange={e => setSplitMethod(e.target.value)}>
                <option value="median">Median</option>
                <option value="mean">Mean</option>
              </select>
            </div>
            <div>
              <label className="vax-label flex items-center gap-1">Covariates <InfoTooltip term="Covariates" definition="Additional clinical variables (age, sex, tumor stage) included in multivariate models to control for confounding factors." /></label>
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

      {computing || !analysisResults ? (
        <FadeSection>
          <div className="space-y-4">
            <StatGridSkeleton count={4} />
            <ChartSkeleton height={420} bars={10} />
          </div>
        </FadeSection>
      ) : (
        <>
           <StaggerGrid className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <StaggerItem><StatCard label="High Expression" value={analysisResults.highN} sub={`≥ ${analysisResults.threshold.toFixed(2)}`} tooltip={{ term: "High Expression", definition: "Patients whose gene expression level is at or above the cutoff threshold." }} /></StaggerItem>
            <StaggerItem><StatCard label="Low Expression" value={analysisResults.lowN} sub={`< ${analysisResults.threshold.toFixed(2)}`} tooltip={{ term: "Low Expression", definition: "Patients whose gene expression level is below the cutoff threshold." }} /></StaggerItem>
            <StaggerItem><StatCard label="Median OS (High)" value={typeof analysisResults.medianHigh === 'number' ? `${analysisResults.medianHigh}d` : String(analysisResults.medianHigh)} tooltip={{ term: "Median OS", definition: "Median Overall Survival — the time at which 50% of patients in the group have experienced the event (death). 'NR' means not reached." }} /></StaggerItem>
            <StaggerItem><StatCard label="Median OS (Low)" value={typeof analysisResults.medianLow === 'number' ? `${analysisResults.medianLow}d` : String(analysisResults.medianLow)} /></StaggerItem>
           </StaggerGrid>

          <div className="vax-tab-bar overflow-x-auto">
            {['km', 'cox', 'correlation', ...(hasAnyCovariates ? ['multivariate'] : [])].map(tab => (
              <button key={tab} onClick={() => setAnalysisTab(tab)} className={`vax-tab-btn ${analysisTab === tab ? 'active' : ''}`}>
                {tab === 'km' ? 'Kaplan-Meier' : tab === 'cox' ? 'Cox Regression' : tab === 'multivariate' ? 'Multivariate' : 'Correlations'}
              </button>
            ))}
          </div>

          {analysisTab === 'km' && (
            <FadeSection>
            <div className="vax-card">
               <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                Kaplan-Meier Survival by {targetGene} Expression
                <InfoTooltip term="Kaplan-Meier Curve" definition="A non-parametric statistic that estimates survival probability over time. The step-down pattern shows when events (deaths) occur in each group." />
              </h3>
              <p className="text-xs text-muted-foreground mb-4">Log-rank p = {analysisResults.logRank.p.toFixed(4)} <InfoTooltip term="Log-rank p-value" definition="Tests whether there is a statistically significant difference in survival between the two groups. p < 0.05 is typically considered significant." /></p>
              <ResponsiveContainer width="100%" height={420}>
                <LineChart data={analysisResults.kmData} margin={{ top: 5, right: 10, bottom: 35, left: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(270,13%,82%)" />
                  <XAxis dataKey="t" type="number" domain={[0, 'dataMax']} ticks={[0, 200, 400, 600, 800, 1000, 1200, 1400, 1600]} tick={{ fontSize: 10 }} label={{ value: 'Time (days)', position: 'insideBottom', offset: -5, style: { fontSize: 10, fill: 'hsl(270,9%,46%)' } }} stroke="hsl(270,9%,46%)" />
                  <YAxis domain={[0, 1.05]} width={45} label={{ value: 'Survival Probability', angle: -90, position: 'insideLeft', offset: -5, style: { fontSize: 10, fill: 'hsl(270,9%,46%)' } }} stroke="hsl(270,9%,46%)" />
                  <Tooltip formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, undefined]} labelFormatter={(label: number) => `Day ${label}`} />
                  <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: 10 }} />
                  <ReferenceLine y={0.5} stroke="hsl(270,9%,46%)" strokeDasharray="4 4" strokeWidth={1}>
                    <Label value="50% survival" position="insideTopRight" style={{ fontSize: 9, fill: 'hsl(270,9%,46%)' }} />
                  </ReferenceLine>
                  <Line type="stepAfter" dataKey="high" name={`High ${targetGene} (n=${analysisResults.highN})`} stroke="#ef4444" strokeWidth={2} dot={false} />
                  <Line type="stepAfter" dataKey="low" name={`Low ${targetGene} (n=${analysisResults.lowN})`} stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-2 flex flex-wrap gap-3 justify-center text-xs">
                <span className="px-2 py-1 rounded bg-muted font-medium">
                  HR = {analysisResults.cox.hr.toFixed(2)} <span className="text-muted-foreground">({analysisResults.cox.ci[0].toFixed(2)}–{analysisResults.cox.ci[1].toFixed(2)})</span>
                </span>
                <span className={`px-2 py-1 rounded font-medium ${analysisResults.logRank.p < 0.05 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted'}`}>
                  Log-rank p = {analysisResults.logRank.p.toFixed(4)}
                </span>
                <span className="px-2 py-1 rounded bg-muted text-muted-foreground">
                  {analysisResults.cox.hr > 1 ? '↑ Higher expression → worse prognosis' : '↓ Higher expression → better prognosis'}
                </span>
              </div>
            </div>
            </FadeSection>
          )}

          {analysisTab === 'cox' && (
            <FadeSection>
             <div className="vax-card">
              <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                Cox Proportional Hazards — Univariate
                <InfoTooltip term="Cox Regression" definition="Estimates the hazard ratio (HR) per standard deviation increase in expression. HR > 1 means higher risk; HR < 1 means protective." />
              </h3>
              <p className="text-[11px] text-muted-foreground mb-3">HR reported per SD increase in expression</p>
              <div className="overflow-x-auto">
              <table>
                <thead><tr><th>Variable</th><th>HR (per SD) <InfoTooltip term="Hazard Ratio" definition="HR per standard deviation increase. HR=2.0 means each SD increase in expression doubles the risk of death." /></th><th>95% CI</th><th>p-value</th><th className="min-w-[120px]">Interpretation</th></tr></thead>
                <tbody>
                  <tr>
                    <td className="font-medium">{targetGene}</td>
                    <td><span className={analysisResults.cox.hr > 1 ? 'text-red-600' : 'text-green-600'}>{analysisResults.cox.hr.toFixed(3)}</span></td>
                    <td className="whitespace-nowrap">{analysisResults.cox.ci[0].toFixed(2)} – {analysisResults.cox.ci[1].toFixed(2)}</td>
                    <td><span className={analysisResults.cox.p < 0.05 ? 'font-medium text-green-600' : ''}>{analysisResults.cox.p.toFixed(4)}</span></td>
                    <td className="text-muted-foreground whitespace-nowrap">{analysisResults.cox.hr > 1 ? 'Higher expression → worse survival' : 'Higher expression → better survival'}</td>
                  </tr>
                </tbody>
              </table>
              </div>

              {/* Forest Plot */}
              <div className="mt-6">
                <h4 className="font-semibold text-xs mb-3 flex items-center gap-2">
                  Forest Plot
                  <InfoTooltip term="Forest Plot" definition="A graphical display of the hazard ratio and its confidence interval. The square marks the HR point estimate; horizontal lines show the 95% CI. A vertical line at HR=1 indicates no effect." />
                </h4>
                {(() => {
                  const forestData = [
                    { name: targetGene, hr: analysisResults.cox.hr, ciLow: analysisResults.cox.ci[0], ciHigh: analysisResults.cox.ci[1], p: analysisResults.cox.p },
                    ...(analysisResults.multiResults
                      ? Object.entries(analysisResults.multiResults as Record<string, MultiCoxResult>)
                          .filter(([n]) => n !== targetGene)
                          .filter(([, r]) => r.hr != null)
                          .map(([name, res]) => ({
                            name,
                            hr: res.hr!,
                            ciLow: res.ci[0]!,
                            ciHigh: res.ci[1]!,
                            p: res.p!,
                          }))
                      : []),
                  ];
                  // Use log scale for forest plot — map log(HR) to position
                  const logMin = Math.min(...forestData.map(d => Math.log(Math.max(d.ciLow, 0.01))), Math.log(0.1));
                  const logMax = Math.max(...forestData.map(d => Math.log(Math.max(d.ciHigh, 0.01))), Math.log(10));
                  const logRange = logMax - logMin || 1;
                  const scaleX = (v: number) => Math.max(2, Math.min(98, ((Math.log(Math.max(v, 0.01)) - logMin) / logRange) * 100));
                  const refLinePos = scaleX(1);

                  return (
                    <div className="space-y-1">
                      {/* Header */}
                      <div className="grid grid-cols-[80px_1fr_70px] sm:grid-cols-[100px_1fr_90px] items-center text-[10px] text-muted-foreground font-medium px-1">
                        <span>Variable</span>
                        <span className="text-center">Hazard Ratio (95% CI)</span>
                        <span className="text-right">HR (p)</span>
                      </div>
                      {forestData.map((d) => {
                        const hrPos = scaleX(d.hr);
                        const ciLowPos = scaleX(d.ciLow);
                        const ciHighPos = scaleX(d.ciHigh);
                        const isSignificant = d.p < 0.05;
                        const color = isSignificant ? (d.hr > 1 ? 'hsl(0,72%,51%)' : 'hsl(142,71%,45%)') : 'hsl(var(--muted-foreground))';
                        return (
                          <div key={d.name} className="grid grid-cols-[80px_1fr_70px] sm:grid-cols-[100px_1fr_90px] items-center py-2 px-1 rounded hover:bg-muted/50 transition-colors">
                            <span className="text-[11px] font-medium truncate">{d.name}</span>
                            <div className="relative h-8 mx-1 sm:mx-2">
                              {/* Reference line at HR=1 */}
                              <div className="absolute top-0 bottom-0 w-px bg-muted-foreground/40" style={{ left: `${refLinePos}%` }} />
                              <div className="absolute -top-0.5 text-[7px] text-muted-foreground/60" style={{ left: `${refLinePos}%`, transform: 'translateX(-50%)' }}>1.0</div>
                              {/* CI line */}
                              <div className="absolute top-1/2 -translate-y-1/2 h-[2px]" style={{ left: `${ciLowPos}%`, width: `${Math.max(ciHighPos - ciLowPos, 1)}%`, backgroundColor: color }} />
                              {/* CI caps */}
                              <div className="absolute w-[2px] h-3" style={{ left: `${ciLowPos}%`, top: '50%', transform: 'translate(-50%, -50%)', backgroundColor: color }} />
                              <div className="absolute w-[2px] h-3" style={{ left: `${ciHighPos}%`, top: '50%', transform: 'translate(-50%, -50%)', backgroundColor: color }} />
                              {/* HR diamond */}
                              <div className="absolute w-2.5 h-2.5 rotate-45" style={{ left: `${hrPos}%`, top: '50%', transform: 'translate(-50%, -50%) rotate(45deg)', backgroundColor: color }} />
                            </div>
                            <span className="text-[10px] sm:text-[11px] text-right tabular-nums leading-tight">
                              <span className={`font-semibold ${d.hr > 1 ? 'text-red-600' : 'text-green-600'}`}>{d.hr.toFixed(2)}</span>
                              <br className="sm:hidden" />
                              <span className="text-muted-foreground ml-0.5">({d.p < 0.001 ? '<.001' : d.p.toFixed(3)})</span>
                            </span>
                          </div>
                        );
                      })}
                      {/* Legend */}
                      <div className="flex flex-wrap items-center gap-3 mt-2 pt-2 border-t border-border/50 text-[9px] sm:text-[10px] text-muted-foreground px-1">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rotate-45 bg-red-500 inline-block" /> HR {'>'} 1 (risk ↑)</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rotate-45 bg-green-500 inline-block" /> HR {'<'} 1 (protective)</span>
                        <span className="flex items-center gap-1"><span className="w-px h-3 bg-muted-foreground/40 inline-block" /> No effect</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
            </FadeSection>
          )}

          {analysisTab === 'correlation' && (
            <FadeSection>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="vax-card">
                <h3 className="font-semibold text-sm mb-4">Gene Correlations with {targetGene}</h3>
                <ResponsiveContainer width="100%" height={360}>
                  <BarChart data={analysisResults.correlations.slice(0, 8)} margin={{ top: 5, right: 10, bottom: 50, left: 15 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(270,13%,82%)" />
                    <XAxis dataKey="gene" stroke="hsl(270,9%,46%)" tick={{ fontSize: 10 }} angle={-40} textAnchor="end" height={70} />
                    <YAxis domain={[-1, 1]} width={55} label={{ value: 'Pearson r', angle: -90, position: 'insideLeft', offset: 5, style: { fontSize: 10, fill: 'hsl(270,9%,46%)' } }} stroke="hsl(270,9%,46%)" />
                    <Tooltip formatter={(value: number) => [value.toFixed(3), 'Pearson r']} />
                    <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: 10 }} />
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
            </FadeSection>
          )}

          {analysisTab === 'multivariate' && analysisResults.multiResults && (
            <FadeSection>
            <div className="vax-card">
              <h3 className="font-semibold text-sm mb-4">Multivariate Cox Regression</h3>
              <div className="overflow-x-auto">
              <table>
                <thead><tr><th>Variable</th><th>Hazard Ratio</th><th className="whitespace-nowrap">95% CI</th><th>p-value</th><th>Sig</th><th>N</th></tr></thead>
                <tbody>
                  {Object.entries(analysisResults.multiResults as Record<string, MultiCoxResult>).map(([name, res]) => (
                    <tr key={name}>
                      <td className="font-medium">{name}</td>
                      <td><span className={res.hr ? (res.hr > 1 ? 'text-red-600' : 'text-green-600') : 'text-muted-foreground'}>{res.hr ? res.hr.toFixed(3) : '—'}</span></td>
                      <td className="whitespace-nowrap">{res.ci[0] != null ? `${res.ci[0].toFixed(2)} – ${res.ci[1]!.toFixed(2)}` : '—'}</td>
                      <td>{res.p ? res.p.toFixed(4) : '—'}</td>
                      <td>{res.p ? (res.p < 0.001 ? '***' : res.p < 0.01 ? '**' : res.p < 0.05 ? '*' : 'ns') : '—'}</td>
                      <td>{res.n}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
            </FadeSection>
          )}
        </>
      )}
    </div>
  );
};

export default Analysis;
