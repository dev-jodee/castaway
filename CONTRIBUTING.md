# Contributing to Castaway

Thanks for your interest in contributing! This guide covers everything you need to get up and running.

## Prerequisites

- Node.js 22+
- npm

## Local setup

```bash
git clone https://github.com/dev-jodee/castaway.git
cd castaway
npm install
cp .env.example .env.local   # then fill in SOLANA_RPC_URL
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Adding a preset program

This is the most common contribution and the easiest place to start.

Presets live in [`data/presets.json`](./data/presets.json). Each entry follows this shape:

```json
{
  "name": "My Program",
  "programId": "base58AddressHere...",
  "description": "Short description of what the program does",
  "category": "DeFi"
}
```

**Rules:**

- `programId` must be a valid Solana base58 address
- The program **must have a published on-chain Anchor IDL** — test it in the app first by pasting the address and clicking "Fetch IDL"
- `category` should be one of: `DeFi`, `Staking`, `NFT`, `Governance` — open an issue first if you want to propose a new category
- `description` should be one sentence, no trailing period

**Steps:**

1. Fork the repo
2. Create a branch: `git checkout -b preset/program-name`
3. Add your entry to `data/presets.json` (alphabetical order within each category is preferred but not required)
4. Test it locally — fetch the IDL and generate a client to make sure it works end to end
5. Open a PR with the title: `feat: add [Program Name] preset`

## Code style

- TypeScript everywhere — no `any` unless unavoidable
- Prettier is configured — run `npx prettier --write .` before committing
- ESLint is configured — run `npx eslint .` to check

CI will enforce both on every PR.

## Pull request process

1. Make sure `npm run build` passes locally
2. Keep PRs focused — one feature or fix per PR
3. Write a clear description of what changed and why
4. A maintainer will review and merge

## Reporting bugs

Open a GitHub issue with:

- Steps to reproduce
- Expected vs actual behaviour
- Browser and OS (for UI bugs)
- Program ID (for IDL fetch / generate bugs)

## License

By contributing you agree that your contributions will be licensed under the [MIT License](./LICENSE).
