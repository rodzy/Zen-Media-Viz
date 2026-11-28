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
- Card DOM (`src/card.js`): adds, updates and removes an artwork image at the start of a media card's info container. The image stays hidden until it loads, and only `https:` or image `data:` sources are set.
- Runtime (`src/runtime.js`, `src/install.js`): watches Zen's media cards and each playing tab's metadata, and keeps every card's artwork in step with the track it shows, picking an image sized for the screen's pixel density. Disabling the mod or re-running it removes all artwork and listeners.
- Sine manifest (`theme.json`) and a minimal `chrome.css` that sizes the thumbnail, so the mod can be installed from this repository.
- Artwork styles, chosen under the mod's settings in Sine (`preferences.json`, pref `zen-media-viz.artwork-style`): a small thumbnail beside the title (default), a large centered cover above the title, or the artwork behind the whole card, which grows to a square on hover so the whole cover shows. Changing the style applies at once.
- The media card's buttons show a pointer cursor.
- The small thumbnail hides in very narrow sidebars, and artwork is fetched again at a higher resolution when the window moves to a denser screen.
- Claude Code project skills: `unslop` (code style, summarized in the contributing guide), `mine` (attribution policy) and `ship-it` (commit, review and fix loop).

[Unreleased]: https://github.com/rodzy/Zen-Media-Viz/commits/main
