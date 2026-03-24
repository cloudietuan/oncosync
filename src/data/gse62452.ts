export const GSE62452_GENES = ['APOC1','CD8A','PDCD1','CD274','PRF1','GZMA','CTLA4','CXCL9','IL10','TGFB1'];

export const GSE62452_SAMPLES = ['P001','P003','P005','P007','P009','P011','P013','P015','P017','P019','P021','P023','P025','P027','P029','P031','P033','P035','P037','P039','P041','P043','P045','P047','P049','P051','P053','P055','P057','P059'];

export const GSE62452_EXPR = [
  [1.33,2.92,2.04,2.98,1.95,2.29,2.49,2.26,1.44,2.86,2.55,1.78,1.51,3.15,2.35,1.98,2.65,1.56,1.73,1.79,2.41,2.92,1.60,2.68,1.88,2.85,2.02,2.10,2.10,2.75],
  [5.69,6.08,6.08,5.58,5.80,5.92,5.86,5.21,5.91,5.87,5.80,5.29,5.39,5.74,5.18,5.43,5.80,5.03,5.76,5.72,5.94,5.57,6.47,5.65,4.97,5.10,6.01,6.91,5.69,6.13],
  [4.26,3.18,2.67,2.94,3.30,3.99,2.82,3.58,4.32,4.64,3.91,4.10,3.72,2.95,4.77,4.56,3.35,2.83,4.38,3.91,4.72,3.88,4.78,3.96,3.33,3.86,3.95,4.38,4.27,3.82],
  [5.02,5.11,4.66,4.88,5.19,5.25,5.13,4.98,5.27,5.70,5.27,5.58,5.11,4.90,5.87,5.25,5.53,5.60,5.13,5.43,5.36,5.22,5.42,5.54,5.41,5.03,5.36,5.62,4.87,5.19],
  [5.40,5.58,5.88,5.10,5.79,5.77,5.85,5.20,5.91,5.86,5.80,5.29,5.39,5.74,5.18,5.44,5.80,5.04,5.76,5.72,5.94,5.57,6.47,5.65,4.97,5.11,6.01,6.91,5.69,6.13],
  [5.35,5.58,5.88,5.39,5.38,5.41,5.44,5.57,5.99,5.87,5.37,5.56,5.10,5.74,5.09,5.58,5.93,5.03,5.81,5.36,5.87,5.56,6.47,5.83,5.40,5.10,5.35,5.61,5.11,5.27],
  [2.81,2.48,2.46,2.68,2.55,2.66,2.47,2.97,2.58,2.53,2.86,2.77,2.65,2.84,2.84,2.47,2.48,2.80,2.38,2.68,2.56,2.47,2.46,2.41,2.45,2.52,2.66,2.77,2.49,2.76],
  [2.43,2.17,2.05,2.55,2.44,2.32,2.41,2.68,2.14,2.06,2.59,2.16,2.25,2.38,2.22,2.32,2.17,1.98,2.17,2.24,3.07,2.66,2.90,2.34,2.30,2.20,2.32,2.15,2.64,2.56],
  [2.16,1.85,1.93,2.37,2.30,2.05,2.07,2.35,2.08,2.01,1.95,2.05,2.09,2.25,2.01,2.08,2.09,1.98,2.02,2.00,1.76,2.20,2.05,2.11,2.15,2.00,2.08,2.10,2.17,2.00],
  [5.74,5.92,5.07,5.78,5.23,5.86,6.08,5.56,5.71,5.02,5.92,5.32,5.45,5.23,5.62,5.51,5.29,5.59,5.54,5.45,5.62,5.70,5.80,5.72,5.41,5.46,5.74,5.79,5.53,5.53]
];

export interface ClinicalRecord {
  sample_id: string;
  time_to_event_days: number | null;
  event: number;
  age: number | null;
  sex: string | null;
  stage: string | null;
}

