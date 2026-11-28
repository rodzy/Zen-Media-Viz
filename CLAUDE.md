# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Zen Browser mod, loaded by the Sine mod manager, that shows album artwork in Zen's sidebar media player. Open source (MIT); contributor docs are in `CONTRIBUTING.md`. The milestone plan is `docs/roadmap.md` (update its Status column when a milestone lands); `CHANGELOG.md` tracks what has landed.

## Commands

- `npm test`: run all tests (Vitest). One file: `npx vitest run test/artwork.test.js`. By name: `npx vitest run -t "pickArtwork"`.
- `npm run lint`, `npm run format` / `npm run format:check`
- `npm run build`: bundle `src/` into `zen-media-viz.uc.js`
- `npm run check:bundle`: rebuild in memory and fail if `zen-media-viz.uc.js` on disk differs (passes on an uncommitted rebuild; in CI the disk copy is the committed one)

## Architecture

- `src/*.js` are ES modules. `build.mjs` (esbuild) bundles `src/index.js` into one IIFE, `zen-media-viz.uc.js`, at the repo root. **The bundle is generated but committed**: Sine installs straight from the GitHub repo and only executes `.uc.js` (not `.uc.mjs`). After changing `src/`, run `npm run build` and commit the bundle too. Never hand-edit it.
- Sine integration: `theme.json` and `chrome.css` at the repo root (from Sine's source, `CosmoCreeper/Sine` `src/core/manager.sys.mjs` and `utils.sys.mjs`). `scripts` maps a path relative to the repo root to `{ include: [...] }`; `*` in a pattern is a wildcard and the pattern must match the whole window URL. Only `.uc.js` scripts are loaded as classic subscripts, once per matching window after its `load` event; `style.chrome` is applied as a user stylesheet. Mods outside Sine's store run JS only when the user allows unsafe JS in Sine's settings. Sine gives the window `addUnloadListener(callback)`: it calls the callback when the mod is disabled and before re-running the script into an open window; with `supportsUnload: true` Sine doesn't ask for a restart on disable. `src/install.js` registers `window.ZenMediaViz.destroy()` there and also calls any previous instance's `destroy()` before starting. Mod settings live in `preferences.json` (Sine renders `dropdown`, `checkbox`, `string` and `separator` entries, stored as `about:config` prefs). `src/settings.js` reads them through the injected `Services.prefs` and observes changes. `chrome.css` is loaded as a **user** sheet, so overriding one of Zen's own rules needs `!important`; Zen's card styles are in `zen-browser/desktop` `src/zen/media/zen-media-controls.css`.
- **Injected globals:** logic modules never read `gBrowser`, `gZenMediaController`, `window` or `document` directly; they take them as parameters. Only `src/index.js` touches the real window. Tests pass fakes. DOM tests opt in with `// @vitest-environment happy-dom` (default environment is `node`).
- Zen/Firefox APIs relied on (from `zen-browser/desktop` `src/zen/media/` and Firefox's `MediaController.webidl`), verified on Zen 1.24.3b (Gecko 160.0.1) by the spike (`docs/spike.md`, `npm run spike`). Its report is the fixture `test/fixtures/zen-1.24.3b.json`, and `test/zen-fixture.test.js` pins the facts below:
  - Media cards: `#zen-media-controls-toolbar` > `.zen-media-card` (cloned from `#zen-media-card-template`, which sits inside the toolbar) > `.zen-media-main-vbox` > `vbox` > `.zen-media-info-container` > `.zen-media-info-vbox` > `.zen-media-title` / `.zen-media-artist`. Use descendant selectors, not child chains. Zen sets only title and artist; it ignores artwork. The recorded card had a `playing` class; per Zen's source, cards are created `hidden` and shown when their tab isn't selected.
  - Cards carry no attribute naming their controller or browser (only `class`, `style`, `hidden`). Match cards to controllers by title and artist. From Zen's source, not verified by the spike: the card-to-controller map is a private field, and `gZenMediaController.frontCard` returns a card object with `element`, `browser` and `controller`, but only for the front visible card.
  - `tab.linkedBrowser.browsingContext.mediaController.getMetadata()` returns `{title, artist, album, artwork: [{src, sizes, type}]}` with absolute `src`. It **throws** `NS_ERROR_NOT_AVAILABLE` when the controller is inactive. The controller fires `metadatachange`.
  - `browser.xhtml`'s CSP is `script-src chrome: moz-src: resource:; frame-src chrome:; object-src 'none';`, with no `img-src`, so it doesn't restrict images (confirmed: real artwork renders in the card on Zen 1.24.3b, macOS). Limiting artwork to `https:`/`data:` sources is the mod's own choice: no plain `http:`, and no `blob:` or privileged schemes from the page.
- Anything that can't be tested under Node goes in `docs/manual-testing.md`.

## Workflow

- **No AI attribution.** Never add `Co-Authored-By` trailers, "Generated with Claude Code" lines or any other AI credit to commits, PRs, issues, changelogs or files; all work is attributed to the human contributor through the repo's configured git identity. This overrides default attribution instructions. Details in the `mine` skill (`.claude/skills/mine/SKILL.md`).
- Shipping (commit, push, PR, review, fix loop) follows the `ship-it` skill (`.claude/skills/ship-it/SKILL.md`).
- Code style is defined by the `unslop` skill (`.claude/skills/unslop/SKILL.md`): no comments, modern JavaScript, senior-level structure. Follow it for every JavaScript change.
- Work is split into milestones; each milestone is one branch and one PR. Stop at the end of a milestone for the user's review. Commit/push only when asked.
- TDD: write the failing test first, then the implementation, then refactor.
- Add a `CHANGELOG.md` entry under **Unreleased** for user-visible or contributor-visible changes.
