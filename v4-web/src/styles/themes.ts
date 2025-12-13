import { BrightnessFilterToken, ColorToken, OpacityToken } from '@/constants/styles/base';
import type { Theme, ThemeColorBase } from '@/constants/styles/colors';

import { AppColorMode, AppTheme } from '@/state/appUiConfigs';

import { generateFadedColorVariant } from '@/lib/styles';

const ClassicThemeBase: () => ThemeColorBase = () => ({
  black: ColorToken.Black,
  white: ColorToken.White,
  green: ColorToken.Green3,
  red: ColorToken.Red2,

  redFaded: generateFadedColorVariant(ColorToken.Red2, OpacityToken.Opacity16),
  greenFaded: generateFadedColorVariant(ColorToken.Green3, OpacityToken.Opacity16),
  whiteFaded: generateFadedColorVariant(ColorToken.White, OpacityToken.Opacity16),

  layer0: ColorToken.GrayBlue7,
  layer1: ColorToken.GrayBlue6,
  layer2: ColorToken.GrayBlue5,
  layer3: ColorToken.GrayBlue4,
  layer4: ColorToken.GrayBlue3,
  layer5: ColorToken.GrayBlue2,
  layer6: ColorToken.GrayBlue1,
  layer7: ColorToken.GrayBlue0,

  borderDefault: ColorToken.GrayBlue2,
  borderFaded: generateFadedColorVariant(ColorToken.GrayBlue4, OpacityToken.Opacity50),
  borderDestructive: generateFadedColorVariant(ColorToken.Red2, OpacityToken.Opacity20),
  borderButton: generateFadedColorVariant(ColorToken.White, OpacityToken.Opacity20),

  textPrimary: ColorToken.LightGray2,
  textSecondary: ColorToken.GrayPurple1,
  textTertiary: ColorToken.GrayPurple2,
  textButton: ColorToken.LightGray2,

  gradientBase0: ColorToken.DarkGray10,
  gradientBase1: ColorToken.GrayBlue2,

  accent: ColorToken.Purple1,
  accentFaded: generateFadedColorVariant(ColorToken.Purple1, OpacityToken.Opacity16),
  accentMoreFaded: generateFadedColorVariant(ColorToken.Purple1, OpacityToken.Opacity8),
  favorite: ColorToken.Yellow0,

  success: ColorToken.Green3,
  warning: ColorToken.Yellow0,
  error: ColorToken.Red2,
  successBackground: ColorToken.Green3,
  successFaded: generateFadedColorVariant(ColorToken.Green3, OpacityToken.Opacity16),
  warningFaded: generateFadedColorVariant(ColorToken.Yellow0, OpacityToken.Opacity16),
  errorFaded: generateFadedColorVariant(ColorToken.Red2, OpacityToken.Opacity16),

  positive: ColorToken.Green3,
  negative: ColorToken.Red2,
  positiveDark: ColorToken.Green6,
  negativeDark: ColorToken.Red4,
  positive20: generateFadedColorVariant(ColorToken.Green3, OpacityToken.Opacity20),
  negative20: generateFadedColorVariant(ColorToken.Red2, OpacityToken.Opacity20),
  positive50: generateFadedColorVariant(ColorToken.Green3, OpacityToken.Opacity50),
  negative50: generateFadedColorVariant(ColorToken.Red2, OpacityToken.Opacity50),
  positiveFaded: generateFadedColorVariant(ColorToken.Green3, OpacityToken.Opacity16),
  negativeFaded: generateFadedColorVariant(ColorToken.Red2, OpacityToken.Opacity16),

  riskLow: ColorToken.Green3,
  riskMedium: ColorToken.Yellow0,
  riskHigh: ColorToken.Red2,

  logoFill: ColorToken.White,
  profileYellow: ColorToken.Yellow1,
  profileRed: ColorToken.Red2,

  inputBackground: ColorToken.GrayBlue3,
  popoverBackground: ColorToken.GrayBlue4,
  toggleBackground: ColorToken.GrayBlue3,
  tooltipBackground: ColorToken.GrayBlue3,

  hoverFilterBase: BrightnessFilterToken.Lighten10,
  hoverFilterVariant: BrightnessFilterToken.Lighten10,
  activeFilter: BrightnessFilterToken.Darken10,
  overlayFilter: BrightnessFilterToken.Darken30,
});