export const GSE62452_CLIN: ClinicalRecord[] = [
  {sample_id:'P001',time_to_event_days:1533,event:1,age:null,sex:null,stage:'IIA'},
  {sample_id:'P003',time_to_event_days:81,event:1,age:null,sex:null,stage:'III'},
  {sample_id:'P005',time_to_event_days:null,event:0,age:null,sex:null,stage:'IIA'},
  {sample_id:'P007',time_to_event_days:72,event:1,age:null,sex:null,stage:'III'},
  {sample_id:'P009',time_to_event_days:null,event:0,age:null,sex:null,stage:'III'},
  {sample_id:'P011',time_to_event_days:585,event:1,age:null,sex:null,stage:'III'},
  {sample_id:'P013',time_to_event_days:378,event:1,age:null,sex:null,stage:'III'},
  {sample_id:'P015',time_to_event_days:480,event:1,age:null,sex:null,stage:'III'},
  {sample_id:'P017',time_to_event_days:1227,event:1,age:null,sex:null,stage:'III'},
  {sample_id:'P019',time_to_event_days:84,event:1,age:null,sex:null,stage:'III'},
  {sample_id:'P021',time_to_event_days:348,event:1,age:null,sex:null,stage:'III'},
  {sample_id:'P023',time_to_event_days:741,event:1,age:null,sex:null,stage:'III'},
  {sample_id:'P025',time_to_event_days:1200,event:1,age:null,sex:null,stage:'III'},
  {sample_id:'P027',time_to_event_days:36,event:1,age:null,sex:null,stage:'IVA'},
  {sample_id:'P029',time_to_event_days:396,event:1,age:null,sex:null,stage:'IVA'},
  {sample_id:'P031',time_to_event_days:696,event:1,age:null,sex:null,stage:'III'},
  {sample_id:'P033',time_to_event_days:324,event:1,age:null,sex:null,stage:'III'},
  {sample_id:'P035',time_to_event_days:870,event:1,age:null,sex:null,stage:'IVA'},
  {sample_id:'P037',time_to_event_days:831,event:1,age:null,sex:null,stage:'IVA'},
  {sample_id:'P039',time_to_event_days:828,event:1,age:null,sex:null,stage:'III'},
  {sample_id:'P041',time_to_event_days:414,event:1,age:null,sex:null,stage:'III'},
  {sample_id:'P043',time_to_event_days:204,event:1,age:null,sex:null,stage:'IVB'},
  {sample_id:'P045',time_to_event_days:846,event:1,age:null,sex:null,stage:'IVB'},
  {sample_id:'P047',time_to_event_days:294,event:1,age:null,sex:null,stage:'III'},
  {sample_id:'P049',time_to_event_days:708,event:1,age:null,sex:null,stage:'III'},
  {sample_id:'P051',time_to_event_days:231,event:1,age:null,sex:null,stage:'III'},
  {sample_id:'P053',time_to_event_days:654,event:1,age:null,sex:null,stage:'IIA'},
  {sample_id:'P055',time_to_event_days:636,event:1,age:null,sex:null,stage:'IIA'},
  {sample_id:'P057',time_to_event_days:633,event:1,age:null,sex:null,stage:'IIB'},
  {sample_id:'P059',time_to_event_days:267,event:1,age:null,sex:null,stage:'IIB'}
];

export interface Batch {
  id: string;
  date: string;
  volume: number;
  iptg: number;
  hours: number;
  gel: boolean;
  sds: number | string;
  linker: string;
  peptide: string;
  status: string;
  notes: string;
}

export const DEMO_BATCHES: Batch[] = [
  { id:'QB-2024-001', date:'2024-09-15', volume:500, iptg:0.5, hours:4, gel:true, sds:2.8, linker:'SMPH', peptide:'v2', status:'completed', notes:'Pilot batch' },
  { id:'QB-2024-002', date:'2024-10-22', volume:1000, iptg:1.0, hours:5, gel:true, sds:3.2, linker:'SMPH', peptide:'v2', status:'completed', notes:'Scale-up' },
  { id:'QB-2024-003', date:'2024-11-30', volume:2000, iptg:1.5, hours:5, gel:true, sds:3.5, linker:'SMPH', peptide:'v3', status:'in_progress', notes:'Production batch' }
];

export interface SafetyLog {
  profile_id: string;
  dose: number;
  date: string;
  symptom: string;
  severity: 'mild' | 'moderate' | 'severe';
  ts: string;
}

export const DEMO_LOGS: SafetyLog[] = [
  { profile_id:'SIM-001', dose:1, date:'2024-10-01', symptom:'Injection site pain', severity:'mild', ts:'2024-10-01T10:00:00Z' },
  { profile_id:'SIM-001', dose:1, date:'2024-10-01', symptom:'Fatigue', severity:'mild', ts:'2024-10-01T18:00:00Z' },
  { profile_id:'SIM-001', dose:2, date:'2024-10-15', symptom:'Headache', severity:'mild', ts:'2024-10-15T14:00:00Z' },
  { profile_id:'SIM-001', dose:3, date:'2024-10-29', symptom:'Injection site swelling', severity:'moderate', ts:'2024-10-29T11:00:00Z' },
  { profile_id:'SIM-002', dose:1, date:'2024-10-03', symptom:'Fatigue', severity:'mild', ts:'2024-10-03T09:00:00Z' },
  { profile_id:'SIM-002', dose:1, date:'2024-10-03', symptom:'Myalgia', severity:'mild', ts:'2024-10-03T20:00:00Z' },
  { profile_id:'SIM-002', dose:2, date:'2024-10-17', symptom:'Fever', severity:'moderate', ts:'2024-10-17T22:00:00Z' },
  { profile_id:'SIM-002', dose:3, date:'2024-10-31', symptom:'Injection site pain', severity:'mild', ts:'2024-10-31T10:00:00Z' },
  { profile_id:'SIM-003', dose:1, date:'2024-10-05', symptom:'Headache', severity:'mild', ts:'2024-10-05T16:00:00Z' },
  { profile_id:'SIM-003', dose:2, date:'2024-10-19', symptom:'Nausea', severity:'moderate', ts:'2024-10-19T08:00:00Z' },
  { profile_id:'SIM-003', dose:2, date:'2024-10-19', symptom:'Fatigue', severity:'severe', ts:'2024-10-19T12:00:00Z' },
  { profile_id:'SIM-003', dose:3, date:'2024-11-02', symptom:'Injection site pain', severity:'mild', ts:'2024-11-02T10:00:00Z' }
];

export interface ExpressionData {
  genes: string[];
  samples: string[];
  values: number[][];
  fileName?: string;
}
