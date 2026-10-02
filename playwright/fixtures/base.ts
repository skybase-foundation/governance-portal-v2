import { test as base } from '@playwright/test';
import { LegacyPollingPage } from './polling';
import { WalletPage } from './wallet';
import { LegacyExecutivePage } from './executive';
import { DelegatePage } from './delegate';
import { SkyPollingPage } from './sky-polling';
import { SkyExecutivePage } from './sky-executive';

type Fixtures = {
  pollingPage: LegacyPollingPage;
  walletPage: WalletPage;
  executivePage: LegacyExecutivePage;
  delegatePage: DelegatePage;
  skyPollingPage: SkyPollingPage;
  skyExecutivePage: SkyExecutivePage;
};

export const test = base.extend<Fixtures>({
  // The Next.js dev overlay mounts a full-screen `<nextjs-portal>` host as soon as
  // the page reports a runtime error, and it swallows pointer events. The specs
  // that assert graceful API-error handling trigger such an error on purpose, so
  // the overlay ends up covering the very "Retry" button they need to click. The
  // overlay only exists in dev mode, never in the deployed app, so hide it.
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      const hideDevOverlay = () => {
        if (document.getElementById('pw-hide-next-dev-overlay')) return;
        const style = document.createElement('style');
        style.id = 'pw-hide-next-dev-overlay';
        style.textContent = 'nextjs-portal { display: none !important; }';
        (document.head || document.documentElement).appendChild(style);
      };

      if (document.head || document.documentElement) hideDevOverlay();
      document.addEventListener('DOMContentLoaded', hideDevOverlay);
    });

    await use(page);
  },
  pollingPage: async ({ page }, use) => {
    await use(new LegacyPollingPage(page));
  },
  walletPage: async ({ page }, use) => {
    await use(new WalletPage(page));
  },
  executivePage: async ({ page }, use) => {
    await use(new LegacyExecutivePage(page));
  },
  delegatePage: async ({ page }, use) => {
    await use(new DelegatePage(page));
  },
  skyPollingPage: async ({ page }, use) => {
    await use(new SkyPollingPage(page));
  },
  skyExecutivePage: async ({ page }, use) => {
    await use(new SkyExecutivePage(page));
  }
});

export { expect } from '@playwright/test';
