// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";
import { collectReport } from "../spike/report.js";

const CARD_HTML = `
  <toolbaritem class="zen-media-card">
    <vbox class="zen-media-main-vbox">
      <hbox class="zen-media-info-container">
        <vbox class="zen-media-info-vbox">
          <label class="zen-media-title">Song</label>
          <label class="zen-media-artist">Band</label>
        </vbox>
      </hbox>
    </vbox>
  </toolbaritem>`;

const TOOLBAR_HTML = `
  <toolbar id="zen-media-controls-toolbar">
    <template id="zen-media-card-template">${CARD_HTML}</template>
    ${CARD_HTML}
  </toolbar>`;

const ARTWORK = [{ src: "https://img.example/a.jpg", sizes: "512x512", type: "image/jpeg" }];

function fakeController({ id = 1, isActive = true, metadata = {}, metadataError = null } = {}) {
  return {
    id,
    isActive,
    isPlaying: isActive,
    isAudible: isActive,
    playbackState: isActive ? "playing" : "none",
    supportedKeys: ["play", "pause"],
    getMetadata() {
      if (metadataError) throw metadataError;
      return metadata;
    },
  };
}

function fakeTab({
  spec = "https://music.example/watch?v=secret",
  controller = fakeController(),
  soundPlaying = false,
} = {}) {
  return {
    hasAttribute: (name) => name === "soundplaying" && soundPlaying,
    linkedBrowser: {
      browserId: 7,
      currentURI: { spec },
      browsingContext: controller ? { mediaController: controller } : null,
    },
  };
}

function fakeAppinfo() {
  return { name: "Zen", version: "1.17.5b", platformVersion: "145.0", OS: "Darwin" };
}

function collect({ tabs = [], gZenMediaController = null } = {}) {
  return collectReport({
    document,
    gBrowser: { tabs },
    gZenMediaController,
    appinfo: fakeAppinfo(),
  });
}

beforeEach(() => {
  document.head.innerHTML = "";
  document.body.innerHTML = "";
});

describe("collectReport environment", () => {
  it("describes the app name, version, Gecko version and OS", () => {
    const { environment } = collect();

    expect(environment).toEqual({
      name: "Zen",
      version: "1.17.5b",
      platformVersion: "145.0",
      os: "Darwin",
    });
  });

  it("reports the content security policy declared by the document", () => {
    document.head.innerHTML = `<meta http-equiv="Content-Security-Policy" content="img-src https: data:">`;

    const { csp } = collect();

    expect(csp).toBe("img-src https: data:");
  });

  it("reports no content security policy when none is declared", () => {
    const { csp } = collect();

    expect(csp).toBeNull();
  });
});

describe("collectReport media card DOM", () => {
  it("reports a missing toolbar as null", () => {
    const { toolbar } = collect();

    expect(toolbar).toBeNull();
  });

  it("captures the toolbar markup and whether it has a card template", () => {
    document.body.innerHTML = TOOLBAR_HTML;

    const { toolbar } = collect();

    expect(toolbar.hasTemplate).toBe(true);
    expect(toolbar.html).toContain('id="zen-media-controls-toolbar"');
  });

  it("captures each rendered card's title, artist and hidden state, ignoring the template", () => {
    document.body.innerHTML = TOOLBAR_HTML;
    document.querySelector("toolbar > .zen-media-card").hidden = true;

    const { toolbar } = collect();

    expect(toolbar.cards).toEqual([
      expect.objectContaining({ hidden: true, title: "Song", artist: "Band" }),
    ]);
  });

  it("records the element path from each card to its title", () => {
    document.body.innerHTML = TOOLBAR_HTML;

    const [card] = collect().toolbar.cards;

    expect(card.titlePath).toEqual([
      "toolbaritem.zen-media-card",
      "vbox.zen-media-main-vbox",
      "hbox.zen-media-info-container",
      "vbox.zen-media-info-vbox",
      "label.zen-media-title",
    ]);
  });

  it("reports null title fields for a card without a title", () => {
    document.body.innerHTML = `<toolbar id="zen-media-controls-toolbar"><toolbaritem class="zen-media-card"></toolbaritem></toolbar>`;

    const [card] = collect().toolbar.cards;

    expect(card).toEqual({ hidden: false, title: null, artist: null, titlePath: null });
  });
});

