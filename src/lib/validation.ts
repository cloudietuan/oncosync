/* Validation & benchmarking utilities for T-Cell Proxy */

export interface ValidationRow {
  proxyScore: number;
  outcome: number; // 1 = responder/event, 0 = non-responder/censored
  label?: string;
}

/** Sort by descending score, compute TP/FP/TN/FN at every threshold */
export interface ROCPoint {
  threshold: number;
  tpr: number; // sensitivity
  fpr: number; // 1 - specificity
}

export function computeROC(rows: ValidationRow[]): { curve: ROCPoint[]; auc: number } {
  const sorted = [...rows].sort((a, b) => b.proxyScore - a.proxyScore);
  const P = rows.filter(r => r.outcome === 1).length;
  const N = rows.length - P;
  if (P === 0 || N === 0) return { curve: [{ threshold: 100, tpr: 0, fpr: 0 }, { threshold: 0, tpr: 1, fpr: 1 }], auc: 0.5 };

  const curve: ROCPoint[] = [{ threshold: 101, tpr: 0, fpr: 0 }];
  let tp = 0, fp = 0;

  for (const row of sorted) {
    if (row.outcome === 1) tp++;
    else fp++;
    curve.push({ threshold: row.proxyScore, tpr: tp / P, fpr: fp / N });
  }

  // AUC via trapezoidal rule
  let auc = 0;
  for (let i = 1; i < curve.length; i++) {
    auc += (curve[i].fpr - curve[i - 1].fpr) * (curve[i].tpr + curve[i - 1].tpr) / 2;
  }

  return { curve, auc: Math.max(0, Math.min(1, auc)) };
}

export interface ConfusionMetrics {
  threshold: number;
  sensitivity: number;
  specificity: number;
  ppv: number;
  npv: number;
  accuracy: number;
  tp: number; fp: number; tn: number; fn: number;
}

export function computeConfusionAtThreshold(rows: ValidationRow[], threshold: number): ConfusionMetrics {
  let tp = 0, fp = 0, tn = 0, fn = 0;
  for (const r of rows) {
    const predicted = r.proxyScore >= threshold ? 1 : 0;
    if (predicted === 1 && r.outcome === 1) tp++;
    else if (predicted === 1 && r.outcome === 0) fp++;
    else if (predicted === 0 && r.outcome === 0) tn++;
    else fn++;
  }
  const sensitivity = tp + fn > 0 ? tp / (tp + fn) : 0;
  const specificity = tn + fp > 0 ? tn / (tn + fp) : 0;
  const ppv = tp + fp > 0 ? tp / (tp + fp) : 0;
  const npv = tn + fn > 0 ? tn / (tn + fn) : 0;
  const accuracy = rows.length > 0 ? (tp + tn) / rows.length : 0;
  return { threshold, sensitivity, specificity, ppv, npv, accuracy, tp, fp, tn, fn };
}

/** Find optimal threshold (Youden's J) */
export function findOptimalThreshold(rows: ValidationRow[]): number {
  const { curve } = computeROC(rows);
  let best = 50, bestJ = -1;
  for (const pt of curve) {
    const j = pt.tpr - pt.fpr;
    if (j > bestJ) { bestJ = j; best = pt.threshold; }
  }
  return best;
}

export interface CalibrationBin {
  tier: string;
  predicted: number; // mean proxy score in bin
  actual: number;    // actual response rate
  count: number;
}

export function computeCalibration(rows: ValidationRow[]): CalibrationBin[] {
  const bins = [
    { tier: 'Low (0-39)', min: 0, max: 40 },
    { tier: 'Moderate (40-69)', min: 40, max: 70 },
    { tier: 'High (70-100)', min: 70, max: 101 },
  ];
  return bins.map(b => {
    const inBin = rows.filter(r => r.proxyScore >= b.min && r.proxyScore < b.max);
    const count = inBin.length;
    const predicted = count > 0 ? inBin.reduce((s, r) => s + r.proxyScore, 0) / count : (b.min + b.max) / 2;
    const actual = count > 0 ? (inBin.filter(r => r.outcome === 1).length / count) * 100 : 0;
    return { tier: b.tier, predicted, actual, count };
  });
}
