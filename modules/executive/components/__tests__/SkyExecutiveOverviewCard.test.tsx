import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'theme-ui';
import { parseEther } from 'viem';
import theme from 'lib/theme';
import SkyExecutiveOverviewCard from '../SkyExecutiveOverviewCard';
import SkyExecutiveOverviewCardLanding from '../SkyExecutiveOverviewCardLanding';
import { SkyProposal } from 'modules/executive/types';

const proposal = {
  title: 'Sep 24 executive',
  proposalBlurb: 'Blurb',
  key: 'sep-24',
  address: '0xF01b594aF26fC8A8ae1e24DCaF904ECB6Fd1BaDC',
  date: '2026-09-24T00:00:00.000Z',
  active: true,
  proposalLink: 'https://example.com/sep-24.md',
  spellData: {
    hasBeenCast: false,
    hasBeenScheduled: false,
    expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    // The executive list API returns skySupport in SKY, not wei
    skySupport: '719873992.828063415720552885',
    executiveHash: '0xabcdef',
    officeHours: true
  }
} as unknown as SkyProposal;

const skyOnHat = parseEther('6946943699.418492723066348245');

describe.each([
  ['SkyExecutiveOverviewCard', SkyExecutiveOverviewCard],
  ['SkyExecutiveOverviewCardLanding', SkyExecutiveOverviewCardLanding]
])('%s', (_, Card) => {
  it('shows the SKY needed to pass from a SKY support value and a wei hat value', () => {
    render(
      <ThemeProvider theme={theme}>
        <Card proposal={proposal} isHat={false} skyOnHat={skyOnHat} />
      </ThemeProvider>
    );

    expect(screen.getByText('719,873,992')).toBeInTheDocument();
    expect(screen.getByText(/6,227,069,707 additional SKY support needed to pass/)).toBeInTheDocument();
  });
});
