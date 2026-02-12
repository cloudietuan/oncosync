import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend, BarChart, Bar, Area, ComposedChart, ReferenceArea,
} from 'recharts';
import StatCard from './StatCard';
import AlertBox from './AlertBox';
import InfoTooltip from './InfoTooltip';
import { StaggerGrid, StaggerItem } from './MotionWrappers';
import type { ImmuneMarkerEntry } from '@/data/immuneData';
import type { SafetyLog } from '@/data/gse62452';

interface ImmuneTrackingProps {
  immuneData: ImmuneMarkerEntry[];
  setImmuneData: (data: ImmuneMarkerEntry[]) => void;
  logs: SafetyLog[];
}

const profiles = [
  { id: 'SIM-001', name: 'Patient A', color: '#10b981', label: 'Strong Responder' },
  { id: 'SIM-002', name: 'Patient B', color: '#f43f5e', label: 'Weak Responder' },
  { id: 'SIM-003', name: 'Patient C', color: '#3b82f6', label: 'Delayed Responder' },
];

const BASELINE_THRESHOLD = 20;
const CA19_9_CUTOFF = 37;

const formatDate = (d: string) => {
  const dt = new Date(d);
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const ImmuneTracking = ({ immuneData, setImmuneData, logs }: ImmuneTrackingProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showModal, setShowModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState('SIM-001');
  const [form, setForm] = useState({
    profile_id: 'SIM-001', date: '', dose: 'Dose 1', days_since_dose: 0,
    igg: '', igm: '', cd4: '', cd8: '', ifn_gamma: '', il2: '', ca19_9: '', notes: '',
  });

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

  // === Overview data ===
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

  const doseLines = useMemo(() => {
    const lines: { date: string; label: string; color: string }[] = [];
    immuneData.forEach(e => {
      if (e.dose !== '—') {
        const p = profiles.find(pr => pr.id === e.profile_id);
        if (p) lines.push({ date: formatDate(e.date), label: `${p.name} ${e.dose}`, color: p.color });
      }
    });
    const seen = new Set<string>();
    return lines.filter(l => { const key = l.date + l.label; if (seen.has(key)) return false; seen.add(key); return true; });
  }, [immuneData]);

  const decayMetrics = useMemo(() => {
    return profiles.map(p => {
      const entries = immuneData.filter(e => e.profile_id === p.id).sort((a, b) => a.date.localeCompare(b.date));
      if (entries.length < 2) return { ...p, peakIgg: 0, currentIgg: 0, k: 0, halfLife: 0, status: 'N/A' as const };
      const peakIdx = entries.reduce((best, e, i) => e.igg > entries[best].igg ? i : best, 0);
      const peakIgg = entries[peakIdx].igg;
      const currentIgg = entries[entries.length - 1].igg;
      const postPeak = entries.slice(peakIdx).filter((e, i) => i === 0 || (e.dose === '—' && e.igg <= peakIgg));
      let k = 0; let halfLife = Infinity;
      if (postPeak.length >= 2) {
        const t0 = new Date(postPeak[0].date).getTime();
        const points = postPeak.map(e => ({ days: (new Date(e.date).getTime() - t0) / 86400000, lnIgg: Math.log(e.igg) }));
        const n = points.length;
        const sumX = points.reduce((s, pt) => s + pt.days, 0);
        const sumY = points.reduce((s, pt) => s + pt.lnIgg, 0);
        const sumXY = points.reduce((s, pt) => s + pt.days * pt.lnIgg, 0);
        const sumX2 = points.reduce((s, pt) => s + pt.days * pt.days, 0);
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        k = -slope; halfLife = k > 0 ? Math.LN2 / k : Infinity;
      }
      let status: 'Strong Response' | 'Moderate' | 'Weak/Rapid Decline' | 'N/A' = 'N/A';
      if (halfLife === Infinity || halfLife > 40) status = 'Strong Response';
      else if (halfLife >= 20) status = 'Moderate';
      else status = 'Weak/Rapid Decline';
      return { ...p, peakIgg, currentIgg, k, halfLife, status };
    });
  }, [immuneData]);

  // === All Markers data (per selected patient) ===
  const allMarkersData = useMemo(() => {
    return immuneData
      .filter(e => e.profile_id === selectedPatient)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(e => ({
        date: formatDate(e.date),
        igg: e.igg,
        cd8: e.cd8,
        ifn_gamma: e.ifn_gamma,
        ca19_9: e.ca19_9,
      }));
  }, [immuneData, selectedPatient]);

  // === Correlation data ===
  const correlationData = useMemo(() => {
    // Group by week for each patient
    return profiles.map(p => {
      const entries = immuneData.filter(e => e.profile_id === p.id).sort((a, b) => a.date.localeCompare(b.date));
      const pLogs = logs.filter(l => l.profile_id === p.id);
      if (entries.length === 0) return { profile: p, weeklyData: [], correlation: 0, insight: '' };

      const startDate = new Date(entries[0].date).getTime();
      const severityMap: Record<string, number> = { mild: 1, moderate: 2, severe: 3 };

      // Build weekly buckets
      const weeks: Record<number, { iggValues: number[]; severities: number[] }> = {};
      entries.forEach(e => {
        const week = Math.floor((new Date(e.date).getTime() - startDate) / (7 * 86400000));
        if (!weeks[week]) weeks[week] = { iggValues: [], severities: [] };
        weeks[week].iggValues.push(e.igg);
      });
      pLogs.forEach(l => {
        const week = Math.floor((new Date(l.date).getTime() - startDate) / (7 * 86400000));
        if (!weeks[week]) weeks[week] = { iggValues: [], severities: [] };
        weeks[week].severities.push(severityMap[l.severity] || 1);
      });

      const weekKeys = Object.keys(weeks).map(Number).sort((a, b) => a - b);
      const weeklyData = weekKeys.map(w => ({
        week: `Week ${w + 1}`,
        avgIgg: weeks[w].iggValues.length ? weeks[w].iggValues.reduce((a, b) => a + b, 0) / weeks[w].iggValues.length : null,
        avgSeverity: weeks[w].severities.length ? weeks[w].severities.reduce((a, b) => a + b, 0) / weeks[w].severities.length : 0,
      }));

      // Pearson correlation
      const paired = weeklyData.filter(w => w.avgIgg !== null && w.avgSeverity > 0);
      let correlation = 0;
      if (paired.length >= 3) {
        const xs = paired.map(w => w.avgIgg!);
        const ys = paired.map(w => w.avgSeverity);
        const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
        const my = ys.reduce((a, b) => a + b, 0) / ys.length;
        const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
        const denX = Math.sqrt(xs.reduce((s, x) => s + (x - mx) ** 2, 0));
        const denY = Math.sqrt(ys.reduce((s, y) => s + (y - my) ** 2, 0));
        correlation = denX * denY > 0 ? num / (denX * denY) : 0;
      }

      const absR = Math.abs(correlation);
      const direction = correlation > 0 ? 'positive' : 'negative';
      let insight = `${p.name} shows `;
      if (paired.length < 3) {
        insight += 'insufficient overlapping data points for correlation analysis.';
      } else if (absR > 0.6) {
        insight += `a ${direction} correlation (r=${correlation.toFixed(2)}) between immune activation and reported symptoms, suggesting side effects are linked to ${correlation > 0 ? 'a healthy immune response' : 'declining immunity'}.`;
      } else if (absR > 0.3) {
        insight += `a moderate ${direction} correlation (r=${correlation.toFixed(2)}) between IgG changes and symptom severity.`;
      } else {
        insight += `a weak correlation (r=${correlation.toFixed(2)}) between immune markers and symptoms, suggesting side effects may be dose-related rather than response-related.`;
      }

      return { profile: p, weeklyData, correlation, insight };
    });
  }, [immuneData, logs]);

  // === Patient comparison data ===
  const patientComparison = useMemo(() => {
    return profiles.map(p => {
      const entries = immuneData.filter(e => e.profile_id === p.id).sort((a, b) => a.date.localeCompare(b.date));
      const pLogs = logs.filter(l => l.profile_id === p.id);
      const latest = entries[entries.length - 1];
      const prev = entries.length >= 2 ? entries[entries.length - 2] : null;

      let trend: '↑' | '↓' | '→' = '→';
      if (latest && prev) {
        const diff = latest.igg - prev.igg;
        if (diff > 2) trend = '↑';
        else if (diff < -2) trend = '↓';
      }

      const sparkData = entries.map(e => ({ date: formatDate(e.date), igg: e.igg }));

      return {
        ...p,
        currentIgg: latest?.igg ?? 0,
        ca19_9: latest?.ca19_9 ?? 0,
        trend,
        totalSymptoms: pLogs.length,
        sparkData,
      };
    });
  }, [immuneData, logs]);

  // Alerts
  const alerts = useMemo(() => {
    const result: { variant: 'warning' | 'error'; icon: string; title: string; description: string }[] = [];
    profiles.forEach(p => {
      const entries = immuneData.filter(e => e.profile_id === p.id).sort((a, b) => a.date.localeCompare(b.date));
      if (entries.length < 2) return;
      const latest = entries[entries.length - 1];
      const prev = entries[entries.length - 2];
      if (latest.ca19_9 > 37 && prev.ca19_9 <= 37) result.push({ variant: 'error', icon: '⚠', title: `CA 19-9 Alert — ${p.name}`, description: `CA 19-9 has risen above clinical cutoff (${latest.ca19_9} U/mL). Consider additional imaging.` });
      if (latest.igg < BASELINE_THRESHOLD && prev.igg >= BASELINE_THRESHOLD) result.push({ variant: 'warning', icon: '⚠', title: `IgG Alert — ${p.name}`, description: `IgG levels declining below protective threshold (${latest.igg} AU/mL). Consider booster dose.` });
      const peakCd8 = Math.max(...entries.map(e => e.cd8));
      if (latest.cd8 < peakCd8 * 0.7) result.push({ variant: 'warning', icon: '⚠', title: `T-Cell Alert — ${p.name}`, description: `CD8+ T-cell count declining significantly (${latest.cd8} cells/µL, peak was ${peakCd8}).` });
    });
    return result;
  }, [immuneData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entry: ImmuneMarkerEntry = {
      profile_id: form.profile_id, date: form.date, dose: form.dose, days_since_dose: form.days_since_dose,
      igg: parseFloat(form.igg) || 0, igm: form.igm ? parseFloat(form.igm) : null,
      cd4: form.cd4 ? parseFloat(form.cd4) : null, cd8: parseFloat(form.cd8) || 0,
      ifn_gamma: parseFloat(form.ifn_gamma) || 0, il2: form.il2 ? parseFloat(form.il2) : null,
      ca19_9: parseFloat(form.ca19_9) || 0, notes: form.notes, ts: new Date().toISOString(),
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

  const tabLabels: Record<string, string> = { overview: 'Overview', 'all-markers': 'All Markers', correlation: 'Correlation', comparison: 'Patient Comparison' };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
        <div>
          <h2 className="vax-section-title flex items-center gap-2">
            Immune Tracking
            <InfoTooltip term="Immune Tracking" definition="Longitudinal monitoring of humoral and cellular immune markers to assess vaccine-induced immune responses over time." />
          </h2>
          <p className="vax-section-desc">Antibody production curves, decay analysis, and immune marker monitoring</p>
        </div>
        <button onClick={() => setShowModal(true)} className="vax-btn-primary shrink-0">+ Log Immune Marker</button>
      </div>

      <AlertBox variant="info" icon="ℹ" title="Simulated Data" description="This module tracks immune response markers across 3 simulated patient profiles." />
      {alerts.map((a, i) => <AlertBox key={i} variant={a.variant} icon={a.icon} title={a.title} description={a.description} />)}

      <StaggerGrid className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <StaggerItem><StatCard label="Immune Entries" value={totalEntries} sub={`Across ${uniquePatients} patients`} tooltip={{ term: "Immune Entries", definition: "Individual data points recording immune marker levels at a specific date for a given patient." }} /></StaggerItem>
        <StaggerItem><StatCard label="Avg IgG Response" value={`${latestIgg}`} sub="AU/mL (latest avg)" tooltip={{ term: "IgG Response", definition: "Immunoglobulin G — the most abundant antibody class. Rising IgG levels indicate the immune system is mounting a humoral response to the vaccine antigen." }} /></StaggerItem>
        <StaggerItem><StatCard label="Markers Tracked" value={7} sub="IgG, IgM, CD4, CD8, IFN-γ, IL-2, CA 19-9" tooltip={{ term: "Immune Markers", definition: "Blood-based biomarkers: IgG/IgM (antibodies), CD4/CD8 (T-cells), IFN-γ/IL-2 (cytokines), CA 19-9 (tumor marker)." }} /></StaggerItem>
      </StaggerGrid>

      <div className="vax-tab-bar overflow-x-auto">
        {Object.keys(tabLabels).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`vax-tab-btn whitespace-nowrap ${activeTab === tab ? 'active' : ''}`}>
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {/* ===== OVERVIEW SUB-TAB ===== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="vax-card">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">IgG Antibody Production Curve <InfoTooltip term="IgG Production Curve" definition="Tracks how IgG antibody levels change over time after each vaccine dose. A rising curve indicates the immune system is responding to the antigen." /></h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(270,13%,82%)" />
                <XAxis dataKey="date" stroke="hsl(270,9%,46%)" tick={{ fontSize: 11 }} />
                <YAxis stroke="hsl(270,9%,46%)" tick={{ fontSize: 11 }} label={{ value: 'IgG (AU/mL)', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: 'hsl(270,9%,46%)' } }} />
                <Tooltip content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="bg-card border border-border rounded-lg p-3 text-xs shadow-lg">
                      <div className="font-semibold mb-1">{label}</div>
                      {payload.map((pt: any) => {
                        if (pt.value == null) return null;
                        const profile = profiles.find(pr => pr.id === pt.dataKey);
                        const entry = immuneData.find(e => e.profile_id === pt.dataKey && formatDate(e.date) === label);
                        return (
                          <div key={pt.dataKey} className="flex items-center gap-2 py-0.5">
                            <span className="w-2 h-2 rounded-full" style={{ background: pt.color }} />
                            <span>{profile?.name}: {pt.value} AU/mL</span>
                            {entry && <span className="text-muted-foreground">({entry.days_since_dose}d post-dose)</span>}
                          </div>
                        );
                      })}
                    </div>
                  );
                }} />
                <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: 10 }} formatter={(value: string) => { const p = profiles.find(pr => pr.id === value); return p ? p.name : value; }} />
                <ReferenceLine y={BASELINE_THRESHOLD} stroke="hsl(270,9%,46%)" strokeDasharray="6 4" label={{ value: 'Min Protective Level (20 AU/mL)', position: 'insideTopRight', style: { fontSize: 10, fill: 'hsl(270,9%,46%)' } }} />
                {doseLines.slice(0, 12).map((dl, i) => <ReferenceLine key={i} x={dl.date} stroke={dl.color} strokeDasharray="4 3" strokeOpacity={0.4} />)}
                {profiles.map(p => <Line key={p.id} dataKey={p.id} stroke={p.color} strokeWidth={2} dot={{ r: 3, fill: p.color }} activeDot={{ r: 5 }} connectNulls />)}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="vax-card overflow-x-auto">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              Antibody Decay Rate Analysis
              <InfoTooltip term="Decay Rate" definition="The rate at which antibody levels decline after reaching their peak. Calculated using exponential decay fit. Half-life is the time for antibody levels to drop by 50%." />
            </h3>
            <table>
              <thead><tr><th>Patient</th><th className="text-center">Peak IgG</th><th className="text-center">Current IgG</th><th className="text-center">Decay Rate (k) <InfoTooltip term="Decay Constant (k)" definition="The exponential decay constant. Higher k means faster antibody decline. Derived from the slope of ln(IgG) vs time." /></th><th className="text-center">Est. Half-Life (days) <InfoTooltip term="Half-Life" definition="The estimated time (in days) for antibody levels to drop to 50% of peak. Longer half-life indicates more durable immune response." /></th><th className="text-center">Status</th></tr></thead>
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

      {/* ===== ALL MARKERS SUB-TAB ===== */}
      {activeTab === 'all-markers' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <label className="vax-label mb-0">Select Patient</label>
            <select className="vax-input w-auto" value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)}>
              {profiles.map(p => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
            </select>
          </div>

          <div className="vax-card">
            <h3 className="font-semibold text-sm mb-4">Immune Markers — {profiles.find(p => p.id === selectedPatient)?.name}</h3>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={allMarkersData} margin={{ top: 10, right: 60, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(270,13%,82%)" />
                <XAxis dataKey="date" stroke="hsl(270,9%,46%)" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" stroke="#10b981" tick={{ fontSize: 11 }} label={{ value: 'IgG (AU/mL)', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#10b981' } }} />
                <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" tick={{ fontSize: 11 }} label={{ value: 'CD8+ (cells/µL)', angle: 90, position: 'insideRight', style: { fontSize: 10, fill: '#3b82f6' } }} />
                <Tooltip />
                <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: 10 }} />
                <Area yAxisId="left" type="monotone" dataKey="ifn_gamma" name="IFN-γ (pg/mL)" fill="#8b5cf6" fillOpacity={0.15} stroke="#8b5cf6" strokeWidth={1} strokeDasharray="4 2" />
                <Line yAxisId="left" type="monotone" dataKey="igg" name="IgG (AU/mL)" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="right" type="monotone" dataKey="cd8" name="CD8+ (cells/µL)" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="vax-card">
            <h3 className="font-semibold text-sm mb-4">CA 19-9 Tumor Marker — {profiles.find(p => p.id === selectedPatient)?.name}</h3>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={allMarkersData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(270,13%,82%)" />
                <XAxis dataKey="date" stroke="hsl(270,9%,46%)" tick={{ fontSize: 11 }} />
                <YAxis stroke="hsl(270,9%,46%)" tick={{ fontSize: 11 }} domain={[0, 'auto']} label={{ value: 'CA 19-9 (U/mL)', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: 'hsl(270,9%,46%)' } }} />
                <Tooltip />
                <ReferenceArea y1={CA19_9_CUTOFF} y2={200} fill="#ef4444" fillOpacity={0.06} />
                <ReferenceArea y1={0} y2={CA19_9_CUTOFF} fill="#10b981" fillOpacity={0.04} />
                <ReferenceLine y={CA19_9_CUTOFF} stroke="#ef4444" strokeDasharray="6 4" label={{ value: 'Clinical Cutoff (37 U/mL)', position: 'insideTopRight', style: { fontSize: 10, fill: '#ef4444' } }} />
                <Line type="monotone" dataKey="ca19_9" name="CA 19-9 (U/mL)" stroke="#ef4444" strokeWidth={2} dot={{ r: 3, fill: '#ef4444' }} />
              </ComposedChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground mt-2">Values above 37 U/mL (red zone) indicate elevated tumor marker levels. Declining values suggest positive treatment response.</p>
          </div>
        </div>
      )}

      {/* ===== CORRELATION SUB-TAB ===== */}
      {activeTab === 'correlation' && (
        <div className="space-y-6">
          {correlationData.map(({ profile, weeklyData, correlation, insight }) => (
            <div key={profile.id} className="space-y-4">
              <h3 className="font-semibold text-sm">{profile.name} — IgG vs. Symptom Severity</h3>
              <div className="vax-card">
                <ResponsiveContainer width="100%" height={320}>
                  <ComposedChart data={weeklyData} margin={{ top: 10, right: 60, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                    <XAxis dataKey="week" stroke="#a1a1aa" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" stroke={profile.color} tick={{ fontSize: 11 }} label={{ value: 'IgG (AU/mL)', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: profile.color } }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" tick={{ fontSize: 11 }} domain={[0, 3]} label={{ value: 'Severity Score', angle: 90, position: 'insideRight', style: { fontSize: 10, fill: '#f59e0b' } }} />
                    <Tooltip />
                    <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: 10 }} />
                    <Bar yAxisId="right" dataKey="avgSeverity" name="Avg Symptom Severity" fill="#f59e0b" fillOpacity={0.6} barSize={24} />
                    <Line yAxisId="left" type="monotone" dataKey="avgIgg" name="Avg IgG (AU/mL)" stroke={profile.color} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                  </ComposedChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
                  <span className="text-xs font-semibold text-muted-foreground">Pearson r =</span>
                  <span className={`text-sm font-bold ${Math.abs(correlation) > 0.6 ? 'text-emerald-600' : Math.abs(correlation) > 0.3 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                    {correlation.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="vax-card-compact">
                <div className="flex gap-2 items-start">
                  <span className="text-base mt-0.5">💡</span>
                  <p className="text-xs text-muted-foreground leading-relaxed">{insight}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== PATIENT COMPARISON SUB-TAB ===== */}
      {activeTab === 'comparison' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {patientComparison.map(p => (
            <div key={p.id} className="vax-card space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">{p.name}</h4>
                  <p className="text-xs text-muted-foreground font-mono">{p.id}</p>
                </div>
                <span className={statusBadge(p.label)}>{p.label}</span>
              </div>

              {/* Sparkline */}
              <div className="h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={p.sparkData}>
                    <Line type="monotone" dataKey="igg" stroke={p.color} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <div className="text-lg font-bold text-foreground">
                    {p.currentIgg.toFixed(1)}
                    <span className={`text-sm ml-1 ${p.trend === '↑' ? 'text-emerald-600' : p.trend === '↓' ? 'text-red-500' : 'text-muted-foreground'}`}>{p.trend}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">IgG (AU/mL)</div>
                </div>
                <div className={`p-3 rounded-lg text-center ${p.ca19_9 > CA19_9_CUTOFF ? 'bg-red-50' : 'bg-emerald-50'}`}>
                  <div className={`text-lg font-bold ${p.ca19_9 > CA19_9_CUTOFF ? 'text-red-600' : 'text-emerald-600'}`}>{p.ca19_9.toFixed(1)}</div>
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">CA 19-9 (U/mL)</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs p-2 rounded bg-muted">
                <span className="text-muted-foreground">Symptom Events</span>
                <span className="font-semibold">{p.totalSymptoms}</span>
              </div>
            </div>
          ))}
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
                <div><label className="vax-label">IgG (AU/mL) *</label><input className="vax-input" type="number" step="0.1" value={form.igg} onChange={e => setForm({ ...form, igg: e.target.value })} required /></div>
                <div><label className="vax-label">IgM (AU/mL)</label><input className="vax-input" type="number" step="0.1" value={form.igm} onChange={e => setForm({ ...form, igm: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="vax-label">CD4+ (cells/µL)</label><input className="vax-input" type="number" value={form.cd4} onChange={e => setForm({ ...form, cd4: e.target.value })} /></div>
                <div><label className="vax-label">CD8+ (cells/µL) *</label><input className="vax-input" type="number" value={form.cd8} onChange={e => setForm({ ...form, cd8: e.target.value })} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="vax-label">IFN-γ (pg/mL) *</label><input className="vax-input" type="number" step="0.1" value={form.ifn_gamma} onChange={e => setForm({ ...form, ifn_gamma: e.target.value })} required /></div>
                <div><label className="vax-label">IL-2 (pg/mL)</label><input className="vax-input" type="number" step="0.1" value={form.il2} onChange={e => setForm({ ...form, il2: e.target.value })} /></div>
              </div>
              <div><label className="vax-label">CA 19-9 (U/mL) *</label><input className="vax-input" type="number" step="0.1" value={form.ca19_9} onChange={e => setForm({ ...form, ca19_9: e.target.value })} required /></div>
              <div><label className="vax-label">Notes</label><textarea className="vax-input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Clinician observations..." /></div>
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
