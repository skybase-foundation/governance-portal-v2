/*

SPDX-FileCopyrightText: © 2023 Dai Foundation <www.daifoundation.org>

SPDX-License-Identifier: AGPL-3.0-or-later

*/

// Origin of the proxy that serves RPC and indexer traffic, without a trailing slash. next.config.js fails
// the build when NEXT_PUBLIC_PROXY_ORIGIN is not an http(s) URL, or when it is unset and
// NEXT_PUBLIC_VERCEL_ENV is production. Every other build and the dev server fall back to the staging proxy.
export const PROXY_ORIGIN = (process.env.NEXT_PUBLIC_PROXY_ORIGIN || 'https://staging-proxy.sky.money').replace(
  /\/+$/,
  ''
);
