/*

SPDX-FileCopyrightText: © 2026 Dai Foundation <www.daifoundation.org>

SPDX-License-Identifier: AGPL-3.0-or-later

*/

import { Mock, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchEnsAvatar } from 'modules/address/api/fetchEnsAvatar';
import handler from '../[name]';

vi.mock('modules/address/api/fetchEnsAvatar', async importOriginal => ({
  ...(await importOriginal<typeof import('modules/address/api/fetchEnsAvatar')>()),
  fetchEnsAvatar: vi.fn()
}));

function mockRes() {
  const res: any = { headers: {} as Record<string, string> };
  res.setHeader = vi.fn((key: string, value: string) => {
    res.headers[key] = value;
    return res;
  });
  res.status = vi.fn((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json = vi.fn(() => res);
  res.send = vi.fn(() => res);
  return res as NextApiResponse & { headers: Record<string, string>; statusCode: number };
}

function mockReq(name: string) {
  return { method: 'GET', query: { name }, url: `/api/avatar/${name}` } as unknown as NextApiRequest;
}

describe('/api/avatar/[name]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('serves the avatar from our origin with a locked-down CSP', async () => {
    const body = Buffer.from([1, 2, 3]);
    (fetchEnsAvatar as Mock).mockResolvedValue({ contentType: 'image/svg+xml', body });
    const res = mockRes();

    await handler(mockReq('Nick.eth'), res);

    expect(fetchEnsAvatar).toHaveBeenCalledWith('nick.eth');
    expect(res.statusCode).toBe(200);
    expect(res.send).toHaveBeenCalledWith(body);
    expect(res.headers['Content-Type']).toBe('image/svg+xml');
    expect(res.headers['X-Content-Type-Options']).toBe('nosniff');
    expect(res.headers['Content-Security-Policy']).toContain('sandbox');
  });

  it('returns 404 when there is no usable avatar', async () => {
    (fetchEnsAvatar as Mock).mockResolvedValue(null);
    const res = mockRes();

    await handler(mockReq('nobody.eth'), res);

    expect(res.statusCode).toBe(404);
  });

  it('returns 400 for an invalid name without fetching', async () => {
    const res = mockRes();

    await handler(mockReq('not-a-name'), res);

    expect(res.statusCode).toBe(400);
    expect(fetchEnsAvatar).not.toHaveBeenCalled();
  });

  it('returns 500 when the metadata service fails', async () => {
    (fetchEnsAvatar as Mock).mockRejectedValue(new Error('timeout'));
    const res = mockRes();

    await handler(mockReq('nick.eth'), res);

    expect(res.statusCode).toBe(500);
  });
});
