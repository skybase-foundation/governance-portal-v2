/*

SPDX-FileCopyrightText: © 2023 Dai Foundation <www.daifoundation.org>

SPDX-License-Identifier: AGPL-3.0-or-later

*/

// Content-Security-Policy for the portal pages. Plain CommonJS because next.config.js requires it.
const crypto = require('crypto');
const { COLOR_MODE_SCRIPT } = require('./colorModeScript');

const COLOR_MODE_SCRIPT_HASH = `'sha256-${crypto
  .createHash('sha256')
  .update(COLOR_MODE_SCRIPT)
  .digest('base64')}'`;

const DEFAULT_PROXY_ORIGIN = 'https://staging-proxy.sky.money';

// connect-src allowlist: hosts the browser talks to directly. Server-side fetches (API routes,
// getStaticProps) are not subject to the CSP and don't belong here.
const CONNECT_SRC_HOSTS = [
  // Poll data read from GitHub, and the polling API
  'https://raw.githubusercontent.com',
  'https://gov-polling.sky.money',
  // Safe transaction service, used to resolve Safe tx hashes
  'https://safe-transaction-mainnet.safe.global',
  'https://safe-transaction-arbitrum.safe.global',
  // ...which now redirect here, and CSP also checks redirect targets
  'https://api.safe.global',
  // MKR liquidity sidebar
  'https://gateway-arbitrum.network.thegraph.com',
  // ENS offchain (CCIP-Read) name lookups go through ENS's batch gateway
  'https://ccip-v2.ens.xyz',
  // WalletConnect relay, verify and wallet explorer APIs
  'https://*.walletconnect.com',
  'wss://*.walletconnect.com',
  'https://*.walletconnect.org',
  'wss://*.walletconnect.org',
  'https://api.web3modal.org',
  // Coinbase Wallet SDK: WalletLink relay socket, plus HTTPS polling for events missed while it was down
  'https://*.coinbase.com',
  'https://www.walletlink.org',
  'wss://www.walletlink.org',
  // MetaMask SDK
  'https://*.metamask.io',
  'wss://*.metamask.io'
];

// Tenderly vnets (RPC_TENDERLY, and the fork in tenderlyTestnetData.json used by `dev:mock`)
const TENDERLY_ORIGINS = ['https://*.rpc.tenderly.co'];
// Polling API used by the Tenderly chain and by `NEXT_PUBLIC_VERCEL_ENV=development` builds
const STAGING_POLLING_API_ORIGIN = 'https://staging-gov-polling.sky.money';
// viem's default Arbitrum Sepolia RPC, used when NEXT_PUBLIC_RPC_ARBITRUM_TESTNET is unset
const DEFAULT_ARBITRUM_TESTNET_RPC = 'https://sepolia-rollup.arbitrum.io/rpc';

const originOf = url => {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
};

// Every RPC and indexer call goes through the proxy, so a malformed value has to fail the build
// rather than silently drop the proxy from connect-src.
const proxyOrigin = env => {
  const origin = originOf(env.NEXT_PUBLIC_PROXY_ORIGIN || DEFAULT_PROXY_ORIGIN);
  if (!origin) {
    throw new Error(`NEXT_PUBLIC_PROXY_ORIGIN is not a valid URL: ${env.NEXT_PUBLIC_PROXY_ORIGIN}`);
  }
  return origin;
};

/**
 * @param {object} options
 * @param {boolean} options.dev `next dev`: allows eval and inline scripts for hot reloading, and
 *   plain http/ws connections to local nodes and indexers (localhost and 127.0.0.1).
 * @param {boolean} options.testChains Build that exposes the Tenderly and Arbitrum testnet chains.
 * @param {object} options.env Environment to read the RPC origins from.
 */
function buildContentSecurityPolicy({ dev, testChains, env }) {
  const directives = {
    'default-src': ["'self'"],
    // With a hash in the list browsers ignore 'unsafe-inline', so dev gets one or the other.
    // cdn.vercel-insights.com only serves the debug analytics script, which loads in dev.
    'script-src': dev
      ? ["'self'", "'unsafe-eval'", "'unsafe-inline'", 'https://cdn.vercel-insights.com']
      : ["'self'", COLOR_MODE_SCRIPT_HASH],
    'style-src': ["'self'", "'unsafe-inline'"],
    // blob: for the wallet icons the WalletConnect modal renders from fetched images
    'img-src': ["'self'", 'https:', 'data:', 'blob:'],
    'font-src': ["'self'", 'data:'],
    'connect-src': [
      "'self'",
      proxyOrigin(env),
      ...CONNECT_SRC_HOSTS,
      ...(testChains
        ? [
            ...TENDERLY_ORIGINS,
            STAGING_POLLING_API_ORIGIN,
            originOf(env.NEXT_PUBLIC_RPC_ARBITRUM_TESTNET || DEFAULT_ARBITRUM_TESTNET_RPC)
          ]
        : []),
      ...(dev ? ['http://localhost:*', 'ws://localhost:*', 'http://127.0.0.1:*', 'ws://127.0.0.1:*'] : [])
    ],
    'frame-src': [
      'https://player.vimeo.com',
      'https://verify.walletconnect.com',
      'https://verify.walletconnect.org'
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    // Only the portal itself and the Safe{Wallet} app (the portal runs as a Safe App) may frame it.
    'frame-ancestors': ["'self'", 'https://app.safe.global']
  };

  return Object.entries(directives)
    .map(([directive, sources]) => `${directive} ${sources.filter(Boolean).join(' ')}`)
    .join('; ');
}

module.exports = { buildContentSecurityPolicy };
