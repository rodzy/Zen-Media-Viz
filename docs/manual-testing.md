# Manual testing checklist

Unit tests run under Node with fake browser objects. They can't check real layout, the browser's content-security policy or Firefox's real media controller, so run this checklist in a real Zen with Sine before a release, and for any pull request that affects these areas.

Note the Zen version, Sine version and OS you tested on in your pull request.

Items are added as features land.

## Setup

- [ ] The mod installs through Sine and Zen restarts without errors in the Browser Console.
