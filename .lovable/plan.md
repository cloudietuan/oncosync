

## Plan: Tissue Analysis Module + Chart Formatting Fixes

### PART 1: New Tissue Analysis Module

**What it does**: A new tab (inserted after "Lab Records" at position 2) where users upload H-DAB immunohistochemistry tissue images. The app performs client-side color deconvolution to isolate the DAB (brown) stain channel, generates a heatmap overlay showing ApoC-1 protein concentration, and computes quantification metrics.

**Files to create:**

1. **`src/components/vax/TissueAnalysis.tsx`** — Main component (~500 lines)
   - Upload zone (drag-and-drop + click) accepting PNG/JPG
   - FileReader.readAsDataURL loading, scale to max 1200px longest side
   - Four hidden canvases (always in DOM, toggled via `display:none`): original, heatmap overlay, DAB grayscale, side-by-side
   - Four view tabs matching Analysis tab style: Original | ApoC-1 Heatmap | DAB Channel | Side-by-Side
   - Image display card with filename + dimensions metadata bar
   - Parameters card: Detection Threshold slider (1-50%, default 12%, "Sensitive"/"Selective"), Heatmap Opacity slider (10-100%, default 75%)
   - Quantification card (2x2 StatCard grid): Positive Area %, Mean Intensity, Positive Pixels, Total Pixels
   - Intensity Distribution histogram (10 bars, Recharts BarChart, colored by heatmap gradient) with gradient legend bar ("Absent" → "Dense", "ApoC-1 Concentration" center)
   - Method footnote
   - "New Image" reset button
   - Core processing logic:
     - H-DAB stain vectors per Ruifrok & Johnston 2001
     - RGB → optical density conversion
     - 3x3 inverse matrix, extract DAB via second row
     - Normalize DAB 0-1, threshold for positive pixels
     - Heatmap color gradient mapping (10 stops as specified)
     - Real-time re-analysis on slider changes

**Files to modify:**

2. **`src/components/vax/VaxNav.tsx`** — Insert "Tissue Analysis" at index 2 (after "Lab Records"), shifting all subsequent tab indices by 1

3. **`src/pages/Index.tsx`** — Import TissueAnalysis, add `{tab === 2 && <TissueAnalysis />}`, increment all existing tab indices from 2+ by 1

---

### PART 2: Chart Formatting Fixes

**Files to modify:**

4. **`src/components/vax/Analysis.tsx`**
   - KM tooltip: Add custom formatter showing values to 3 decimals / as percentage
   - KM X-axis: Add `ticks={[0, 200, 400, 600, 800, 1000, 1200, 1400, 1600]}` and explicit domain
   - Correlation bar chart X-axis: Add `angle={-35}` and `textAnchor="end"` for gene labels, increase bottom margin
   - Cox p-value display: Clamp to `Math.min(res.p, 1).toFixed(4)` since the simplified Cox model can produce p > 1

5. **`src/lib/statistics.ts`**
   - Fix `coxPH` p-value: clamp result to [0, 1] range (`Math.min(p, 1)`)
   - Fix `logRankTest` p-value: same clamping
   - Fix `jStat.pearson` p-value: same clamping

6. **`src/components/vax/Simulation.tsx`** — Add custom Tooltip formatter with `.toFixed(3)` for all numeric values

7. **Global tooltip formatting**: Add a shared custom tooltip formatter component or apply `toFixed(3)` to all Recharts `<Tooltip>` instances across ImmuneTracking, SafetyTracking, Validation, and TcellProxy (already use formatted values in most places — audit and fix any raw floats)

---

### Technical Details

- **Tab index shift**: Current tabs are 0-8. Adding Tissue Analysis at index 2 makes them 0-9. All `tab === N` checks for N >= 2 in Index.tsx shift to N+1. The `setTab()` calls in Overview.tsx that navigate to Analysis (2), Simulation (3), etc. also shift by 1.
- **Canvas strategy**: Four `<canvas>` elements always rendered with `style={{ display: activeView === X ? 'block' : 'none' }}` so refs are always available
- **Matrix inversion**: Hardcode the inverse of the 3x3 stain matrix (computed once, constant)
- **Performance**: Process on upload and on slider change using `requestAnimationFrame` or direct canvas manipulation; images capped at 1200px

