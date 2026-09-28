/*

SPDX-FileCopyrightText: © 2023 Dai Foundation <www.daifoundation.org>

SPDX-License-Identifier: AGPL-3.0-or-later

*/

import { mainnetPublicClient, tenderly, tenderlyPublicClient } from 'modules/wagmi/config/config.default';
import { Abi, BaseError } from 'viem';

// DSChief's MAX_YAYS: set in its constructor, with no setter. Check it before pointing the portal at a
// different Chief, since getSlateAddresses reads at most this many spells from a slate.
export const CHIEF_MAX_YAYS = 5;

// Out-of-bounds slates() reads hit INVALID (Solidity 0.4's array bounds check). Nodes report it as an
// EVM error rather than a revert, and the message differs by client. A revert doesn't count: this Chief
// never reverts on these reads, and viem reports a provider's generic -32603 error as one.
function isOutOfBounds(error: unknown): boolean {
  return (
    error instanceof BaseError &&
    !!error.walk(e => e instanceof BaseError && /invalid ?(fe)?opcode|badinstruction/i.test(e.details))
  );
}

// A slate's hash is keccak256 of its spells (DSChief's etch), so a hash can only ever hold one list and a
// slate that's been read never goes stale. Caching the pending read also makes every delegate on the same
// slate share one read: fetchDelegatesExecSupport asks for each delegate's slate, and ~260 voting delegates
// share ~100 slates. A failed read is dropped, so the next call retries it.
const slateCache = new Map<string, Promise<string[]>>();

export function getSlateAddresses(
  chainId: number,
  address: `0x${string}`,
  abi: Abi,
  slateHash: `0x${string}`
): Promise<string[]> {
  const key = `${chainId}:${address.toLowerCase()}:${slateHash.toLowerCase()}`;
  const cached = slateCache.get(key);
  if (cached) return cached;

  const read = readSlate(chainId, address, abi, slateHash);
  slateCache.set(key, read);
  read.catch(() => slateCache.delete(key));
  return read;
}

// DSChief has no length() getter, so read every index a slate can hold in parallel (sent together in one
// JSON-RPC batch) and keep the reads before the first out-of-bounds one. A multicall can't be used: the
// INVALID opcode burns all the gas and fails the whole batch. Any other error is thrown instead of
// returning a partial slate.
async function readSlate(
  chainId: number,
  address: `0x${string}`,
  abi: Abi,
  slateHash: `0x${string}`
): Promise<string[]> {
  const publicClient = chainId === tenderly.id ? tenderlyPublicClient : mainnetPublicClient;

  const results = await Promise.allSettled(
    Array.from({ length: CHIEF_MAX_YAYS }, (_, i) =>
      publicClient.readContract({ address, abi, functionName: 'slates', args: [slateHash, BigInt(i)] })
    )
  );

  const yays: string[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      yays.push(result.value as string);
      continue;
    }
    if (isOutOfBounds(result.reason)) break;
    throw result.reason;
  }
  return yays;
}
