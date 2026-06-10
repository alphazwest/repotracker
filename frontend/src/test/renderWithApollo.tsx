import type { ReactElement } from 'react';
import { render, type RenderResult } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react';
import type { MockLink } from '@apollo/client/testing';
import { AppThemeProvider } from '../theme';
import { ToastProvider } from '../lib/toast';

export type RepoMock = MockLink.MockedResponse;

export interface RenderWithApolloOptions {
  mocks?: ReadonlyArray<RepoMock>;
}

/**
 * Render a component with GraphQL mocked at the Apollo client boundary, inside
 * the app theme + toast providers. The single composition used by the feature
 * functional tests; no live backend is involved.
 */
export const renderWithApollo = (
  ui: ReactElement,
  { mocks = [] }: RenderWithApolloOptions = {},
): RenderResult =>
  render(
    <MockedProvider mocks={mocks}>
      <AppThemeProvider>
        <ToastProvider>{ui}</ToastProvider>
      </AppThemeProvider>
    </MockedProvider>,
  );
