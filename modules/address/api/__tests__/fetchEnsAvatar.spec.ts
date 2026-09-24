/*

SPDX-FileCopyrightText: © 2026 Dai Foundation <www.daifoundation.org>

SPDX-License-Identifier: AGPL-3.0-or-later

*/

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ENS_AVATAR_ORIGIN, MAX_AVATAR_BYTES, fetchEnsAvatar, normalizeEnsName } from '../fetchEnsAvatar';

const fetchMock = vi.fn();

function imageResponse(body: Uint8Array, headers: Record<string, string>, status = 200) {
  return new Response(body, { status, headers });
}

describe('normalizeEnsName', () => {
  it('normalizes a valid name', () => {
    expect(normalizeEnsName('Nick.ETH')).toBe('nick.eth');
  });

  it('rejects empty, dotless, overlong and invalid names', () => {
    expect(normalizeEnsName('')).toBeNull();
    expect(normalizeEnsName('nick')).toBeNull();
    expect(normalizeEnsName(`${'a'.repeat(256)}.eth`)).toBeNull();
    expect(normalizeEnsName('bad\u0000name.eth')).toBeNull();
  });
});

describe('fetchEnsAvatar', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('only requests the ENS metadata service and refuses redirects', async () => {
    fetchMock.mockResolvedValue(imageResponse(new Uint8Array([1, 2, 3]), { 'content-type': 'image/png' }));

    await fetchEnsAvatar('nick.eth');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${ENS_AVATAR_ORIGIN}/mainnet/avatar/nick.eth`);
    expect(init.redirect).toBe('error');
  });

  it('returns the image bytes and content type', async () => {
    fetchMock.mockResolvedValue(
      imageResponse(new Uint8Array([1, 2, 3]), { 'content-type': 'image/jpeg; charset=binary' })
    );

    const avatar = await fetchEnsAvatar('nick.eth');

    expect(avatar?.contentType).toBe('image/jpeg');
    expect([...(avatar?.body || [])]).toEqual([1, 2, 3]);
  });

  it('returns null when the name has no avatar', async () => {
    fetchMock.mockResolvedValue(
      new Response('{"message":"not found"}', { status: 404, headers: { 'content-type': 'application/json' } })
    );

    expect(await fetchEnsAvatar('nobody.eth')).toBeNull();
  });

  it('returns null for a non-image response', async () => {
    fetchMock.mockResolvedValue(imageResponse(new Uint8Array([60]), { 'content-type': 'text/html' }));

    expect(await fetchEnsAvatar('nick.eth')).toBeNull();
  });

  it('returns null when the declared or actual size is over the limit', async () => {
    fetchMock.mockResolvedValueOnce(
      imageResponse(new Uint8Array([1]), {
        'content-type': 'image/png',
        'content-length': String(MAX_AVATAR_BYTES + 1)
      })
    );
    expect(await fetchEnsAvatar('nick.eth')).toBeNull();

    fetchMock.mockResolvedValueOnce(
      imageResponse(new Uint8Array(MAX_AVATAR_BYTES + 1), { 'content-type': 'image/png' })
    );
    expect(await fetchEnsAvatar('nick.eth')).toBeNull();
  });
});
