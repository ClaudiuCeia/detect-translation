# Repository Guidelines

## Project Structure

- `src/`: TypeScript library source.
- `src/index.ts`: Public entrypoint (`observe`).
- `src/services/`: Service-specific detection helpers.
- `src/translations/`: Canary translation data.
  - `src/translations/Skip-to-main-content.yml`: Source-of-truth.
  - `src/translations/*.ts`: Generated artifacts (gitignored).
- `src/test/`: Jest tests (`*.test.ts`) running in JSDOM.
- `.bin/`: Dev scripts and Jest tests (not shipped), including language-id generation.
- `.github/workflows/`: CI (`ci.yml`) and tag-driven releases (`release.yml`).

## Build, Test, And Dev Commands

This repo uses `pnpm` (see `package.json#packageManager`) and Node 24 (see `.node-version`).

- `pnpm install`: Install dependencies.
- `pnpm test`: Regenerates lang ids (`pnpm run langids`) then runs Jest.
- `pnpm run lint`: Biome checks (lint + formatting rules).
- `pnpm run format`: Auto-format with Biome.
- `pnpm run typecheck`: `tsc --noEmit`.
- `pnpm run knip`: Unused files/deps checks.
- `pnpm run build`: Build ESM/CJS/browser bundles via `esbuild` and declarations via TypeScript.
- `pnpm run verify`: Main local gate (tests + lint + typecheck + knip + build + publint + audit).
- `pnpm run e2e`: Build and run Playwright in Chromium.
- `pnpm run build && pnpm run e2e:all`: Run Playwright in Chromium, Firefox, and WebKit. Install them first with `pnpm exec playwright install chromium firefox webkit`.

## Coding Style & Naming

- Formatting/linting: Biome (`biome.json`) with 2-space indentation, 80-char line width, and double quotes.
- TypeScript: Prefer explicit types for public APIs; keep browser/DOM access guarded for testability.
- Files: `camelCase.ts` for modules; tests in `src/test/*.test.ts` and `.bin/test/*.test.ts`.

## Testing Guidelines

- Framework: Jest with a custom JSDOM environment (exposes global `jsdom` for `jsdom.reconfigure({ url })`).
- Add/adjust tests when changing detection heuristics or public types.
- Run `pnpm run e2e:all` after browser-observer or packaged-bundle changes; `verify` does not include Playwright.
- Expect `coverage/` to be generated locally (gitignored).

## Commit & Pull Request Guidelines

- Commits follow Conventional Commits in practice: `fix: ...`, `docs: ...`, `chore(scope): ...` (see `git log`).
- Husky runs `pnpm test`, `pnpm run lint`, and `pnpm run knip` on `pre-commit` (CI sets `HUSKY=0`).
- PRs should include: a clear description, rationale for heuristic changes, and tests. Run `pnpm run verify` before opening/updating a PR.

## Notes

- Do not commit build outputs: `dist/` and `dist-browser/` are gitignored.
- If you update `src/translations/Skip-to-main-content.yml`, rerun `pnpm run langids` and verify `pnpm test`.