describe("collectReport media controllers", () => {
  it("lists active controllers with their state, metadata and page host", () => {
    const metadata = { title: "Song", artist: "Band", album: "Record", artwork: ARTWORK };
    const tab = fakeTab({ controller: fakeController({ id: 3, metadata }), soundPlaying: true });

    const { controllers } = collect({ tabs: [tab] });

    expect(controllers.active).toEqual([
      {
        browserId: 7,
        host: "music.example",
        soundPlaying: true,
        id: 3,
        isActive: true,
        isPlaying: true,
        isAudible: true,
        playbackState: "playing",
        supportedKeys: ["play", "pause"],
        metadata,
      },
    ]);
  });

  it("never records the full page URL", () => {
    const tab = fakeTab({ spec: "https://music.example/watch?v=secret" });

    const report = JSON.stringify(collect({ tabs: [tab] }));

    expect(report).not.toContain("secret");
  });

  it("reports a null host for pages without one", () => {
    const tab = fakeTab({ spec: "about:blank" });

    const [entry] = collect({ tabs: [tab] }).controllers.active;

    expect(entry.host).toBeNull();
  });

  it("records the error when reading an active controller's metadata throws", () => {
    const metadataError = Object.assign(new Error("Not available"), { name: "NotSupportedError" });
    const tab = fakeTab({ controller: fakeController({ metadataError }) });

    const [entry] = collect({ tabs: [tab] }).controllers.active;

    expect(entry.metadata).toBeUndefined();
    expect(entry.metadataError).toEqual({ name: "NotSupportedError", message: "Not available" });
  });

  it("counts inactive controllers and records the error from reading one", () => {
    const metadataError = Object.assign(new Error("Inactive"), { name: "InvalidStateError" });
    const inactive = () =>
      fakeTab({ controller: fakeController({ isActive: false, metadataError }) });

    const { controllers } = collect({ tabs: [inactive(), inactive()] });

    expect(controllers.active).toEqual([]);
    expect(controllers.inactiveCount).toBe(2);
    expect(controllers.inactiveMetadataError).toEqual({
      name: "InvalidStateError",
      message: "Inactive",
    });
  });

  it("records null when an inactive controller's metadata does not throw", () => {
    const tab = fakeTab({ controller: fakeController({ isActive: false }) });

    const { controllers } = collect({ tabs: [tab] });

    expect(controllers.inactiveMetadataError).toBeNull();
  });

  it("records the error for a tab that throws while being described and keeps the others", () => {
    const failing = fakeController({ id: 4 });
    Object.defineProperty(failing, "supportedKeys", {
      get() {
        throw Object.assign(new Error("Gone"), { name: "NS_ERROR_FAILURE" });
      },
    });

    const { active } = collect({ tabs: [fakeTab({ controller: failing }), fakeTab()] }).controllers;

    expect(active).toEqual([
      { browserId: 7, error: { name: "NS_ERROR_FAILURE", message: "Gone" } },
      expect.objectContaining({ id: 1, metadata: {} }),
    ]);
  });

  it("skips tabs whose browser has no browsing context", () => {
    const { controllers } = collect({ tabs: [fakeTab({ controller: null })] });

    expect(controllers).toEqual({ active: [], inactiveCount: 0, inactiveMetadataError: null });
  });
});

describe("collectReport gZenMediaController", () => {
  it("lists its own and prototype member names", () => {
    class FakeZenMediaController {
      mediaControlBar = null;
      get frontCard() {
        throw new Error("getters must not be invoked");
      }
      activateMediaControls() {}
    }

    const { zenMediaController } = collect({ gZenMediaController: new FakeZenMediaController() });

    expect(zenMediaController).toEqual({
      own: ["mediaControlBar"],
      prototype: ["activateMediaControls", "constructor", "frontCard"],
    });
  });

  it("reports null when it is missing", () => {
    const { zenMediaController } = collect();

    expect(zenMediaController).toBeNull();
  });
});

describe("collectReport output", () => {
  it("survives a JSON round trip unchanged", () => {
    document.body.innerHTML = TOOLBAR_HTML;
    const tab = fakeTab({
      controller: fakeController({
        metadata: { title: "Song", artist: "", album: "", artwork: ARTWORK },
      }),
    });

    const report = collect({ tabs: [tab] });

    expect(JSON.parse(JSON.stringify(report))).toEqual(report);
  });
});
