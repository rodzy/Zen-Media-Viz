// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { matchCards, mediaSessions, readCardTrack, readMetadata } from "../src/controllers.js";
import report from "./fixtures/zen-1.24.3b.json" with { type: "json" };

function notAvailable() {
  return Object.assign(new Error(""), { name: "NS_ERROR_NOT_AVAILABLE" });
}

function controller(metadata) {
  return { getMetadata: () => metadata };
}

function inactiveController() {
  return {
    getMetadata: () => {
      throw notAvailable();
    },
  };
}

function tab(mediaController) {
  return { linkedBrowser: { browsingContext: { mediaController } } };
}

function track(title, artist) {
  return { title, artist, album: "", artwork: [] };
}

function card(title, artist) {
  const element = document.createElement("toolbaritem");
  element.className = "zen-media-card";
  element.innerHTML = `<vbox><vbox class="zen-media-info-vbox"><label class="zen-media-title"></label><label class="zen-media-artist"></label></vbox></vbox>`;
  element.querySelector(".zen-media-title").textContent = title;
  element.querySelector(".zen-media-artist").textContent = artist;
  return element;
}

function session(title, artist) {
  return { browser: {}, metadata: track(title, artist) };
}

function fixtureCards() {
  const toolbar = new DOMParser().parseFromString(report.toolbar.html, "application/xml");
  return [...toolbar.querySelectorAll("toolbar > .zen-media-card")];
}

describe("readMetadata", () => {
  it("returns the controller's metadata", () => {
    const metadata = track("Song", "Band");

    expect(readMetadata(controller(metadata))).toBe(metadata);
  });

  it("returns null when the controller is inactive", () => {
    expect(readMetadata(inactiveController())).toBeNull();
  });

  it("rethrows other errors", () => {
    const broken = {
      getMetadata: () => {
        throw new TypeError("boom");
      },
    };

    expect(() => readMetadata(broken)).toThrow(TypeError);
  });
});

describe("mediaSessions", () => {
  it("pairs each tab's browser with its controller's metadata", () => {
    const playing = tab(controller(track("Song", "Band")));

    expect(mediaSessions({ tabs: [playing] })).toEqual([
      { browser: playing.linkedBrowser, metadata: track("Song", "Band") },
    ]);
  });

  it("skips tabs whose controller is inactive", () => {
    const tabs = [tab(inactiveController()), tab(controller(track("Song", "Band")))];

    expect(mediaSessions({ tabs }).map(({ metadata }) => metadata.title)).toEqual(["Song"]);
  });

  it("skips tabs without a browser, browsing context or controller", () => {
    const tabs = [{}, { linkedBrowser: {} }, { linkedBrowser: { browsingContext: {} } }];

    expect(mediaSessions({ tabs })).toEqual([]);
  });

  it("returns no sessions when there are no tabs", () => {
    expect(mediaSessions({ tabs: [] })).toEqual([]);
  });
});

describe("readCardTrack", () => {
  it("reads the title and artist shown on a card", () => {
    expect(readCardTrack(card("Song", "Band"))).toEqual({ title: "Song", artist: "Band" });
  });

  it("reads empty strings from a card without labels", () => {
    expect(readCardTrack(document.createElement("toolbaritem"))).toEqual({
      title: "",
      artist: "",
    });
  });

  it("reads the recorded Zen 1.24.3b card", () => {
    const [recorded] = fixtureCards();

    expect(readCardTrack(recorded)).toEqual({ title: "Flames of Fate", artist: "DJ Noriken" });
  });
});

describe("matchCards", () => {
  it("matches a card to the session with the same title and artist", () => {
    const songCard = card("Song", "Band");
    const other = session("Other", "Band");
    const song = session("Song", "Band");

    expect(matchCards([songCard], [other, song])).toEqual(new Map([[songCard, song]]));
  });

  it("does not match a session whose artist differs", () => {
    expect(matchCards([card("Song", "Band")], [session("Song", "Cover Band")]).size).toBe(0);
  });

  it("gives each session to at most one card", () => {
    const first = card("Song", "Band");
    const second = card("Song", "Band");
    const firstSession = session("Song", "Band");
    const secondSession = session("Song", "Band");

    const matches = matchCards([first, second], [firstSession, secondSession]);

    expect(matches.get(first)).toBe(firstSession);
    expect(matches.get(second)).toBe(secondSession);
  });

  it("leaves a card unmatched when every matching session is taken", () => {
    const second = card("Song", "Band");

    const matches = matchCards([card("Song", "Band"), second], [session("Song", "Band")]);

    expect(matches.has(second)).toBe(false);
  });

  it("matches each card to its own session whatever order the sessions come in", () => {
    const songCard = card("Song", "Band");
    const otherCard = card("Other", "Band");
    const song = session("Song", "Band");
    const other = session("Other", "Band");

    const matches = matchCards([songCard, otherCard], [other, song]);

    expect(matches).toEqual(
      new Map([
        [songCard, song],
        [otherCard, other],
      ]),
    );
  });

  it("leaves a card unmatched when its tab's controller has gone inactive", () => {
    const tabs = [tab(inactiveController()), tab(controller(track("Other", "Band")))];

    expect(matchCards([card("Song", "Band")], mediaSessions({ tabs })).size).toBe(0);
  });

  it("does not match a card that shows no title yet", () => {
    expect(matchCards([card("", "")], [session("", "")]).size).toBe(0);
  });

  it("matches the recorded Zen 1.24.3b card to its tab's controller", () => {
    const [recorded] = fixtureCards();
    const [active] = report.controllers.active;
    const playing = tab(controller(active.metadata));

    const matches = matchCards([recorded], mediaSessions({ tabs: [playing] }));

    expect(matches.get(recorded)?.browser).toBe(playing.linkedBrowser);
  });
});