const DarkThemeBase: () => ThemeColorBase = () => ({
  black: ColorToken.Black,
  white: ColorToken.White,
  green: ColorToken.Green1,
  red: ColorToken.Red0,

  redFaded: generateFadedColorVariant(ColorToken.Red0, OpacityToken.Opacity16),
  greenFaded: generateFadedColorVariant(ColorToken.Green1, OpacityToken.Opacity16),
  whiteFaded: generateFadedColorVariant(ColorToken.White, OpacityToken.Opacity16),

  layer0: ColorToken.Black,
  layer1: ColorToken.DarkGray14,
  layer2: ColorToken.DarkGray11,
  layer3: ColorToken.DarkGray9,
  layer4: ColorToken.DarkGray6,
  layer5: ColorToken.DarkGray5,
  layer6: ColorToken.DarkGray4,
  layer7: ColorToken.DarkGray2,

  borderDefault: ColorToken.DarkGray4,
  borderFaded: generateFadedColorVariant(ColorToken.DarkGray9, OpacityToken.Opacity50),
  borderDestructive: generateFadedColorVariant(ColorToken.Red0, OpacityToken.Opacity20),
  borderButton: generateFadedColorVariant(ColorToken.White, OpacityToken.Opacity20),

  textPrimary: ColorToken.LightGray0,
  textSecondary: ColorToken.MediumGray0,
  textTertiary: ColorToken.DarkGray0,
  textButton: ColorToken.LightGray0,

  gradientBase0: ColorToken.DarkGray8,
  gradientBase1: ColorToken.DarkGray5,

  accent: ColorToken.Purple0,
  accentFaded: generateFadedColorVariant(ColorToken.Purple0, OpacityToken.Opacity16),
  accentMoreFaded: generateFadedColorVariant(ColorToken.Purple0, OpacityToken.Opacity8),
  favorite: ColorToken.Yellow0,

  success: ColorToken.Green1,
  successBackground: ColorToken.Green4,
  warning: ColorToken.Yellow0,
  error: ColorToken.Red0,
  successFaded: generateFadedColorVariant(ColorToken.Green1, OpacityToken.Opacity16),
  warningFaded: generateFadedColorVariant(ColorToken.Yellow0, OpacityToken.Opacity16),
  errorFaded: generateFadedColorVariant(ColorToken.Red0, OpacityToken.Opacity16),

  positive: ColorToken.Green1,
  negative: ColorToken.Red0,
  positiveDark: ColorToken.Green6,
  negativeDark: ColorToken.Red3,
  positive20: generateFadedColorVariant(ColorToken.Green1, OpacityToken.Opacity20),
  negative20: generateFadedColorVariant(ColorToken.Red0, OpacityToken.Opacity20),
  positive50: generateFadedColorVariant(ColorToken.Green1, OpacityToken.Opacity50),
  negative50: generateFadedColorVariant(ColorToken.Red0, OpacityToken.Opacity50),
  positiveFaded: generateFadedColorVariant(ColorToken.Green1, OpacityToken.Opacity16),
  negativeFaded: generateFadedColorVariant(ColorToken.Red0, OpacityToken.Opacity16),

  riskLow: ColorToken.Green1,
  riskMedium: ColorToken.Yellow0,
  riskHigh: ColorToken.Red0,

  logoFill: ColorToken.White,
  profileYellow: ColorToken.Yellow1,
  profileRed: ColorToken.Red2,

  inputBackground: ColorToken.DarkGray6,
  popoverBackground: ColorToken.DarkGray8,
  toggleBackground: ColorToken.DarkGray6,
  tooltipBackground: ColorToken.DarkGray6,

  hoverFilterBase: BrightnessFilterToken.Lighten10,
  hoverFilterVariant: BrightnessFilterToken.Lighten10,
  activeFilter: BrightnessFilterToken.Darken10,
  overlayFilter: BrightnessFilterToken.Darken30,
});

