import { createTheme } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';

export type ThemeModeValue = 'light' | 'dark';

export interface CreateAppThemeOptions {
  mode: ThemeModeValue;
}

/** Monospace stack reserved for version tags and numeric metrics. */
export const fontFamilyMono =
  'ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, monospace';

const fontFamilySans =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", ' +
  'Arial, sans-serif';

const ACCENT_LIGHT = '#5c7cfa';
const SUCCESS_DARK = '#37b24d';

/**
 * Brand palette (light mode): a deep teal-green (`brand-500`) over warm cream,
 * with a gold accent. The brand green is reserved for emphasis (actions, key
 * borders); warm neutrals carry the surfaces. Three greens are kept deliberately
 * distinct: brand green (chrome / actions), a brighter status teal (the unseen
 * dot + accent edge), and an unrelated hue for errors/warnings.
 */
const BRAND = {
  green: '#1c302e', // brand-500 — primary
  greenDark: '#162826',
  teal: '#377076', // primary.light
  statusTeal: '#448a8e', // unseen / status — distinct from brand green
  gold: '#886314', // secondary, used sparingly
  goldLight: '#b89f5e',
  goldDark: '#5f4510',
  cream: '#f1ebe4', // page background
  paper: '#ffffff',
  divider: '#ded4c9',
  text: '#162826',
  textMuted: '#6b6155',
} as const;

const lightPalette = {
  mode: 'light' as const,
  primary: {
    main: BRAND.green,
    light: BRAND.teal,
    dark: BRAND.greenDark,
    contrastText: BRAND.cream,
  },
  secondary: {
    main: BRAND.gold,
    light: BRAND.goldLight,
    dark: BRAND.goldDark,
    contrastText: BRAND.cream,
  },
  // Semantic colors read as plain green / yellow / red — they drive the
  // sync-freshness dot (fresh / stale / old) and the unseen accent edge.
  success: { main: '#2f9e44' },
  warning: { main: '#d99e1f' },
  error: { main: '#c0392b' },
  info: { main: BRAND.teal },
  background: { default: BRAND.cream, paper: BRAND.paper },
  divider: BRAND.divider,
  text: { primary: BRAND.text, secondary: BRAND.textMuted },
  grey: {
    50: '#f8f5f0',
    100: '#f4efe9',
    200: '#f0eae3',
    300: '#e8ded3',
    400: '#ded4c9',
    500: '#d0c2b3',
    600: '#b8a88f',
    700: '#8c7a64',
    800: '#3f3730',
    900: '#1f1d1e',
  },
};

const darkPalette = {
  mode: 'dark' as const,
  primary: { main: ACCENT_LIGHT },
  success: { main: SUCCESS_DARK },
  background: { default: '#0d1117', paper: '#161b22' },
  divider: 'rgba(255, 255, 255, 0.12)',
  text: { primary: '#e6edf3', secondary: '#9098a3' },
};

/**
 * Single source of truth for the app's MUI theme, parameterized by `mode`
 * (light/dark). The design is compact-by-default and "hard": sharp 2px corners,
 * flat surfaces defined by 1px borders and contrast rather than shadow. A
 * monospace token (`fontFamilyMono`) is reserved for version tags and metrics.
 */
export const createAppTheme = ({ mode }: CreateAppThemeOptions): Theme => {
  const palette = mode === 'dark' ? darkPalette : lightPalette;
  const borderColor = palette.divider;

  return createTheme({
    palette,
    spacing: 4,
    shape: { borderRadius: 2 },
    // The mobile/desktop switch (hamburger header + stacked toolbar) keys off
    // `md`; set it to 768 so that is the mobile breakpoint.
    breakpoints: { values: { xs: 0, sm: 600, md: 768, lg: 1200, xl: 1536 } },
    typography: {
      fontFamily: fontFamilySans,
      fontSize: 13,
      h6: { fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.25 },
      subtitle1: { fontSize: '0.95rem', fontWeight: 600, lineHeight: 1.3 },
      subtitle2: { fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.3 },
      body1: { fontSize: '0.875rem', lineHeight: 1.4 },
      body2: { fontSize: '0.8125rem', lineHeight: 1.4 },
      caption: { fontSize: '0.75rem', lineHeight: 1.35 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
      MuiButton: {
        defaultProps: { size: 'small', disableElevation: true },
        styleOverrides: { root: { boxShadow: 'none' } },
      },
      MuiIconButton: { defaultProps: { size: 'small' } },
      MuiTextField: { defaultProps: { size: 'small' } },
      MuiChip: {
        defaultProps: { size: 'small' },
        styleOverrides: { root: { borderRadius: 2 } },
      },
      MuiTable: { defaultProps: { size: 'small' } },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: { root: { backgroundImage: 'none' } },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: { backgroundImage: 'none', border: `1px solid ${borderColor}` },
        },
      },
      MuiAppBar: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderBottom: `1px solid ${borderColor}`,
          },
        },
      },
      MuiToggleButton: {
        styleOverrides: { root: { borderRadius: 2 } },
      },
      MuiTooltip: {
        styleOverrides: { tooltip: { borderRadius: 2, fontSize: '0.7rem' } },
      },
    },
  });
};
