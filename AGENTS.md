# Repository Guidelines

## Project Structure & Module Organization
The Next.js App Router lives under `app/` with `app/file/[cid]/` handling per-file routes and `app/api/` exposing edge-friendly API handlers. Shared UI resides in `components/`, each exported as a focused React component. Business logic and service helpers sit under `lib/`, including `lib/services/` for network calls and `lib/config.ts` for environment wiring. Mock Ratio1 services for offline development live in `mock-services/`, while Docker definitions, setup scripts, and config files remain at the repository root.

## Build, Test, and Development Commands
Run `npm install` once per machine. `npm run dev` starts the Next.js dev server on port 3333 with hot reload. `npm run build` executes the production compiler and type checks the project. `npm run lint` applies the Next.js ESLint ruleset; resolve warnings before committing. For container workflows, `docker-compose up -d` brings up the app alongside the bundled mock services.

## Coding Style & Naming Conventions
TypeScript and JSX files use 2-space indentation. Export React components with PascalCase filenames (for example, `StatusModal.tsx`) and keep hooks or utilities camelCase. Keep environment-sensitive logic centralized in `lib/config.ts`. Prefer Tailwind utility classes inside `app/**/*.tsx`, falling back to `app/globals.css` only for shared styling primitives. Always run `npm run lint` before pushing; the repo relies on the built-in Next.js ESLint preset.

## Testing Guidelines
Automated tests are not yet established. Before opening a PR, run `npm run lint`, exercise the core flows (upload, download, status widgets) against the mock services, and capture any remaining manual test steps in the PR. When adding automated coverage, colocate specs beside the source file with a `.test.ts` suffix and ensure they run headlessly in CI.

## Commit & Pull Request Guidelines
Commits follow Conventional Commits (`feat:`, `fix:`, `chore:`) as reflected in recent history (`fix: retrieve chainstore peers server-side`). Prefer small, scoped commits with descriptive bodies when context is non-obvious. PRs should include: a concise summary, links to related issues or tickets, screenshots or logs for UI/API changes, and notes on manual verification plus relevant environment variables. Request maintainer review before merging.

## Environment & Security Notes
Copy `.env.example` to `.env.local` and adjust keys referenced in `README.md` (`EE_CHAINSTORE_API_URL`, `EE_R1FS_API_URL`, `CSTORE_HKEY`, etc.). Never commit secrets; rely on GitHub Actions secrets for Docker publishing. For a local edge simulation, run `setup-dev.sh` to bootstrap supporting services and keep confidential configs outside version control.
