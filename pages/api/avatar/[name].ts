/*

SPDX-FileCopyrightText: © 2026 Dai Foundation <www.daifoundation.org>

SPDX-License-Identifier: AGPL-3.0-or-later

*/

import { NextApiRequest, NextApiResponse } from 'next';
import withApiHandler from 'modules/app/api/withApiHandler';
import { ApiError } from 'modules/app/api/ApiError';
import { fetchEnsAvatar, normalizeEnsName } from 'modules/address/api/fetchEnsAvatar';

// Serves ENS avatars from our own origin so the browser never requests an image
// from an arbitrary host set in someone's ENS avatar record.
export default withApiHandler(async (req: NextApiRequest, res: NextApiResponse) => {
  const name = normalizeEnsName(req.query.name as string);
  if (!name) {
    throw new ApiError('Invalid ENS name', 400, 'Invalid ENS name');
  }

  const avatar = await fetchEnsAvatar(name);

  if (!avatar) {
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=3600');
    return res.status(404).json({ error: { message: 'Avatar not found' } });
  }

  res.setHeader('Content-Type', avatar.contentType);
  res.setHeader('Content-Length', avatar.body.length.toString());
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // SVGs can carry scripts, so a direct visit to this URL must not run anything on our origin
  res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400');
  return res.status(200).send(avatar.body);
});