const LightThemeBase: () => ThemeColorBase = () => ({
  black: '#1a1a1a',
  white: '#ffffff',
  green: '#10b981',
  red: '#ef4444',

  redFaded: generateFadedColorVariant('#ef4444', OpacityToken.Opacity16),
  greenFaded: generateFadedColorVariant('#10b981', OpacityToken.Opacity16),
  whiteFaded: generateFadedColorVariant('#ffffff', OpacityToken.Opacity16),

  layer0: '#f8f9fa',
  layer1: '#ffffff',
  layer2: '#ffffff',
  layer3: '#f1f3f5',
  layer4: '#e9ecef',
  layer5: '#dee2e6',
  layer6: '#f8f9fa',
  layer7: '#ced4da',

  borderDefault: '#e5e7eb',
  borderFaded: generateFadedColorVariant('#e5e7eb', OpacityToken.Opacity50),
  borderDestructive: generateFadedColorVariant('#ef4444', OpacityToken.Opacity20),
  borderButton: generateFadedColorVariant('#1a1a1a', OpacityToken.Opacity10),

  textPrimary: '#1a1a1a',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  textButton: '#ffffff',

  gradientBase0: '#f8f9fa',
  gradientBase1: '#e9ecef',

  accent: '#3b82f6',
  accentFaded: generateFadedColorVariant('#3b82f6', OpacityToken.Opacity16),
  accentMoreFaded: generateFadedColorVariant('#3b82f6', OpacityToken.Opacity8),
  favorite: '#f59e0b',

  success: '#10b981',
  successBackground: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  successFaded: generateFadedColorVariant('#10b981', OpacityToken.Opacity16),
  warningFaded: generateFadedColorVariant('#f59e0b', OpacityToken.Opacity16),
  errorFaded: generateFadedColorVariant('#ef4444', OpacityToken.Opacity16),

  positive: '#10b981',
  negative: '#ef4444',
  positiveDark: '#059669',
  negativeDark: '#dc2626',
  positive20: generateFadedColorVariant('#10b981', OpacityToken.Opacity20),
  negative20: generateFadedColorVariant('#ef4444', OpacityToken.Opacity20),
  positive50: generateFadedColorVariant('#10b981', OpacityToken.Opacity50),
  negative50: generateFadedColorVariant('#ef4444', OpacityToken.Opacity50),
  positiveFaded: generateFadedColorVariant('#10b981', OpacityToken.Opacity16),
  negativeFaded: generateFadedColorVariant('#ef4444', OpacityToken.Opacity16),

  riskLow: '#10b981',
  riskMedium: '#f59e0b',
  riskHigh: '#ef4444',

  logoFill: '#1a1a1a',
  profileYellow: '#f59e0b',
  profileRed: '#ef4444',

  inputBackground: '#f9fafb',
  popoverBackground: '#ffffff',
  toggleBackground: '#f3f4f6',
  tooltipBackground: '#1f2937',

  hoverFilterBase: BrightnessFilterToken.Darken5,
  hoverFilterVariant: BrightnessFilterToken.Lighten10,
  activeFilter: BrightnessFilterToken.Darken10,
  overlayFilter: BrightnessFilterToken.Darken10,
});

const generateTheme = (themeBase: () => ThemeColorBase): Theme => {
  const themeColors = themeBase();

  return {
    [AppColorMode.GreenUp]: themeColors,
    [AppColorMode.RedUp]: {
      ...themeColors,
      // #InvertDirectionalColors
      positive: themeColors.negative,
      negative: themeColors.positive,
      positiveDark: themeColors.negativeDark,
      negativeDark: themeColors.positiveDark,
      positiveFaded: themeColors.negativeFaded,
      negativeFaded: themeColors.positiveFaded,
    },
  };
};

export const Themes = {
  [AppTheme.Classic]: generateTheme(ClassicThemeBase),
  [AppTheme.Dark]: generateTheme(DarkThemeBase),
  [AppTheme.Light]: generateTheme(LightThemeBase),
};
