# Zen Media Viz

A [Zen Browser](https://zen-browser.app) mod that shows the album artwork of whatever you're listening to in Zen's sidebar media player, such as songs on YouTube Music.

> **Status: work in progress.** The mod doesn't do anything yet. Installation steps will be added with the first release; see [CHANGELOG.md](CHANGELOG.md) for progress.

## How it works

Websites report what's playing to the browser, often including album art. Zen's media player shows the title and artist but not the art. This mod is a small script, loaded by the [Sine](https://github.com/CosmoCreeper/Sine) mod manager, that reads the artwork for each playing tab and adds a thumbnail next to the title.

## Contributing

Contributions are welcome! Read [CONTRIBUTING.md](CONTRIBUTING.md) to get set up. The project is built test-first, and every pull request runs the test suite in CI.

Please follow the [Code of Conduct](CODE_OF_CONDUCT.md), and report security problems privately as described in [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE)
