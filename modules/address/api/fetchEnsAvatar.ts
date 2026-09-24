/*

SPDX-FileCopyrightText: © 2026 Dai Foundation <www.daifoundation.org>

SPDX-License-Identifier: AGPL-3.0-or-later

*/

import { normalize } from 'viem/ens';

// The ENS metadata service resolves the avatar record (https, ipfs, NFT) on its side and
// returns the image bytes, so it is the only origin we ever contact for an avatar.
export const ENS_AVATAR_ORIGIN = 'https://metadata.ens.domains';

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 5000;
const MAX_NAME_LENGTH = 255;

const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/svg+xml'
];

export type EnsAvatar = { contentType: string; body: Buffer };

export function normalizeEnsName(name: string): string | null {
  if (!name || name.length > MAX_NAME_LENGTH || !name.includes('.')) return null;
  try {
    return normalize(name);
  } catch {
    return null;
  }
}

// Returns null when the name has no usable avatar. Throws on timeouts and network errors.
export async function fetchEnsAvatar(name: string): Promise<EnsAvatar | null> {
  const url = `${ENS_AVATAR_ORIGIN}/mainnet/avatar/${encodeURIComponent(name)}`;
  const res = await fetch(url, {
    // Never follow a redirect to an origin that is not on the allowlist
    redirect: 'error',
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
  });

  if (!res.ok) return null;

  const contentType = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (!ALLOWED_CONTENT_TYPES.includes(contentType)) return null;

  const declaredLength = Number(res.headers.get('content-length'));
  if (declaredLength > MAX_AVATAR_BYTES) return null;

  const body = Buffer.from(await res.arrayBuffer());
  if (body.length > MAX_AVATAR_BYTES) return null;

  return { contentType, body };
}
