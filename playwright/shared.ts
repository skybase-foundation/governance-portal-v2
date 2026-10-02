import { Page } from '@playwright/test';

type TestAccount = {
  name: string;
  address: string;
};

enum TestAccountsEnum {
  normal = 'normal'
}

interface TestAccounts {
  [key: string]: TestAccount;
}

//this address is able to send transactions on the tenderly vnet via the wagmi mock
export const TEST_ACCOUNTS: TestAccounts = {
  [TestAccountsEnum.normal]: {
    name: 'Default test account',
    address: '0xdE70d75Bee022C0706C584042836a44ABc5bB863'
  }
};

export async function connectWallet(page: Page) {
  const connectBtn = page.getByRole('button', { name: 'Connect wallet' });

  // Idempotent: if the wallet is already connected (e.g. after an earlier
  // connectWallet call on a different page), the "Connect wallet" button is
  // gone and there is nothing to do.
  if ((await connectBtn.count()) === 0) return;

  await connectBtn.first().click();
  const mockOption = page.getByTestId('select-wallet-mock');
  try {
    // Short probe: only true if the wallet is already connected and the
    // button opened the connection-info modal instead of the selector.
    await page.waitForSelector('text="Connected with Mock"', { timeout: 2000 });
    await closeModal(page);
    return;
  } catch {
    // Normal path: pick the mock connector and wait for the selector modal
    // to close, which only happens once the connection completes. That
    // gates downstream `:enabled` locators on the wallet actually being
    // connected, without relying on the "Connected with Mock" string
    // (only shown when re-opening the info modal, not on fresh connect).
    await mockOption.click();
    await mockOption.waitFor({ state: 'hidden', timeout: 20000 });
  }
}

export async function closeModal(page) {
  await page.locator('[aria-label="close"]').click();
}
