import { useState, useMemo, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts';

/* ──────────────────── Types ──────────────────── */
interface PatientBaseline {
  patientId: string; age: string; sex: string; cancerStage: string;
  treatmentType: string; immunosuppressants: string; autoimmuneHx: string;
}
interface VaccineDetails {
  antigen: string; adjuvant: string; injectionSite: string; notes: string;
}
interface Timepoint {
  id: string;
  date: string; doseNumber: string;
  elispotIfng: string; cd8IfngPct: string; cd4ActivatedPct: string; il2: string; tnfAlpha: string;
  alc: string; crp: string; esr: string; wbc: string; nlr: string;
  maxTempF: string; fatigue: string; myalgia: string; chills: string; injectionSiteRxn: string;
  steroids: boolean; infectionSymptoms: boolean; chemoWithin7d: boolean;
  imagingRecist: string; tumorMarker: string; tumorMarkerValue: string; tumorSizeChangePct: string;
  clinicianNotes: string;
}
interface ScoreResult {
  proxyScore: number; tier: string; confidence: string; drivers: string[];
}

const emptyTP = (): Timepoint => ({
  id: crypto.randomUUID(), date: '', doseNumber: '',
  elispotIfng: '', cd8IfngPct: '', cd4ActivatedPct: '', il2: '', tnfAlpha: '',
  alc: '', crp: '', esr: '', wbc: '', nlr: '',
  maxTempF: '', fatigue: '', myalgia: '', chills: '', injectionSiteRxn: '',
  steroids: false, infectionSymptoms: false, chemoWithin7d: false,
  imagingRecist: '', tumorMarker: '', tumorMarkerValue: '', tumorSizeChangePct: '',
  clinicianNotes: '',
});

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
const num = (s: string) => { const n = parseFloat(s); return isNaN(n) ? null : n; };
const validDate = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d);

/* ──────────────── Scoring Engine ──────────────── */
function computeScore(tp: Timepoint, baseline: Timepoint | null): ScoreResult {
  const drivers: string[] = [];

  // --- Primary (70%) ---
  const primaryScores: number[] = [];
  const elispot = num(tp.elispotIfng);
  const cd8 = num(tp.cd8IfngPct);
  const baseEli = baseline ? num(baseline.elispotIfng) : null;
  const baseCd8 = baseline ? num(baseline.cd8IfngPct) : null;

  if (elispot !== null) {
    if (baseEli !== null && baseline) {
      const ds = clamp(((elispot - baseEli) / 250) * 100 + 50);
      primaryScores.push(ds);
      drivers.push(`ELISpot Δ ${elispot} (from ${baseEli}) → ${ds.toFixed(0)}`);
    } else {
      const s = clamp((elispot / 400) * 100);
      primaryScores.push(s);
      drivers.push(`ELISpot ${elispot} → ${s.toFixed(0)}`);
    }
  }
  if (cd8 !== null) {
    if (baseCd8 !== null && baseline) {
      const ds = clamp(((cd8 - baseCd8) / 2.5) * 100 + 50);
      primaryScores.push(ds);
      drivers.push(`CD8% Δ ${cd8} (from ${baseCd8}) → ${ds.toFixed(0)}`);
    } else {
      const s = clamp((cd8 / 5) * 100);
      primaryScores.push(s);
      drivers.push(`CD8% ${cd8} → ${s.toFixed(0)}`);
    }
  }
  const cd4 = num(tp.cd4ActivatedPct);
  if (cd4 !== null) { primaryScores.push(clamp((cd4 / 5) * 100)); drivers.push(`CD4% ${cd4}`); }
  const il2v = num(tp.il2);
  if (il2v !== null) { primaryScores.push(clamp((il2v / 500) * 100)); drivers.push(`IL-2 ${il2v}`); }
  const tnf = num(tp.tnfAlpha);
  if (tnf !== null) { primaryScores.push(clamp((tnf / 500) * 100)); drivers.push(`TNF-α ${tnf}`); }

  const primaryAvg = primaryScores.length ? primaryScores.reduce((a, b) => a + b, 0) / primaryScores.length : null;

  // --- Labs (20%) ---
  const labScores: number[] = [];
  const alcV = num(tp.alc);
  if (alcV !== null) { const s = clamp(((alcV - 0.5) / 3.0) * 100); labScores.push(s); drivers.push(`ALC ${alcV} → ${s.toFixed(0)}`); }
  const crpV = num(tp.crp);
  if (crpV !== null) { const s = clamp(100 - (crpV / 20) * 100); labScores.push(s); drivers.push(`CRP ${crpV} → ${s.toFixed(0)}`); }
  const labAvg = labScores.length ? labScores.reduce((a, b) => a + b, 0) / labScores.length : null;

  // --- Symptoms (10%) ---
  const sympScores: number[] = [];
  const temp = num(tp.maxTempF);
  if (temp !== null) { const s = clamp(((temp - 98.6) / 3.0) * 100); sympScores.push(s); drivers.push(`Temp ${temp}°F → ${s.toFixed(0)}`); }
  const fat = num(tp.fatigue);
  if (fat !== null) { const s = clamp((fat / 10) * 100); sympScores.push(s); drivers.push(`Fatigue ${fat}/10`); }
  const mya = num(tp.myalgia); const chi = num(tp.chills); const site = num(tp.injectionSiteRxn);
  const aches = [mya, chi, site].filter(v => v !== null) as number[];
  if (aches.length) { const s = clamp((aches.reduce((a, b) => a + b, 0) / (aches.length * 3)) * 100); sympScores.push(s); }
  const sympAvg = sympScores.length ? sympScores.reduce((a, b) => a + b, 0) / sympScores.length : null;

  // --- Weighted average ---
  const parts: { w: number; v: number }[] = [];
  if (primaryAvg !== null) parts.push({ w: 70, v: primaryAvg });
  if (labAvg !== null) parts.push({ w: 20, v: labAvg });
  if (sympAvg !== null) parts.push({ w: 10, v: sympAvg });

  let score = 50; // default if nothing
  if (parts.length) {
    const totalW = parts.reduce((a, p) => a + p.w, 0);
    score = parts.reduce((a, p) => a + (p.w / totalW) * p.v, 0);
  }

  // --- Confounders ---
  const confCount = [tp.steroids, tp.infectionSymptoms, tp.chemoWithin7d].filter(Boolean).length;
  const penalty = confCount === 0 ? 0 : confCount === 1 ? 5 : confCount === 2 ? 10 : 15;
  if (penalty) drivers.push(`Confounder penalty: -${penalty}`);
  score = clamp(score - penalty);

  // --- Confidence ---
  const hasAssay = elispot !== null || cd8 !== null;
  const hasLab = alcV !== null || crpV !== null;
  const confidence = hasAssay && hasLab ? 'High' : (hasAssay || hasLab) ? 'Moderate' : 'Low';

  const tier = score >= 70 ? 'High' : score >= 40 ? 'Moderate' : 'Low';
  return { proxyScore: Math.round(score), tier, confidence, drivers };
}

