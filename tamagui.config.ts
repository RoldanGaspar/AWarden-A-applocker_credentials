import { createTamagui } from 'tamagui';
import { config as defaultConfig } from '@tamagui/config';

const config = createTamagui({
  ...defaultConfig,
  themes: {
    ...defaultConfig.themes,
    awarden_light: {
      ...defaultConfig.themes.light,
      background: '#E9EEF5',
      backgroundHover: '#F6F8FB',
      backgroundPress: '#DDE5EF',
      backgroundFocus: '#F6F8FB',
      backgroundActive: '#E9EEF5',
      borderColor: '#D1D9E5',
      borderColorHover: '#C4CEDB',
      borderColorFocus: '#4A7C59',
      borderColorPress: '#B9C5D4',
      color: '#172033',
      colorHover: '#172033',
      colorPress: '#172033',
      colorFocus: '#172033',
      placeholderColor: '#718096',
      shadowColor: 'rgba(95, 108, 126, 0.28)',
      highlight2: 'rgba(255, 255, 255, 0.75)',
    },
    awarden_dark: {
      ...defaultConfig.themes.dark,
      background: '#0E1420',
      backgroundHover: '#172238',
      backgroundPress: '#0B101A',
      backgroundFocus: '#172238',
      backgroundActive: '#0E1420',
      borderColor: '#24344C',
      borderColorHover: '#2E4664',
      borderColorFocus: '#6B9B7A',
      borderColorPress: '#1C2A3E',
      color: '#F5F7FA',
      colorHover: '#F5F7FA',
      colorPress: '#F5F7FA',
      colorFocus: '#F5F7FA',
      placeholderColor: '#8C9AAC',
      shadowColor: 'rgba(3, 7, 13, 0.8)',
      highlight2: 'rgba(81, 111, 145, 0.35)',
    },
  },
});

type AppConfig = typeof config;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config;
