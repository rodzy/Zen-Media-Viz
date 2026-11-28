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

## Artwork styles

Change **Artwork style** in the mod's settings in Sine while a track is playing. Each change should apply without reloading.

- [ ] **Small thumbnail beside the title:** on hover, a 48px square sits left of the title. The start of the title isn't covered or faded, and the artist and close button still fit.
- [ ] **Large cover above the title:** on hover, the card grows smoothly to show a centered square cover with the title, artist and close button below it. Closing is just as smooth.
- [ ] **Artwork behind the whole card:** the artwork sits dimmed behind the resting card. On hover the card grows to a square and the whole cover shows, with the title at the top and the progress bar and controls together at the bottom, all readable.
- [ ] Switching back to the small thumbnail leaves one thumbnail per card and nothing behind the card.
- [ ] Narrowing the sidebar until the card is very thin hides the small thumbnail instead of squeezing the title.
- [ ] Try each style with a light and a dark Zen theme.
- [ ] The pointer turns into a hand over every button on the card (play/pause, previous, next, mute, close, picture-in-picture and the tab button on the left).
