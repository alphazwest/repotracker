import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Box from '@mui/material/Box';
import { AppThemeProvider, useThemeMode } from './index';

/**
 * Probe that reports the live theme palette mode and offers a button to toggle
 * it, so we can assert the mode switch re-themes the tree.
 */
const ThemeProbe = () => {
  const { mode, toggleMode } = useThemeMode();
  return (
    <Box>
      <span data-testid="mode">{mode}</span>
      <button type="button" onClick={toggleMode}>
        toggle mode
      </button>
    </Box>
  );
};

describe('AppThemeProvider', () => {
  it('toggles palette mode (light/dark) across the tree', async () => {
    const user = userEvent.setup();
    render(
      <AppThemeProvider>
        <ThemeProbe />
      </AppThemeProvider>,
    );

    expect(screen.getByTestId('mode')).toHaveTextContent('light');
    await user.click(screen.getByRole('button', { name: /toggle mode/i }));
    expect(screen.getByTestId('mode')).toHaveTextContent('dark');
  });
});
