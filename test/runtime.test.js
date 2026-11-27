// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { startMediaViz } from "../src/runtime.js";
import report from "./fixtures/zen-1.24.3b.json" with { type: "json" };

const [recorded] = report.controllers.active;
const COVER = "https://a.test/cover.jpg";
const OTHER_COVER = "https://a.test/other.jpg";

class FakeController extends EventTarget {
  constructor(metadata) {
    super();
    this.metadata = metadata;
  }

  getMetadata() {
    return this.metadata;
  }

  change(metadata) {
    this.metadata = metadata;
    this.dispatchEvent(new Event("metadatachange"));
  }
}

function track(title, artist, src = COVER) {
  return { title, artist, album: "", artwork: [{ src, sizes: "96x96", type: "image/jpeg" }] };
}

const tab = (controller) => ({
  linkedBrowser: { browsingContext: { mediaController: controller } },
});

function mountToolbar() {
  const parsed = new DOMParser().parseFromString(report.toolbar.html, "application/xml");
  const toolbar = document.importNode(parsed.documentElement, true);
  document.body.replaceChildren(toolbar);
  return toolbar;
}

const cardOf = (toolbar) => toolbar.querySelector(":scope > .zen-media-card");
const artworkSrc = (card) =>
  card.querySelector(".zen-media-viz-artwork")?.getAttribute("src") ?? null;
const settle = () => new Promise((resolve) => setTimeout(resolve));

function addCard(toolbar, title, artist) {
  const card = cardOf(toolbar).cloneNode(true);
  card.querySelector(".zen-media-viz-artwork")?.remove();
  card.querySelector(".zen-media-title").textContent = title;
  card.querySelector(".zen-media-artist").textContent = artist;
  toolbar.append(card);
  return card;
}

let running = null;

function start(controllers) {
  running = startMediaViz({ window, gBrowser: { tabs: controllers.map(tab) } });
  return running;
}

afterEach(() => {
  running?.destroy();
  running = null;
  vi.restoreAllMocks();
});

describe("startMediaViz", () => {
  it("shows artwork on the card of the playing tab", () => {
    const toolbar = mountToolbar();

    start([new FakeController(recorded.metadata)]);

    expect(artworkSrc(cardOf(toolbar))).toMatch(/^https:\/\/yt3\.googleusercontent\.com\//);
  });

  it.each([
    [1, "=w60-h60"],
    [2, "=w120-h120"],
    [4, "=w226-h226"],
  ])("picks an image big enough at a pixel density of %d", (ratio, size) => {
    const toolbar = mountToolbar();
    vi.spyOn(window, "devicePixelRatio", "get").mockReturnValue(ratio);

    start([new FakeController(recorded.metadata)]);

    expect(artworkSrc(cardOf(toolbar))).toContain(size);
  });

  it("updates the artwork when the tab's metadata changes", () => {
    const toolbar = mountToolbar();
    const controller = new FakeController(track("Flames of Fate", "DJ Noriken"));
    start([controller]);

    controller.change(track("Flames of Fate", "DJ Noriken", OTHER_COVER));

    expect(artworkSrc(cardOf(toolbar))).toBe(OTHER_COVER);
  });

  it("follows the card when it switches to another track", async () => {
    const toolbar = mountToolbar();
    const controller = new FakeController(track("Flames of Fate", "DJ Noriken"));
    start([controller]);

    controller.metadata = track("Next Song", "Band", OTHER_COVER);
    cardOf(toolbar).querySelector(".zen-media-title").textContent = "Next Song";
    cardOf(toolbar).querySelector(".zen-media-artist").textContent = "Band";
    await settle();

    expect(artworkSrc(cardOf(toolbar))).toBe(OTHER_COVER);
  });

  it("adds artwork to a card that appears later", async () => {
    const toolbar = mountToolbar();
    start([
      new FakeController(track("Flames of Fate", "DJ Noriken")),
      new FakeController(track("Other Song", "Other Band", OTHER_COVER)),
    ]);

    const card = addCard(toolbar, "Other Song", "Other Band");
    await settle();

    expect(artworkSrc(card)).toBe(OTHER_COVER);
  });

  it("removes the artwork when the card no longer matches a playing tab", async () => {
    const toolbar = mountToolbar();
    start([new FakeController(track("Flames of Fate", "DJ Noriken"))]);

    cardOf(toolbar).querySelector(".zen-media-title").textContent = "Unknown";
    await settle();

    expect(artworkSrc(cardOf(toolbar))).toBeNull();
  });

  it("does not reread metadata when only the playback time changes", async () => {
    const toolbar = mountToolbar();
    const controller = new FakeController(track("Flames of Fate", "DJ Noriken"));
    start([controller]);
    const getMetadata = vi.spyOn(controller, "getMetadata");

    cardOf(toolbar).querySelector(".zen-media-current-time").textContent = "1:34";
    await settle();

    expect(getMetadata).not.toHaveBeenCalled();
  });

  it("keeps working and logs when reading metadata fails", async () => {
    const toolbar = mountToolbar();
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const controller = new FakeController(track("Flames of Fate", "DJ Noriken"));
    start([controller]);
    const failure = new TypeError("boom");
    vi.spyOn(controller, "getMetadata").mockImplementationOnce(() => {
      throw failure;
    });

    controller.dispatchEvent(new Event("metadatachange"));
    controller.change(track("Flames of Fate", "DJ Noriken", OTHER_COVER));

    expect(error).toHaveBeenCalledWith("[zen-media-viz]", failure);
    expect(artworkSrc(cardOf(toolbar))).toBe(OTHER_COVER);
  });

  it("throws when the media toolbar is missing", () => {
    document.body.replaceChildren();

    expect(() => start([])).toThrow("#zen-media-controls-toolbar");
  });
});

describe("destroy", () => {
  it("removes the artwork from every card", () => {
    const toolbar = mountToolbar();
    const viz = start([new FakeController(track("Flames of Fate", "DJ Noriken"))]);

    viz.destroy();

    expect(artworkSrc(cardOf(toolbar))).toBeNull();
  });

  it("stops reacting to metadata changes", () => {
    const toolbar = mountToolbar();
    const controller = new FakeController(track("Flames of Fate", "DJ Noriken"));
    start([controller]).destroy();

    controller.change(track("Flames of Fate", "DJ Noriken", OTHER_COVER));

    expect(artworkSrc(cardOf(toolbar))).toBeNull();
  });

  it("stops reacting to card changes", async () => {
    const toolbar = mountToolbar();
    start([new FakeController(track("Other Song", "Other Band"))]).destroy();

    const card = addCard(toolbar, "Other Song", "Other Band");
    await settle();

    expect(artworkSrc(card)).toBeNull();
  });
});
