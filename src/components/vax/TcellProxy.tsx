import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts';
import InfoTooltip from './InfoTooltip';
import {
  type PatientBaseline, type VaccineDetails, type Timepoint, type TcellProxyState,
  emptyTP, emptyPatient, emptyVaccine, validDate, computeScore,
} from '@/lib/tcellProxy';

/* Scoring engine imported from @/lib/tcellProxy */

/* ──── Collapsible Section ──── */
const Section = ({ title, tag, tagClass, defaultOpen = true, children }: {
  title: string; tag?: string; tagClass?: string; defaultOpen?: boolean; children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-border pt-2">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-1.5 text-left group"
      >
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">{title}</span>
          {tag && <span className={`vax-badge text-[10px] ${tagClass || 'vax-badge-gray'}`}>{tag}</span>}
        </div>
        <span className="text-muted-foreground text-[11px] transition-transform" style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}>▼</span>
      </button>
      {open && <div className="pt-2 pb-1">{children}</div>}
    </div>
  );
};

/* ──── Score Gauge ──── */
const ScoreGauge = ({ score, tier, confidence }: { score: number; tier: string; confidence: string }) => {
  const pct = score / 100;
  const color = tier === 'High' ? 'hsl(160,84%,39%)' : tier === 'Moderate' ? 'hsl(38,92%,50%)' : 'hsl(0,84%,60%)';
  return (
    <div className="flex items-center gap-4">
      <div className="relative w-16 h-16 flex-shrink-0">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(220,13%,91%)" strokeWidth="3" />
          <circle cx="18" cy="18" r="15.9" fill="none" stroke={color} strokeWidth="3"
            strokeDasharray={`${pct * 100} ${100 - pct * 100}`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold" style={{ color }}>{score}</span>
        </div>
      </div>
      <div>
        <span className={`vax-badge ${tier === 'High' ? 'vax-badge-green' : tier === 'Moderate' ? 'vax-badge-amber' : 'vax-badge-red'}`}>{tier}</span>
        <div className="text-[10px] text-muted-foreground mt-0.5">{confidence} confidence</div>
      </div>
    </div>
  );
};

/* ──── Compact Input ──── */
const CI = ({ label, value, onChange, type = 'text', placeholder, min, max, step, className = '' }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; min?: string; max?: string; step?: string; className?: string;
}) => (
  <div className={className}>
    <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">{label}</label>
    <input className="vax-input py-1.5 text-[12px]" type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} min={min} max={max} step={step} />
  </div>
);

/* ──────────────── Main Component ──────────────── */
interface TcellProxyProps {
  initialState?: TcellProxyState;
  onStateChange?: (state: TcellProxyState) => void;
}

