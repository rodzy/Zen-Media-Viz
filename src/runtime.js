import { pickArtwork } from "./artwork.js";
import { removeArtwork, showArtwork } from "./card.js";
import { matchCards, mediaSessions } from "./controllers.js";
import { logError } from "./log.js";
import { readArtworkStyle, watchArtworkStyle } from "./settings.js";

const TOOLBAR_SELECTOR = "#zen-media-controls-toolbar";
const CARD_SELECTOR = ":scope > .zen-media-card";
const TRACK_LABEL_SELECTOR = ".zen-media-title, .zen-media-artist";
const STYLE_ATTRIBUTE = "zen-media-viz-style";
const COVER_CSS_PX = 240;
const BACKGROUND_CSS_PX = 400;
const ARTWORK_CSS_PX = { small: 48, large: COVER_CSS_PX, background: BACKGROUND_CSS_PX };
const WATCHED_MUTATIONS = { childList: true, characterData: true, subtree: true };

const cardsIn = (toolbar) => [...toolbar.querySelectorAll(CARD_SELECTOR)];
const elementOf = (node) => (node.nodeType === node.ELEMENT_NODE ? node : node.parentElement);

function isTrackChange(toolbar, { target }) {
  return target === toolbar || Boolean(elementOf(target)?.closest(TRACK_LABEL_SELECTOR));
}

function renderArtwork(cards, sessions, { style, pixelRatio }) {
  const matches = matchCards(cards, sessions);
  const minPx = ARTWORK_CSS_PX[style] * pixelRatio;
  const asBackground = style === "background";
  for (const card of cards) {
    const artwork = matches.get(card)?.metadata.artwork ?? [];
    showArtwork(card, pickArtwork(artwork, { minPx }), { asBackground });
  }
}

function controllerWatcher(onChange, { signal }) {
  const watched = new WeakSet();
  return ({ browser }) => {
    const controller = browser.browsingContext.mediaController;
    if (watched.has(controller)) return;
    watched.add(controller);
    controller.addEventListener("metadatachange", onChange, { signal });
  };
}

function observeTrackChanges({ MutationObserver }, toolbar, onChange) {
  const observer = new MutationObserver((records) => {
    if (records.some((record) => isTrackChange(toolbar, record))) onChange();
  });
  observer.observe(toolbar, WATCHED_MUTATIONS);
  return observer;
}

function watchPixelRatio(window, onChange, { signal }) {
  const query = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
  const rearm = () => {
    onChange();
    watchPixelRatio(window, onChange, { signal });
  };
  query.addEventListener("change", rearm, { once: true, signal });
}

function artworkRefresher({ window, gBrowser, toolbar }, teardown) {
  const refresh = () => {
    try {
      const sessions = mediaSessions(gBrowser);
      sessions.forEach(watchController);
      renderArtwork(cardsIn(toolbar), sessions, {
        style: toolbar.getAttribute(STYLE_ATTRIBUTE),
        pixelRatio: window.devicePixelRatio,
      });
    } catch (error) {
      logError(error);
    }
  };
  const watchController = controllerWatcher(refresh, teardown);
  return refresh;
}

export function startMediaViz({ window, gBrowser, prefs }) {
  const toolbar = window.document.querySelector(TOOLBAR_SELECTOR);
  if (!toolbar) throw new Error(`${TOOLBAR_SELECTOR} not found`);
  const teardown = new AbortController();
  const refresh = artworkRefresher({ window, gBrowser, toolbar }, teardown);
  const applyStyle = (style) => {
    toolbar.setAttribute(STYLE_ATTRIBUTE, style);
    refresh();
  };
  watchArtworkStyle(prefs, applyStyle, teardown);
  watchPixelRatio(window, refresh, teardown);
  const observer = observeTrackChanges(window, toolbar, refresh);
  applyStyle(readArtworkStyle(prefs));

  return {
    destroy() {
      observer.disconnect();
      teardown.abort();
      toolbar.removeAttribute(STYLE_ATTRIBUTE);
      cardsIn(toolbar).forEach(removeArtwork);
    },
  };
}
