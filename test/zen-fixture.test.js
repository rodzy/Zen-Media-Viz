// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import report from "./fixtures/zen-1.24.3b.json" with { type: "json" };

function parseToolbar() {
  return new DOMParser().parseFromString(report.toolbar.html, "application/xml");
}

function renderedCard() {
  return parseToolbar().querySelector("toolbar > .zen-media-card");
}

const [activeController] = report.controllers.active;

describe("Zen 1.24.3b media card DOM", () => {
  it("keeps the card template inside the toolbar", () => {
    const template = parseToolbar().querySelector("toolbar > #zen-media-card-template");

    expect(template.querySelector(".zen-media-card")).not.toBeNull();
  });

  it("places the title and artist in the info vbox of the info container", () => {
    const vbox = renderedCard().querySelector(".zen-media-info-container > .zen-media-info-vbox");

    expect(vbox.querySelector(".zen-media-title").textContent).toBe("Flames of Fate");
    expect(vbox.querySelector(".zen-media-artist").textContent).toBe("DJ Noriken");
  });

  it("nests the info container below the card rather than directly in it", () => {
    const card = renderedCard();

    expect(card.querySelector(".zen-media-info-container").parentElement).not.toBe(card);
  });

  it("shows the active controller's title and artist on its card", () => {
    const card = renderedCard();

    expect(card.querySelector(".zen-media-title").textContent).toBe(
      activeController.metadata.title,
    );
    expect(card.querySelector(".zen-media-artist").textContent).toBe(
      activeController.metadata.artist,
    );
  });

  it("gives cards no attribute that identifies their controller or browser", () => {
    const names = [...renderedCard().attributes].map(({ name }) => name);

    expect(names.toSorted()).toEqual(["class", "hidden", "style"]);
  });
});

describe("Zen 1.24.3b media controllers", () => {
  it("reports artwork as absolute https URLs with WxH sizes and a type", () => {
    const { artwork } = activeController.metadata;

    expect(artwork.length).toBeGreaterThan(0);
    for (const { src, sizes, type } of artwork) {
      expect(URL.parse(src)?.protocol).toBe("https:");
      expect(sizes).toMatch(/^\d+x\d+$/);
      expect(type).toMatch(/^image\//);
    }
  });

  it("throws NS_ERROR_NOT_AVAILABLE when reading an inactive controller's metadata", () => {
    expect(report.controllers.inactiveMetadataError.name).toBe("NS_ERROR_NOT_AVAILABLE");
  });
});

describe("Zen 1.24.3b browser window", () => {
  it("declares no content security policy directive that restricts images", () => {
    expect(report.csp).not.toMatch(/\b(img-src|default-src)\b/);
  });
});
