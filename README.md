<h1  align="center"  style="margin-top: 1em; margin-bottom: 3em;">

<p><a  href="https://vote.makerdao.com/"><img  alt="maker logo"  src="./maker-logo.png"  alt="vote.makerdao.com"  width="125"></a></p>

<p>Maker Governance Portal</p>

</h1>

This is the repo containing the code for the [Maker Governance Portal](https://vote.makerdao.com). The Maker Governance Portal is an open-source interface for governance of the Maker protocol. </br>Copyright [Dai Foundation](https://daifoundation.org/) 2022.

### To run locally:

While the portal is hosted by MakerDAO at https://vote.makerdao.com, it can also be run by anyone on their local machine.

In order to run the project locally, you must have the following installed on the machine:

- Node, version 18.17 or greater (up to version 20.x) ([install](https://nodejs.dev/learn/how-to-install-nodejs))

To get started, clone the repository to the desired directory and then navigate into the project folder:

```bash
# clones repo
git clone https://github.com/sky-ecosystem/governance-portal-v2.git

# changes directory to cloned project folder
cd governance-portal-v2
```

Next, install the project's dependencies using [pnpm](https://pnpm.io/installation):

```bash

# installs dependencies
pnpm i

# runs the application on localhost:3000
pnpm dev

```

At this point, you should be able to access the application by going to the address `http://localhost:3000` in your browser.

### Upgrading

> **Warning**
> The method `_signTypedData` from ethers is an experimental feature and will be renamed to `signTypedData`. Make sure to keep the version of ethers fixed or rename the method once is available.

### Releasing

To do releases of the governance portal, please use `npm version minor` or `npm version patch` to bump the version in the package.json and create a tag.

The tag and versioning should be done on develop, and then merged to master through a PR. To push your local tag use the command `git push origin develop --follow-tags`.

### Additional configuration overview:

#### Content

The portal seeks to rely on on-chain data as much as possible and to minimize reliance on data stored on centralized servers. However, due to the large volume of data that is relevant to Maker governance, fetching this data from on-chain is both time and resource-intensive. In order to improve the user's experience, some reliance on third-party services has been added, and we recommend a few configuration steps for optimal use. These services include:

- [GitHub](https://github.com/sky-ecosystem/community/tree/master/governance) for storing markdown related to [polls](https://github.com/sky-ecosystem/community/tree/master/governance/polls), [executives](https://github.com/sky-ecosystem/community/tree/master/governance/votes), and [aligned delegates](https://github.com/sky-ecosystem/community/tree/master/governance/delegates)

#### Network providers

The portal uses the [Wagmi](https://wagmi.sh/react/getting-started) library in order to communicate with the Ethereum network through its React hooks, and [Viem](https://viem.sh/docs/getting-started) in order to do so through its public client as well as provide Web3 utilities. Both Wagmi and Viem work by connecting to JSON-RPC APIs via HTTP in order to provide on-chain data to web applications. By default, they provide default RPC URLs that can be used to get started. However, these RPCs keys can quickly become rate-limited when too many requests are made. In order to prevent this, it is recommended that you sign up and add your own API keys to the configuration.

Due to the large volume of data that is constantly being fetched and displayed in the portal, we use caching in order to cache various network responses for a limited amount of time. This helps to reduce the load of networking calls to various APIs. This feature can be configured to be on or off.

### Configuration steps:

To begin, create a local `.env` file in the project's root directory. The `.env.sample` file can be used as a template.

The following configuration values can be added to the `.env` file:

#### Recommended for improved performance:

- Set `NEXT_PUBLIC_RPC_MAINNET` to a valid Ethereum mainnet RPC URL (e.g. from Alchemy, Infura, Tenderly, etc)
- Set `NEXT_PUBLIC_RPC_ARBITRUM` to a valid Arbitrum mainnet RPC URL
- Set `NEXT_PUBLIC_RPC_ARBITRUM_TESTNET` to a valid Arbitrum testnet RPC URL

- Set `ETHERSCAN_V2_API_KEY` to a valid [Etherscan V2](https://docs.etherscan.io/etherscan-v2#why-v2) API key for Wagmi to be able to generate the contract ABIs

- Set `GITHUB_TOKEN` to fetch polls, executives, and aligned delegates information from GitHub (optionally set `GITHUB_TOKEN_2` and `GITHUB_TOKEN_3`)

- Set `USE_CACHE` to true if you want to use cache, if `REDIS_URL` is set it will use REDIS otherwise filesystem cache

- Set `GASLESS_DISABLED` to `true` to disable gasless voting in UI (pre-check endpoint will fail)

- Set `NEXT_PUBLIC_VERCEL_ENV` to `development` to use development environment databases

#### Optional (DUX-specific config, no performance improvements):

- Set `MIGRATION_WEBHOOK_URL` for sending migration requests to discord

- Set `GASLESS_WEBHOOK_URL` for sending gasless vote requests to discord

**Optional** Set `DEFENDER_API_KEY_MAINNET` and/or `DEFENDER_API_KEY_TESTNET` to a valid OpenZeppelin Defender Relay key (used for gasless poll voting)
**Optional** Set `DEFENDER_API_SECRET_MAINNET` and/or`DEFENDER_API_SECRET_TESTNET` to a valid OpenZeppelin Defender Relay secret
**Optional** Set `GASLESS_BACKDOOR_SECRET` to allow for bypassing the gasless voting eligibility checks by anyone with the password

- Set `DASHBOARD_PASSWORD` for adding protection to the `/dashboard` route

Required for e2e:

- Set `NEXT_PUBLIC_TENDERLY_RPC_KEY` to the API key required to query the forked Tenderly network RPC
- Set `TENDERLY_API_KEY` to be able to run e2e tests against forked network

**Optional** Set `TENDERLY_MAINNET_FORK_VNET_ID` to override the Tenderly VNet used as the source of each test fork

### Tests

The Governance portal includes two test suites: Vitest and E2E

To run e2e, `TENDERLY_API_KEY` and `NEXT_PUBLIC_TENDERLY_RPC_KEY` must be correcly configured.

Install playwright
`pnpm playwright install`

To run headless mode:
`pnpm e2e`

To run in UI mode:
`pnpm dev:mock` to run the app with mock wallet
`pnpm e2e:ui` to open playwright UI

Vitest tests under the folder `__tests__` currently execute unit tests of the platform.

#### Test commands

Vitest:

```bash
# runs Vitest tests on live-reload mode
npm run test

# runs all the Vitest tests
npm run test:ci
```

### CI/CD

The CI/CD system is integrated with Github Actions.

After each push the system will execute:

- Lint, verify type consistency

- Unit test, execute Vitest test suite

```bash
npm run start:ci
```

### Contributing

See our [contributing guide](./CONTRIBUTING.md).
