// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { removeArtwork, showArtwork } from "../src/card.js";
import report from "./fixtures/zen-1.24.3b.json" with { type: "json" };

const COVER = "https://a.test/cover.jpg";
const OTHER_COVER = "https://a.test/other.jpg";

function recordedCard() {
  const toolbar = new DOMParser().parseFromString(report.toolbar.html, "application/xml");
  return toolbar.querySelector("toolbar > .zen-media-card");
}

const artworkOf = (card) => card.querySelectorAll(".zen-media-viz-artwork");

function loaded(image) {
  image.dispatchEvent(new Event("load"));
  return image;
}

describe("showArtwork", () => {
  it("adds an image as the first item of the card's info container", () => {
    const card = recordedCard();

    showArtwork(card, COVER);

    const [image] = artworkOf(card);
    expect(image.parentElement.classList.contains("zen-media-info-container")).toBe(true);
    expect(image.parentElement.firstElementChild).toBe(image);
    expect(image.getAttribute("src")).toBe(COVER);
  });

  it("creates an HTML image even inside a XUL card", () => {
    const card = recordedCard();

    showArtwork(card, COVER);

    expect(artworkOf(card)[0].namespaceURI).toBe("http://www.w3.org/1999/xhtml");
    expect(artworkOf(card)[0].localName).toBe("img");
  });

  it("marks the image as decorative", () => {
    const card = recordedCard();

    showArtwork(card, COVER);

    expect(artworkOf(card)[0].getAttribute("alt")).toBe("");
  });

  it("keeps the image hidden until it loads", () => {
    const card = recordedCard();

    showArtwork(card, COVER);
    const [image] = artworkOf(card);

    expect(image.hidden).toBe(true);
    expect(loaded(image).hidden).toBe(false);
  });

  it("keeps the image hidden when it fails to load", () => {
    const card = recordedCard();
    showArtwork(card, COVER);
    const [image] = artworkOf(card);

    image.dispatchEvent(new Event("error"));

    expect(image.hidden).toBe(true);
  });

  it("reuses the image when the artwork changes", () => {
    const card = recordedCard();
    showArtwork(card, COVER);
    const [image] = artworkOf(card);

    showArtwork(card, OTHER_COVER);

    expect([...artworkOf(card)]).toEqual([image]);
    expect(image.getAttribute("src")).toBe(OTHER_COVER);
  });

  it("hides the image again while new artwork loads", () => {
    const card = recordedCard();
    showArtwork(card, COVER);
    const image = loaded(artworkOf(card)[0]);

    showArtwork(card, OTHER_COVER);

    expect(image.hidden).toBe(true);
  });

  it("leaves a loaded image visible when the artwork is unchanged", () => {
    const card = recordedCard();
    showArtwork(card, COVER);
    const image = loaded(artworkOf(card)[0]);

    showArtwork(card, COVER);

    expect(image.hidden).toBe(false);
  });

  it.each([null, "http://a.test/cover.jpg", "javascript:alert(1)"])(
    "removes the image when given %s",
    (src) => {
      const card = recordedCard();
      showArtwork(card, COVER);

      showArtwork(card, src);

      expect(artworkOf(card)).toHaveLength(0);
    },
  );

  it("does nothing to a card without an info container", () => {
    const card = document.createElement("toolbaritem");

    showArtwork(card, COVER);

    expect(card.children).toHaveLength(0);
  });
});

describe("removeArtwork", () => {
  it("removes the image from the card", () => {
    const card = recordedCard();
    showArtwork(card, COVER);

    removeArtwork(card);

    expect(artworkOf(card)).toHaveLength(0);
  });

  it("leaves the rest of the card untouched", () => {
    const card = recordedCard();
    const before = card.outerHTML;
    showArtwork(card, COVER);

    removeArtwork(card);

    expect(card.outerHTML).toBe(before);
  });

  it("does nothing to a card without artwork", () => {
    const card = recordedCard();
    const before = card.outerHTML;

    removeArtwork(card);

    expect(card.outerHTML).toBe(before);
  });
});
