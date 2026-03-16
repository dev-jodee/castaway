# 🪃 Castaway

**Castaway** is an open-source web app that turns any Solana Anchor program's on-chain IDL into a fully-typed SDK client — in seconds.

Paste a program ID → fetch the IDL → download a generated TypeScript or Rust client, powered by [Codama](https://github.com/codama-idl/codama).

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/dev-jodee/castaway&env=SOLANA_RPC_URL&envDescription=Optional%20private%20Solana%20RPC%20endpoint.%20Falls%20back%20to%20public%20mainnet%20if%20unset.)

![Castaway screenshot](./public/screenshot.png)

<!-- Replace with a real screenshot after first deployment -->

---

## Features

- 🔍 **Fetch any Anchor IDL** directly from the Solana blockchain
- ⚡ **Generate SDK clients** for TypeScript (`@solana/kit`), TypeScript Umi, and Rust
- 📦 **Download as a zip** — drop it straight into your project
- 🔎 **Preset programs** — popular protocols pre-loaded for quick access
- 🔐 **Safe RPC handling** — your private RPC URL is used server-side and never exposed to the browser

---

## Tech stack

|                |                                                             |
| -------------- | ----------------------------------------------------------- |
| Framework      | [Next.js 16](https://nextjs.org) (App Router)               |
| SDK generation | [Codama](https://github.com/codama-idl/codama)              |
| Solana client  | [@solana/kit](https://github.com/anza-xyz/kit) (web3.js v2) |
| Styling        | [Tailwind CSS v4](https://tailwindcss.com)                  |

---

## Getting started

### Prerequisites

- Node.js 22+
- npm

### Installation

```bash
git clone https://github.com/dev-jodee/castaway.git
cd castaway
npm install
```

### Environment variables

```bash
cp .env.example .env.local
```

| Variable               | Required    | Description                                                                                                                                     |
| ---------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `SOLANA_RPC_URL`       | Optional    | A private Solana RPC endpoint. Falls back to the public `api.mainnet-beta.solana.com` if unset, but rate limits apply and may cause 403 errors. |
| `NEXT_PUBLIC_BASE_URL` | Recommended | The canonical public URL of your deployment (no trailing slash), e.g. `https://castaway.dev`. Used for Open Graph / social preview meta tags.   |

Any Solana RPC provider with a free tier will work.

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploying to Vercel

Click the button at the top of this README, or:

```bash
npx vercel
```

After deploying, add `SOLANA_RPC_URL` in your Vercel project under **Settings → Environment Variables**.

You'll also need to add three GitHub Actions secrets for the CI/Deploy workflow:

| Secret              | Where to find it                                                  |
| ------------------- | ----------------------------------------------------------------- |
| `VERCEL_TOKEN`      | [vercel.com/account/tokens](https://vercel.com/account/tokens)    |
| `VERCEL_ORG_ID`     | Run `npx vercel link` locally — printed in `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | Same as above                                                     |

---

## Adding a preset program

Preset programs live in [`data/presets.json`](./data/presets.json). Each entry looks like this:

```json
{
  "name": "Jupiter",
  "programId": "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
  "description": "Jupiter aggregator v6",
  "category": "DeFi"
}
```

**To submit a new preset:**

1. Fork the repo and create a branch: `git checkout -b preset/program-name`
2. Add your entry to `data/presets.json`
3. Make sure the program has an on-chain Anchor IDL — test it in the app first
4. `category` must be one of: `DeFi`, `Staking`, `NFT`, `Governance`
5. Open a PR with the title: `feat: add [Program Name] preset`

See [CONTRIBUTING.md](./CONTRIBUTING.md) for more details.

---

## Contributing

All contributions are welcome — bug fixes, new presets, new features, and documentation improvements. Please read [CONTRIBUTING.md](./CONTRIBUTING.md) first.

---

## License

MIT © [dev-jodee](https://github.com/dev-jodee)
