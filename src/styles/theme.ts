/**
 * Design system derived from /web/src/app/styles/theme.ts
 * rem values translated to numeric (1rem ≈ 16px base)
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  md: 18,
  lg: 20,
  xl: 24,
  xxl: 28,
} as const;

export const borderRadius = {
  sm: 8,
  md: 10,
  lg: 16,
  full: 999,
} as const;

export const lightTheme = {
  colors: {
    background: '#f7f8fc',
    surface: '#ffffff',
    textPrimary: '#1e293b',
    textSecondary: '#64748b',
    primary: '#6366f1',
    secondary: '#eef2ff',
    terciary: '#f59e0b',
    gray200: '#f1f5f9',
    gray300: '#e2e8f0',
    gray700: '#334155',
    danger: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
    white: '#ffffff',
  },
  spacing,
  fontSize,
  borderRadius,
} as const;

export const darkTheme = {
  colors: {
    background: '#0f172a',
    surface: '#1e293b',
    textPrimary: '#f1f5f9',
    textSecondary: '#94a3b8',
    primary: '#818cf8',
    secondary: '#312e81',
    terciary: '#fbbf24',
    gray200: '#1e293b',
    gray300: '#334155',
    gray700: '#94a3b8',
    danger: '#f87171',
    success: '#34d399',
    warning: '#fbbf24',
    white: '#ffffff',
  },
  spacing,
  fontSize,
  borderRadius,
} as const;

export type Theme = typeof lightTheme;
