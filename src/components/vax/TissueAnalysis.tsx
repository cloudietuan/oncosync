import { useState, useRef, useEffect, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import StatCard from './StatCard';
import InfoTooltip from './InfoTooltip';
import { FadeSection } from './MotionWrappers';
import { Microscope, Upload, RotateCcw, FlaskConical, Download, Loader2 } from 'lucide-react';

// H-DAB stain vectors (Ruifrok & Johnston 2001)
const H_VEC = [0.65, 0.704, 0.286] as const;
const DAB_VEC = [0.269, 0.568, 0.778] as const;
const MAX_OD = 2;
const WHITE_BG_THRESHOLD = 240;
const HEMA_SUPPRESSION_RATIO = 0.6;
const MIN_DAB_HEMA_GAP = 0.01;

// Inverse of [H_VEC; DAB_VEC; Residual] matrix for proper deconvolution
const INV_MATRIX = [
  [1.195046, -0.683542, 0.638039],
  [0.689411, 0.018376, -0.710083],
  [-0.916520, 1.508271, 0.297808],
];

// FIX #2: Updated gradient stops — low-intensity DAB is now clearly visible
const GRADIENT_STOPS = [
  { t: 0.00, r: 0,   g: 0,   b: 0,   a: 0 },
  { t: 0.05, r: 8,   g: 40,  b: 120, a: 0.20 },
  { t: 0.15, r: 10,  g: 100, b: 160, a: 0.40 },
  { t: 0.30, r: 0,   g: 168, b: 140, a: 0.55 },
  { t: 0.50, r: 80,  g: 210, b: 50,  a: 0.65 },
  { t: 0.75, r: 255, g: 150, b: 0,   a: 0.78 },
  { t: 1.00, r: 210, g: 20,  b: 20,  a: 0.90 },
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

const HIST_COLORS = Array.from({ length: 10 }, (_, i) => {
  const val = (i + 0.5) / 10;
  const [r, g, b] = lerpGradient(val);
  return `rgb(${r},${g},${b})`;
});

interface AnalysisResult {
  dabValues: Float32Array;
  hemaValues: Float32Array;
  tissueMask: Uint8Array;
  width: number;
  height: number;
  positiveArea: number;
  meanIntensity: number;
  positivePixels: number;
  totalPixels: number;
  histogram: { bin: string; count: number }[];
}

const MAX_DIM = 1200;

function thresholdToNormalized(thresholdPercent: number) {
  return Math.min(Math.max(thresholdPercent / 100, 0), 1);
}

function buildHistogram(dabValues: Float32Array, tissueMask: Uint8Array) {
  const bins = Array.from({ length: 10 }, () => 0);
  let totalTissue = 0;

  for (let i = 0; i < dabValues.length; i++) {
    if (!tissueMask[i]) continue;
    totalTissue++;
    const bin = Math.min(Math.floor(dabValues[i] * 10), 9);
    bins[bin]++;
  }

  return bins.map((count, i) => ({
    bin: `${(i * 10).toFixed(0)}–${((i + 1) * 10).toFixed(0)}%`,
    count: totalTissue > 0 ? (count / totalTissue) * 100 : 0,
  }));
}

function computeMetrics(
  dabValues: Float32Array,
  hemaValues: Float32Array,
  tissueMask: Uint8Array,
  thresholdNorm: number,
) {
  let posCount = 0;
  let tissueCount = 0;
  let sumIntensity = 0;

  for (let i = 0; i < dabValues.length; i++) {
    if (!tissueMask[i]) continue;
    tissueCount++;

    const dab = dabValues[i];
    const hema = hemaValues[i];
    const isPositive = dab > thresholdNorm && dab > hema * HEMA_SUPPRESSION_RATIO;

    if (!isPositive) continue;

    posCount++;
    sumIntensity += dab;
  }

  return {
    positiveArea: tissueCount > 0 ? (posCount / tissueCount) * 100 : 0,
    meanIntensity: posCount > 0 ? sumIntensity / posCount : 0,
    positivePixels: posCount,
    totalPixels: tissueCount,
  };
}

// FIX #1: Generate a synthetic pancreatic IHC tissue image on canvas
function generateDemoImage(): HTMLCanvasElement {
  const w = 800, h = 600;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;

  // Light pink/white tissue background (hematoxylin counterstain)
  ctx.fillStyle = '#f0e4e0';
  ctx.fillRect(0, 0, w, h);

  // Add subtle tissue texture noise
  const imgData = ctx.getImageData(0, 0, w, h);
  const px = imgData.data;
  for (let i = 0; i < px.length; i += 4) {
    const noise = (Math.random() - 0.5) * 20;
    px[i] = Math.min(255, Math.max(0, px[i] + noise));
    px[i+1] = Math.min(255, Math.max(0, px[i+1] + noise - 5));
    px[i+2] = Math.min(255, Math.max(0, px[i+2] + noise - 8));
  }
  ctx.putImageData(imgData, 0, 0);

  // Draw hematoxylin-stained nuclei (blue-purple dots scattered across tissue)
  const nucleiCount = 1200;
  for (let i = 0; i < nucleiCount; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = 1.5 + Math.random() * 2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    const blueShift = Math.random() * 40;
    ctx.fillStyle = `rgba(${80 + blueShift}, ${50 + blueShift * 0.5}, ${120 + blueShift}, ${0.3 + Math.random() * 0.4})`;
    ctx.fill();
  }

  // Draw DAB-positive clustered regions (brown, mimicking tumor gland patterns)
  // Use ~12 cluster centers with irregular shapes
  const clusters: { cx: number; cy: number; rx: number; ry: number; angle: number }[] = [];
  const clusterCount = 14;
  for (let i = 0; i < clusterCount; i++) {
    clusters.push({
      cx: 80 + Math.random() * (w - 160),
      cy: 60 + Math.random() * (h - 120),
      rx: 40 + Math.random() * 80,
      ry: 30 + Math.random() * 60,
      angle: Math.random() * Math.PI,
    });
  }

  // Paint brown DAB stain in cluster regions with glandular sub-structure
  for (const cl of clusters) {
    ctx.save();
    ctx.translate(cl.cx, cl.cy);
    ctx.rotate(cl.angle);

    // Main gland shape — irregular ellipse filled with brown
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 2; a += 0.1) {
      const wobble = 1 + Math.sin(a * 3) * 0.15 + Math.cos(a * 7) * 0.08;
      const x = Math.cos(a) * cl.rx * wobble;
      const y = Math.sin(a) * cl.ry * wobble;
      if (a === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();

    // Brown DAB fill (RGB ~160,120,60)
    const brownR = 140 + Math.random() * 40;
    const brownG = 100 + Math.random() * 40;
    const brownB = 40 + Math.random() * 30;
    ctx.fillStyle = `rgba(${brownR}, ${brownG}, ${brownB}, ${0.6 + Math.random() * 0.35})`;
    ctx.fill();

    // Add darker brown spots within glands (high-intensity DAB)
    const spotCount = 8 + Math.floor(Math.random() * 15);
    for (let s = 0; s < spotCount; s++) {
      const sx = (Math.random() - 0.5) * cl.rx * 1.4;
      const sy = (Math.random() - 0.5) * cl.ry * 1.4;
      const sr = 3 + Math.random() * 10;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${120 + Math.random() * 30}, ${80 + Math.random() * 30}, ${30 + Math.random() * 20}, ${0.5 + Math.random() * 0.4})`;
      ctx.fill();
    }

    // Gland lumen (lighter center holes)
    if (Math.random() > 0.3) {
      ctx.beginPath();
      ctx.arc(0, 0, cl.rx * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(240, 230, 220, ${0.3 + Math.random() * 0.3})`;
      ctx.fill();
    }

    ctx.restore();
  }

  // Add scattered individual DAB-positive cells between clusters
  for (let i = 0; i < 300; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = 2 + Math.random() * 4;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${150 + Math.random() * 30}, ${110 + Math.random() * 20}, ${50 + Math.random() * 20}, ${0.3 + Math.random() * 0.5})`;
    ctx.fill();
  }

  return c;
}

const DEMO_IMAGES = [
  { group: 'Pancreatic Cancer', items: [
    { label: 'Pancreatic – ApoC-1 High', url: 'https://images.proteinatlas.org/51518/124366_B_5_1.jpg', fileName: 'pancreatic_apoc1_positive.jpg' },
    { label: 'Pancreatic – ApoC-1 Negative', url: 'https://images.proteinatlas.org/51518/124366_B_4_3.jpg', fileName: 'pancreatic_apoc1_negative.jpg' },
  ]},
  { group: 'Liver Tissue', items: [
    { label: 'Liver – ApoC-1 High', url: 'https://images.proteinatlas.org/51518/124365_A_7_4.jpg', fileName: 'liver_apoc1_positive.jpg' },
    { label: 'Liver – ApoC-1 Negative', url: 'https://images.proteinatlas.org/51518/124365_A_9_4.jpg', fileName: 'liver_apoc1_negative.jpg' },
  ]},
];

const TissueAnalysis = () => {
  const [imageData, setImageData] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [imgDims, setImgDims] = useState<{ w: number; h: number } | null>(null);
  const [activeView, setActiveView] = useState<'original' | 'heatmap' | 'dab' | 'sidebyside'>('original');
  const [threshold, setThreshold] = useState(12);
  const [opacity, setOpacity] = useState(75);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const canvasOrigRef = useRef<HTMLCanvasElement>(null);
  const canvasHeatRef = useRef<HTMLCanvasElement>(null);
  const canvasDabRef = useRef<HTMLCanvasElement>(null);
  const canvasSideRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const demoCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const loadImage = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImageData(dataUrl);
    };
    reader.readAsDataURL(file);
  }, []);

  // Load remote IHC image via fetch → blob → objectURL
  const loadRemoteImage = useCallback(async (url: string, name: string) => {
    setLoadingDemo(name);
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      setFileName(name);
      setImageData(objectUrl);
    } catch {
      // Fallback: try loading via img tag directly (some browsers allow cross-origin canvas)
      setFileName(name);
      setImageData(url);
    } finally {
      setLoadingDemo(null);
    }
  }, []);

  // Load synthetic demo image
  const loadDemoImage = useCallback(() => {
    const demoCanvas = generateDemoImage();
    demoCanvasRef.current = demoCanvas;
    setFileName('demo_synthetic_ihc.png');
    setImageData(demoCanvas.toDataURL('image/png'));
  }, []);

  // Process image and compute DAB values
  useEffect(() => {
    if (!imageData) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
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

      const offscreen = document.createElement('canvas');
      offscreen.width = w;
      offscreen.height = h;
      const offCtx = offscreen.getContext('2d')!;
      offCtx.drawImage(img, 0, 0, w, h);
      const pixels = offCtx.getImageData(0, 0, w, h);
      const data = pixels.data;

      const dabValues = new Float32Array(w * h);
      const hemaValues = new Float32Array(w * h);
      const tissueMask = new Uint8Array(w * h);

      for (let i = 0; i < w * h; i++) {
        const r = data[i * 4];
        const g = data[i * 4 + 1];
        const b = data[i * 4 + 2];
        tissueMask[i] = r > WHITE_BG_THRESHOLD && g > WHITE_BG_THRESHOLD && b > WHITE_BG_THRESHOLD ? 0 : 1;

        const odR = -Math.log((r + 1) / 256);
        const odG = -Math.log((g + 1) / 256);
        const odB = -Math.log((b + 1) / 256);

        const hemaConc = INV_MATRIX[0][0] * odR + INV_MATRIX[0][1] * odG + INV_MATRIX[0][2] * odB;
        const dabConc = INV_MATRIX[1][0] * odR + INV_MATRIX[1][1] * odG + INV_MATRIX[1][2] * odB;

        dabValues[i] = Math.min(Math.max(dabConc / MAX_OD, 0), 1);
        hemaValues[i] = Math.min(Math.max(hemaConc / MAX_OD, 0), 1);
      }

      const threshNorm = thresholdToNormalized(threshold);
      const histogram = buildHistogram(dabValues, tissueMask);
      const metrics = computeMetrics(dabValues, hemaValues, tissueMask, threshNorm);

      setResult({
        dabValues,
        hemaValues,
        tissueMask,
        width: w,
        height: h,
        ...metrics,
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

  // FIX #3: Re-render views with proper compositing — heatmap drawn ON TOP of original
  useEffect(() => {
    if (!result || !imgRef.current) return;
    const { dabValues, hemaValues, tissueMask, width: w, height: h } = result;
    const img = imgRef.current;
    const threshNorm = thresholdToNormalized(threshold);
    const opacityMul = opacity / 100;

    const metrics = computeMetrics(dabValues, hemaValues, tissueMask, threshNorm);

    setResult(prev => prev ? {
      ...prev,
      ...metrics,
    } : prev);

    // FIX #3: Heatmap canvas — draw original image FIRST, then overlay colored pixels on top
    const heatCtx = canvasHeatRef.current?.getContext('2d');
    if (heatCtx && canvasHeatRef.current) {
      canvasHeatRef.current.width = w;
      canvasHeatRef.current.height = h;
      heatCtx.clearRect(0, 0, w, h);
      // Step 1: Draw original tissue image as base
      heatCtx.drawImage(img, 0, 0, w, h);
      // Step 2: Create a separate overlay with ONLY the heatmap colors where DAB > threshold
      const overlayCanvas = document.createElement('canvas');
      overlayCanvas.width = w;
      overlayCanvas.height = h;
      const overlayCtx = overlayCanvas.getContext('2d')!;
      const overlayData = overlayCtx.createImageData(w, h);
      const oPx = overlayData.data;
      for (let i = 0; i < dabValues.length; i++) {
        const isPositive = tissueMask[i] && dabValues[i] > threshNorm && dabValues[i] > hemaValues[i] * HEMA_SUPPRESSION_RATIO;
        if (isPositive) {
          const stretchedDab = Math.min(dabValues[i] / 0.75, 1.0);
          const [cr, cg, cb, ca] = lerpGradient(stretchedDab);
          const alpha = ca * opacityMul;
          oPx[i * 4] = cr;
          oPx[i * 4 + 1] = cg;
          oPx[i * 4 + 2] = cb;
          oPx[i * 4 + 3] = Math.round(alpha * 255);
        }
        // else: stays transparent (0,0,0,0) — no overlay on negative pixels
      }
      overlayCtx.putImageData(overlayData, 0, 0);
      // Step 3: Composite overlay on top of original using default 'source-over'
      heatCtx.drawImage(overlayCanvas, 0, 0);
    }

    // DAB grayscale canvas — fixed absolute scale: 0.0 OD = black, 0.5 OD = white
    const dabCtx = canvasDabRef.current?.getContext('2d');
    if (dabCtx && canvasDabRef.current) {
      canvasDabRef.current.width = w;
      canvasDabRef.current.height = h;

      const imgData = dabCtx.createImageData(w, h);
      const px = imgData.data;
      const DAB_SCALE_MAX = 0.85; // fixed upper OD bound
      for (let i = 0; i < dabValues.length; i++) {
        const v = tissueMask[i]
          ? Math.round(Math.min(Math.max(dabValues[i] / DAB_SCALE_MAX, 0), 1) * 255)
          : 25;
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
       sideCtx.clearRect(0, 0, totalW, h);
      sideCtx.drawImage(img, 0, 0, w, h);
      sideCtx.fillStyle = 'hsl(270,9%,46%)';
      sideCtx.fillRect(w, 0, 2, h);
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
    demoCanvasRef.current = null;
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
        <div className="space-y-3">
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

          {/* Demo images from Human Protein Atlas */}
          <div className="space-y-2">
            {DEMO_IMAGES.map(group => (
              <div key={group.group}>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{group.group}</p>
                <div className="grid grid-cols-2 gap-2">
                  {group.items.map(item => (
                    <button
                      key={item.fileName}
                      onClick={() => loadRemoteImage(item.url, item.fileName)}
                      disabled={!!loadingDemo}
                      className="vax-btn-secondary flex items-center justify-center gap-1.5 py-2 text-xs disabled:opacity-50"
                    >
                      {loadingDemo === item.fileName ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      <span className="truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Synthetic fallback */}
          <button
            onClick={loadDemoImage}
            className="vax-btn-secondary w-full flex items-center justify-center gap-2 py-2 text-xs"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            Generate Synthetic H-DAB Image
          </button>

          <p className="text-[9px] text-muted-foreground text-center">
            IHC images: Human Protein Atlas, antibody HPA051518 · CC BY-SA 3.0
          </p>
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

              {/* Donut + Area Chart */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Donut: Positive vs Negative Area */}
                <div className="vax-card flex flex-col items-center">
                  <h3 className="font-semibold text-sm mb-2 flex items-center gap-2 self-start">
                    Tissue Composition
                    <InfoTooltip term="Tissue Composition" definition="Proportion of tissue area classified as DAB-positive (stained) vs negative (unstained)." />
                  </h3>
                  <div className="relative w-full" style={{ height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Positive', value: Math.round(result.positiveArea * 10) / 10 },
                            { name: 'Negative', value: Math.round((100 - result.positiveArea) * 10) / 10 },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={85}
                          startAngle={90}
                          endAngle={-270}
                          dataKey="value"
                          stroke="none"
                        >
                          <Cell fill="hsl(36, 85%, 55%)" />
                          <Cell fill="hsl(var(--muted))" />
                        </Pie>
                        <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`]} />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-bold text-foreground">{result.positiveArea.toFixed(1)}%</span>
                      <span className="text-[10px] text-muted-foreground">Positive</span>
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'hsl(36, 85%, 55%)' }} /> DAB+</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-muted" /> Negative</span>
                  </div>
                </div>

                {/* Area Chart: Intensity Distribution */}
                <div className="vax-card">
                  <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    Intensity Distribution
                    <InfoTooltip term="Intensity Distribution" definition="Shows how positive pixels are distributed across intensity bins from low (faint staining) to high (dense staining)." />
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={result.histogram} margin={{ top: 5, right: 10, bottom: 35, left: 5 }}>
                      <defs>
                        <linearGradient id="ihcAreaGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="rgb(8,40,120)" stopOpacity={0.9} />
                          <stop offset="15%" stopColor="rgb(10,100,160)" stopOpacity={0.85} />
                          <stop offset="30%" stopColor="rgb(0,168,140)" stopOpacity={0.8} />
                          <stop offset="50%" stopColor="rgb(80,210,50)" stopOpacity={0.75} />
                          <stop offset="75%" stopColor="rgb(255,150,0)" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="rgb(210,20,20)" stopOpacity={0.85} />
                        </linearGradient>
                        <linearGradient id="ihcAreaStroke" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="rgb(8,40,120)" />
                          <stop offset="30%" stopColor="rgb(0,168,140)" />
                          <stop offset="50%" stopColor="rgb(80,210,50)" />
                          <stop offset="75%" stopColor="rgb(255,150,0)" />
                          <stop offset="100%" stopColor="rgb(210,20,20)" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(270,13%,82%)" />
                      <XAxis dataKey="bin" stroke="hsl(270,9%,46%)" tick={{ fontSize: 8 }} angle={-30} textAnchor="end" height={50} />
                      <YAxis stroke="hsl(270,9%,46%)" width={42} domain={[0, 'auto']} label={{ value: '% tissue', angle: -90, position: 'insideLeft', offset: -2, style: { fontSize: 9, fill: 'hsl(270,9%,46%)' } }} />
                      <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, '% of tissue']} />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="url(#ihcAreaStroke)"
                        strokeWidth={2}
                        fill="url(#ihcAreaGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                  <div className="mt-2">
                    <div className="h-2.5 rounded-full overflow-hidden" style={{
                      background: `linear-gradient(to right, rgb(8,40,120), rgb(10,100,160), rgb(0,168,140), rgb(80,210,50), rgb(255,150,0), rgb(210,20,20))`,
                    }} />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                      <span>Absent</span>
                      <span className="font-medium">ApoC-1 Concentration</span>
                      <span>Dense</span>
                    </div>
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
