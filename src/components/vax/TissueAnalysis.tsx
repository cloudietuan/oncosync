import { useState, useRef, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import StatCard from './StatCard';
import InfoTooltip from './InfoTooltip';
import { FadeSection } from './MotionWrappers';
import { Microscope, Upload, RotateCcw } from 'lucide-react';

// H-DAB stain vectors (Ruifrok & Johnston 2001)
const H_VEC = [0.65, 0.704, 0.286];
const DAB_VEC = [0.269, 0.568, 0.778];
const RES_VEC = [0.7076, -0.4231, 0.5643];

// Precompute inverse of stain matrix
function invertMatrix3(m: number[][]): number[][] {
  const [[a,b,c],[d,e,f],[g,h,i]] = m;
  const det = a*(e*i-f*h) - b*(d*i-f*g) + c*(d*h-e*g);
  if (Math.abs(det) < 1e-10) return m;
  const inv = 1/det;
  return [
    [(e*i-f*h)*inv, (c*h-b*i)*inv, (b*f-c*e)*inv],
    [(f*g-d*i)*inv, (a*i-c*g)*inv, (c*d-a*f)*inv],
    [(d*h-e*g)*inv, (b*g-a*h)*inv, (a*e-b*d)*inv],
  ];
}

const STAIN_MATRIX = [H_VEC, DAB_VEC, RES_VEC];
const INV_MATRIX = invertMatrix3(STAIN_MATRIX);
const DAB_ROW = INV_MATRIX[1]; // second row for DAB extraction

// Heatmap gradient stops
const GRADIENT_STOPS = [
  { t: 0.00, r: 0, g: 0, b: 0, a: 0 },
  { t: 0.15, r: 8, g: 40, b: 82, a: 0.4 },
  { t: 0.30, r: 17, g: 95, b: 154, a: 0.6 },
  { t: 0.45, r: 0, g: 168, b: 150, a: 0.7 },
  { t: 0.55, r: 46, g: 204, b: 90, a: 0.75 },
  { t: 0.65, r: 180, g: 220, b: 30, a: 0.8 },
  { t: 0.75, r: 255, g: 200, b: 0, a: 0.85 },
  { t: 0.85, r: 255, g: 120, b: 0, a: 0.9 },
  { t: 0.95, r: 230, g: 30, b: 15, a: 0.95 },
  { t: 1.00, r: 180, g: 0, b: 30, a: 1.0 },
];

function lerpGradient(val: number): [number, number, number, number] {
  if (val <= 0) return [0, 0, 0, 0];
  for (let i = 1; i < GRADIENT_STOPS.length; i++) {
    if (val <= GRADIENT_STOPS[i].t) {
      const s0 = GRADIENT_STOPS[i - 1];
      const s1 = GRADIENT_STOPS[i];
      const f = (val - s0.t) / (s1.t - s0.t);
      return [
        Math.round(s0.r + f * (s1.r - s0.r)),
        Math.round(s0.g + f * (s1.g - s0.g)),
        Math.round(s0.b + f * (s1.b - s0.b)),
        s0.a + f * (s1.a - s0.a),
      ];
    }
  }
  const last = GRADIENT_STOPS[GRADIENT_STOPS.length - 1];
  return [last.r, last.g, last.b, last.a];
}

// Histogram bar colors from gradient
const HIST_COLORS = Array.from({ length: 10 }, (_, i) => {
  const val = (i + 0.5) / 10;
  const [r, g, b] = lerpGradient(val);
  return `rgb(${r},${g},${b})`;
});

interface AnalysisResult {
  dabValues: Float32Array;
  width: number;
  height: number;
  positiveArea: number;
  meanIntensity: number;
  positivePixels: number;
  totalPixels: number;
  histogram: { bin: string; count: number }[];
}

const MAX_DIM = 1200;

const TissueAnalysis = () => {
  const [imageData, setImageData] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [imgDims, setImgDims] = useState<{ w: number; h: number } | null>(null);
  const [activeView, setActiveView] = useState<'original' | 'heatmap' | 'dab' | 'sidebyside'>('original');
  const [threshold, setThreshold] = useState(12);
  const [opacity, setOpacity] = useState(75);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [dragging, setDragging] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const canvasOrigRef = useRef<HTMLCanvasElement>(null);
  const canvasHeatRef = useRef<HTMLCanvasElement>(null);
  const canvasDabRef = useRef<HTMLCanvasElement>(null);
  const canvasSideRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const loadImage = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImageData(dataUrl);
    };
    reader.readAsDataURL(file);
  }, []);

  // When imageData changes, draw original and compute DAB
  useEffect(() => {
    if (!imageData) return;
    const img = new Image();
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      const maxSide = Math.max(w, h);
      if (maxSide > MAX_DIM) {
        const scale = MAX_DIM / maxSide;
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      setImgDims({ w, h });
      imgRef.current = img;

      // Draw to offscreen canvas to get pixel data
      const offscreen = document.createElement('canvas');
      offscreen.width = w;
      offscreen.height = h;
      const offCtx = offscreen.getContext('2d')!;
      offCtx.drawImage(img, 0, 0, w, h);
      const pixels = offCtx.getImageData(0, 0, w, h);
      const data = pixels.data;

      // Compute DAB channel
      const dabValues = new Float32Array(w * h);
      let maxDab = 0;
      for (let i = 0; i < w * h; i++) {
        const r = data[i * 4];
        const g = data[i * 4 + 1];
        const b = data[i * 4 + 2];
        const odR = -Math.log(Math.max(r, 1) / 255);
        const odG = -Math.log(Math.max(g, 1) / 255);
        const odB = -Math.log(Math.max(b, 1) / 255);
        const dab = DAB_ROW[0] * odR + DAB_ROW[1] * odG + DAB_ROW[2] * odB;
        dabValues[i] = Math.max(dab, 0);
        if (dabValues[i] > maxDab) maxDab = dabValues[i];
      }
      // Normalize
      if (maxDab > 0) {
        for (let i = 0; i < dabValues.length; i++) dabValues[i] /= maxDab;
      }

      // Build histogram
      const bins = Array.from({ length: 10 }, () => 0);
      const threshNorm = threshold / 100;
      let posCount = 0;
      let sumIntensity = 0;
      for (let i = 0; i < dabValues.length; i++) {
        if (dabValues[i] >= threshNorm) {
          posCount++;
          sumIntensity += dabValues[i];
          const bin = Math.min(Math.floor(dabValues[i] * 10), 9);
          bins[bin]++;
        }
      }

      const histogram = bins.map((count, i) => ({
        bin: `${(i * 10).toFixed(0)}–${((i + 1) * 10).toFixed(0)}%`,
        count,
      }));

      setResult({
        dabValues,
        width: w,
        height: h,
        positiveArea: posCount / dabValues.length * 100,
        meanIntensity: posCount > 0 ? sumIntensity / posCount : 0,
        positivePixels: posCount,
        totalPixels: dabValues.length,
        histogram,
      });

      // Draw original canvas
      const origCtx = canvasOrigRef.current?.getContext('2d');
      if (origCtx && canvasOrigRef.current) {
        canvasOrigRef.current.width = w;
        canvasOrigRef.current.height = h;
        origCtx.drawImage(img, 0, 0, w, h);
      }
    };
    img.src = imageData;
  }, [imageData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-render views when threshold/opacity/result changes
  useEffect(() => {
    if (!result || !imgRef.current) return;
    const { dabValues, width: w, height: h } = result;
    const img = imgRef.current;
    const threshNorm = threshold / 100;
    const opacityMul = opacity / 100;

    // Recompute histogram/stats
    const bins = Array.from({ length: 10 }, () => 0);
    let posCount = 0;
    let sumIntensity = 0;
    for (let i = 0; i < dabValues.length; i++) {
      if (dabValues[i] >= threshNorm) {
        posCount++;
        sumIntensity += dabValues[i];
        const bin = Math.min(Math.floor(dabValues[i] * 10), 9);
        bins[bin]++;
      }
    }
    const histogram = bins.map((count, i) => ({
      bin: `${(i * 10).toFixed(0)}–${((i + 1) * 10).toFixed(0)}%`,
      count,
    }));

    setResult(prev => prev ? {
      ...prev,
      positiveArea: posCount / dabValues.length * 100,
      meanIntensity: posCount > 0 ? sumIntensity / posCount : 0,
      positivePixels: posCount,
      histogram,
    } : prev);

    // Heatmap canvas
    const heatCtx = canvasHeatRef.current?.getContext('2d');
    if (heatCtx && canvasHeatRef.current) {
      canvasHeatRef.current.width = w;
      canvasHeatRef.current.height = h;
      heatCtx.drawImage(img, 0, 0, w, h);
      const imgData = heatCtx.getImageData(0, 0, w, h);
      const px = imgData.data;
      for (let i = 0; i < dabValues.length; i++) {
        if (dabValues[i] >= threshNorm) {
          const [cr, cg, cb, ca] = lerpGradient(dabValues[i]);
          const alpha = ca * opacityMul;
          px[i * 4] = Math.round(px[i * 4] * (1 - alpha) + cr * alpha);
          px[i * 4 + 1] = Math.round(px[i * 4 + 1] * (1 - alpha) + cg * alpha);
          px[i * 4 + 2] = Math.round(px[i * 4 + 2] * (1 - alpha) + cb * alpha);
        }
      }
      heatCtx.putImageData(imgData, 0, 0);
    }

    // DAB grayscale canvas
    const dabCtx = canvasDabRef.current?.getContext('2d');
    if (dabCtx && canvasDabRef.current) {
      canvasDabRef.current.width = w;
      canvasDabRef.current.height = h;
      const imgData = dabCtx.createImageData(w, h);
      const px = imgData.data;
      for (let i = 0; i < dabValues.length; i++) {
        const v = Math.round(dabValues[i] * 255);
        px[i * 4] = v;
        px[i * 4 + 1] = v;
        px[i * 4 + 2] = v;
        px[i * 4 + 3] = 255;
      }
      dabCtx.putImageData(imgData, 0, 0);
    }

    // Side-by-side canvas
    const sideCtx = canvasSideRef.current?.getContext('2d');
    if (sideCtx && canvasSideRef.current) {
      const totalW = w * 2 + 2;
      canvasSideRef.current.width = totalW;
      canvasSideRef.current.height = h;
      // Left: original
      sideCtx.drawImage(img, 0, 0, w, h);
      // Divider
      sideCtx.fillStyle = 'hsl(270,9%,46%)';
      sideCtx.fillRect(w, 0, 2, h);
      // Right: heatmap
      if (canvasHeatRef.current) {
        sideCtx.drawImage(canvasHeatRef.current, w + 2, 0);
      }
    }
  }, [threshold, opacity, result?.dabValues]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg')) {
      loadImage(file);
    }
  };

  const resetImage = () => {
    setImageData(null);
    setFileName(null);
    setImgDims(null);
    setResult(null);
    setActiveView('original');
    if (inputRef.current) inputRef.current.value = '';
  };

  const views = [
    { key: 'original' as const, label: 'Original' },
    { key: 'heatmap' as const, label: 'ApoC-1 Heatmap' },
    { key: 'dab' as const, label: 'DAB Channel' },
    { key: 'sidebyside' as const, label: 'Side-by-Side' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="vax-section-title flex items-center gap-2">
          <Microscope className="w-5 h-5 text-primary" />
          Tissue Analysis
          <InfoTooltip term="Tissue Analysis" definition="IHC color deconvolution isolates the DAB (brown) antibody stain from H&E counterstain to quantify protein expression distribution in tissue sections." />
        </h2>
        <p className="vax-section-desc">IHC color deconvolution and ApoC-1 spatial quantification</p>
      </div>

      {/* Upload zone */}
      {!imageData ? (
        <div
          className={`vax-card border-2 border-dashed cursor-pointer transition-colors ${dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        >
          <div className="flex flex-col items-center justify-center py-12">
            <Upload className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-foreground">Upload IHC-stained tissue image (H-DAB)</p>
            <p className="text-xs text-muted-foreground mt-1">PNG, JPG supported · Ruifrok-Johnston color deconvolution</p>
          </div>
          <input ref={inputRef} type="file" accept=".png,.jpg,.jpeg" className="hidden" onChange={e => handleFiles(e.target.files)} />
        </div>
      ) : (
        <>
          {/* View tabs + New Image button */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="vax-tab-bar overflow-x-auto">
              {views.map(v => (
                <button
                  key={v.key}
                  onClick={() => setActiveView(v.key)}
                  className={`vax-tab-btn whitespace-nowrap ${activeView === v.key ? 'active' : ''}`}
                >
                  {v.label}
                </button>
              ))}
            </div>
            <button onClick={resetImage} className="vax-btn-secondary text-xs flex items-center gap-1">
              <RotateCcw className="w-3 h-3" /> New Image
            </button>
          </div>

          {/* Image display */}
          <FadeSection>
            <div className="vax-card">
              <div className="relative overflow-auto max-h-[600px] rounded-lg bg-muted/30 flex items-center justify-center">
                <canvas ref={canvasOrigRef} style={{ display: activeView === 'original' ? 'block' : 'none', maxWidth: '100%', height: 'auto' }} />
                <canvas ref={canvasHeatRef} style={{ display: activeView === 'heatmap' ? 'block' : 'none', maxWidth: '100%', height: 'auto' }} />
                <canvas ref={canvasDabRef} style={{ display: activeView === 'dab' ? 'block' : 'none', maxWidth: '100%', height: 'auto' }} />
                <canvas ref={canvasSideRef} style={{ display: activeView === 'sidebyside' ? 'block' : 'none', maxWidth: '100%', height: 'auto' }} />
              </div>
              {fileName && imgDims && (
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span className="font-mono">{fileName}</span>
                  <span>{imgDims.w} × {imgDims.h} px</span>
                </div>
              )}
            </div>
          </FadeSection>

          {/* Parameters */}
          <div className="vax-card">
            <h3 className="font-semibold text-sm mb-4">Parameters</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-foreground">Detection Threshold</span>
                  <span className="font-bold text-primary">{threshold}%</span>
                </div>
                <input type="range" min={1} max={50} value={threshold} onChange={e => setThreshold(parseInt(e.target.value))} className="w-full accent-primary" />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                  <span>Sensitive</span>
                  <span>Selective</span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-foreground">Heatmap Opacity</span>
                  <span className="font-bold text-primary">{opacity}%</span>
                </div>
                <input type="range" min={10} max={100} value={opacity} onChange={e => setOpacity(parseInt(e.target.value))} className="w-full accent-primary" />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                  <span>Subtle</span>
                  <span>Full</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quantification */}
          {result && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <StatCard label="Positive Area" value={`${result.positiveArea.toFixed(1)}%`} tooltip={{ term: "Positive Area", definition: "Percentage of tissue pixels above the detection threshold, indicating DAB-stained regions." }} />
                <StatCard label="Mean Intensity" value={result.meanIntensity.toFixed(3)} tooltip={{ term: "Mean Intensity", definition: "Average normalized DAB intensity across positive pixels (0–1 scale)." }} />
                <StatCard label="Positive Pixels" value={result.positivePixels.toLocaleString()} />
                <StatCard label="Total Pixels" value={result.totalPixels.toLocaleString()} />
              </div>

              {/* Histogram */}
              <div className="vax-card">
                <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                  Intensity Distribution
                  <InfoTooltip term="Intensity Distribution" definition="Shows how positive pixels are distributed across intensity bins from low (faint staining) to high (dense staining)." />
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={result.histogram} margin={{ top: 5, right: 10, bottom: 35, left: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(270,13%,82%)" />
                    <XAxis dataKey="bin" stroke="hsl(270,9%,46%)" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={60} />
                    <YAxis stroke="hsl(270,9%,46%)" width={50} label={{ value: 'Pixel Count', angle: -90, position: 'insideLeft', offset: -5, style: { fontSize: 10, fill: 'hsl(270,9%,46%)' } }} />
                    <Tooltip formatter={(value: number) => [value.toLocaleString(), 'Pixels']} />
                    <Bar dataKey="count" name="Positive Pixels">
                      {result.histogram.map((_, i) => (
                        <Cell key={i} fill={HIST_COLORS[i]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                {/* Gradient legend bar */}
                <div className="mt-4">
                  <div className="h-4 rounded-full overflow-hidden" style={{
                    background: `linear-gradient(to right, rgb(8,40,82), rgb(17,95,154), rgb(0,168,150), rgb(46,204,90), rgb(180,220,30), rgb(255,200,0), rgb(255,120,0), rgb(230,30,15), rgb(180,0,30))`,
                  }} />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>Absent</span>
                    <span className="font-medium">ApoC-1 Concentration</span>
                    <span>Dense</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Method footnote */}
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Method: H-DAB color deconvolution (Ruifrok & Johnston, <em>Anal Quant Cytol Histol</em>, 2001). DAB channel isolated via inverse stain matrix decomposition.
          </p>
        </>
      )}
    </div>
  );
};

export default TissueAnalysis;
