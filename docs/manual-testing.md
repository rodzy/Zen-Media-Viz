# Manual testing checklist

Unit tests run under Node with fake browser objects. They can't check real layout, the browser's content-security policy or Firefox's real media controller, so run this checklist in a real Zen with Sine before a release, and for any pull request that affects these areas.

Note the Zen version, Sine version and OS you tested on in your pull request.

Items are added as features land.

## Setup

- [ ] The mod installs through Sine and Zen restarts without errors in the Browser Console.

## Spike

- [ ] Pasting the `npm run spike` snippet into the Browser Console logs `[zen-media-viz] Spike report copied to the clipboard.` and the clipboard holds the JSON report.

## Artwork

Allow JavaScript from unofficial sources in Sine's settings, install the mod from this repository, and play a track with artwork (for example on [YouTube Music](https://music.youtube.com)) in one tab while another tab is selected.

- [ ] The media card in the sidebar shows the track's artwork next to the title, and no `[zen-media-viz]` errors appear in the Browser Console.
- [ ] Skipping to the next track replaces the artwork with the new track's.
- [ ] With two tabs playing different tracks, each card shows its own track's artwork.
- [ ] A track without artwork shows no thumbnail and no broken image.
- [ ] Disabling the mod in Sine removes the artwork without a restart; enabling it again brings it back, with only one thumbnail per card.
- [ ] Opening a new window shows artwork there too.
