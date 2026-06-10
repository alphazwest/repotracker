import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useLocalStorage, STORAGE_KEYS } from '../hooks';
import { createAppTheme, type ThemeModeValue } from './createAppTheme';

export interface ThemeModeContextValue {
  mode: ThemeModeValue;
  toggleMode: () => void;
}

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

interface AppThemeProviderProps {
  children: ReactNode;
  initialMode?: ThemeModeValue;
}

/**
 * Owns theme `mode` state (persisted to localStorage), builds the MUI theme from
 * it, and provides both the toggle (via context) and the themed tree (via MUI
 * ThemeProvider + CssBaseline). A single switch here re-themes the whole app.
 */
export const AppThemeProvider = ({
  children,
  initialMode = 'light',
}: AppThemeProviderProps) => {
  const [mode, setMode] = useLocalStorage<ThemeModeValue>(
    STORAGE_KEYS.themeMode,
    initialMode,
  );

  const theme = useMemo(() => createAppTheme({ mode }), [mode]);

  const value = useMemo<ThemeModeContextValue>(
    () => ({
      mode,
      toggleMode: () => setMode(mode === 'light' ? 'dark' : 'light'),
    }),
    [mode, setMode],
  );

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
};

export const useThemeMode = (): ThemeModeContextValue => {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) {
    throw new Error('useThemeMode must be used within an AppThemeProvider');
  }
  return ctx;
};
