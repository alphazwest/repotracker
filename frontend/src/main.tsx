import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AppProviders } from './app';

/**
 * App entry. Mounts <App /> inside the shared provider stack: Apollo Client
 * (data + normalized cache), the MUI theme, and toast feedback.
 */

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found in index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
);
