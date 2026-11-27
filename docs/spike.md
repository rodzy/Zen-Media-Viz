# Spike: checking Zen's media player

The mod depends on Zen's media card markup and on Firefox's media controller API, neither of which is documented. The spike is a read-only snippet you run in Zen's Browser Console. It reports what your Zen version provides, and the report is saved as test fixtures under `test/fixtures/` so the tests use real data.

The snippet doesn't change anything in the browser. It reads the media toolbar, the active media controllers, the browser window's content-security policy and the member names of `gZenMediaController`.

## Running it

1. In `about:config`, set `devtools.chrome.enabled` to `true` so the Browser Console accepts input.
2. Play something with artwork in one or two tabs, such as a song on [YouTube Music](https://music.youtube.com), then switch to a different tab so Zen shows the media card in the sidebar.
3. Copy the snippet to the clipboard: `npm run -s spike | pbcopy` on macOS, or `npm run -s spike` and copy the output.
4. Open the Browser Console (Cmd/Ctrl+Shift+J), paste the snippet and press Enter. You'll need to type `allow pasting` first if the console asks.
5. The report is now on the clipboard. Paste it into a file and share it in the pull request or issue. A maintainer saves it as `test/fixtures/zen-<version>.json`.

## Before sharing a report

The report has no full page URLs; tabs are identified by host. It does include the title, artist, album and artwork URLs of what's playing, and the media toolbar's markup, which can contain a page's favicon URL. Read it through and remove anything you'd rather not publish.
