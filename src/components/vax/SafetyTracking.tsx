import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis, LineChart, Line } from 'recharts';
import StatCard from './StatCard';
import AlertBox from './AlertBox';
import InfoTooltip from './InfoTooltip';
import { StaggerGrid, StaggerItem } from './MotionWrappers';
import type { SafetyLog } from '@/data/gse62452';
import type { ImmuneMarkerEntry } from '@/data/immuneData';

interface SafetyTrackingProps {
  logs: SafetyLog[];
  setLogs: (logs: SafetyLog[]) => void;
  immuneData: ImmuneMarkerEntry[];
}

const profiles = [
  { id: 'SIM-001', name: 'Patient A', color: '#10b981' },
  { id: 'SIM-002', name: 'Patient B', color: '#f43f5e' },
  { id: 'SIM-003', name: 'Patient C', color: '#3b82f6' },
];

const COLORS = { mild: '#10b981', moderate: '#f59e0b', severe: '#ef4444' };

const formatDate = (d: string) => {
  const dt = new Date(d);
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const SafetyTracking = ({ logs, setLogs, immuneData }: SafetyTrackingProps) => {
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [form, setForm] = useState<{ profile_id: string; dose: number; date: string; symptom: string; severity: 'mild' | 'moderate' | 'severe' }>({ profile_id: 'SIM-001', dose: 1, date: '', symptom: '', severity: 'mild' });

  const hasSevere = logs.some(l => l.severity === 'severe');

  const analytics = useMemo(() => {
    const totalLogs = logs.length;
    const uniquePatients = new Set(logs.map(l => l.profile_id)).size;
    const maxDose = Math.max(...logs.map(l => l.dose), 0);
    const severityCounts = { mild: 0, moderate: 0, severe: 0 };
    logs.forEach(l => severityCounts[l.severity]++);
    const symptomCounts: Record<string, number> = {};
    logs.forEach(l => {
      const s = l.symptom.toLowerCase();
      symptomCounts[s] = (symptomCounts[s] || 0) + 1;
    });
    const topSymptoms = Object.entries(symptomCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([symptom, count]) => ({
        symptom: symptom.charAt(0).toUpperCase() + symptom.slice(1),
        count,
        pct: ((count / totalLogs) * 100).toFixed(0),
      }));
    const byPatient: Record<string, { total: number; mild: number; moderate: number; severe: number }> = {};
    logs.forEach(l => {
      if (!byPatient[l.profile_id]) byPatient[l.profile_id] = { total: 0, mild: 0, moderate: 0, severe: 0 };
      byPatient[l.profile_id].total++;
      byPatient[l.profile_id][l.severity]++;
    });
    return { totalLogs, uniquePatients, maxDose, severityCounts, topSymptoms, byPatient };
  }, [logs]);

  // IgG sparkline data per patient
  const iggSparkData = useMemo(() => {
    const result: Record<string, { date: string; igg: number }[]> = {};
    profiles.forEach(p => {
      result[p.id] = immuneData
        .filter(e => e.profile_id === p.id)
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(e => ({ date: formatDate(e.date), igg: e.igg }));
    });
    return result;
  }, [immuneData]);

  // Concurrent IgG lookup: find closest immune entry for a given patient+date
  const getConcurrentIgg = (profileId: string, date: string): string => {
    const entries = immuneData
      .filter(e => e.profile_id === profileId)
      .sort((a, b) => a.date.localeCompare(b.date));
    if (entries.length === 0) return '—';
    const targetTime = new Date(date).getTime();
    let closest = entries[0];
    let minDiff = Math.abs(new Date(entries[0].date).getTime() - targetTime);
    entries.forEach(e => {
      const diff = Math.abs(new Date(e.date).getTime() - targetTime);
      if (diff < minDiff) { minDiff = diff; closest = e; }
    });
    return closest.igg.toFixed(1);
  };

  const pieData = [
    { name: 'Grade 1 (Mild)', value: analytics.severityCounts.mild },
    { name: 'Grade 2 (Moderate)', value: analytics.severityCounts.moderate },
    { name: 'Grade 3 (Severe)', value: analytics.severityCounts.severe },
  ];

  const scatterData = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(l => ({
    date: l.date,
    dose: l.dose,
    severity: l.severity,
    label: `${l.profile_id}: ${l.symptom} (${l.severity})`,
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLogs([...logs, { ...form, ts: new Date().toISOString() } as SafetyLog]);
    setShowModal(false);
    setForm({ profile_id: 'SIM-001', dose: 1, date: '', symptom: '', severity: 'mild' });
  };

  const exportSafetyTable = () => {
    const { severityCounts, topSymptoms } = analytics;
    let csv = 'Adverse Event,Grade 1 (Mild),Grade 2 (Moderate),Grade 3 (Severe),Total\n';
    topSymptoms.forEach(s => {
      const symptomLogs = logs.filter(l => l.symptom.toLowerCase() === s.symptom.toLowerCase());
      const g1 = symptomLogs.filter(l => l.severity === 'mild').length;
      const g2 = symptomLogs.filter(l => l.severity === 'moderate').length;
      const g3 = symptomLogs.filter(l => l.severity === 'severe').length;
      csv += `${s.symptom},${g1},${g2},${g3},${g1 + g2 + g3}\n`;
    });
    csv += `\nTOTAL,${severityCounts.mild},${severityCounts.moderate},${severityCounts.severe},${logs.length}\n`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'safety_summary.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
        <div>
          <h2 className="vax-section-title flex items-center gap-2">
            Safety Monitoring
            <InfoTooltip term="Safety Monitoring" definition="Systematic tracking and grading of adverse events (side effects) experienced by patients during vaccine trials, using CTCAE standardized criteria." />
          </h2>
          <p className="vax-section-desc">Adverse event tracking and CTCAE grading</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={exportSafetyTable} className="vax-btn-secondary">Export CSV</button>
          <button onClick={() => setShowModal(true)} className="vax-btn-primary">+ Log Event</button>
        </div>
      </div>

      <AlertBox variant="info" icon="ℹ" title="Simulated Data" description="This module demonstrates safety tracking with simulated patient profiles." />

      {hasSevere && (
        <AlertBox variant="error" icon="⚠" title="Severe Event Detected" description="One or more Grade 3 adverse events have been logged." />
      )}

      <StaggerGrid className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <StaggerItem><StatCard label="Total Events" value={analytics.totalLogs} tooltip={{ term: "Total Events", definition: "The total number of adverse events reported across all patients and doses." }} /></StaggerItem>
        <StaggerItem><StatCard label="Patients" value={analytics.uniquePatients} /></StaggerItem>
        <StaggerItem><StatCard label="Max Dose" value={analytics.maxDose || '—'} /></StaggerItem>
        <StaggerItem><StatCard label="Mild (G1)" value={analytics.severityCounts.mild} sub={`${((analytics.severityCounts.mild / analytics.totalLogs) * 100 || 0).toFixed(0)}%`} tooltip={{ term: "CTCAE Grade 1", definition: "Mild adverse events — generally asymptomatic or mild symptoms requiring no intervention (e.g., low-grade fever, mild fatigue)." }} /></StaggerItem>
        <StaggerItem><StatCard label="Moderate+ (G2-3)" value={analytics.severityCounts.moderate + analytics.severityCounts.severe} tooltip={{ term: "CTCAE Grade 2-3", definition: "Grade 2: Moderate symptoms requiring minimal intervention. Grade 3: Severe or medically significant but not life-threatening, may require hospitalization." }} /></StaggerItem>
      </StaggerGrid>

      <div className="vax-tab-bar overflow-x-auto">
        {['dashboard', 'timeline', 'by-patient', 'safety-table'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`vax-tab-btn whitespace-nowrap ${activeTab === tab ? 'active' : ''}`}>
            {tab === 'dashboard' ? 'Dashboard' : tab === 'timeline' ? 'Timeline' : tab === 'by-patient' ? 'By Patient' : 'Safety Table'}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="vax-card">
            <h3 className="font-semibold text-sm mb-4">Adverse Events by Frequency</h3>
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={analytics.topSymptoms} margin={{ top: 5, right: 20, bottom: 5, left: 15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(270,13%,82%)" />
                <XAxis dataKey="symptom" stroke="hsl(270,9%,46%)" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={80} />
                <YAxis stroke="hsl(270,9%,46%)" label={{ value: 'Event Count', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 11, fill: 'hsl(270,9%,46%)' } }} />
                <Tooltip formatter={(value: number) => [typeof value === 'number' ? value.toFixed(0) : value, undefined]} />
                <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: 10 }} />
                <Bar dataKey="count" fill="#3b82f6" name="Event Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="vax-card">
            <h3 className="font-semibold text-sm mb-4">Severity Distribution</h3>
            <ResponsiveContainer width="100%" height={360}>
              <PieChart margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent, midAngle, outerRadius: oR, cx: cxVal, cy: cyVal }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = oR + 28;
                    const x = cxVal + radius * Math.cos(-midAngle * RADIAN);
                    const y = cyVal + radius * Math.sin(-midAngle * RADIAN);
                    return (
                      <text
                        x={x}
                        y={y}
                        textAnchor={x > cxVal ? 'start' : 'end'}
                        dominantBaseline="central"
                        className="fill-foreground"
                        style={{ fontSize: 12, fontWeight: 500 }}
                      >
                        {`${name} ${(percent * 100).toFixed(0)}%`}
                      </text>
                    );
                  }}
                  labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={[COLORS.mild, COLORS.moderate, COLORS.severe][i]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="vax-card">
          <h3 className="font-semibold text-sm mb-4">Adverse Events Timeline</h3>
          <ResponsiveContainer width="100%" height={360}>
            <ScatterChart margin={{ top: 10, right: 20, left: 15, bottom: 35 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(270,13%,82%)" />
              <XAxis dataKey="date" name="Date" stroke="hsl(270,9%,46%)" label={{ value: 'Date', position: 'insideBottom', offset: -5, style: { fontSize: 11, fill: 'hsl(270,9%,46%)' } }} />
              <YAxis dataKey="dose" name="Dose" domain={[0, 4]} stroke="hsl(270,9%,46%)" label={{ value: 'Dose Number', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 11, fill: 'hsl(270,9%,46%)' } }} />
              <ZAxis range={[100, 100]} />
              <Tooltip content={({ payload }) => {
                if (!payload?.length) return null;
                const d = payload[0].payload;
                return <div className="bg-card border border-border rounded-lg p-2 text-xs shadow-lg">{d.label}</div>;
              }} />
              <Scatter data={scatterData.filter(d => d.severity === 'mild')} fill={COLORS.mild} name="Mild" />
              <Scatter data={scatterData.filter(d => d.severity === 'moderate')} fill={COLORS.moderate} name="Moderate" shape="diamond" />
              <Scatter data={scatterData.filter(d => d.severity === 'severe')} fill={COLORS.severe} name="Severe" shape="cross" />
            </ScatterChart>
          </ResponsiveContainer>
          <div className="flex gap-6 justify-center mt-4 pt-4 border-t border-border flex-wrap">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500" /><span className="text-xs text-muted-foreground">Mild</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-amber-500 rotate-45" /><span className="text-xs text-muted-foreground">Moderate</span></div>
            <div className="flex items-center gap-2"><span className="text-red-500 font-bold text-sm">✕</span><span className="text-xs text-muted-foreground">Severe</span></div>
          </div>
        </div>
      )}

      {activeTab === 'by-patient' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map(p => {
            const pData = analytics.byPatient[p.id] || { total: 0, mild: 0, moderate: 0, severe: 0 };
            const pLogs = logs.filter(l => l.profile_id === p.id);
            const sparkData = iggSparkData[p.id] || [];
            return (
              <div key={p.id} className="vax-card">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-semibold">{p.name}</h4>
                    <p className="text-xs text-muted-foreground font-mono">{p.id}</p>
                  </div>
                  <span className="vax-badge-blue">{pData.total} events</span>
                </div>

                {/* IgG Sparkline */}
                {sparkData.length > 0 && (
                  <div className="mb-4">
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">IgG Trend</p>
                    <div className="h-12">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sparkData}>
                          <Line type="monotone" dataKey="igg" stroke={p.color} strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center p-3 rounded-lg bg-emerald-50">
                    <div className="text-xl font-bold text-emerald-600">{pData.mild}</div>
                    <div className="text-xs text-muted-foreground">Mild</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-amber-50">
                    <div className="text-xl font-bold text-amber-600">{pData.moderate}</div>
                    <div className="text-xs text-muted-foreground">Mod</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-red-50">
                    <div className="text-xl font-bold text-red-600">{pData.severe}</div>
                    <div className="text-xs text-muted-foreground">Sev</div>
                  </div>
                </div>
                {pLogs.length > 0 && (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {pLogs.slice(0, 5).map((l, i) => (
                      <div key={i} className="flex justify-between items-center text-xs p-2 rounded bg-muted">
                        <span>Dose {l.dose}: {l.symptom}</span>
                        <span className={l.severity === 'mild' ? 'vax-badge-green' : l.severity === 'moderate' ? 'vax-badge-amber' : 'vax-badge-red'}>{l.severity}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'safety-table' && (
         <div className="vax-card overflow-x-auto">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            Adverse Event Summary — CTCAE Grading
            <InfoTooltip term="CTCAE" definition="Common Terminology Criteria for Adverse Events — a standardized system for grading the severity of adverse effects in clinical trials, ranging from Grade 1 (mild) to Grade 5 (death)." />
          </h3>
          <table>
            <thead>
              <tr>
                <th>Adverse Event</th>
                <th className="text-center">Grade 1 (Mild)</th>
                <th className="text-center">Grade 2 (Moderate)</th>
                <th className="text-center">Grade 3 (Severe)</th>
                <th className="text-center">Total</th>
                <th className="text-center">% Patients</th>
                <th className="text-center">Concurrent IgG <InfoTooltip term="Concurrent IgG" definition="The average IgG antibody level measured at or near the time each adverse event was reported, to assess whether side effects correlate with immune response." /></th>
              </tr>
            </thead>
            <tbody>
              {analytics.topSymptoms.map(s => {
                const symptomLogs = logs.filter(l => l.symptom.toLowerCase() === s.symptom.toLowerCase());
                const g1 = symptomLogs.filter(l => l.severity === 'mild').length;
                const g2 = symptomLogs.filter(l => l.severity === 'moderate').length;
                const g3 = symptomLogs.filter(l => l.severity === 'severe').length;
                const patientsAffected = new Set(symptomLogs.map(l => l.profile_id)).size;
                // Average concurrent IgG across all instances of this symptom
                const iggValues = symptomLogs.map(l => {
                  const val = getConcurrentIgg(l.profile_id, l.date);
                  return val !== '—' ? parseFloat(val) : null;
                }).filter((v): v is number => v !== null);
                const avgIgg = iggValues.length > 0 ? (iggValues.reduce((a, b) => a + b, 0) / iggValues.length).toFixed(1) : '—';
                return (
                  <tr key={s.symptom}>
                    <td>{s.symptom}</td>
                    <td className="text-center text-emerald-600">{g1 || '—'}</td>
                    <td className="text-center text-amber-600">{g2 || '—'}</td>
                    <td className="text-center text-red-600">{g3 || '—'}</td>
                    <td className="text-center font-medium">{s.count}</td>
                    <td className="text-center">{((patientsAffected / analytics.uniquePatients) * 100).toFixed(0)}%</td>
                    <td className="text-center font-mono text-xs">{avgIgg} AU/mL</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border">
                <td className="font-semibold">TOTAL</td>
                <td className="text-center font-semibold text-emerald-600">{analytics.severityCounts.mild}</td>
                <td className="text-center font-semibold text-amber-600">{analytics.severityCounts.moderate}</td>
                <td className="text-center font-semibold text-red-600">{analytics.severityCounts.severe}</td>
                <td className="text-center font-bold">{analytics.totalLogs}</td>
                <td className="text-center">—</td>
                <td className="text-center">—</td>
              </tr>
            </tfoot>
          </table>
          <p className="text-xs text-muted-foreground mt-4">Grading based on CTCAE v5.0 criteria. Concurrent IgG shows average antibody level at the time of each adverse event.</p>
        </div>
      )}

      {showModal && (
        <div className="vax-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="vax-modal" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-semibold mb-5">Log Adverse Event</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="vax-label">Patient</label>
                  <select className="vax-input" value={form.profile_id} onChange={e => setForm({ ...form, profile_id: e.target.value })}>
                    {profiles.map(p => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
                  </select>
                </div>
                <div>
                  <label className="vax-label">Dose Number</label>
                  <input className="vax-input" type="number" min="1" max="10" value={form.dose} onChange={e => setForm({ ...form, dose: parseInt(e.target.value) || 1 })} required />
                </div>
              </div>
              <div>
                <label className="vax-label">Date</label>
                <input className="vax-input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div>
                <label className="vax-label">Symptom / Adverse Event</label>
                <input className="vax-input" type="text" value={form.symptom} onChange={e => setForm({ ...form, symptom: e.target.value })} placeholder="e.g., Injection site pain" required />
              </div>
              <div>
                <label className="vax-label">Severity (CTCAE)</label>
                <select className="vax-input" value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value as 'mild' | 'moderate' | 'severe' })}>
                  <option value="mild">Grade 1 — Mild</option>
                  <option value="moderate">Grade 2 — Moderate</option>
                  <option value="severe">Grade 3 — Severe</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="vax-btn-primary flex-1">Save Event</button>
                <button type="button" onClick={() => setShowModal(false)} className="vax-btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SafetyTracking;
