import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend,
} from 'recharts';
import StatCard from './StatCard';
import AlertBox from './AlertBox';
import type { ImmuneMarkerEntry } from '@/data/immuneData';

interface ImmuneTrackingProps {
  immuneData: ImmuneMarkerEntry[];
  setImmuneData: (data: ImmuneMarkerEntry[]) => void;
}

const profiles = [
  { id: 'SIM-001', name: 'Patient A', color: '#10b981' },
  { id: 'SIM-002', name: 'Patient B', color: '#f43f5e' },
  { id: 'SIM-003', name: 'Patient C', color: '#3b82f6' },
];

const BASELINE_THRESHOLD = 20;

const formatDate = (d: string) => {
  const dt = new Date(d);
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const ImmuneTracking = ({ immuneData, setImmuneData }: ImmuneTrackingProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    profile_id: 'SIM-001',
    date: '',
    dose: 'Dose 1',
    days_since_dose: 0,
    igg: '',
    igm: '',
    cd4: '',
    cd8: '',
    ifn_gamma: '',
    il2: '',
    ca19_9: '',
    notes: '',
  });

  // Stats
  const totalEntries = immuneData.length;
  const uniquePatients = new Set(immuneData.map(e => e.profile_id)).size;
  const latestIgg = useMemo(() => {
    const latest: Record<string, number> = {};
    immuneData.forEach(e => {
      if (!latest[e.profile_id] || e.date > (immuneData.find(x => x.profile_id === e.profile_id && x.igg === latest[e.profile_id])?.date || '')) {
        latest[e.profile_id] = e.igg;
      }
    });
    const vals = Object.values(latest);
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '—';
  }, [immuneData]);

  // Antibody curve chart data — merge all patients onto a unified timeline
  const chartData = useMemo(() => {
    const allDates = [...new Set(immuneData.map(e => e.date))].sort();
    return allDates.map(date => {
      const row: Record<string, string | number | null> = { date: formatDate(date), rawDate: date };
      profiles.forEach(p => {
        const entry = immuneData.find(e => e.profile_id === p.id && e.date === date);
        row[p.id] = entry ? entry.igg : null;
      });
      return row;
    });
  }, [immuneData]);

  // Dose reference lines
  const doseLines = useMemo(() => {
    const lines: { date: string; label: string; color: string }[] = [];
    immuneData.forEach(e => {
      if (e.dose !== '—') {
        const p = profiles.find(pr => pr.id === e.profile_id);
        if (p) {
          lines.push({ date: formatDate(e.date), label: `${p.name} ${e.dose}`, color: p.color });
        }
      }
    });
    // deduplicate by date+label
    const seen = new Set<string>();
    return lines.filter(l => {
      const key = l.date + l.label;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [immuneData]);

  // Decay rate calculations
  const decayMetrics = useMemo(() => {
    return profiles.map(p => {
      const entries = immuneData
        .filter(e => e.profile_id === p.id)
        .sort((a, b) => a.date.localeCompare(b.date));

      if (entries.length < 2) return { ...p, peakIgg: 0, currentIgg: 0, k: 0, halfLife: 0, status: 'N/A' as const };

      const peakIdx = entries.reduce((best, e, i) => e.igg > entries[best].igg ? i : best, 0);
      const peakIgg = entries[peakIdx].igg;
      const currentIgg = entries[entries.length - 1].igg;

      // Get post-peak declining entries (exclude booster rebounds)
      const postPeak = entries.slice(peakIdx).filter((e, i) => i === 0 || (e.dose === '—' && e.igg <= peakIgg));

      let k = 0;
      let halfLife = Infinity;

      if (postPeak.length >= 2) {
        // Linear regression on ln(IgG) vs days
        const t0 = new Date(postPeak[0].date).getTime();
        const points = postPeak.map(e => ({
          days: (new Date(e.date).getTime() - t0) / (1000 * 60 * 60 * 24),
          lnIgg: Math.log(e.igg),
        }));

        const n = points.length;
        const sumX = points.reduce((s, p) => s + p.days, 0);
        const sumY = points.reduce((s, p) => s + p.lnIgg, 0);
        const sumXY = points.reduce((s, p) => s + p.days * p.lnIgg, 0);
        const sumX2 = points.reduce((s, p) => s + p.days * p.days, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        k = -slope;
        halfLife = k > 0 ? Math.LN2 / k : Infinity;
      }

      let status: 'Strong Response' | 'Moderate' | 'Weak/Rapid Decline' | 'N/A' = 'N/A';
      if (halfLife === Infinity || halfLife > 40) status = 'Strong Response';
      else if (halfLife >= 20) status = 'Moderate';
      else status = 'Weak/Rapid Decline';

      return { ...p, peakIgg, currentIgg, k, halfLife, status };
    });
  }, [immuneData]);

  // Alerts
  const alerts = useMemo(() => {
    const result: { variant: 'warning' | 'error'; icon: string; title: string; description: string }[] = [];
    profiles.forEach(p => {
      const entries = immuneData
        .filter(e => e.profile_id === p.id)
        .sort((a, b) => a.date.localeCompare(b.date));
      if (entries.length < 2) return;

      const latest = entries[entries.length - 1];
      const prev = entries[entries.length - 2];

      // CA 19-9 rising above cutoff
      if (latest.ca19_9 > 37 && prev.ca19_9 <= 37) {
        result.push({ variant: 'error', icon: '⚠', title: `CA 19-9 Alert — ${p.name}`, description: `CA 19-9 has risen above clinical cutoff (${latest.ca19_9} U/mL). Consider additional imaging.` });
      }

      // IgG dropping below protective threshold
      if (latest.igg < BASELINE_THRESHOLD && prev.igg >= BASELINE_THRESHOLD) {
        result.push({ variant: 'warning', icon: '⚠', title: `IgG Alert — ${p.name}`, description: `IgG levels declining below protective threshold (${latest.igg} AU/mL). Consider booster dose.` });
      }

      // CD8+ dropping >30% from peak
      const peakCd8 = Math.max(...entries.map(e => e.cd8));
      if (latest.cd8 < peakCd8 * 0.7) {
        result.push({ variant: 'warning', icon: '⚠', title: `T-Cell Alert — ${p.name}`, description: `CD8+ T-cell count declining significantly (${latest.cd8} cells/µL, peak was ${peakCd8}).` });
      }
    });
    return result;
  }, [immuneData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entry: ImmuneMarkerEntry = {
      profile_id: form.profile_id,
      date: form.date,
      dose: form.dose,
      days_since_dose: form.days_since_dose,
      igg: parseFloat(form.igg) || 0,
      igm: form.igm ? parseFloat(form.igm) : null,
      cd4: form.cd4 ? parseFloat(form.cd4) : null,
      cd8: parseFloat(form.cd8) || 0,
      ifn_gamma: parseFloat(form.ifn_gamma) || 0,
      il2: form.il2 ? parseFloat(form.il2) : null,
      ca19_9: parseFloat(form.ca19_9) || 0,
      notes: form.notes,
      ts: new Date().toISOString(),
    };
    setImmuneData([...immuneData, entry]);
    setShowModal(false);
    setForm({ profile_id: 'SIM-001', date: '', dose: 'Dose 1', days_since_dose: 0, igg: '', igm: '', cd4: '', cd8: '', ifn_gamma: '', il2: '', ca19_9: '', notes: '' });
  };

  const statusBadge = (status: string) => {
    if (status === 'Strong Response') return 'vax-badge-green';
    if (status === 'Moderate') return 'vax-badge-amber';
    if (status === 'Weak/Rapid Decline') return 'vax-badge-red';
    return 'vax-badge-gray';
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
        <div>
          <h2 className="vax-section-title">Immune Tracking</h2>
          <p className="vax-section-desc">Antibody production curves, decay analysis, and immune marker monitoring</p>
        </div>
        <button onClick={() => setShowModal(true)} className="vax-btn-primary shrink-0">+ Log Immune Marker</button>
      </div>

      <AlertBox variant="info" icon="ℹ" title="Simulated Data" description="This module tracks immune response markers across 3 simulated patient profiles." />

      {alerts.map((a, i) => (
        <AlertBox key={i} variant={a.variant} icon={a.icon} title={a.title} description={a.description} />
      ))}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <StatCard label="Immune Entries" value={totalEntries} sub={`Across ${uniquePatients} patients`} />
        <StatCard label="Avg IgG Response" value={`${latestIgg}`} sub="AU/mL (latest avg)" />
        <StatCard label="Markers Tracked" value={7} sub="IgG, IgM, CD4, CD8, IFN-γ, IL-2, CA 19-9" />
      </div>

      <div className="vax-tab-bar overflow-x-auto">
        {['overview'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`vax-tab-btn whitespace-nowrap ${activeTab === tab ? 'active' : ''}`}>
            {tab === 'overview' ? 'Overview' : tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Antibody Production Curve */}
          <div className="vax-card">
            <h3 className="font-semibold text-sm mb-4">IgG Antibody Production Curve</h3>
            <ResponsiveContainer width="100%" height={360}>
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis dataKey="date" stroke="#a1a1aa" tick={{ fontSize: 11 }} />
                <YAxis stroke="#a1a1aa" tick={{ fontSize: 11 }} label={{ value: 'IgG (AU/mL)', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#a1a1aa' } }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-card border border-border rounded-lg p-3 text-xs shadow-lg">
                        <div className="font-semibold mb-1">{label}</div>
                        {payload.map((p: any) => {
                          if (p.value == null) return null;
                          const profile = profiles.find(pr => pr.id === p.dataKey);
                          const entry = immuneData.find(e => e.profile_id === p.dataKey && formatDate(e.date) === label);
                          return (
                            <div key={p.dataKey} className="flex items-center gap-2 py-0.5">
                              <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                              <span>{profile?.name}: {p.value} AU/mL</span>
                              {entry && <span className="text-muted-foreground">({entry.days_since_dose}d post-dose)</span>}
                            </div>
                          );
                        })}
                      </div>
                    );
                  }}
                />
                <Legend
                  formatter={(value: string) => {
                    const p = profiles.find(pr => pr.id === value);
                    return p ? p.name : value;
                  }}
                />
                <ReferenceLine y={BASELINE_THRESHOLD} stroke="#a1a1aa" strokeDasharray="6 4" label={{ value: 'Min Protective Level (20 AU/mL)', position: 'insideTopRight', style: { fontSize: 10, fill: '#a1a1aa' } }} />
                {doseLines.slice(0, 12).map((dl, i) => (
                  <ReferenceLine key={i} x={dl.date} stroke={dl.color} strokeDasharray="4 3" strokeOpacity={0.4} />
                ))}
                {profiles.map(p => (
                  <Line
                    key={p.id}
                    dataKey={p.id}
                    stroke={p.color}
                    strokeWidth={2}
                    dot={{ r: 3, fill: p.color }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Decay Rate Calculator */}
          <div className="vax-card overflow-x-auto">
            <h3 className="font-semibold text-sm mb-4">Antibody Decay Rate Analysis</h3>
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th className="text-center">Peak IgG</th>
                  <th className="text-center">Current IgG</th>
                  <th className="text-center">Decay Rate (k)</th>
                  <th className="text-center">Est. Half-Life (days)</th>
                  <th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {decayMetrics.map(m => (
                  <tr key={m.id}>
                    <td className="font-medium">{m.name} <span className="text-muted-foreground font-mono text-xs">({m.id})</span></td>
                    <td className="text-center">{m.peakIgg.toFixed(1)}</td>
                    <td className="text-center">{m.currentIgg.toFixed(1)}</td>
                    <td className="text-center font-mono text-xs">{m.k > 0 ? m.k.toFixed(4) : '—'}</td>
                    <td className="text-center">{m.halfLife === Infinity ? '∞' : m.halfLife.toFixed(1)}</td>
                    <td className="text-center"><span className={statusBadge(m.status)}>{m.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-muted-foreground mt-4">Half-life calculated via exponential decay fit on post-peak IgG values. ln(2)/k where k = −slope of ln(IgG) vs. time.</p>
          </div>
        </div>
      )}

      {/* Entry Modal */}
      {showModal && (
        <div className="vax-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="vax-modal" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-semibold mb-5">Log Immune Marker Entry</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="vax-label">Patient</label>
                  <select className="vax-input" value={form.profile_id} onChange={e => setForm({ ...form, profile_id: e.target.value })}>
                    {profiles.map(p => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
                  </select>
                </div>
                <div>
                  <label className="vax-label">Linked Vaccine Dose</label>
                  <select className="vax-input" value={form.dose} onChange={e => setForm({ ...form, dose: e.target.value })}>
                    <option value="Baseline">Baseline</option>
                    <option value="Dose 1">Dose 1</option>
                    <option value="Dose 2">Dose 2</option>
                    <option value="Dose 3">Dose 3</option>
                    <option value="Booster">Booster</option>
                    <option value="—">— (Follow-up)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="vax-label">Date of Blood Draw</label>
                  <input className="vax-input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                </div>
                <div>
                  <label className="vax-label">Days Since Last Dose</label>
                  <input className="vax-input" type="number" min="0" value={form.days_since_dose} onChange={e => setForm({ ...form, days_since_dose: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="vax-label">IgG (AU/mL) *</label>
                  <input className="vax-input" type="number" step="0.1" value={form.igg} onChange={e => setForm({ ...form, igg: e.target.value })} required />
                </div>
                <div>
                  <label className="vax-label">IgM (AU/mL)</label>
                  <input className="vax-input" type="number" step="0.1" value={form.igm} onChange={e => setForm({ ...form, igm: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="vax-label">CD4+ (cells/µL)</label>
                  <input className="vax-input" type="number" value={form.cd4} onChange={e => setForm({ ...form, cd4: e.target.value })} />
                </div>
                <div>
                  <label className="vax-label">CD8+ (cells/µL) *</label>
                  <input className="vax-input" type="number" value={form.cd8} onChange={e => setForm({ ...form, cd8: e.target.value })} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="vax-label">IFN-γ (pg/mL) *</label>
                  <input className="vax-input" type="number" step="0.1" value={form.ifn_gamma} onChange={e => setForm({ ...form, ifn_gamma: e.target.value })} required />
                </div>
                <div>
                  <label className="vax-label">IL-2 (pg/mL)</label>
                  <input className="vax-input" type="number" step="0.1" value={form.il2} onChange={e => setForm({ ...form, il2: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="vax-label">CA 19-9 (U/mL) *</label>
                <input className="vax-input" type="number" step="0.1" value={form.ca19_9} onChange={e => setForm({ ...form, ca19_9: e.target.value })} required />
              </div>
              <div>
                <label className="vax-label">Notes</label>
                <textarea className="vax-input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Clinician observations..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="vax-btn-primary flex-1">Save Entry</button>
                <button type="button" onClick={() => setShowModal(false)} className="vax-btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImmuneTracking;
