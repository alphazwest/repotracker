import type { ReactElement, ReactNode } from 'react';
import { render, type RenderResult } from '@testing-library/react';
import { AppThemeProvider } from '../theme';

/** Render a component inside the app theme (and optional extra wrappers). */
export const renderWithTheme = (
  ui: ReactElement,
  wrapper?: (children: ReactNode) => ReactNode,
): RenderResult =>
  render(<AppThemeProvider>{wrapper ? wrapper(ui) : ui}</AppThemeProvider>);
