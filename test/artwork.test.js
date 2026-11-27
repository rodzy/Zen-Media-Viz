import { describe, expect, it } from "vitest";
import { isUsableSrc, parseSizes, pickArtwork } from "../src/artwork.js";
import report from "./fixtures/zen-1.24.3b.json" with { type: "json" };

function image(src, sizes = "") {
  return { src, sizes, type: "image/jpeg" };
}

describe("parseSizes", () => {
  it("parses a single WxH size", () => {
    expect(parseSizes("60x60")).toEqual([{ widthPx: 60, heightPx: 60 }]);
  });

  it("parses space-separated sizes", () => {
    expect(parseSizes("16x16  32x48")).toEqual([
      { widthPx: 16, heightPx: 16 },
      { widthPx: 32, heightPx: 48 },
    ]);
  });

  it("accepts an uppercase X separator", () => {
    expect(parseSizes("48X48")).toEqual([{ widthPx: 48, heightPx: 48 }]);
  });

  it("treats any as an infinitely scalable size", () => {
    expect(parseSizes("ANY")).toEqual([{ widthPx: Infinity, heightPx: Infinity }]);
  });

  it("skips malformed and zero sizes", () => {
    expect(parseSizes("0x0 60x 012x12 axb 1.5x2 64x64")).toEqual([{ widthPx: 64, heightPx: 64 }]);
  });

  it("returns no sizes for an empty or missing value", () => {
    expect(parseSizes("")).toEqual([]);
    expect(parseSizes(undefined)).toEqual([]);
  });
});

describe("isUsableSrc", () => {
  it("accepts https URLs", () => {
    expect(isUsableSrc("https://example.com/cover.jpg")).toBe(true);
  });

  it("accepts image data URLs", () => {
    expect(isUsableSrc("data:image/png;base64,iVBORw0KGgo=")).toBe(true);
  });

  it("rejects data URLs that are not images", () => {
    expect(isUsableSrc("data:text/html,<p>hi</p>")).toBe(false);
  });

  it.each([
    "http://example.com/cover.jpg",
    "blob:https://example.com/2f6c1e9a",
    "chrome://browser/content/icon.png",
    "resource://gre/res/icon.png",
    "moz-extension://abc/cover.png",
    "file:///etc/passwd",
    "javascript:alert(1)",
  ])("rejects %s", (src) => {
    expect(isUsableSrc(src)).toBe(false);
  });

  it("rejects relative and malformed URLs", () => {
    expect(isUsableSrc("/cover.jpg")).toBe(false);
    expect(isUsableSrc("")).toBe(false);
    expect(isUsableSrc(undefined)).toBe(false);
  });
});

describe("pickArtwork", () => {
  it("prefers the smallest image at least minPx wide", () => {
    const artwork = [
      image("https://a.test/544", "544x544"),
      image("https://a.test/60", "60x60"),
      image("https://a.test/226", "226x226"),
      image("https://a.test/120", "120x120"),
    ];

    expect(pickArtwork(artwork, { minPx: 100 })).toBe("https://a.test/120");
  });

  it("falls back to the largest image when none is wide enough", () => {
    const artwork = [image("https://a.test/60", "60x60"), image("https://a.test/120", "120x120")];

    expect(pickArtwork(artwork, { minPx: 500 })).toBe("https://a.test/120");
  });

  it("measures an image by the largest of its sizes", () => {
    const artwork = [
      image("https://a.test/multi", "16x16 256x256"),
      image("https://a.test/128", "128x128"),
    ];

    expect(pickArtwork(artwork, { minPx: 200 })).toBe("https://a.test/multi");
  });

  it("prefers a sized image that is wide enough over a scalable one", () => {
    const artwork = [
      image("https://a.test/any.svg", "any"),
      image("https://a.test/300", "300x300"),
    ];

    expect(pickArtwork(artwork, { minPx: 200 })).toBe("https://a.test/300");
  });

  it("prefers a scalable image when no sized image is wide enough", () => {
    const artwork = [image("https://a.test/60", "60x60"), image("https://a.test/any.svg", "any")];

    expect(pickArtwork(artwork, { minPx: 200 })).toBe("https://a.test/any.svg");
  });

  it("prefers a sized image over one without sizes", () => {
    const artwork = [image("https://a.test/unsized"), image("https://a.test/60", "60x60")];

    expect(pickArtwork(artwork, { minPx: 200 })).toBe("https://a.test/60");
  });

  it("picks the first unsized image when no image declares sizes", () => {
    const artwork = [image("https://a.test/first"), image("https://a.test/second")];

    expect(pickArtwork(artwork, { minPx: 200 })).toBe("https://a.test/first");
  });

  it("keeps the first of equally sized images", () => {
    const artwork = [
      image("https://a.test/first", "120x120"),
      image("https://a.test/second", "120x120"),
    ];

    expect(pickArtwork(artwork, { minPx: 100 })).toBe("https://a.test/first");
  });

  it("ignores images with unusable sources", () => {
    const artwork = [
      image("http://a.test/120", "120x120"),
      image("blob:https://a.test/1", "120x120"),
      image("https://a.test/544", "544x544"),
    ];

    expect(pickArtwork(artwork, { minPx: 100 })).toBe("https://a.test/544");
  });

  it("returns null when no image is usable", () => {
    const artwork = [image("http://a.test/120", "120x120")];

    expect(pickArtwork(artwork, { minPx: 100 })).toBeNull();
  });

  it("returns null for empty artwork", () => {
    expect(pickArtwork([], { minPx: 100 })).toBeNull();
  });

  it("picks from the artwork recorded on Zen 1.24.3b", () => {
    const [{ metadata }] = report.controllers.active;

    const src = pickArtwork(metadata.artwork, { minPx: 96 });

    expect(src).toBe(metadata.artwork.find(({ sizes }) => sizes === "120x120").src);
  });
});