const TcellProxy = ({ initialState, onStateChange }: TcellProxyProps) => {
  const [patient, setPatient] = useState<PatientBaseline>(initialState?.patient || emptyPatient());
  const [vaccine, setVaccine] = useState<VaccineDetails>(initialState?.vaccine || emptyVaccine());
  const [timepoints, setTimepoints] = useState<Timepoint[]>(initialState?.timepoints || []);
  const [activeTP, setActiveTP] = useState<string | null>(null);
  const [contextOpen, setContextOpen] = useState(true);

  // Report state changes for persistence
  useEffect(() => {
    onStateChange?.({ patient, vaccine, timepoints });
  }, [patient, vaccine, timepoints, onStateChange]);

  const addTP = () => {
    const tp = emptyTP();
    setTimepoints(p => [...p, tp]);
    setActiveTP(tp.id);
  };
  const removeTP = (id: string) => {
    setTimepoints(p => p.filter(t => t.id !== id));
    setActiveTP(prev => prev === id ? null : prev);
  };
  const updateTP = useCallback((id: string, field: string, value: string | boolean) => {
    setTimepoints(p => p.map(t => t.id === id ? { ...t, [field]: value } : t));
  }, []);

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
  const datedCount = timepoints.filter(t => validDate(t.date)).length;

  const loadDemo = () => {
    setPatient({ patientId: 'DEMO-001', age: '58', sex: 'F', cancerStage: 'III', treatmentType: 'Vaccine + chemo', immunosuppressants: 'None', autoimmuneHx: 'None' });
    setVaccine({ antigen: 'ApoC-1', adjuvant: 'Qβ VLP', injectionSite: 'Left deltoid', notes: 'Phase I trial participant' });
    const tps = [
      { ...emptyTP(), date: '2026-02-01', doseNumber: '0 (baseline)', elispotIfng: '40', cd8IfngPct: '0.4', alc: '1.2', crp: '6.0', maxTempF: '98.6', fatigue: '1' },
      { ...emptyTP(), date: '2026-02-10', doseNumber: '1', elispotIfng: '170', cd8IfngPct: '1.7', alc: '1.6', crp: '3.2', maxTempF: '100.2', fatigue: '6', myalgia: '2', chills: '1', injectionSiteRxn: '2' },
      { ...emptyTP(), date: '2026-02-24', doseNumber: '2', elispotIfng: '220', cd8IfngPct: '2.3', alc: '1.8', crp: '2.1', maxTempF: '99.1', fatigue: '3', myalgia: '1', injectionSiteRxn: '1' },
    ];
    setTimepoints(tps);
    setActiveTP(tps[0].id);
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

  const activeScoredIdx = timepoints.findIndex(t => t.id === activeTP);
  const activeResult = activeScoredIdx >= 0 ? scored[activeScoredIdx] : null;

  return (
    <div className="animate-in">
      {/* ─── Calculator Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">Tc</div>
            <div>
              <h2 className="vax-section-title text-lg flex items-center gap-2">
                T-Cell Activation Proxy
                <InfoTooltip term="T-Cell Activation Proxy" definition="A weighted composite score (0-100) estimating cellular immune activation using direct assays (70%), general labs (20%), and symptoms (10%). Not a direct T-cell measurement — it's a proxy inferred from available markers." />
              </h2>
              <p className="text-[11px] text-muted-foreground">Proxy trend calculator · Not diagnostic</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={addTP} className="vax-btn-primary text-[12px] py-1.5 px-3">+ Timepoint</button>
          <button onClick={loadDemo} className="vax-btn-secondary text-[12px] py-1.5 px-3">Demo Data</button>
          <button onClick={exportJSON} className="vax-btn-secondary text-[12px] py-1.5 px-3">↓ JSON</button>
        </div>
      </div>

      <div className="vax-alert-warning text-[11px] font-medium flex items-center gap-2 p-2.5 rounded-lg mb-4">
        <span>⚠️</span>
        <span>Educational prototype. Not validated. Not for clinical decision-making.</span>
      </div>

      {/* ─── Score Display Strip ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {chartData.map((d, i) => (
          <button
            key={d.date}
            onClick={() => {
              const match = timepoints.find(t => t.date === d.date);
              if (match) setActiveTP(match.id);
            }}
            className={`vax-card-compact text-center transition-all ${
              timepoints.find(t => t.date === d.date)?.id === activeTP ? 'ring-2 ring-primary' : 'hover:border-primary/30'
            }`}
          >
            <div className="text-[10px] text-muted-foreground font-medium">{d.date}</div>
            <div className={`text-2xl font-bold mt-0.5 ${d.proxyScore >= 70 ? 'text-emerald-600' : d.proxyScore >= 40 ? 'text-amber-600' : 'text-red-500'}`}>
              {d.proxyScore}
            </div>
            <div className="flex justify-center gap-1 mt-1">
              <span className={`vax-badge text-[9px] ${d.tier === 'High' ? 'vax-badge-green' : d.tier === 'Moderate' ? 'vax-badge-amber' : 'vax-badge-red'}`}>{d.tier}</span>
              <span className={`vax-badge text-[9px] ${d.confidence === 'High' ? 'vax-badge-blue' : d.confidence === 'Moderate' ? 'vax-badge-amber' : 'vax-badge-gray'}`}>{d.confidence}</span>
            </div>
          </button>
        ))}
        {chartData.length === 0 && (
          <div className="col-span-full vax-card-compact text-center text-muted-foreground text-[12px] py-4">
            No scored timepoints. Add timepoints or load demo data.
          </div>
        )}
      </div>

      {/* ─── Main Layout: Chart + Active Timepoint ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
        {/* Chart */}
        <div className="vax-card lg:col-span-3">
          <h3 className="font-semibold text-[13px] mb-2">Proxy Score Trend</h3>
          {datedCount < 2 ? (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground text-[12px] flex-col gap-2">
              <span className="text-2xl">📊</span>
              <span>Add ≥2 dated timepoints to render curve</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(270,13%,82%)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} width={30} />
                <ReferenceLine y={70} stroke="hsl(160,84%,39%)" strokeDasharray="6 3" />
                <ReferenceLine y={40} stroke="hsl(38,92%,50%)" strokeDasharray="6 3" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-card border border-border rounded-lg p-2.5 text-[11px] shadow-lg max-w-[240px]">
                        <div className="font-semibold">{d.date} — Score: {d.proxyScore} ({d.tier})</div>
                        <div className="text-muted-foreground">Confidence: {d.confidence}</div>
                        {d.drivers?.slice(0, 3).map((dr: string, i: number) => <div key={i} className="text-muted-foreground">• {dr}</div>)}
                      </div>
                    );
                  }}
                />
                <Line type="monotone" dataKey="proxyScore" stroke="hsl(221,83%,53%)" strokeWidth={2.5} dot={{ r: 4, fill: 'hsl(221,83%,53%)' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Latest Summary */}
        <div className="vax-card lg:col-span-2">
          <h3 className="font-semibold text-[13px] mb-3">
            {activeResult ? `Timepoint ${activeScoredIdx + 1} Result` : 'Latest Result'}
          </h3>
          {(activeResult || latest) ? (() => {
            const r = activeResult?.result || { proxyScore: latest!.proxyScore, tier: latest!.tier, confidence: latest!.confidence, drivers: latest!.drivers };
            return (
              <div className="space-y-3">
                <ScoreGauge score={r.proxyScore} tier={r.tier} confidence={r.confidence} />
                <div className="border-t border-border pt-2 space-y-0.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Scoring Breakdown</div>
                  {r.drivers.map((d, i) => (
                    <div key={i} className="text-[11px] text-muted-foreground flex items-start gap-1">
                      <span className="text-primary mt-px">›</span> {d}
                    </div>
                  ))}
                </div>
              </div>
            );
          })() : (
            <div className="text-center py-6 text-muted-foreground text-[12px]">
              <span className="text-2xl block mb-1">🧮</span>
              Enter data to compute proxy score
            </div>
          )}
        </div>
      </div>

      {/* ─── Patient & Vaccine Context (Collapsible) ─── */}
      <div className="vax-card mb-4">
        <button onClick={() => setContextOpen(!contextOpen)} className="w-full flex items-center justify-between">
          <h3 className="font-semibold text-[13px]">Patient & Vaccine Context</h3>
          <span className="text-muted-foreground text-[11px]">{contextOpen ? '▼' : '▶'}</span>
        </button>
        {contextOpen && (
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
              {([
                ['patientId', 'ID'], ['age', 'Age'], ['sex', 'Sex'], ['cancerStage', 'Stage'],
                ['treatmentType', 'Tx Type'], ['immunosuppressants', 'Immunosupp.'], ['autoimmuneHx', 'AI Hx'],
              ] as const).map(([k, label]) => (
                <CI key={k} label={label} value={patient[k]} onChange={v => setPatient(p => ({ ...p, [k]: v }))} />
              ))}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              <CI label="Antigen" value={vaccine.antigen} onChange={v => setVaccine(p => ({ ...p, antigen: v }))} />
              <CI label="Adjuvant" value={vaccine.adjuvant} onChange={v => setVaccine(p => ({ ...p, adjuvant: v }))} />
              <CI label="Inj. Site" value={vaccine.injectionSite} onChange={v => setVaccine(p => ({ ...p, injectionSite: v }))} />
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Notes</label>
                <textarea className="vax-input py-1.5 text-[12px] min-h-[32px]" rows={1} value={vaccine.notes} onChange={e => setVaccine(p => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Timepoint Tabs ─── */}
      {timepoints.length > 0 && (
        <div className="vax-card">
          {/* Tab strip */}
          <div className="flex items-center gap-1 border-b border-border pb-2 mb-3 overflow-x-auto">
            {timepoints.map((tp, idx) => {
              const sr = scored[idx]?.result;
              const isActive = tp.id === activeTP;
              return (
                <button
                  key={tp.id}
                  onClick={() => setActiveTP(tp.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                    isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <span>T{idx + 1}</span>
                  {sr && <span className="ml-1.5 opacity-80">{sr.proxyScore}</span>}
                </button>
              );
            })}
            <button onClick={addTP} className="flex-shrink-0 px-2 py-1.5 rounded-lg text-[12px] text-muted-foreground hover:bg-muted">+</button>
          </div>

          {/* Active timepoint form */}
          {activeTP && (() => {
            const idx = timepoints.findIndex(t => t.id === activeTP);
            if (idx < 0) return null;
            const tp = timepoints[idx];
            const sr = scored[idx]?.result;
            const confCount = [tp.steroids, tp.infectionSymptoms, tp.chemoWithin7d].filter(Boolean).length;

            return (
              <div className="space-y-1">
                {/* Score readout bar */}
                {sr && (
                  <div className="flex items-center justify-between bg-muted rounded-lg px-3 py-2 mb-2">
                    <div className="flex items-center gap-3">
                      <span className={`text-xl font-bold ${sr.proxyScore >= 70 ? 'text-emerald-600' : sr.proxyScore >= 40 ? 'text-amber-600' : 'text-red-500'}`}>{sr.proxyScore}</span>
                      <span className={`vax-badge text-[10px] ${sr.tier === 'High' ? 'vax-badge-green' : sr.tier === 'Moderate' ? 'vax-badge-amber' : 'vax-badge-red'}`}>{sr.tier}</span>
                      <span className={`vax-badge text-[10px] ${sr.confidence === 'High' ? 'vax-badge-blue' : sr.confidence === 'Moderate' ? 'vax-badge-amber' : 'vax-badge-gray'}`}>{sr.confidence}</span>
                    </div>
                    <button onClick={() => removeTP(tp.id)} className="text-[11px] text-destructive hover:underline">Remove</button>
                  </div>
                )}

                {/* Date & Dose — always visible */}
                <div className="grid grid-cols-3 gap-2 pb-2">
                  <CI label="Date (YYYY-MM-DD)" value={tp.date} onChange={v => updateTP(tp.id, 'date', v)} placeholder="2026-01-15" />
                  <CI label="Dose #" value={tp.doseNumber} onChange={v => updateTP(tp.id, 'doseNumber', v)} placeholder="0 (baseline)" />
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">RECIST</label>
                    <select className="vax-input py-1.5 text-[12px]" value={tp.imagingRecist} onChange={e => updateTP(tp.id, 'imagingRecist', e.target.value)}>
                      <option value="">—</option><option>SD</option><option>PR</option><option>CR</option><option>PD</option>
                    </select>
                  </div>
                </div>

                <Section title="Direct Immune Assays" tag="70% weight" tagClass="vax-badge-blue">
                  <div className="grid grid-cols-5 gap-2">
                    <CI label="ELISpot IFN-γ" value={tp.elispotIfng} onChange={v => updateTP(tp.id, 'elispotIfng', v)} type="number" />
                    <CI label="CD8 IFN-γ %" value={tp.cd8IfngPct} onChange={v => updateTP(tp.id, 'cd8IfngPct', v)} type="number" />
                    <CI label="CD4 Act. %" value={tp.cd4ActivatedPct} onChange={v => updateTP(tp.id, 'cd4ActivatedPct', v)} type="number" />
                    <CI label="IL-2" value={tp.il2} onChange={v => updateTP(tp.id, 'il2', v)} type="number" />
                    <CI label="TNF-α" value={tp.tnfAlpha} onChange={v => updateTP(tp.id, 'tnfAlpha', v)} type="number" />
                  </div>
                </Section>

                <Section title="General Labs" tag="20% weight" tagClass="vax-badge-amber">
                  <div className="grid grid-cols-5 gap-2">
                    <CI label="ALC" value={tp.alc} onChange={v => updateTP(tp.id, 'alc', v)} type="number" />
                    <CI label="CRP" value={tp.crp} onChange={v => updateTP(tp.id, 'crp', v)} type="number" />
                    <CI label="ESR" value={tp.esr} onChange={v => updateTP(tp.id, 'esr', v)} type="number" />
                    <CI label="WBC" value={tp.wbc} onChange={v => updateTP(tp.id, 'wbc', v)} type="number" />
                    <CI label="NLR" value={tp.nlr} onChange={v => updateTP(tp.id, 'nlr', v)} type="number" />
                  </div>
                </Section>

                <Section title="Reported Symptoms" tag="10% weight" tagClass="vax-badge-gray">
                  <div className="grid grid-cols-5 gap-2">
                    <CI label="Temp °F" value={tp.maxTempF} onChange={v => updateTP(tp.id, 'maxTempF', v)} type="number" step="0.1" />
                    <CI label="Fatigue 0–10" value={tp.fatigue} onChange={v => updateTP(tp.id, 'fatigue', v)} type="number" min="0" max="10" />
                    <CI label="Myalgia 0–3" value={tp.myalgia} onChange={v => updateTP(tp.id, 'myalgia', v)} type="number" min="0" max="3" />
                    <CI label="Chills 0–3" value={tp.chills} onChange={v => updateTP(tp.id, 'chills', v)} type="number" min="0" max="3" />
                    <CI label="Inj. Site 0–3" value={tp.injectionSiteRxn} onChange={v => updateTP(tp.id, 'injectionSiteRxn', v)} type="number" min="0" max="3" />
                  </div>
                </Section>

                <Section title="Confounders" defaultOpen={confCount > 0}>
                  <div className="flex flex-wrap gap-4 items-center">
                    {([['steroids', 'Steroids'], ['infectionSymptoms', 'Infection'], ['chemoWithin7d', 'Chemo ≤7d']] as const).map(([k, l]) => (
                      <label key={k} className="flex items-center gap-1.5 text-[12px] cursor-pointer">
                        <input type="checkbox" checked={tp[k] as boolean} onChange={e => updateTP(tp.id, k, e.target.checked)} className="rounded border-border w-3.5 h-3.5" />
                        {l}
                      </label>
                    ))}
                    {confCount > 0 && <span className="vax-badge-red text-[10px]">−{confCount === 1 ? 5 : confCount === 2 ? 10 : 15} pts</span>}
                  </div>
                </Section>

                <Section title="Tumor & Notes" defaultOpen={false}>
                  <div className="grid grid-cols-4 gap-2">
                    <CI label="Marker" value={tp.tumorMarker} onChange={v => updateTP(tp.id, 'tumorMarker', v)} placeholder="CA19-9" />
                    <CI label="Value" value={tp.tumorMarkerValue} onChange={v => updateTP(tp.id, 'tumorMarkerValue', v)} type="number" />
                    <CI label="Size Δ%" value={tp.tumorSizeChangePct} onChange={v => updateTP(tp.id, 'tumorSizeChangePct', v)} type="number" />
                    <div></div>
                  </div>
                  <div className="mt-2">
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Notes</label>
                    <textarea className="vax-input py-1.5 text-[12px] min-h-[40px]" rows={2} value={tp.clinicianNotes} onChange={e => updateTP(tp.id, 'clinicianNotes', e.target.value)} />
                  </div>
                </Section>
              </div>
            );
          })()}
        </div>
      )}

      {timepoints.length === 0 && (
        <div className="vax-card text-center py-8 text-muted-foreground">
          <div className="text-3xl mb-2">🧮</div>
          <p className="text-[13px] font-medium">T-Cell Activation Calculator</p>
          <p className="text-[11px] mt-1">Click <strong>+ Timepoint</strong> or <strong>Demo Data</strong> to begin computing proxy scores.</p>
        </div>
      )}
    </div>
  );
};

export default TcellProxy;
