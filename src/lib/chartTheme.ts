/**
 * Shared chart theme constants for consistent Recharts styling.
 * Uses the warm professional design system colors.
 */

/** Neutral axis / grid color — warm gray */
export const CHART_AXIS = 'hsl(220, 8%, 52%)';
/** Grid line color — light warm gray */
export const CHART_GRID = 'hsl(220, 12%, 86%)';
/** Primary data color — teal */
export const CHART_PRIMARY = 'hsl(200, 80%, 44%)';
/** Secondary data color — warm coral */
export const CHART_SECONDARY = '#ef4444';
/** Tertiary data color — emerald */
export const CHART_TERTIARY = '#10b981';
/** Quaternary — amber */
export const CHART_QUATERNARY = '#f59e0b';
/** Accent — soft violet (for supplementary data) */
export const CHART_ACCENT = 'hsl(258, 50%, 58%)';
/** Blue for secondary lines */
export const CHART_BLUE = '#3b82f6';

/** Standard chart margin */
export const CHART_MARGIN = { top: 5, right: 15, bottom: 35, left: 10 };

/** Common axis tick style */
export const CHART_TICK = { fontSize: 10 };

/** Common label style */
export const chartLabelStyle = (fontSize = 10) => ({
  fontSize,
  fill: CHART_AXIS,
});
