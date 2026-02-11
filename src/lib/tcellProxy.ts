/* Shared types and scoring for T-Cell Proxy */

export interface PatientBaseline {
  patientId: string; age: string; sex: string; cancerStage: string;
  treatmentType: string; immunosuppressants: string; autoimmuneHx: string;
}

export interface VaccineDetails {
  antigen: string; adjuvant: string; injectionSite: string; notes: string;
}

export interface Timepoint {
  id: string;
  date: string; doseNumber: string;
  elispotIfng: string; cd8IfngPct: string; cd4ActivatedPct: string; il2: string; tnfAlpha: string;
  alc: string; crp: string; esr: string; wbc: string; nlr: string;
  maxTempF: string; fatigue: string; myalgia: string; chills: string; injectionSiteRxn: string;
  steroids: boolean; infectionSymptoms: boolean; chemoWithin7d: boolean;
  imagingRecist: string; tumorMarker: string; tumorMarkerValue: string; tumorSizeChangePct: string;
  clinicianNotes: string;
}

export interface ScoreResult {
  proxyScore: number; tier: string; confidence: string; drivers: string[];
}

export interface TcellProxyState {
  patient: PatientBaseline;
  vaccine: VaccineDetails;
  timepoints: Timepoint[];
}

export const emptyPatient = (): PatientBaseline => ({
  patientId: '', age: '', sex: '', cancerStage: '', treatmentType: '', immunosuppressants: '', autoimmuneHx: '',
});

export const emptyVaccine = (): VaccineDetails => ({ antigen: '', adjuvant: '', injectionSite: '', notes: '' });

export const emptyTP = (): Timepoint => ({
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
export const validDate = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d);

export function computeScore(tp: Timepoint, baseline: Timepoint | null): ScoreResult {
  const drivers: string[] = [];
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

  const labScores: number[] = [];
  const alcV = num(tp.alc);
  if (alcV !== null) { const s = clamp(((alcV - 0.5) / 3.0) * 100); labScores.push(s); drivers.push(`ALC ${alcV} → ${s.toFixed(0)}`); }
  const crpV = num(tp.crp);
  if (crpV !== null) { const s = clamp(100 - (crpV / 20) * 100); labScores.push(s); drivers.push(`CRP ${crpV} → ${s.toFixed(0)}`); }
  const labAvg = labScores.length ? labScores.reduce((a, b) => a + b, 0) / labScores.length : null;

  const sympScores: number[] = [];
  const temp = num(tp.maxTempF);
  if (temp !== null) { const s = clamp(((temp - 98.6) / 3.0) * 100); sympScores.push(s); drivers.push(`Temp ${temp}°F → ${s.toFixed(0)}`); }
  const fat = num(tp.fatigue);
  if (fat !== null) { const s = clamp((fat / 10) * 100); sympScores.push(s); drivers.push(`Fatigue ${fat}/10`); }
  const mya = num(tp.myalgia); const chi = num(tp.chills); const site = num(tp.injectionSiteRxn);
  const aches = [mya, chi, site].filter(v => v !== null) as number[];
  if (aches.length) { const s = clamp((aches.reduce((a, b) => a + b, 0) / (aches.length * 3)) * 100); sympScores.push(s); }
  const sympAvg = sympScores.length ? sympScores.reduce((a, b) => a + b, 0) / sympScores.length : null;

  const parts: { w: number; v: number }[] = [];
  if (primaryAvg !== null) parts.push({ w: 70, v: primaryAvg });
  if (labAvg !== null) parts.push({ w: 20, v: labAvg });
  if (sympAvg !== null) parts.push({ w: 10, v: sympAvg });

  let score = 50;
  if (parts.length) {
    const totalW = parts.reduce((a, p) => a + p.w, 0);
    score = parts.reduce((a, p) => a + (p.w / totalW) * p.v, 0);
  }

  const confCount = [tp.steroids, tp.infectionSymptoms, tp.chemoWithin7d].filter(Boolean).length;
  const penalty = confCount === 0 ? 0 : confCount === 1 ? 5 : confCount === 2 ? 10 : 15;
  if (penalty) drivers.push(`Confounder penalty: -${penalty}`);
  score = clamp(score - penalty);

  const hasAssay = elispot !== null || cd8 !== null;
  const hasLab = alcV !== null || crpV !== null;
  const confidence = hasAssay && hasLab ? 'High' : (hasAssay || hasLab) ? 'Moderate' : 'Low';
  const tier = score >= 70 ? 'High' : score >= 40 ? 'Moderate' : 'Low';
  return { proxyScore: Math.round(score), tier, confidence, drivers };
}

export function computeAllScores(timepoints: Timepoint[]) {
  const dated = timepoints.filter(t => validDate(t.date)).sort((a, b) => a.date.localeCompare(b.date));
  const baseline = dated.length ? dated[0] : null;
  return timepoints.map(tp => ({
    tp,
    result: computeScore(tp, baseline && tp.id !== baseline.id ? baseline : null),
  }));
}
