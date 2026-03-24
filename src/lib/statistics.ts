export const jStat = {
  mean: (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length,
  stdev: (arr: number[]) => {
    const m = jStat.mean(arr);
    return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length);
  },
  pearson: (x: number[], y: number[]) => {
    const n = x.length;
    const mx = jStat.mean(x);
    const my = jStat.mean(y);
    const num = x.reduce((s, xi, i) => s + (xi - mx) * (y[i] - my), 0);
    const d1 = Math.sqrt(x.reduce((s, xi) => s + (xi - mx) ** 2, 0));
    const d2 = Math.sqrt(y.reduce((s, yi) => s + (yi - my) ** 2, 0));
    const r = num / (d1 * d2);
    const t = r * Math.sqrt((n - 2) / (1 - r * r));
    const p = Math.min(Math.exp(-0.5 * t * t) * 2, 1);
    return { r, p };
  },
};

export interface KMPoint {
  t: number;
  S: number;
}

export const kaplanMeier = (times: (number | null)[], events: number[]): KMPoint[] => {
  const data = times
    .map((t, i) => ({ t: t as number, e: events[i] }))
    .filter((d) => d.t != null)
    .sort((a, b) => a.t - b.t);
  let S = 1;
  const curve: KMPoint[] = [{ t: 0, S: 1 }];
  let atRisk = data.length;
  data.forEach((d) => {
    if (d.e === 1) {
      S *= (atRisk - 1) / atRisk;
      curve.push({ t: d.t, S });
    }
    atRisk--;
  });
  return curve;
};

export const logRankTest = (
  t1: (number | null)[],
  e1: number[],
  t2: (number | null)[],
  e2: number[]
) => {
  const all = [
    ...t1.map((t, i) => ({ t: t as number, e: e1[i], g: 0 })),
    ...t2.map((t, i) => ({ t: t as number, e: e2[i], g: 1 })),
  ]
    .filter((d) => d.t != null)
    .sort((a, b) => a.t - b.t);
  let n1 = t1.filter((t) => t != null).length;
  let n2 = t2.filter((t) => t != null).length;
  let O1 = 0;
  let E1 = 0;
  all.forEach((d) => {
    if (d.e === 1) {
      E1 += n1 / (n1 + n2);
      if (d.g === 0) O1++;
    }
    if (d.g === 0) n1--;
    else n2--;
  });
  const V =
    E1 *
    (1 -
      E1 /
        (t1.filter((t) => t != null).length +
          t2.filter((t) => t != null).length)) *
    0.5;
  const chi2 = V > 0 ? (O1 - E1) ** 2 / V : 0;
  return { chi2, p: Math.min(Math.exp(-chi2 / 2), 1) };
};

export interface CoxResult {
  hr: number;
  ci: [number, number];
  p: number;
  beta: number;
}

export const coxPH = (
  times: (number | null)[],
  events: number[],
  x: number[]
): CoxResult => {
  const data = times
    .map((t, i) => ({ t: t as number, e: events[i], x: x[i] }))
    .filter((d) => d.t != null);
  if (data.length < 3) {
    return { hr: 1, ci: [1, 1], p: 1, beta: 0 };
  }
  const mx = jStat.mean(data.map((d) => d.x));
  const sx = jStat.stdev(data.map((d) => d.x));
  // Standardize x to prevent numerical overflow
  const useStd = sx > 0;
  const stdData = data.map(d => ({ ...d, xc: useStd ? (d.x - mx) / sx : d.x - mx }));

  let beta = 0;
  let den = 1;
  for (let iter = 0; iter < 30; iter++) {
    let num = 0;
    den = 0;
    stdData.sort((a, b) => b.t - a.t);
    let riskSum = 0;
    let riskSumX = 0;
    let riskSumX2 = 0;
    stdData.forEach((d) => {
      const w = Math.exp(Math.max(-20, Math.min(20, beta * d.xc)));
      riskSum += w;
      riskSumX += w * d.xc;
      riskSumX2 += w * d.xc ** 2;
      if (d.e === 1) {
        num += d.xc - riskSumX / riskSum;
        den += riskSumX2 / riskSum - (riskSumX / riskSum) ** 2;
      }
    });
    if (Math.abs(den) > 1e-8) {
      const step = num / den;
      beta += Math.max(-2, Math.min(2, step)); // damped step
    }
    // Clamp beta to prevent explosion
    beta = Math.max(-10, Math.min(10, beta));
  }
  // Convert back: beta on standardized scale → original scale
  const betaOrig = useStd ? beta / sx : beta;
  // Clamp final beta to clinically reasonable HR range (~0.05 to ~20)
  const betaClamped = Math.max(-3, Math.min(3, betaOrig));
  const se = Math.abs(den) > 1e-8 ? 1 / Math.sqrt(Math.abs(den)) * (useStd ? 1 / sx : 1) : 0.5;
  const seClamped = Math.min(se, 3); // prevent absurdly wide CIs
  const hr = Math.exp(betaClamped);
  const z = Math.abs(betaClamped) / seClamped;
  const p = Math.min(Math.max(Math.exp((-z * z) / 2) * 2, 0), 1);
  return {
    hr,
    ci: [hr * Math.exp(-1.96 * seClamped), hr * Math.exp(1.96 * seClamped)],
    p,
    beta: betaClamped,
  };
};

export interface MultiCoxResult {
  hr: number | null;
  ci: [number | null, number | null];
  p: number | null;
  n: number;
  beta?: number;
}

export const coxMultivariate = (
  times: (number | null)[],
  events: number[],
  covariates: Record<string, (number | null)[]>
): Record<string, MultiCoxResult> => {
  const results: Record<string, MultiCoxResult> = {};
  Object.entries(covariates).forEach(([name, values]) => {
    const valid = times
      .map((t, i) => ({ t, e: events[i], x: values[i] }))
      .filter((d) => d.t != null && d.x != null) as { t: number; e: number; x: number }[];
    if (valid.length < 5) {
      results[name] = { hr: null, ci: [null, null], p: null, n: valid.length };
      return;
    }
    const res = coxPH(
      valid.map((d) => d.t),
      valid.map((d) => d.e),
      valid.map((d) => d.x)
    );
    results[name] = { ...res, n: valid.length };
  });
  return results;
};
