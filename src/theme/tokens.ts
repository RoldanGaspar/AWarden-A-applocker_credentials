/**
 * Life OS & Vault - Design System Tokens
 * WCAG AA Compliant Color Palettes, Typography & Spacing
 */

export type AccentName = 'sage' | 'clay' | 'slate' | 'moss' | 'dusk' | 'obsidian';
export type ThemeMode = 'dark' | 'light' | 'system';
export type FontScale = 'small' | 'medium' | 'large';

export interface ColorPalette {
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgElevated: string;
  bgCard: string;
  bgInput: string;
  surfaceHighlight: string;
  surfaceShadow: string;
  
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textMuted: string;
  
  borderSubtle: string;
  borderMedium: string;
  borderStrong: string;
  
  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  danger: string;
  dangerBg: string;
  info: string;
  infoBg: string;
}

export interface AccentColorSet {
  name: AccentName;
  label: string;
  primary: string;
  primaryHover: string;
  primaryActive: string;
  primaryBgLight: string;
  primaryBgDark: string;
  contrastText: string;
}

export const ACCENT_PALETTES: Record<AccentName, AccentColorSet> = {
  sage: {
    name: 'sage',
    label: 'Sage Green',
    primary: '#4A7C59',
    primaryHover: '#3D684A',
    primaryActive: '#33563D',
    primaryBgLight: '#EDF4EE',
    primaryBgDark: '#1C2E22',
    contrastText: '#FFFFFF',
  },
  clay: {
    name: 'clay',
    label: 'Terracotta Clay',
    primary: '#C86446',
    primaryHover: '#B05338',
    primaryActive: '#94442D',
    primaryBgLight: '#FBEFEA',
    primaryBgDark: '#351C15',
    contrastText: '#FFFFFF',
  },
  slate: {
    name: 'slate',
    label: 'Ocean Slate',
    primary: '#3B82F6',
    primaryHover: '#2563EB',
    primaryActive: '#1D4ED8',
    primaryBgLight: '#EFF6FF',
    primaryBgDark: '#172554',
    contrastText: '#FFFFFF',
  },
  moss: {
    name: 'moss',
    label: 'Deep Moss',
    primary: '#65A30D',
    primaryHover: '#4D7C0F',
    primaryActive: '#3F6212',
    primaryBgLight: '#F7FEE7',
    primaryBgDark: '#1A2E05',
    contrastText: '#FFFFFF',
  },
  dusk: {
    name: 'dusk',
    label: 'Twilight Dusk',
    primary: '#8B5CF6',
    primaryHover: '#7C3AED',
    primaryActive: '#6D28D9',
    primaryBgLight: '#F5F3FF',
    primaryBgDark: '#2E1065',
    contrastText: '#FFFFFF',
  },
  obsidian: {
    name: 'obsidian',
    label: 'Pure Obsidian',
    primary: '#475569',
    primaryHover: '#334155',
    primaryActive: '#1E293B',
    primaryBgLight: '#F1F5F9',
    primaryBgDark: '#0F172A',
    contrastText: '#FFFFFF',
  },
};

export const LIGHT_THEME: ColorPalette = {
  bgPrimary: '#EAF0F7',
  bgSecondary: '#E4EBF3',
  bgTertiary: '#D9E2ED',
  bgElevated: '#F7F9FC',
  bgCard: '#EEF3F8',
  bgInput: '#E7EDF5',
  surfaceHighlight: '#FFFFFF',
  surfaceShadow: '#C7D1DE',
  
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#64748B',
  textMuted: '#94A3B8',
  
  borderSubtle: '#E2E8F0',
  borderMedium: '#CBD5E1',
  borderStrong: '#94A3B8',
  
  success: '#16A34A',
  successBg: '#DCFCE7',
  warning: '#D97706',
  warningBg: '#FEF3C7',
  danger: '#DC2626',
  dangerBg: '#FEE2E2',
  info: '#0284C7',
  infoBg: '#E0F2FE',
};

export const DARK_THEME: ColorPalette = {
  bgPrimary: '#0C1320',
  bgSecondary: '#111B2B',
  bgTertiary: '#1B2940',
  bgElevated: '#18253A',
  bgCard: '#142035',
  bgInput: '#0F1A2C',
  surfaceHighlight: '#263B5A',
  surfaceShadow: '#050A13',
  
  textPrimary: '#F9FAFB',
  textSecondary: '#D1D5DB',
  textTertiary: '#9CA3AF',
  textMuted: '#6B7280',
  
  borderSubtle: '#1F2937',
  borderMedium: '#374151',
  borderStrong: '#4B5563',
  
  success: '#22C55E',
  successBg: '#052E16',
  warning: '#F59E0B',
  warningBg: '#451A03',
  danger: '#EF4444',
  dangerBg: '#450A0A',
  info: '#38BDF8',
  infoBg: '#082F49',
};

export const SPACING = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  massive: 48,
  minTouchTarget: 44, // WCAG 2.2 touch target minimum
};

export const RADIUS = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  xxl: 28,
  full: 9999,
};

export const FONT_SCALE_FACTORS: Record<FontScale, number> = {
  small: 0.88,
  medium: 1.0,
  large: 1.15,
};

export const BASE_TYPOGRAPHY = {
  xs: 12,
  sm: 14,
  base: 16,
  md: 18,
  lg: 20,
  xl: 24,
  xxl: 28,
  hero: 34,
};

export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  subtle: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  elevated: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};
