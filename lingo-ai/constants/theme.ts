export const colors = {
  background: '#0F0F14',
  surface: '#1A1A26',
  surfaceHigh: '#242433',
  primary: '#7C6FFF',
  primaryDim: '#7C6FFF33',
  accent: '#FF7B54',
  accentDim: '#FF7B5433',
  text: '#E8E8F2',
  textMuted: '#888899',
  textDim: '#55556A',
  success: '#4CAF82',
  error: '#FF5A5A',
  border: '#2A2A3A',
  overlay: 'rgba(0,0,0,0.7)',

  // Word type badge colors
  idiom: '#A78BFA',
  slang: '#F59E0B',
  phrasal_verb: '#34D399',
  cultural_expression: '#F472B6',
  word: '#60A5FA',
  phrase: '#60A5FA',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
  full: 9999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, color: colors.text },
  h2: { fontSize: 22, fontWeight: '600' as const, color: colors.text },
  h3: { fontSize: 18, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 16, fontWeight: '400' as const, color: colors.text },
  bodyMuted: { fontSize: 16, fontWeight: '400' as const, color: colors.textMuted },
  small: { fontSize: 13, fontWeight: '400' as const, color: colors.textMuted },
  word: { fontSize: 17, fontWeight: '400' as const, color: colors.text },
  wordInterim: { fontSize: 17, fontWeight: '400' as const, color: colors.textDim },
};
