/**
 * INGELOX ERP — DESIGN SYSTEM TOKENS
 * 
 * Fuente de verdad de tokens programáticos para TypeScript / React.
 * Estos valores reflejan estrictamente lo definido en DESIGN_SYSTEM.md y index.css.
 */

export const COLOR_TOKENS = {
  brand: {
    orange: 'var(--brand-orange)',
    orangeHover: 'var(--brand-orange-hover)',
    orangeText: 'var(--brand-orange-text)',
    orangeDim: 'var(--brand-orange-dim)',
    orangeRing: 'var(--brand-orange-ring)',
    navy: 'var(--brand-navy)',
    navyDim: 'var(--brand-navy-dim)',
  },
  surface: {
    bg: 'var(--surface-bg)',
    base: 'var(--surface-base)',
    raised: 'var(--surface-raised)',
    input: 'var(--surface-input)',
    hover: 'var(--surface-hover)',
    overlay: 'var(--surface-overlay)',
  },
  sidebar: {
    bg: 'var(--sidebar-bg)',
    bgDeeper: 'var(--sidebar-bg-deeper)',
    border: 'var(--sidebar-border)',
  },
  border: {
    default: 'var(--border-default)',
    strong: 'var(--border-strong)',
    subtle: 'var(--border-subtle)',
  },
  text: {
    primary: 'var(--text-primary)',
    secondary: 'var(--text-secondary)',
    muted: 'var(--text-muted)',
    disabled: 'var(--text-disabled)',
  },
  status: {
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    danger: 'var(--color-danger)',
    info: 'var(--color-info)',
  },
} as const;

export const BREAKPOINTS = {
  xs: '375px',  // Mobile base
  sm: '640px',  // Tablet vertical
  md: '768px',  // Tablet horizontal
  lg: '1024px', // Desktop
  xl: '1280px', // Monitor amplio
} as const;

export const SHADOWS = {
  sm: 'var(--shadow-sm)',
  card: 'var(--shadow-card)',
  raised: 'var(--shadow-raised)',
  overlay: 'var(--shadow-overlay)',
} as const;

export const RADII = {
  sm: '0.25rem',  // 4px
  md: '0.5rem',   // 8px
  lg: '0.75rem',  // 12px
  xl: '1rem',     // 16px
  full: '9999px',
} as const;
