# Roadmap

The first release is built in milestones. Each milestone is one pull request, written test-first.

| #   | Milestone                   | What it delivers                                                                                                                       | Status |
| --- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 0   | Open-source & tooling shell | Test, lint, format and bundle tooling, CI, contributor docs and templates                                                              | Done   |
| 1   | Spike & fixtures            | A read-only console snippet that checks Zen's media card DOM and real metadata on the maintainer's Zen version, saved as test fixtures | Next   |
| 2   | Artwork selection           | `src/artwork.js`: parse `sizes`, filter to usable `https:`/`data:` sources, pick the best image                                        |        |
| 3   | Controller matching         | `src/controllers.js`: safely read metadata from each tab's media controller and match it to a media card                               |        |
| 4   | Card DOM                    | `src/card.js`: add, update and remove the thumbnail element in a media card                                                            |        |
| 5   | Runtime wiring & Sine       | Watch cards and metadata changes, clean teardown, `theme.json`, first run inside Zen                                                   |        |
| 6   | Styling & polish            | `chrome.css` for the thumbnail, narrow-sidebar and collapsed states, manual checklist                                                  |        |
| 7   | Release v0.1.0              | Install guide, screenshot, version bump and tag                                                                                        |        |

Ideas for after v0.1.0 are tracked as [issues](https://github.com/rodzy/Zen-Media-Viz/issues).
