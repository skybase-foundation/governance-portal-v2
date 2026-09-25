import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchLandingPageData } from '../fetchLandingPageData';
import { SupportedNetworks } from 'modules/web3/constants/networks';

vi.mock('modules/executive/api/fetchMkrInChief', () => ({
  fetchMkrInChief: vi.fn().mockResolvedValue(0n)
}));

const hatResponse = {
  hatAddress: '0x86d6CdD0D259AAAfb8134D47464b77743F50380B',
  skyOnHat: '6946944010157658258547828569',
  network: 'mainnet'
};

describe('fetchLandingPageData', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads skyOnHat from the Sky hat response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => ({
        ok: true,
        json: async () => (url.includes('/api/executive/hat') ? hatResponse : [])
      }))
    );

    const { skyHatInfo } = await fetchLandingPageData(SupportedNetworks.MAINNET);

    expect(skyHatInfo).toEqual({
      hatAddress: hatResponse.hatAddress,
      skyOnHat: hatResponse.skyOnHat
    });
  });
});
