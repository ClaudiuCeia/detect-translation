# Repository Guidelines

## Project Structure

- `src/`: TypeScript library source.
- `src/index.ts`: Public entrypoint (`observe`).
- `src/services/`: Service-specific detection helpers.
- `src/translations/`: Canary translation data.
  - `src/translations/Skip-to-main-content.yml`: Source-of-truth.
  - `src/translations/*.ts`: Generated artifacts (gitignored).
- `src/test/`: Jest tests (`*.test.ts`) running in JSDOM.
- `.bin/`: Dev scripts (not shipped), including language-id generation.
- `.github/workflows/`: CI (`ci.yml`) and tag-driven releases (`release.yml`).

## Build, Test, And Dev Commands

This repo uses `pnpm` (see `package.json#packageManager`) and CI runs on Node 22.

- `pnpm install`: Install dependencies.
- `pnpm test`: Regenerates lang ids (`pnpm run langids`) then runs Jest.
- `pnpm run lint`: Biome checks (lint + formatting rules).
- `pnpm run format`: Auto-format with Biome.
- `pnpm run typecheck`: `tsc --noEmit`.
- `pnpm run knip`: Unused files/deps checks.
- `pnpm run build`: Build ESM/CJS via `tsup` plus the browser bundle via `esbuild`.
- `pnpm run prepublish`: Main local gate (tests + lint + typecheck + knip + build + publint + audit).

## Coding Style & Naming

- Formatting/linting: Biome (`biome.json`) with 2-space indentation, 80-char line width, and double quotes.
- TypeScript: Prefer explicit types for public APIs; keep browser/DOM access guarded for testability.
- Files: `camelCase.ts` for modules; tests in `src/test/*.test.ts`.

## Testing Guidelines

- Framework: Jest with a custom JSDOM environment (exposes global `jsdom` for `jsdom.reconfigure({ url })`).
- Add/adjust tests when changing detection heuristics or public types.
- Expect `coverage/` to be generated locally (gitignored).

## Commit & Pull Request Guidelines

- Commits follow Conventional Commits in practice: `fix: ...`, `docs: ...`, `chore(scope): ...` (see `git log`).
- Husky runs `pnpm test`, `pnpm run lint`, and `pnpm run knip` on `pre-commit` (CI sets `HUSKY=0`).
- PRs should include: a clear description, rationale for heuristic changes, and tests. Run `pnpm run prepublish` before opening/updating a PR.

## Notes

- Do not commit build outputs: `dist/` and `dist-browser/` are gitignored.
- If you update `src/translations/Skip-to-main-content.yml`, rerun `pnpm run langids` and verify `pnpm test`.
