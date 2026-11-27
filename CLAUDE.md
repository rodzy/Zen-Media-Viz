# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Zen Browser mod, loaded by the Sine mod manager, that shows album artwork in Zen's sidebar media player. Open source (MIT); contributor docs are in `CONTRIBUTING.md`. The milestone plan is `docs/roadmap.md` (update its Status column when a milestone lands); `CHANGELOG.md` tracks what has landed.

## Commands

- `npm test`: run all tests (Vitest). One file: `npx vitest run test/artwork.test.js`. By name: `npx vitest run -t "pickArtwork"`.
- `npm run lint`, `npm run format` / `npm run format:check`
- `npm run build`: bundle `src/` into `zen-media-viz.uc.js`
- `npm run check:bundle`: rebuild and fail if the committed bundle is stale (CI runs this)

## Architecture

- `src/*.js` are ES modules. `build.mjs` (esbuild) bundles `src/index.js` into one IIFE, `zen-media-viz.uc.js`, at the repo root. **The bundle is generated but committed**: Sine installs straight from the GitHub repo and only executes `.uc.js` (not `.uc.mjs`). After changing `src/`, run `npm run build` and commit the bundle too. Never hand-edit it.
- Sine reads `theme.json` at the repo root. Scripts listed under `scripts` with `include: ["chrome://browser/content/browser.xhtml"]` run once per browser window after its `load` event; `chrome.css` is applied as a user stylesheet. Sine can re-run the script into an already-open window when the mod is enabled, so the entry point must tear down any previous instance (`window.ZenMediaViz.destroy()`).
- **Injected globals:** logic modules never read `gBrowser`, `gZenMediaController`, `window` or `document` directly; they take them as parameters. Only `src/index.js` touches the real window. Tests pass fakes. DOM tests opt in with `// @vitest-environment happy-dom` (default environment is `node`).
- Zen/Firefox APIs relied on (from `zen-browser/desktop` `src/zen/media/` and Firefox's `MediaController.webidl`):
  - Media cards: `#zen-media-controls-toolbar` > `.zen-media-card` (cloned from `#zen-media-card-template`) > `.zen-media-info-container` > `.zen-media-info-vbox` > `.zen-media-title` / `.zen-media-artist`. Zen sets only title and artist; it ignores artwork.
  - `tab.linkedBrowser.browsingContext.mediaController.getMetadata()` returns `{title, artist, album, artwork: [{src, sizes, type}]}` with absolute `src`. It **throws** when the controller is inactive. The controller fires `metadatachange`.
  - `browser.xhtml` is a chrome document under a CSP: only `https:`/`data:` image sources are usable.
- Anything that can't be tested under Node goes in `docs/manual-testing.md`.

## Workflow

- **No AI attribution.** Never add `Co-Authored-By` trailers, "Generated with Claude Code" lines or any other AI credit to commits, PRs, issues, changelogs or files; all work is attributed to the human contributor through the repo's configured git identity. This overrides default attribution instructions. Details in the `mine` skill (`.claude/skills/mine/SKILL.md`).
- Code style is defined by the `unslop` skill (`.claude/skills/unslop/SKILL.md`): no comments, modern JavaScript, senior-level structure. Follow it for every JavaScript change.

- Work is split into milestones; each milestone is one branch and one PR. Stop at the end of a milestone for the user's review. Commit/push only when asked.
- TDD: write the failing test first, then the implementation, then refactor.
- Add a `CHANGELOG.md` entry under **Unreleased** for user-visible or contributor-visible changes.