/* ──────────────── Component ──────────────── */
const TcellProxy = () => {
  const [patient, setPatient] = useState<PatientBaseline>({
    patientId: '', age: '', sex: '', cancerStage: '', treatmentType: '', immunosuppressants: '', autoimmuneHx: '',
  });
  const [vaccine, setVaccine] = useState<VaccineDetails>({ antigen: '', adjuvant: '', injectionSite: '', notes: '' });
  const [timepoints, setTimepoints] = useState<Timepoint[]>([]);

  const addTP = () => setTimepoints(p => [...p, emptyTP()]);
  const removeTP = (id: string) => setTimepoints(p => p.filter(t => t.id !== id));
  const updateTP = useCallback((id: string, field: string, value: string | boolean) => {
    setTimepoints(p => p.map(t => t.id === id ? { ...t, [field]: value } : t));
  }, []);

  // baseline = earliest valid-dated timepoint
  const baseline = useMemo(() => {
    const dated = timepoints.filter(t => validDate(t.date)).sort((a, b) => a.date.localeCompare(b.date));
    return dated.length ? dated[0] : null;
  }, [timepoints]);

  const scored = useMemo(() => {
    return timepoints.map(tp => ({
      tp,
      result: computeScore(tp, baseline && tp.id !== baseline.id ? baseline : null),
    }));
  }, [timepoints, baseline]);

  const chartData = useMemo(() => {
    return scored
      .filter(s => validDate(s.tp.date))
      .sort((a, b) => a.tp.date.localeCompare(b.tp.date))
      .map(s => ({ date: s.tp.date, proxyScore: s.result.proxyScore, tier: s.result.tier, confidence: s.result.confidence, drivers: s.result.drivers }));
  }, [scored]);

  const latest = chartData.length ? chartData[chartData.length - 1] : null;

  const loadDemo = () => {
    setPatient({ patientId: 'DEMO-001', age: '58', sex: 'F', cancerStage: 'III', treatmentType: 'Vaccine + chemo', immunosuppressants: 'None', autoimmuneHx: 'None' });
    setVaccine({ antigen: 'ApoC-1', adjuvant: 'Qβ VLP', injectionSite: 'Left deltoid', notes: 'Phase I trial participant' });
    setTimepoints([
      { ...emptyTP(), date: '2026-02-01', doseNumber: '0 (baseline)', elispotIfng: '40', cd8IfngPct: '0.4', alc: '1.2', crp: '6.0', maxTempF: '98.6', fatigue: '1' },
      { ...emptyTP(), date: '2026-02-10', doseNumber: '1', elispotIfng: '170', cd8IfngPct: '1.7', alc: '1.6', crp: '3.2', maxTempF: '100.2', fatigue: '6', myalgia: '2', chills: '1', injectionSiteRxn: '2' },
      { ...emptyTP(), date: '2026-02-24', doseNumber: '2', elispotIfng: '220', cd8IfngPct: '2.3', alc: '1.8', crp: '2.1', maxTempF: '99.1', fatigue: '3', myalgia: '1', injectionSiteRxn: '1' },
    ]);
  };

  const exportJSON = () => {
    const payload = {
      disclaimer: 'Educational prototype. Not validated. Not for clinical decision-making.',
      patient, vaccine,
      timepoints: scored.map(s => ({
        date: s.tp.date, doseNumber: s.tp.doseNumber,
        raw: { ...s.tp, id: undefined },
        proxyScore: s.result.proxyScore, tier: s.result.tier, confidence: s.result.confidence, drivers: s.result.drivers,
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `tcell-proxy-${patient.patientId || 'export'}.json`;
    a.click();
  };

  const datedCount = timepoints.filter(t => validDate(t.date)).length;

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div>
        <h2 className="vax-section-title">T-Cell Activation Proxy</h2>
        <p className="vax-section-desc">Proxy trend visualization; not diagnostic.</p>
      </div>

      <div className="vax-alert-warning text-[12px] font-medium flex items-start gap-2 p-3 rounded-xl">
        <span>⚠️</span>
        <span>Educational prototype. Not validated. Not for clinical decision-making.</span>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button onClick={addTP} className="vax-btn-primary">+ Add Timepoint</button>
        <button onClick={loadDemo} className="vax-btn-secondary">Load Demo Data</button>
        <button onClick={exportJSON} className="vax-btn-secondary">Export JSON</button>
      </div>

      {/* Chart + Latest Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="vax-card lg:col-span-2">
          <h3 className="font-semibold text-sm mb-3">Proxy Score Trend</h3>
          {datedCount < 2 && (
            <div className="vax-alert-info text-[12px] p-3 rounded-lg mb-3">
              <span>ℹ️ Add at least 2 timepoints with valid dates (YYYY-MM-DD) to render the curve.</span>
            </div>
          )}
          {datedCount >= 2 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <ReferenceLine y={70} stroke="hsl(160,84%,39%)" strokeDasharray="6 3" label={{ value: 'High', position: 'right', fontSize: 10, fill: 'hsl(160,84%,39%)' }} />
                <ReferenceLine y={40} stroke="hsl(38,92%,50%)" strokeDasharray="6 3" label={{ value: 'Moderate', position: 'right', fontSize: 10, fill: 'hsl(38,92%,50%)' }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-card border border-border rounded-lg p-3 text-[12px] shadow-lg max-w-[260px]">
                        <div className="font-semibold">{d.date}</div>
                        <div>Score: <span className="font-bold">{d.proxyScore}</span> — {d.tier}</div>
                        <div className="text-muted-foreground">Confidence: {d.confidence}</div>
                        {d.drivers?.slice(0, 4).map((dr: string, i: number) => <div key={i} className="text-muted-foreground">• {dr}</div>)}
                      </div>
                    );
                  }}
                />
                <Line type="monotone" dataKey="proxyScore" stroke="hsl(221,83%,53%)" strokeWidth={2.5} dot={{ r: 4, fill: 'hsl(221,83%,53%)' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">No chart data yet</div>
          )}
        </div>

        <div className="vax-card">
          <h3 className="font-semibold text-sm mb-3">Latest Summary</h3>
          {latest ? (
            <div className="space-y-3">
              <div className="text-center">
                <div className={`text-4xl font-bold ${latest.proxyScore >= 70 ? 'text-emerald-600' : latest.proxyScore >= 40 ? 'text-amber-600' : 'text-red-500'}`}>{latest.proxyScore}</div>
                <div className="text-[11px] text-muted-foreground mt-1">{latest.date}</div>
              </div>
              <div className="flex justify-center gap-2">
                <span className={`vax-badge ${latest.tier === 'High' ? 'vax-badge-green' : latest.tier === 'Moderate' ? 'vax-badge-amber' : 'vax-badge-red'}`}>{latest.tier} Activation</span>
                <span className={`vax-badge ${latest.confidence === 'High' ? 'vax-badge-blue' : latest.confidence === 'Moderate' ? 'vax-badge-amber' : 'vax-badge-gray'}`}>{latest.confidence} Conf.</span>
              </div>
              <div className="border-t border-border pt-2">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Key Drivers</div>
                {latest.drivers.map((d, i) => <div key={i} className="text-[12px] text-muted-foreground">• {d}</div>)}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No scored timepoints yet.</p>
          )}
        </div>
      </div>

      {/* Patient Baseline */}
      <div className="vax-card">
        <h3 className="font-semibold text-sm mb-4">Patient Baseline</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {([
            ['patientId', 'Patient ID'], ['age', 'Age'], ['sex', 'Sex'], ['cancerStage', 'Cancer Stage'],
            ['treatmentType', 'Treatment'], ['immunosuppressants', 'Immunosuppressants'], ['autoimmuneHx', 'Autoimmune Hx'],
          ] as const).map(([k, label]) => (
            <div key={k}>
              <label className="vax-label">{label}</label>
              <input className="vax-input" value={patient[k]} onChange={e => setPatient(p => ({ ...p, [k]: e.target.value }))} />
            </div>
          ))}
        </div>
      </div>

      {/* Vaccine Details */}
      <div className="vax-card">
        <h3 className="font-semibold text-sm mb-4">Vaccine Details</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div><label className="vax-label">Antigen</label><input className="vax-input" value={vaccine.antigen} onChange={e => setVaccine(v => ({ ...v, antigen: e.target.value }))} /></div>
          <div><label className="vax-label">Adjuvant / Platform</label><input className="vax-input" value={vaccine.adjuvant} onChange={e => setVaccine(v => ({ ...v, adjuvant: e.target.value }))} /></div>
          <div><label className="vax-label">Injection Site</label><input className="vax-input" value={vaccine.injectionSite} onChange={e => setVaccine(v => ({ ...v, injectionSite: e.target.value }))} /></div>
        </div>
        <div className="mt-3">
          <label className="vax-label">Notes</label>
          <textarea className="vax-input min-h-[60px]" value={vaccine.notes} onChange={e => setVaccine(v => ({ ...v, notes: e.target.value }))} />
        </div>
      </div>

      {/* Timepoints */}
      {timepoints.map((tp, idx) => {
        const sr = scored[idx]?.result;
        return (
          <div key={tp.id} className="vax-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Timepoint {idx + 1}</h3>
              <div className="flex items-center gap-2">
                {sr && <span className={`vax-badge ${sr.tier === 'High' ? 'vax-badge-green' : sr.tier === 'Moderate' ? 'vax-badge-amber' : 'vax-badge-red'}`}>Score: {sr.proxyScore}</span>}
                <button onClick={() => removeTP(tp.id)} className="vax-btn-ghost text-destructive text-[12px]">✕ Remove</button>
              </div>
            </div>

            {/* Date / Dose */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Date & Dose</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div><label className="vax-label">Date (YYYY-MM-DD)</label><input className="vax-input" placeholder="2026-01-15" value={tp.date} onChange={e => updateTP(tp.id, 'date', e.target.value)} /></div>
                <div><label className="vax-label">Dose #</label><input className="vax-input" placeholder='0 (baseline)' value={tp.doseNumber} onChange={e => updateTP(tp.id, 'doseNumber', e.target.value)} /></div>
                <div><label className="vax-label">RECIST</label>
                  <select className="vax-input" value={tp.imagingRecist} onChange={e => updateTP(tp.id, 'imagingRecist', e.target.value)}>
                    <option value="">—</option><option>SD</option><option>PR</option><option>CR</option><option>PD</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Direct Immune Assays */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Direct Immune Assays <span className="vax-badge-blue ml-1">High weight</span></div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {([['elispotIfng', 'ELISpot IFN-γ'], ['cd8IfngPct', 'CD8 IFN-γ %'], ['cd4ActivatedPct', 'CD4 Act. %'], ['il2', 'IL-2'], ['tnfAlpha', 'TNF-α']] as const).map(([k, l]) => (
                  <div key={k}><label className="vax-label">{l}</label><input className="vax-input" type="number" value={tp[k]} onChange={e => updateTP(tp.id, k, e.target.value)} /></div>
                ))}
              </div>
            </div>

            {/* General Labs */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">General Labs <span className="vax-badge-amber ml-1">Moderate weight</span></div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {([['alc', 'ALC'], ['crp', 'CRP'], ['esr', 'ESR'], ['wbc', 'WBC'], ['nlr', 'NLR']] as const).map(([k, l]) => (
                  <div key={k}><label className="vax-label">{l}</label><input className="vax-input" type="number" value={tp[k]} onChange={e => updateTP(tp.id, k, e.target.value)} /></div>
                ))}
              </div>
            </div>

            {/* Symptoms */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Reported Symptoms <span className="vax-badge-gray ml-1">Low weight</span></div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div><label className="vax-label">Max Temp (°F)</label><input className="vax-input" type="number" step="0.1" value={tp.maxTempF} onChange={e => updateTP(tp.id, 'maxTempF', e.target.value)} /></div>
                <div><label className="vax-label">Fatigue (0–10)</label><input className="vax-input" type="number" min="0" max="10" value={tp.fatigue} onChange={e => updateTP(tp.id, 'fatigue', e.target.value)} /></div>
                <div><label className="vax-label">Myalgia (0–3)</label><input className="vax-input" type="number" min="0" max="3" value={tp.myalgia} onChange={e => updateTP(tp.id, 'myalgia', e.target.value)} /></div>
                <div><label className="vax-label">Chills (0–3)</label><input className="vax-input" type="number" min="0" max="3" value={tp.chills} onChange={e => updateTP(tp.id, 'chills', e.target.value)} /></div>
                <div><label className="vax-label">Inj. Site Rxn (0–3)</label><input className="vax-input" type="number" min="0" max="3" value={tp.injectionSiteRxn} onChange={e => updateTP(tp.id, 'injectionSiteRxn', e.target.value)} /></div>
              </div>
            </div>

            {/* Confounders */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Confounders</div>
              <div className="flex flex-wrap gap-4">
                {([['steroids', 'Steroids'], ['infectionSymptoms', 'Infection Symptoms'], ['chemoWithin7d', 'Chemo within 7d']] as const).map(([k, l]) => (
                  <label key={k} className="flex items-center gap-2 text-[13px] cursor-pointer">
                    <input type="checkbox" checked={tp[k] as boolean} onChange={e => updateTP(tp.id, k, e.target.checked)} className="rounded border-border" />
                    {l}
                  </label>
                ))}
                {(() => { const c = [tp.steroids, tp.infectionSymptoms, tp.chemoWithin7d].filter(Boolean).length; return c ? <span className="vax-badge-red">Penalty: -{c === 1 ? 5 : c === 2 ? 10 : 15}</span> : null; })()}
              </div>
            </div>

            {/* Tumor Monitoring + Notes */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Tumor Monitoring & Notes</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div><label className="vax-label">Tumor Marker</label><input className="vax-input" placeholder="CA19-9" value={tp.tumorMarker} onChange={e => updateTP(tp.id, 'tumorMarker', e.target.value)} /></div>
                <div><label className="vax-label">Marker Value</label><input className="vax-input" type="number" value={tp.tumorMarkerValue} onChange={e => updateTP(tp.id, 'tumorMarkerValue', e.target.value)} /></div>
                <div><label className="vax-label">Tumor Size Δ%</label><input className="vax-input" type="number" value={tp.tumorSizeChangePct} onChange={e => updateTP(tp.id, 'tumorSizeChangePct', e.target.value)} /></div>
              </div>
              <div className="mt-3">
                <label className="vax-label">Clinician Notes</label>
                <textarea className="vax-input min-h-[50px]" value={tp.clinicianNotes} onChange={e => updateTP(tp.id, 'clinicianNotes', e.target.value)} />
              </div>
            </div>

            {/* Score output */}
            {sr && (
              <div className="bg-muted rounded-lg p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">{sr.proxyScore}</span>
                  <span className={`vax-badge ${sr.tier === 'High' ? 'vax-badge-green' : sr.tier === 'Moderate' ? 'vax-badge-amber' : 'vax-badge-red'}`}>{sr.tier}</span>
                  <span className={`vax-badge ${sr.confidence === 'High' ? 'vax-badge-blue' : sr.confidence === 'Moderate' ? 'vax-badge-amber' : 'vax-badge-gray'}`}>{sr.confidence} Confidence</span>
                </div>
                <div className="text-[11px] text-muted-foreground">{sr.drivers.join(' · ')}</div>
              </div>
            )}
          </div>
        );
      })}

      {timepoints.length === 0 && (
        <div className="vax-card text-center py-10 text-muted-foreground">
          <p className="text-sm">No timepoints yet. Click <strong>"Add Timepoint"</strong> or <strong>"Load Demo Data"</strong> to begin.</p>
        </div>
      )}
    </div>
  );
};

export default TcellProxy;
