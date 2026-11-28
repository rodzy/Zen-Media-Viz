export const ARTWORK_STYLE_PREF = "zen-media-viz.artwork-style";
export const ARTWORK_STYLES = ["small", "large", "background"];
const DEFAULT_STYLE = "small";

function readStoredStyle(prefs) {
  try {
    return prefs.getStringPref(ARTWORK_STYLE_PREF, DEFAULT_STYLE);
  } catch {
    return DEFAULT_STYLE;
  }
}

export function readArtworkStyle(prefs) {
  const style = readStoredStyle(prefs);
  return ARTWORK_STYLES.includes(style) ? style : DEFAULT_STYLE;
}

export function watchArtworkStyle(prefs, onChange, { signal }) {
  const observer = { observe: () => onChange(readArtworkStyle(prefs)) };
  prefs.addObserver(ARTWORK_STYLE_PREF, observer);
  signal.addEventListener("abort", () => prefs.removeObserver(ARTWORK_STYLE_PREF, observer), {
    once: true,
  });
}
