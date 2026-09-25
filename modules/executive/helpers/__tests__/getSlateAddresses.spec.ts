/*

SPDX-FileCopyrightText: © 2026 Dai Foundation <www.daifoundation.org>

SPDX-License-Identifier: AGPL-3.0-or-later

*/

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseError, HttpRequestError } from 'viem';
import { getSlateAddresses, CHIEF_MAX_YAYS } from '../getSlateAddresses';
import { mainnetPublicClient } from 'modules/wagmi/config/config.default';
import { chiefAbi } from 'modules/contracts/generated';

vi.mock('modules/wagmi/config/config.default', () => ({
  mainnetPublicClient: { readContract: vi.fn() },
  tenderlyPublicClient: { readContract: vi.fn() },
  tenderly: { id: 314310 }
}));

const CHIEF = '0x0a3f6849f78076aefaDf113F5BED87720274dDC0';
const SLATE = '0xd6182083f5caf68c9a8e15cde248c1f265ab9b421c2359cc7436ae7f4bab0d37';
const SPELL_A = '0xe751BF33164b8786C71D59c48F668d22408e142D';
const SPELL_B = '0x86d6CdD0D259AAAfb8134D47464b77743F50380B';

// How the proxy RPC reports an out-of-bounds slates() read
const outOfBounds = () => new BaseError('Execution failed', { details: 'EVM error: InvalidFEOpcode' });
const readContract = vi.mocked(mainnetPublicClient.readContract);

// Answers slates(slate, i) from a per-index list of results
function mockSlate(...reads: (string | Error)[]) {
  readContract.mockImplementation((async ({ args }: { args: [string, bigint] }) => {
    const read = reads[Number(args[1])] ?? outOfBounds();
    if (read instanceof Error) throw read;
    return read;
  }) as never);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getSlateAddresses', () => {
  it('reads every index the slate can hold in parallel and stops at the first out-of-bounds read', async () => {
    mockSlate(SPELL_A, SPELL_B);

    await expect(getSlateAddresses(1, CHIEF, chiefAbi, SLATE)).resolves.toEqual([SPELL_A, SPELL_B]);
    expect(readContract).toHaveBeenCalledTimes(CHIEF_MAX_YAYS);
  });

  it('returns an empty list for an empty slate', async () => {
    mockSlate();

    await expect(getSlateAddresses(1, CHIEF, chiefAbi, SLATE)).resolves.toEqual([]);
  });

  it("recognises geth's invalid opcode message", async () => {
    mockSlate(SPELL_A, new BaseError('Execution failed', { details: 'invalid opcode: INVALID' }));

    await expect(getSlateAddresses(1, CHIEF, chiefAbi, SLATE)).resolves.toEqual([SPELL_A]);
  });

  it('throws instead of returning a partial slate when a read inside the slate fails', async () => {
    mockSlate(SPELL_A, new HttpRequestError({ url: 'https://rpc', status: 503 }), SPELL_B);

    await expect(getSlateAddresses(1, CHIEF, chiefAbi, SLATE)).rejects.toThrow(HttpRequestError);
  });

  it('ignores errors after the end of the slate', async () => {
    mockSlate(SPELL_A, outOfBounds(), new HttpRequestError({ url: 'https://rpc', status: 503 }));

    await expect(getSlateAddresses(1, CHIEF, chiefAbi, SLATE)).resolves.toEqual([SPELL_A]);
  });
});
