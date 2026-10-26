/*

SPDX-FileCopyrightText: © 2023 Dai Foundation <www.daifoundation.org>

SPDX-License-Identifier: AGPL-3.0-or-later

*/

import { PROXY_ORIGIN } from 'modules/app/constants/proxy';

/* Spock URLs */
export const LOCAL_SPOCK_URL = 'http://localhost:3001/v1';
export const STAGING_MAINNET_SPOCK_URL = 'https://staging-gov-polling.sky.money/api/v1';
export const MAINNET_SPOCK_URL = 'https://gov-polling.sky.money/api/v1';
export const TENDERLY_SPOCK_URL = 'https://staging-gov-polling.sky.money/api/v1';

/* Subgraph URLs (Envio HyperIndex) */

const ENVIO_SUBGRAPH_URL = `${PROXY_ORIGIN}/indexer`;
export const STAGING_SUBGRAPH_URL = ENVIO_SUBGRAPH_URL;
export const PROD_SUBGRAPH_URL = ENVIO_SUBGRAPH_URL;

export enum QueryFilterNames {
  Active = 'active',
  PollId = 'pollId',
  Range = 'range',
  MultiHash = 'multiHash'
}

export const sealEngineAddressTestnet = '0x9581c795dbcaf408e477f6f1908a41be43093122';
export const sealEngineAddressMainnet = '0x2b16c07d5fd5cc701a0a871eae2aad6da5fc8f12';
