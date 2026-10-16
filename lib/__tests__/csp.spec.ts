/*

SPDX-FileCopyrightText: © 2023 Dai Foundation <www.daifoundation.org>

SPDX-License-Identifier: AGPL-3.0-or-later

*/

import { createHash } from 'crypto';
import { renderToStaticMarkup } from 'react-dom/server';
import { InitializeColorMode } from 'theme-ui';
import { buildContentSecurityPolicy } from 'lib/csp';
import { COLOR_MODE_SCRIPT } from 'lib/colorModeScript';

const env = {
  NEXT_PUBLIC_PROXY_ORIGIN: 'https://proxy.sky.money/',
  NEXT_PUBLIC_RPC_ARBITRUM_TESTNET: 'https://arbitrum-testnet.example/rpc/key'
};
const production = { dev: false, testChains: false, env };

const directive = (csp: string, name: string) =>
  csp
    .split('; ')
    .find(d => d.startsWith(`${name} `))
    ?.split(' ')
    .slice(1);

describe('buildContentSecurityPolicy', () => {
  it('only lets the portal itself and Safe frame the pages', () => {
    const csp = buildContentSecurityPolicy(production);

    expect(directive(csp, 'frame-ancestors')).toEqual(["'self'", 'https://app.safe.global']);
  });

  it('allows the color mode script by the hash of the script that is rendered', () => {
    const csp = buildContentSecurityPolicy(production);
    const hash = createHash('sha256').update(COLOR_MODE_SCRIPT).digest('base64');

    expect(directive(csp, 'script-src')).toEqual(["'self'", `'sha256-${hash}'`]);
  });

  it('only lets the browser connect to listed hosts', () => {
    const connectSrc = directive(buildContentSecurityPolicy(production), 'connect-src');

    expect(connectSrc).toContain('https://proxy.sky.money');
    expect(connectSrc).not.toContain('https:');
    expect(connectSrc).not.toContain('wss:');
  });

  it('fails when the proxy origin is not a valid URL', () => {
    expect(() =>
      buildContentSecurityPolicy({ ...production, env: { NEXT_PUBLIC_PROXY_ORIGIN: 'proxy.sky.money' } })
    ).toThrow(/NEXT_PUBLIC_PROXY_ORIGIN/);
  });

  it('only allows plain http and localhost in dev', () => {
    expect(buildContentSecurityPolicy(production)).not.toMatch(/http:|ws:|localhost|127\.0\.0\.1/);
    const devConnectSrc = directive(buildContentSecurityPolicy({ ...production, dev: true }), 'connect-src');

    expect(devConnectSrc).toContain('http://localhost:*');
    expect(devConnectSrc).toContain('http://127.0.0.1:*');
  });

  it('only lists the testnet RPCs when the test chains are enabled', () => {
    const prod = directive(buildContentSecurityPolicy(production), 'connect-src');
    const testnet = directive(buildContentSecurityPolicy({ ...production, testChains: true }), 'connect-src');
    const testnetDefaultArbitrum = directive(
      buildContentSecurityPolicy({ ...production, testChains: true, env: {} }),
      'connect-src'
    );

    expect(prod).not.toContain('https://*.rpc.tenderly.co');
    expect(prod).not.toContain('https://staging-gov-polling.sky.money');
    expect(prod).not.toContain('https://arbitrum-testnet.example');
    expect(testnet).toContain('https://*.rpc.tenderly.co');
    expect(testnet).toContain('https://staging-gov-polling.sky.money');
    expect(testnet).toContain('https://arbitrum-testnet.example');
    expect(testnetDefaultArbitrum).toContain('https://sepolia-rollup.arbitrum.io');
  });
});

describe('COLOR_MODE_SCRIPT', () => {
  // Fails when a theme-ui upgrade changes how it persists or applies the color mode
  it('matches the script rendered by theme-ui', () => {
    expect(renderToStaticMarkup(InitializeColorMode())).toEqual(`<script>${COLOR_MODE_SCRIPT}</script>`);
  });
});
