export interface ImmuneMarkerEntry {
  profile_id: string;
  date: string;
  dose: string;
  days_since_dose: number;
  igg: number;
  igm: number | null;
  cd4: number | null;
  cd8: number;
  ifn_gamma: number;
  il2: number | null;
  ca19_9: number;
  notes: string;
  ts: string;
}

export const DEMO_IMMUNE_DATA: ImmuneMarkerEntry[] = [
  // Patient A (SIM-001) — Strong Responder
  { profile_id: 'SIM-001', date: '2024-09-28', dose: 'Baseline', days_since_dose: 0, igg: 12.0, igm: null, cd4: null, cd8: 450, ifn_gamma: 15.0, il2: null, ca19_9: 85.0, notes: 'Pre-vaccination baseline', ts: '2024-09-28T09:00:00Z' },
  { profile_id: 'SIM-001', date: '2024-10-08', dose: 'Dose 1', days_since_dose: 10, igg: 28.5, igm: null, cd4: null, cd8: 620, ifn_gamma: 42.0, il2: null, ca19_9: 78.0, notes: 'Initial immune activation observed', ts: '2024-10-08T09:00:00Z' },
  { profile_id: 'SIM-001', date: '2024-10-22', dose: 'Dose 2', days_since_dose: 14, igg: 67.3, igm: null, cd4: null, cd8: 890, ifn_gamma: 98.5, il2: null, ca19_9: 52.0, notes: 'Strong anamnestic response', ts: '2024-10-22T09:00:00Z' },
  { profile_id: 'SIM-001', date: '2024-11-05', dose: 'Dose 3', days_since_dose: 14, igg: 112.0, igm: null, cd4: null, cd8: 1050, ifn_gamma: 145.0, il2: null, ca19_9: 34.0, notes: 'Peak antibody levels reached', ts: '2024-11-05T09:00:00Z' },
  { profile_id: 'SIM-001', date: '2024-11-19', dose: '—', days_since_dose: 14, igg: 95.0, igm: null, cd4: null, cd8: 980, ifn_gamma: 120.0, il2: null, ca19_9: 31.0, notes: 'Expected post-peak decline', ts: '2024-11-19T09:00:00Z' },
  { profile_id: 'SIM-001', date: '2024-12-03', dose: '—', days_since_dose: 28, igg: 78.0, igm: null, cd4: null, cd8: 910, ifn_gamma: 95.0, il2: null, ca19_9: 29.0, notes: 'Steady decline, still above protective threshold', ts: '2024-12-03T09:00:00Z' },
  { profile_id: 'SIM-001', date: '2024-12-17', dose: '—', days_since_dose: 42, igg: 64.0, igm: null, cd4: null, cd8: 850, ifn_gamma: 78.0, il2: null, ca19_9: 28.0, notes: 'Gradual waning, CA 19-9 stable', ts: '2024-12-17T09:00:00Z' },
  { profile_id: 'SIM-001', date: '2025-01-14', dose: 'Booster', days_since_dose: 0, igg: 135.0, igm: null, cd4: null, cd8: 1120, ifn_gamma: 165.0, il2: null, ca19_9: 25.0, notes: 'Booster — robust recall response exceeding initial peak', ts: '2025-01-14T09:00:00Z' },

  // Patient B (SIM-002) — Weak Responder
  { profile_id: 'SIM-002', date: '2024-10-01', dose: 'Baseline', days_since_dose: 0, igg: 10.0, igm: null, cd4: null, cd8: 380, ifn_gamma: 12.0, il2: null, ca19_9: 92.0, notes: 'Pre-vaccination baseline', ts: '2024-10-01T09:00:00Z' },
  { profile_id: 'SIM-002', date: '2024-10-10', dose: 'Dose 1', days_since_dose: 9, igg: 15.2, igm: null, cd4: null, cd8: 420, ifn_gamma: 18.0, il2: null, ca19_9: 89.0, notes: 'Minimal response to first dose', ts: '2024-10-10T09:00:00Z' },
  { profile_id: 'SIM-002', date: '2024-10-24', dose: 'Dose 2', days_since_dose: 14, igg: 22.0, igm: null, cd4: null, cd8: 480, ifn_gamma: 25.0, il2: null, ca19_9: 85.0, notes: 'Modest increase', ts: '2024-10-24T09:00:00Z' },
  { profile_id: 'SIM-002', date: '2024-11-07', dose: 'Dose 3', days_since_dose: 14, igg: 28.5, igm: null, cd4: null, cd8: 510, ifn_gamma: 30.0, il2: null, ca19_9: 82.0, notes: 'Suboptimal peak response', ts: '2024-11-07T09:00:00Z' },
  { profile_id: 'SIM-002', date: '2024-11-21', dose: '—', days_since_dose: 14, igg: 24.0, igm: null, cd4: null, cd8: 470, ifn_gamma: 26.0, il2: null, ca19_9: 84.0, notes: 'Rapid decline beginning', ts: '2024-11-21T09:00:00Z' },
  { profile_id: 'SIM-002', date: '2024-12-05', dose: '—', days_since_dose: 28, igg: 19.0, igm: null, cd4: null, cd8: 430, ifn_gamma: 20.0, il2: null, ca19_9: 88.0, notes: 'Below protective threshold', ts: '2024-12-05T09:00:00Z' },
  { profile_id: 'SIM-002', date: '2024-12-19', dose: '—', days_since_dose: 42, igg: 16.0, igm: null, cd4: null, cd8: 400, ifn_gamma: 17.0, il2: null, ca19_9: 90.0, notes: 'Continued decline, booster recommended', ts: '2024-12-19T09:00:00Z' },

  // Patient C (SIM-003) — Delayed Responder
  { profile_id: 'SIM-003', date: '2024-10-03', dose: 'Baseline', days_since_dose: 0, igg: 11.0, igm: null, cd4: null, cd8: 410, ifn_gamma: 13.0, il2: null, ca19_9: 88.0, notes: 'Pre-vaccination baseline', ts: '2024-10-03T09:00:00Z' },
  { profile_id: 'SIM-003', date: '2024-10-12', dose: 'Dose 1', days_since_dose: 9, igg: 14.0, igm: null, cd4: null, cd8: 430, ifn_gamma: 16.0, il2: null, ca19_9: 86.0, notes: 'Minimal initial response', ts: '2024-10-12T09:00:00Z' },
  { profile_id: 'SIM-003', date: '2024-10-26', dose: 'Dose 2', days_since_dose: 14, igg: 18.5, igm: null, cd4: null, cd8: 460, ifn_gamma: 22.0, il2: null, ca19_9: 83.0, notes: 'Slow build', ts: '2024-10-26T09:00:00Z' },
  { profile_id: 'SIM-003', date: '2024-11-09', dose: 'Dose 3', days_since_dose: 14, igg: 35.0, igm: null, cd4: null, cd8: 580, ifn_gamma: 48.0, il2: null, ca19_9: 68.0, notes: 'Delayed activation beginning', ts: '2024-11-09T09:00:00Z' },
  { profile_id: 'SIM-003', date: '2024-11-23', dose: '—', days_since_dose: 14, igg: 55.0, igm: null, cd4: null, cd8: 720, ifn_gamma: 72.0, il2: null, ca19_9: 55.0, notes: 'Strong delayed response emerging', ts: '2024-11-23T09:00:00Z' },
  { profile_id: 'SIM-003', date: '2024-12-07', dose: '—', days_since_dose: 28, igg: 82.0, igm: null, cd4: null, cd8: 870, ifn_gamma: 105.0, il2: null, ca19_9: 42.0, notes: 'Peak reached — delayed but robust', ts: '2024-12-07T09:00:00Z' },
  { profile_id: 'SIM-003', date: '2024-12-21', dose: '—', days_since_dose: 42, igg: 75.0, igm: null, cd4: null, cd8: 830, ifn_gamma: 92.0, il2: null, ca19_9: 40.0, notes: 'Slow decline, good retention', ts: '2024-12-21T09:00:00Z' },
  { profile_id: 'SIM-003', date: '2025-01-18', dose: 'Booster', days_since_dose: 0, igg: 125.0, igm: null, cd4: null, cd8: 1080, ifn_gamma: 155.0, il2: null, ca19_9: 32.0, notes: 'Booster — excellent recall', ts: '2025-01-18T09:00:00Z' },
];
