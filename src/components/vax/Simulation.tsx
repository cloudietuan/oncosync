import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AlertBox from './AlertBox';
import { jStat } from '@/lib/statistics';
import type { ExpressionData, ClinicalRecord } from '@/data/gse62452';

interface SimulationProps {
  expr: ExpressionData | null;
  clin: ClinicalRecord[] | null;
}

interface SimResults {
  meanBenefit: number;
  ci: [number, number];
  histogram: { bin: string; count: number }[];
  responders: number;
  total: number;
}

const Simulation = ({ expr, clin }: SimulationProps) => {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<SimResults | null>(null);
  const [params, setParams] = useState({ efficacy: 0.35, nBootstrap: 500, responseBias: 0.6 });

  const runSimulation = () => {
    if (!expr || !clin) return;
    setRunning(true);
    setTimeout(() => {
      const geneIdx = expr.genes.findIndex(g => g.toUpperCase() === 'APOC1');
      const geneExpr = geneIdx >= 0 ? expr.values[geneIdx] : expr.values[0];
      const threshold = [...geneExpr].sort((a, b) => a - b)[Math.floor(geneExpr.length / 2)];
      const validClin = clin.filter(c => c.time_to_event_days != null && expr.samples.includes(c.sample_id));
      const bootstrapResults: number[] = [];

      for (let b = 0; b < params.nBootstrap; b++) {
        let treatedBenefit = 0;
        let n = 0;
        validClin.forEach(c => {
          const idx = expr.samples.indexOf(c.sample_id);
          const exprVal = geneExpr[idx];
          const isHighExpr = exprVal >= threshold;
          const responseProb = isHighExpr ? params.responseBias : (1 - params.responseBias);
          if (Math.random() < responseProb) {
            const benefit = c.time_to_event_days! * params.efficacy * (0.5 + Math.random());
            treatedBenefit += benefit;
            n++;
          }
        });
        bootstrapResults.push(n > 0 ? treatedBenefit / n : 0);
      }

      bootstrapResults.sort((a, b) => a - b);
      const meanBenefit = jStat.mean(bootstrapResults);
      const ci: [number, number] = [
        bootstrapResults[Math.floor(params.nBootstrap * 0.025)],
        bootstrapResults[Math.floor(params.nBootstrap * 0.975)]
      ];

      const min = bootstrapResults[0];
      const max = bootstrapResults[bootstrapResults.length - 1];
      const binCount = 30;
      const binSize = (max - min) / binCount;
      const bins: { bin: string; count: number }[] = [];
      for (let i = 0; i < binCount; i++) {
        const lo = min + i * binSize;
        const hi = lo + binSize;
        const count = bootstrapResults.filter(v => v >= lo && (i === binCount - 1 ? v <= hi : v < hi)).length;
        bins.push({ bin: lo.toFixed(0), count });
      }

      setResults({
        meanBenefit,
        ci,
        histogram: bins,
        responders: Math.round(validClin.length * params.responseBias),
        total: validClin.length,
      });
      setRunning(false);
    }, 600);
  };

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h2 className="vax-section-title">VLP Response Simulation</h2>
        <p className="vax-section-desc">Bootstrap modeling of hypothetical vaccine response</p>
      </div>

      <AlertBox variant="warning" icon="⚠" title="Simulation Disclaimer" description="This is a hypothetical model assuming treatment effects not clinically established. For educational exploration only." />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="vax-card">
          <h3 className="font-semibold text-sm mb-4">Parameters</h3>
          <div className="space-y-5">
            <div>
              <label className="vax-label">Assumed Efficacy: {(params.efficacy * 100).toFixed(0)}%</label>
              <input type="range" min="0.1" max="0.8" step="0.05" value={params.efficacy} onChange={e => setParams({ ...params, efficacy: parseFloat(e.target.value) })} className="w-full mt-2" />
            </div>
            <div>
              <label className="vax-label">Bootstrap Iterations</label>
              <select className="vax-input" value={params.nBootstrap} onChange={e => setParams({ ...params, nBootstrap: parseInt(e.target.value) })}>
                <option value={200}>200</option>
                <option value={500}>500</option>
                <option value={1000}>1000</option>
              </select>
            </div>
            <div>
              <label className="vax-label">High-APOC1 Response Bias: {(params.responseBias * 100).toFixed(0)}%</label>
              <input type="range" min="0.3" max="0.9" step="0.05" value={params.responseBias} onChange={e => setParams({ ...params, responseBias: parseFloat(e.target.value) })} className="w-full mt-2" />
            </div>
            <button onClick={runSimulation} disabled={running || !expr || !clin} className="vax-btn-primary w-full disabled:opacity-50">
              {running ? 'Running...' : 'Run Simulation'}
            </button>
          </div>
        </div>

        <div className="vax-card lg:col-span-3">
          {results ? (
            <>
              <h3 className="font-semibold text-sm mb-2">Bootstrap Distribution of Survival Benefit</h3>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={results.histogram} margin={{ top: 5, right: 20, bottom: 25, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(270,13%,82%)" />
                  <XAxis dataKey="bin" label={{ value: 'Mean Survival Benefit (days)', position: 'insideBottom', offset: -10 }} stroke="hsl(270,9%,46%)" tick={{ fontSize: 10 }} interval={4} />
                  <YAxis label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }} stroke="hsl(270,9%,46%)" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
                <div className="text-center">
                  <div className="text-3xl font-bold text-violet-600">{results.meanBenefit.toFixed(0)}</div>
                  <div className="text-xs text-muted-foreground mt-1">Mean Benefit (days)</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-blue-600">{results.ci[0].toFixed(0)} – {results.ci[1].toFixed(0)}</div>
                  <div className="text-xs text-muted-foreground mt-1">95% Confidence Interval</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-amber-600">{results.responders} / {results.total}</div>
                  <div className="text-xs text-muted-foreground mt-1">Predicted Responders</div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-60 lg:h-80 text-muted-foreground">
              Configure parameters and run simulation
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Simulation;
