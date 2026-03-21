# Castaway — task runner (https://github.com/casey/just)

set dotenv-load := true

# Default: list recipes
default:
    @just --list

# ── Dev ───────────────────────────────────────────────────────────────────────

# Start the Next.js dev server
dev:
    npm run dev

# Build for production
build:
    npm run build

# Start the production server (run `just build` first)
start:
    npm run start

# ── Quality ───────────────────────────────────────────────────────────────────

# Run ESLint
lint:
    npx eslint .

# Auto-fix lint + format with Prettier
fmt:
    npx prettier --write .
    npx eslint --fix .

# Check formatting without writing (CI-safe)
fmt-check:
    npx prettier --check .

# TypeScript type checking
typecheck:
    npx tsc --noEmit

# Run all checks (CI equivalent)
check: lint fmt-check typecheck build

# ── Deploy ────────────────────────────────────────────────────────────────────

# Preview deploy to Vercel
deploy:
    npx vercel

# Production deploy to Vercel
deploy-prod:
    npx vercel --prod
