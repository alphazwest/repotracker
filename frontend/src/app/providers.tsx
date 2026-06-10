import type { ReactNode } from 'react';
import { ApolloProvider } from '@apollo/client/react';
import { apolloClient } from '../lib/apollo';
import { AppThemeProvider } from '../theme';
import { ToastProvider } from '../lib/toast';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * The application provider stack, composed once and mounted at the root
 * (see `main.tsx`). Order: Apollo (data) → Theme (mode/density) → Toast
 * (action/error feedback). Tests can compose a subset directly instead of
 * using this root.
 */
export const AppProviders = ({ children }: AppProvidersProps) => (
  <ApolloProvider client={apolloClient}>
    <AppThemeProvider>
      <ToastProvider>{children}</ToastProvider>
    </AppThemeProvider>
  </ApolloProvider>
);
