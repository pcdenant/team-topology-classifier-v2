// ─── Palette ──────────────────────────────────────────────────
export const C = {
  vert:        '#006946',
  vertDark:    '#004d34',
  vertLight:   '#e6f2ed',
  jaune:       '#FFF200',
  jauneMuted:  '#E6D900',
  creme:       '#FBF3EB',
  cremeDark:   '#f0e4d6',
  bg:          '#f4f1ec',

  text:        '#1a1a1a',
  textMuted:   '#666666',
  textLight:   '#999999',
  border:      '#e5e7eb',
  borderLight: '#f0f0f0',

  danger:      '#dc2626',
  dangerBg:    '#fef2f2',
  warning:     '#d97706',
  warningBg:   '#fffbeb',
  info:        '#2563eb',
  infoBg:      '#eff6ff',
  purple:      '#7c3aed',

  white:       '#ffffff',
  black:       '#000000',
}

// ─── Type colors ───────────────────────────────────────────────
export const TYPE_CLR = {
  stream_aligned:        C.vert,
  platform:              C.purple,
  enabling:              C.warning,
  complicated_subsystem: C.danger,
  hybrid:                C.textLight,
}

// ─── Clarity colors ────────────────────────────────────────────
export const CLAR_CLR = {
  high:   C.vert,
  medium: C.warning,
  low:    C.danger,
}

// ─── Sidebar ───────────────────────────────────────────────────
export const SIDEBAR_W = 260
export const SIDEBAR_W_COLLAPSED = 56

// ─── Button variants ───────────────────────────────────────────
export const BP = {
  background: C.jaune,
  color:      C.vertDark,
  border:     'none',
  fontWeight: 700,
  fontSize:   14,
  padding:    '10px 20px',
  borderRadius: 8,
  cursor:     'pointer',
  transition: 'all 0.15s ease',
}

export const BP_VERT = {
  ...BP,
  background: C.vert,
  color:      C.white,
}

export const BS = {
  background:   C.white,
  color:        C.text,
  border:       `1px solid ${C.border}`,
  fontWeight:   600,
  fontSize:     14,
  padding:      '10px 20px',
  borderRadius: 8,
  cursor:       'pointer',
  transition:   'all 0.15s ease',
}

export const BT = {
  background:   C.white,
  color:        C.textMuted,
  border:       `1px solid ${C.border}`,
  fontWeight:   500,
  fontSize:     13,
  padding:      '8px 16px',
  borderRadius: 8,
  cursor:       'pointer',
  transition:   'all 0.15s ease',
}

export const BD = {
  background:   'transparent',
  color:        'rgba(255,255,255,0.75)',
  border:       '1px solid rgba(255,255,255,0.25)',
  fontWeight:   500,
  fontSize:     13,
  padding:      '8px 16px',
  borderRadius: 8,
  cursor:       'pointer',
  transition:   'all 0.15s ease',
}

// ─── Card variants ─────────────────────────────────────────────
export const CARD = {
  background:   C.white,
  border:       `1px solid ${C.border}`,
  borderRadius: 14,
  padding:      24,
}

export const CARD_CREME = {
  background:   C.creme,
  border:       'none',
  borderRadius: 14,
  padding:      24,
}

export const CARD_VERT = {
  background:   C.vert,
  border:       'none',
  borderRadius: 14,
  padding:      24,
  color:        C.white,
}

// ─── Label variants ────────────────────────────────────────────
export const LABEL = {
  fontSize:      11,
  fontWeight:    700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color:         C.vert,
}

export const LABEL_W = {
  ...LABEL,
  color: C.jaune,
}

export const LABEL_MUTED = {
  ...LABEL,
  color: C.textLight,
}

// ─── Badge factory ─────────────────────────────────────────────
export const badge = (bg, color) => ({
  background:   bg,
  color:        color,
  borderRadius: 20,
  padding:      '3px 10px',
  fontWeight:   700,
  fontSize:     12,
  display:      'inline-block',
})

// ─── Link style ────────────────────────────────────────────────
export const LK = {
  color:          C.vert,
  textDecoration: 'none',
  borderBottom:   `1px dotted ${C.vert}44`,
  cursor:         'pointer',
}
