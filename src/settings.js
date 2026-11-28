export const ARTWORK_STYLE_PREF = "zen-media-viz.artwork-style";
export const ARTWORK_STYLES = ["small", "large", "background-blur", "background-sharp"];
const DEFAULT_STYLE = "small";

export function readArtworkStyle(prefs) {
  const style = prefs.getStringPref(ARTWORK_STYLE_PREF, DEFAULT_STYLE);
  return ARTWORK_STYLES.includes(style) ? style : DEFAULT_STYLE;
}

export function watchArtworkStyle(prefs, onChange, { signal }) {
  const observer = { observe: () => onChange(readArtworkStyle(prefs)) };
  prefs.addObserver(ARTWORK_STYLE_PREF, observer);
  signal.addEventListener("abort", () => prefs.removeObserver(ARTWORK_STYLE_PREF, observer), {
    once: true,
  });
}
