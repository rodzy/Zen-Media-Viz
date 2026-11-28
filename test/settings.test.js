import { describe, expect, it, vi } from "vitest";
import {
  ARTWORK_STYLES,
  ARTWORK_STYLE_PREF,
  readArtworkStyle,
  watchArtworkStyle,
} from "../src/settings.js";
import preferences from "../preferences.json" with { type: "json" };

function fakePrefs(values = {}) {
  const observers = new Map();
  return {
    getStringPref: (name, fallback) => values[name] ?? fallback,
    addObserver: (name, observer) => observers.set(name, observer),
    removeObserver: (name, observer) => {
      if (observers.get(name) === observer) observers.delete(name);
    },
    set(name, value) {
      values[name] = value;
      observers.get(name)?.observe(null, "nsPref:changed", name);
    },
    observerCount: () => observers.size,
  };
}

describe("readArtworkStyle", () => {
  it("defaults to the small thumbnail", () => {
    expect(readArtworkStyle(fakePrefs())).toBe("small");
  });

  it.each(ARTWORK_STYLES)("reads the %s style", (style) => {
    expect(readArtworkStyle(fakePrefs({ [ARTWORK_STYLE_PREF]: style }))).toBe(style);
  });

  it.each(["huge", "background-blur"])(
    "falls back to the small thumbnail for the unknown style %s",
    (style) => {
      expect(readArtworkStyle(fakePrefs({ [ARTWORK_STYLE_PREF]: style }))).toBe("small");
    },
  );
});

describe("watchArtworkStyle", () => {
  it("reports the new style when the pref changes", () => {
    const prefs = fakePrefs();
    const onChange = vi.fn();
    watchArtworkStyle(prefs, onChange, new AbortController());

    prefs.set(ARTWORK_STYLE_PREF, "large");

    expect(onChange).toHaveBeenCalledWith("large");
  });

  it("stops watching when aborted", () => {
    const prefs = fakePrefs();
    const onChange = vi.fn();
    const teardown = new AbortController();
    watchArtworkStyle(prefs, onChange, teardown);

    teardown.abort();
    prefs.set(ARTWORK_STYLE_PREF, "large");

    expect(onChange).not.toHaveBeenCalled();
    expect(prefs.observerCount()).toBe(0);
  });
});

describe("preferences.json", () => {
  const [stylePref] = preferences;

  it("offers every artwork style in a dropdown", () => {
    expect(stylePref.type).toBe("dropdown");
    expect(stylePref.property).toBe(ARTWORK_STYLE_PREF);
    expect(stylePref.options.map(({ value }) => value)).toEqual(ARTWORK_STYLES);
  });

  it("defaults to the small thumbnail without an empty choice", () => {
    expect(stylePref.defaultValue).toBe("small");
    expect(stylePref.placeholder).toBe(false);
  });
});
