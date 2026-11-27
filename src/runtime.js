import { pickArtwork } from "./artwork.js";
import { removeArtwork, showArtwork } from "./card.js";
import { matchCards, mediaSessions } from "./controllers.js";
import { logError } from "./log.js";

const TOOLBAR_SELECTOR = "#zen-media-controls-toolbar";
const CARD_SELECTOR = ":scope > .zen-media-card";
const TRACK_LABEL_SELECTOR = ".zen-media-title, .zen-media-artist";
const ARTWORK_CSS_PX = 36;
const WATCHED_MUTATIONS = { childList: true, characterData: true, subtree: true };

const cardsIn = (toolbar) => [...toolbar.querySelectorAll(CARD_SELECTOR)];
const elementOf = (node) => (node.nodeType === node.ELEMENT_NODE ? node : node.parentElement);

function isTrackChange(toolbar, { target }) {
  return target === toolbar || Boolean(elementOf(target)?.closest(TRACK_LABEL_SELECTOR));
}

function renderArtwork(cards, sessions, { minPx }) {
  const matches = matchCards(cards, sessions);
  for (const card of cards) {
    const artwork = matches.get(card)?.metadata.artwork ?? [];
    showArtwork(card, pickArtwork(artwork, { minPx }));
  }
}

export function startMediaViz({ window, gBrowser }) {
  const toolbar = window.document.querySelector(TOOLBAR_SELECTOR);
  if (!toolbar) throw new Error(`${TOOLBAR_SELECTOR} not found`);
  const teardown = new AbortController();
  const watchedControllers = new WeakSet();

  const watchController = (controller) => {
    if (watchedControllers.has(controller)) return;
    watchedControllers.add(controller);
    controller.addEventListener("metadatachange", refresh, { signal: teardown.signal });
  };

  function refresh() {
    try {
      const sessions = mediaSessions(gBrowser);
      sessions.forEach(({ browser }) => watchController(browser.browsingContext.mediaController));
      renderArtwork(cardsIn(toolbar), sessions, {
        minPx: ARTWORK_CSS_PX * window.devicePixelRatio,
      });
    } catch (error) {
      logError(error);
    }
  }

  const observer = new window.MutationObserver((records) => {
    if (records.some((record) => isTrackChange(toolbar, record))) refresh();
  });
  observer.observe(toolbar, WATCHED_MUTATIONS);
  refresh();

  return {
    destroy() {
      observer.disconnect();
      teardown.abort();
      cardsIn(toolbar).forEach(removeArtwork);
    },
  };
}
