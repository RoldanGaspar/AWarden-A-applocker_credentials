import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AccentColorSet,
  AccentName,
  ACCENT_PALETTES,
  ColorPalette,
  DARK_THEME,
  FontScale,
  FONT_SCALE_FACTORS,
  LIGHT_THEME,
  RADIUS,
  SHADOWS,
  SPACING,
  BASE_TYPOGRAPHY,
  ThemeMode,
} from './tokens';

const STORAGE_KEYS = {
  THEME_MODE: '@applocker_theme_mode',
  ACCENT_COLOR: '@applocker_accent_color',
  FONT_SCALE: '@applocker_font_scale',
};

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  accentName: AccentName;
  accent: AccentColorSet;
  colors: ColorPalette;
  fontScale: FontScale;
  fontScaleFactor: number;
  spacing: typeof SPACING;
  radius: typeof RADIUS;
  shadows: typeof SHADOWS;
  setMode: (mode: ThemeMode) => Promise<void>;
  setAccent: (accent: AccentName) => Promise<void>;
  setFontScale: (scale: FontScale) => Promise<void>;
  scaleFontSize: (baseSize: number) => number;
  typography: {
    xs: number;
    sm: number;
    base: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    hero: number;
  };
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const [accentName, setAccentState] = useState<AccentName>('sage');
  const [fontScale, setFontScaleState] = useState<FontScale>('medium');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const [savedMode, savedAccent, savedFontScale] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.THEME_MODE),
          AsyncStorage.getItem(STORAGE_KEYS.ACCENT_COLOR),
          AsyncStorage.getItem(STORAGE_KEYS.FONT_SCALE),
        ]);

        if (savedMode && (savedMode === 'dark' || savedMode === 'light' || savedMode === 'system')) {
          setModeState(savedMode as ThemeMode);
        }
        if (savedAccent && savedAccent in ACCENT_PALETTES) {
          setAccentState(savedAccent as AccentName);
        }
        if (savedFontScale && (savedFontScale === 'small' || savedFontScale === 'medium' || savedFontScale === 'large')) {
          setFontScaleState(savedFontScale as FontScale);
        }
      } catch (error) {
        console.warn('Failed to load theme preferences from storage:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadPreferences();
  }, []);

  const isDark = useMemo(() => {
    if (mode === 'system') {
      return systemColorScheme === 'dark';
    }
    return mode === 'dark';
  }, [mode, systemColorScheme]);

  const colors = useMemo(() => (isDark ? DARK_THEME : LIGHT_THEME), [isDark]);
  const accent = useMemo(() => ACCENT_PALETTES[accentName] || ACCENT_PALETTES.sage, [accentName]);
  const fontScaleFactor = useMemo(() => FONT_SCALE_FACTORS[fontScale] || 1.0, [fontScale]);

  const scaleFontSize = useMemo(
    () => (baseSize: number) => Math.round(baseSize * fontScaleFactor),
    [fontScaleFactor]
  );

  const typography = useMemo(
    () => ({
      xs: scaleFontSize(BASE_TYPOGRAPHY.xs),
      sm: scaleFontSize(BASE_TYPOGRAPHY.sm),
      base: scaleFontSize(BASE_TYPOGRAPHY.base),
      md: scaleFontSize(BASE_TYPOGRAPHY.md),
      lg: scaleFontSize(BASE_TYPOGRAPHY.lg),
      xl: scaleFontSize(BASE_TYPOGRAPHY.xl),
      xxl: scaleFontSize(BASE_TYPOGRAPHY.xxl),
      hero: scaleFontSize(BASE_TYPOGRAPHY.hero),
    }),
    [scaleFontSize]
  );

  const setMode = async (newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME_MODE, newMode);
    } catch (e) {
      console.warn('Failed to save theme mode:', e);
    }
  };

  const setAccent = async (newAccent: AccentName) => {
    setAccentState(newAccent);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCENT_COLOR, newAccent);
    } catch (e) {
      console.warn('Failed to save accent color:', e);
    }
  };

  const setFontScale = async (newScale: FontScale) => {
    setFontScaleState(newScale);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.FONT_SCALE, newScale);
    } catch (e) {
      console.warn('Failed to save font scale:', e);
    }
  };

  const contextValue = useMemo(
    () => ({
      mode,
      isDark,
      accentName,
      accent,
      colors,
      fontScale,
      fontScaleFactor,
      spacing: SPACING,
      radius: RADIUS,
      shadows: SHADOWS,
      setMode,
      setAccent,
      setFontScale,
      scaleFontSize,
      typography,
    }),
    [mode, isDark, accentName, accent, colors, fontScale, fontScaleFactor, scaleFontSize, typography]
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
