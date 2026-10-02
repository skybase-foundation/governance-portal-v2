/*

SPDX-FileCopyrightText: © 2023 Dai Foundation <www.daifoundation.org>

SPDX-License-Identifier: AGPL-3.0-or-later

*/

import { fetchMkrInChief } from 'modules/executive/api/fetchMkrInChief';
import { SupportedNetworks } from 'modules/web3/constants/networks';
import { formatValue } from 'lib/string';
import { SkyProposal } from 'modules/executive/types';
import { fetchJson } from 'lib/fetchJson';
import type { SkyPoll } from 'modules/polling/components/SkyPollOverviewCard';
import type { SkyPollsResponse } from 'pages/api/sky/polls';

export type LandingPageData = {
  skyExecutive?: SkyProposal;
  skyHatInfo?: { hatAddress: string; skyOnHat: string };
  skyPolls?: SkyPoll[];
  mkrInChief?: string;
};

async function fetchSkyExecutivesDirectly() {
  try {
    const response = await fetch('https://vote.sky.money/api/executive?start=0&limit=1', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch Sky executives:', response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching Sky executives:', error);
    return null;
  }
}

async function fetchSkyHatDirectly() {
  try {
    const response = await fetch('https://vote.sky.money/api/executive/hat', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch Sky hat:', response.status);
      return null;
    }

    const data = await response.json();
    return {
      hatAddress: data.hatAddress,
      skyOnHat: data.skyOnHat
    };
  } catch (error) {
    console.error('Error fetching Sky hat:', error);
    return null;
  }
}

async function fetchSkyPollsDirectly() {
  try {
    const response = await fetch(
      'https://vote.sky.money/api/polling/all-polls-with-tally?pageSize=2&page=1',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch Sky polls:', response.status);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching Sky polls:', error);
    return null;
  }
}

export async function fetchLandingPageData(
  network: SupportedNetworks,
  useApi = false
): Promise<Partial<LandingPageData>> {
  const responses = useApi
    ? await Promise.allSettled([
        fetchMkrInChief(network),
        fetchJson('/api/sky/executives?pageSize=1&page=1').catch(err => {
          console.error('Failed to fetch Sky executives:', err);
          return null;
        }),
        fetchJson('/api/sky/hat').catch(err => {
          console.error('Failed to fetch Sky hat info:', err);
          return null;
        }),
        fetchJson('/api/sky/polls?pageSize=2&page=1').catch(err => {
          console.error('Failed to fetch Sky polls:', err);
          return null;
        })
      ])
    : await Promise.allSettled([
        fetchMkrInChief(network),
        fetchSkyExecutivesDirectly(),
        fetchSkyHatDirectly(),
        fetchSkyPollsDirectly()
      ]);

  // return null for any data we couldn't fetch
  const [mkrInChief, skyExecutives, skyHatInfo, skyPollsData] = responses.map(promise =>
    promise.status === 'fulfilled' ? promise.value : null
  );

  const skyExecutive =
    skyExecutives && Array.isArray(skyExecutives) && skyExecutives.length > 0 ? skyExecutives[0] : undefined;
  const skyPolls =
    skyPollsData && (skyPollsData as SkyPollsResponse)?.polls
      ? (skyPollsData as SkyPollsResponse).polls
      : undefined;

  return {
    skyExecutive,
    skyHatInfo: skyHatInfo as { hatAddress: string; skyOnHat: string } | undefined,
    skyPolls: skyPolls as SkyPoll[] | undefined,
    mkrInChief: mkrInChief ? formatValue(mkrInChief as bigint) : undefined
  };
}
