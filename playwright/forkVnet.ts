/**
 * Fork a new tenderly testnet at the start of each test file and delete it at the end of the file. And set balances.
 * This file has to be imported in every e2e test file that you want it to run on.
 */
import { test } from '@playwright/test';
import { writeFile, readFile } from 'fs/promises';
import dotenv from 'dotenv';
import { parseEther, parseUnits, toHex } from 'viem';
import { TEST_ACCOUNTS } from './shared';
import { mockRpcCalls } from './mock-rpc-call';

dotenv.config();

const displayName = process.env.CI ? 'ci-tests-testnet' : 'local-tests-testnet';
const RPC_READY_RETRIES = 5;

const sendTenderlyRpc = async (rpcUrl: string, body: Record<string, unknown>) => {
  let lastError = 'unknown error';

  for (let attempt = 1; attempt <= RPC_READY_RETRIES; attempt++) {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        accept: '*/*',
        'content-type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    const result = await response.json();

    if (response.ok && !result.error) return;

    lastError = result.error?.message || `${response.status} ${response.statusText}`;
    if (attempt < RPC_READY_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, attempt * 1000));
    }
  }

  throw new Error(`Tenderly RPC failed after ${RPC_READY_RETRIES} attempts: ${lastError}`);
};

test.beforeAll(async () => {
  await forkVnet(displayName);
  const address = TEST_ACCOUNTS.normal.address;
  await new Promise(resolve => setTimeout(resolve, 5000));
  await setEthBalance(address, '100');
  await setErc20Balance(address, '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2', '150001', 18); //fund MKR balance
});

test.beforeEach(async ({ page }) => {
  const file = await readFile('./tenderlyTestnetData.json', 'utf-8');
  const { TENDERLY_RPC_URL } = JSON.parse(file);
  await page.route(TENDERLY_RPC_URL, mockRpcCalls);
});

// test.afterAll(async () => {
//   await deleteVnet();
// });

export const setEthBalance = async (address: string, amount: string) => {
  const file = await readFile('./tenderlyTestnetData.json', 'utf-8');
  const { TENDERLY_RPC_URL } = JSON.parse(file);
  const hexAmount = toHex(parseEther(amount)).replace(/^0x0/, '0x');
  await sendTenderlyRpc(TENDERLY_RPC_URL, {
    method: 'tenderly_setBalance',
    params: [[address], hexAmount],
    id: 42,
    jsonrpc: '2.0'
  });
  console.log('ETH balance set');
};

export const setErc20Balance = async (
  address: string,
  tokenAddress: string,
  amount: string,
  decimals = 18
) => {
  const file = await readFile('./tenderlyTestnetData.json', 'utf-8');
  const { TENDERLY_RPC_URL } = JSON.parse(file);

  await sendTenderlyRpc(TENDERLY_RPC_URL, {
    method: 'tenderly_setErc20Balance',
    params: [tokenAddress, [address], toHex(parseUnits(amount, decimals))],
    id: 42,
    jsonrpc: '2.0'
  });
  console.log('token balance set');
};

const forkVnet = async (displayName: string) => {
  if (!displayName.length) {
    throw new Error('A display name is required for the virtual testnet');
  }
  const sourceVnetId = process.env.TENDERLY_MAINNET_FORK_VNET_ID;

  const res = await fetch('https://api.tenderly.co/api/v1/account/jetstreamgg/project/jetstream/vnets/fork', {
    headers: [
      ['accept', 'application/json, text/plain, */*'],
      ['content-type', 'application/json'],
      ['X-Access-Key', `${process.env.TENDERLY_API_KEY}`]
    ],
    method: 'POST',
    body: JSON.stringify({
      vnet_id: sourceVnetId,
      display_name: displayName
    })
  });

  const testnetData = await res.json();

  if (!res.ok) {
    console.error('There was an error while forking the virtual testnet:', testnetData);
    process.exit(1);
  }

  const adminRpc = testnetData.rpcs?.find((rpc: { name: string }) => rpc.name === 'Admin RPC');
  if (!adminRpc?.url) {
    throw new Error('Tenderly fork response did not include an Admin RPC URL');
  }

  console.log('Virtual Testnet successfully forked');

  await writeFile(
    './tenderlyTestnetData.json',
    JSON.stringify({
      TENDERLY_TESTNET_ID: testnetData.id,
      TENDERLY_RPC_URL: adminRpc.url
    })
  );
};

const deleteVnet = async () => {
  const file = await readFile('./tenderlyTestnetData.json', 'utf-8');
  const { TENDERLY_TESTNET_ID } = JSON.parse(file);

  const res = await fetch(
    `https://api.tenderly.co/api/v1/account/jetstreamgg/project/jetstream/testnet/container/${TENDERLY_TESTNET_ID}`,
    {
      headers: [['X-Access-Key', `${process.env.TENDERLY_API_KEY}`]],
      method: 'DELETE'
    }
  );

  if (res.status === 204) {
    console.log('Virtual Testnet successfully deleted');
  } else {
    console.log('There was an error while deleting the virtual testnet');
  }
};
