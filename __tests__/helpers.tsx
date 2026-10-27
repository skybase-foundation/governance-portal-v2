import { render, RenderResult } from '@testing-library/react';
import { ThemeUIProvider } from 'theme-ui';
import theme from 'lib/theme';
import React from 'react';
import { vi } from 'vitest';
import { mockWagmiConfig } from 'modules/wagmi/config/config.e2e';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { wagmiConfigDev } from 'modules/wagmi/config/config.default';

export function renderWithTheme(component: React.ReactNode): RenderResult {
  const queryClient = new QueryClient();

  return render(
    <WagmiProvider config={mockWagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {/* @ts-expect-error - Incompatible pointer events */}
        <ThemeUIProvider theme={theme}>{component}</ThemeUIProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export function renderWithRealWagmiConnector(component: React.ReactNode): RenderResult {
  const queryClient = new QueryClient();

  return render(
    <WagmiProvider config={wagmiConfigDev}>
      <QueryClientProvider client={queryClient}>
        {/* @ts-expect-error - Incompatible pointer events */}
        <ThemeUIProvider theme={theme}>{component}</ThemeUIProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

// Vitest 4 only lets `vi.fn()` be called with `new` when its implementation
// is a `function` or `class`, so this can't be an arrow function.
export const mockIntersectionObserver = vi.fn(function () {
  return {
    root: null,
    rootMargin: '600px',
    thresholds: [1],
    disconnect: vi.fn(),
    observe: vi.fn(),
    unobserve: vi.fn(),
    takeRecords: vi.fn()
  };
});
