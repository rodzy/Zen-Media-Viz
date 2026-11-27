# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Project tooling: Vitest, ESLint, Prettier, esbuild bundling and GitHub Actions CI.
- Contributor docs: contributing guide, code of conduct, security policy, issue and pull request templates.
- Spike: `npm run spike` prints a read-only Browser Console snippet that reports Zen's media card DOM and media controller metadata ([docs/spike.md](docs/spike.md)).
- Test fixture recorded with the spike on Zen 1.24.3b, with tests that pin the media card DOM, metadata and CSP facts the mod relies on.
- Artwork selection (`src/artwork.js`): parses Media Session `sizes`, keeps only `https:` and image `data:` sources and picks the smallest image whose shorter side is big enough, falling back to the largest.
- Controller matching (`src/controllers.js`): reads metadata from each tab's media controller, treating an inactive controller (`NS_ERROR_NOT_AVAILABLE`) as no session, and matches each media card to a session by its title and artist, giving each session to at most one card.
- Claude Code project skills: `unslop` (code style, summarized in the contributing guide), `mine` (attribution policy) and `ship-it` (commit, review and fix loop).

[Unreleased]: https://github.com/rodzy/Zen-Media-Viz/commits/main
