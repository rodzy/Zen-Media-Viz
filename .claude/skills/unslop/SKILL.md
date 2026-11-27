---
name: unslop
description: Code style for this repository. Use whenever writing, editing, reviewing or refactoring JavaScript here (src/, test/, build and config scripts). Produces comment-free, modern, senior-level JavaScript.
---

# Unslop

Write code the way a senior engineer would ship it: small, exact, self-explanatory. The code is the documentation.

## No comments

- Do not write comments. No line comments, block comments, JSDoc, section dividers or commented-out code.
- Do not explain code in the code. If a block needs explaining, rename things or extract a well-named function until it doesn't.
- Delete comments you find in code you touch, unless they are one of the exceptions below.
- Exceptions, and only these:
  - Tool directives that change behavior: `// @vitest-environment happy-dom`, `// eslint-disable-next-line <rule>` (always with a specific rule), `/* global */`.
  - The generated userscript banner emitted by `build.mjs`.
  - License headers required by third-party code.
- Never narrate changes in the code ("// fixed", "// new", "// TODO: maybe"). Open an issue instead.

## Naming carries the meaning

- Names say what a thing is or does: `pickArtwork`, `activeControllers`, `isUsableSrc`. No `data`, `info`, `tmp`, `handle`, `doStuff`, `helper`, `utils`.
- Booleans read as predicates: `isActive`, `hasArtwork`, `shouldRefresh`.
- Functions are verbs, values are nouns. Units go in the name when not obvious: `timeoutMs`, `minPx`.
- Magic numbers become named constants at module scope.

## Modern JavaScript

- ES modules only. Named exports; no default exports.
- `const` by default, `let` only when reassigned, never `var`.
- Arrow functions for callbacks and small helpers; `function` declarations for top-level module functions.
- Optional chaining `?.` and nullish coalescing `??` / `??=` instead of manual guards and `||` defaults.
- Destructuring in parameters and assignments; default parameter values instead of in-body fallbacks.
- Template literals instead of concatenation.
- `async`/`await` instead of `.then()` chains. Never mix the two in one function.
- Non-mutating array methods: `map`, `filter`, `flatMap`, `find`, `some`, `every`, `toSorted`, `toReversed`, `at(-1)`, `Object.groupBy`, `Object.fromEntries`. No `for (let i = 0; ...)` when an array method or `for...of` says it better.
- `Set`/`Map`/`WeakSet`/`WeakMap` for membership and keyed state; `WeakMap`/`WeakSet` for DOM nodes and browser objects so nothing leaks.
- Private class fields (`#field`) when a class is genuinely the right shape. Prefer plain functions and closures otherwise.
- `AbortController` signals to tear down event listeners and observers in one place.
- `structuredClone` for deep copies. No JSON round-trips.
- Strict equality only.

## Structure

- Small, pure functions with one job. Side effects live at the edges (`src/index.js`).
- Early returns over nested `if`/`else`. No `else` after `return`.
- No dead code, unused parameters, unused exports or speculative abstractions. Build exactly what the current milestone needs.
- Inject environment (`window`, `document`, `gBrowser`, timers) as parameters; never read browser globals inside logic modules.
- Errors: catch only where you can do something useful. At the mod boundary, log with the `[zen-media-viz]` prefix and keep Zen working. Never swallow errors silently elsewhere.
- Return `null` for "nothing found", not `undefined`, `false` or `-1`.
- Keep modules under ~150 lines and functions under ~25 lines; split when they grow.

## Tests

- Test names state behavior in plain language: `it("prefers the smallest image at least minPx wide")`.
- Arrange, act, assert, separated by blank lines rather than comments.
- One behavior per test. Build fakes with small factory functions, not shared mutable fixtures.
- Assert on outcomes, not on implementation details.

## Before finishing

Run `npm run lint`, `npm run format:check` and `npm test`. Re-read the diff and remove any comment, unused symbol or explanatory text that slipped in.
