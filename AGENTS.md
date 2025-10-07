# Repository Guidelines

## Project Structure & Module Organization
- `app/` hosts the Next.js App Router; feature routes live under `app/file/[cid]/` and APIs under `app/api/` to stay edge-friendly.
- Shared UI is in `components/`, each exporting a focused React component; cross-cutting utilities live in `lib/` with network helpers scoped to `lib/services/` and environment wiring in `lib/config.ts`.
- Local mock integrations reside in `mock-services/`; Dockerfiles, scripts (for example `setup-dev.sh`), and configuration stay at the repository root for quick discovery.

## Build, Test, and Development Commands
- `npm run dev` boots the dev server on port 3333 with hot reload against mock services.
- `npm run build` runs the production compiler and full TypeScript check.
- `npm run lint` applies the Next.js ESLint preset; resolve every warning before committing.
- `docker-compose up -d` brings up the app with bundled mock Ratio1 services for container workflows.

## Coding Style & Naming Conventions
- Use 2-space indentation across TypeScript, JSX, and configuration files.
- Export React components from PascalCase files such as `StatusModal.tsx`; keep hooks and utilities camelCase.
- Prefer Tailwind classes within `app/**/*.tsx`; reserve `app/globals.css` for shared primitives.
- Centralize environment toggles in `lib/config.ts` and avoid scattering `process.env` reads.

## Testing Guidelines
- Automated coverage is still forming; prioritize `npm run lint` plus manual validation of upload, download, and status flows against the mock services.
- Co-locate new automated specs beside their source with a `.test.ts` suffix and ensure they can execute headlessly in CI when added.
- Document manual verification steps in PR descriptions until we add formal test suites.

## Commit & Pull Request Guidelines
- Follow Conventional Commits such as `feat:`, `fix:`, and `chore:`; keep commits small and descriptive when context is not obvious.
- PRs must include a concise summary, linked issues or tickets, relevant screenshots or logs for UI/API updates, and notes on manual verification plus required environment variables.
- Request review from a maintainer before merging and confirm all lint and build checks succeed locally.

## Security & Configuration Tips
- Copy `.env.example` to `.env.local`; configure keys like `EE_CHAINSTORE_API_URL`, `EE_R1FS_API_URL`, and `CSTORE_HKEY` per README instructions.
- Toggle mock authentication with `AUTH_ENABLED` (default true), `AUTH_MOCK_USERS` (`user:pass` pairs), and optional `AUTH_SESSION_COOKIE` or `AUTH_SESSION_TTL_SECONDS` overrides.
- Never commit secrets or generated `.env*` files; rely on GitHub Actions secrets when publishing Docker images.
- Use `setup-dev.sh` to bootstrap the local edge simulation while keeping confidential configs outside version control.

## Authentication Workflow
- Navigate to `/login` for the mocked credential flow; successful POSTs to `/api/auth/login` issue the `r1-session` cookie and redirect back to the requested page.
- Call `POST /api/auth/logout` to clear the mock session; the header logout button already wires this endpoint.
- Middleware enforces auth on app routes, redirecting unauthenticated GET requests to `/login` and allowing a local override via the `x-mock-auth: allow` header for scripted testing.
