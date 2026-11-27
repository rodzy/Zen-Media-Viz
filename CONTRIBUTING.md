# Contributing to Zen Media Viz

Thanks for your interest in helping! This project is a [Zen Browser](https://zen-browser.app) mod, loaded by the [Sine](https://github.com/CosmoCreeper/Sine) mod manager, that adds album artwork to Zen's sidebar media player.

By taking part you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting set up

You need Node.js (the version is in [`.nvmrc`](.nvmrc); with nvm, run `nvm use`).

```sh
git clone https://github.com/rodzy/Zen-Media-Viz.git
cd Zen-Media-Viz
npm install
npm test
```

| Command                 | What it does                                                           |
| ----------------------- | ---------------------------------------------------------------------- |
| `npm test`              | Run the test suite once                                                |
| `npm run test:watch`    | Re-run tests as you edit                                               |
| `npx vitest run <file>` | Run one test file, e.g. `npx vitest run test/smoke.test.js`            |
| `npx vitest run -t "x"` | Run only tests whose name matches `x`                                  |
| `npm run lint`          | ESLint                                                                 |
| `npm run format`        | Format everything with Prettier (`format:check` only reports)          |
| `npm run build`         | Bundle `src/` into `zen-media-viz.uc.js`                               |
| `npm run check:bundle`  | Rebuild and fail if the committed `zen-media-viz.uc.js` is out of date |

## How the code is organized

- **`src/`** holds the mod's source as small ES modules.
- **`zen-media-viz.uc.js`** at the repo root is **generated** by `npm run build`. Sine can only run a single classic `.uc.js` file and installs mods straight from the repository, so this bundle is committed. Never edit it by hand. If you change anything in `src/`, run `npm run build` and commit the result; CI fails otherwise.
- **`test/`** holds the tests ([Vitest](https://vitest.dev)). Tests that need a DOM add `// @vitest-environment happy-dom` at the top of the file.

### The injected-globals rule

The mod runs inside Zen's browser window, where globals like `gBrowser`, `gZenMediaController`, `window` and `document` exist. Those don't exist under Node. So logic modules in `src/` never read those globals directly: they take them as parameters. Only the entry point (`src/index.js`) touches the real `window` and passes it down. This keeps every module testable with simple fakes.

## Code style

Prettier and ESLint handle formatting and basic correctness. Beyond that, the project follows the rules in [`.claude/skills/unslop/SKILL.md`](.claude/skills/unslop/SKILL.md). The main points:

- **No comments.** Clear names and small functions replace explanations. The only exceptions are tool directives such as `// @vitest-environment happy-dom`.
- **Modern JavaScript:** ES modules with named exports, `const`, `?.` and `??`, destructuring, `async`/`await`, and non-mutating array methods.
- **Small pure functions,** with side effects kept in `src/index.js`.

## Test-driven development

This project is built test-first. For any change in behavior:

1. **Red:** write a test that describes the behavior and watch it fail (`npm run test:watch`).
2. **Green:** write the smallest change in `src/` that makes it pass.
3. **Refactor:** clean up with the tests still passing.

Bug fixes start with a test that reproduces the bug.

Some things can't be tested under Node: real XUL layout, the browser's content-security policy, Firefox's real `MediaController`. Those are covered by the manual checklist in [`docs/manual-testing.md`](docs/manual-testing.md). If your change affects them, add or update a checklist item and run it in a real Zen.

## Testing in Zen

1. Install [Sine](https://github.com/CosmoCreeper/Sine) in Zen.
2. In Sine's settings, turn on installing JavaScript from unofficial sources.
3. Push your branch to your fork and install it in Sine by repository name.
4. Restart Zen and play something with artwork, such as a song on [YouTube Music](https://music.youtube.com).
5. Open the Browser Console (Cmd/Ctrl+Shift+J) and look for lines starting with `[zen-media-viz]`.

More detailed setup notes will live in `docs/`.

## Submitting a pull request

1. Fork the repo and create a branch from `main`.
2. Make your change test-first, as above.
3. Make sure `npm run lint`, `npm run format:check`, `npm test` and `npm run check:bundle` all pass.
4. Add a line to [`CHANGELOG.md`](CHANGELOG.md) under **Unreleased**.
5. Open a pull request and fill in the template.

Keep pull requests focused on one change; small PRs get reviewed faster. Write commit messages in the imperative mood ("Add artwork fallback", not "Added artwork fallback").

## Reporting bugs and requesting features

Use the [issue templates](https://github.com/rodzy/Zen-Media-Viz/issues/new/choose). For bugs, your Zen and Sine versions and any `[zen-media-viz]` lines from the Browser Console help a lot.

Security problems should **not** go in public issues; see [SECURITY.md](SECURITY.md).
