// ==UserScript==
// @name         Zen Media Viz
// @version      0.0.0
// @description  A Zen Browser mod that shows album artwork in the sidebar media player.
// @homepage     https://github.com/rodzy/Zen-Media-Viz
// @license      MIT
// ==/UserScript==
// GENERATED FILE. Do not edit by hand: change src/ and run `npm run build`.
(() => {
  // src/log.js
  var LOG_PREFIX = "[zen-media-viz]";
  function logError(error) {
    console.error(LOG_PREFIX, error);
  }

  // src/artwork.js
  var SIZE_PATTERN = /^([1-9]\d*)x([1-9]\d*)$/i;
  var SCALABLE_SIZE = { widthPx: Infinity, heightPx: Infinity };
  function parseSize(token) {
    if (token.toLowerCase() === "any") return SCALABLE_SIZE;
    const match = SIZE_PATTERN.exec(token);
    if (!match) return null;
    const [, width, height] = match;
    return { widthPx: Number(width), heightPx: Number(height) };
  }
  function parseSizes(sizes = "") {
    return sizes.split(/\s+/).filter(Boolean).map(parseSize).filter((size) => size !== null);
  }
  var isImageDataUrl = ({ protocol, pathname }) => protocol === "data:" && pathname.toLowerCase().startsWith("image/");
  function isUsableSrc(src) {
    const url = URL.parse(src);
    if (!url) return false;
    return url.protocol === "https:" || isImageDataUrl(url);
  }
  function largestEdgePx(sizes) {
    return parseSizes(sizes).reduce(
      (maxPx, { widthPx, heightPx }) => Math.max(maxPx, Math.min(widthPx, heightPx)),
      0
    );
  }
  var smallest = (images) => images.reduce((best, image) => image.edgePx < best.edgePx ? image : best);
  var largest = (images) => images.reduce((best, image) => image.edgePx > best.edgePx ? image : best);
  function pickArtwork(artwork, { minPx }) {
    const candidates = artwork.filter(({ src }) => isUsableSrc(src)).map(({ src, sizes }) => ({ src, edgePx: largestEdgePx(sizes) }));
    if (candidates.length === 0) return null;
    const bigEnough = candidates.filter(({ edgePx }) => edgePx >= minPx);
    return (bigEnough.length > 0 ? smallest(bigEnough) : largest(candidates)).src;
  }

  // src/card.js
  var HTML_NS = "http://www.w3.org/1999/xhtml";
  var ARTWORK_CLASS = "zen-media-viz-artwork";
  var INFO_CONTAINER_SELECTOR = ".zen-media-info-container";
  var findArtwork = (card) => card.querySelector(`.${ARTWORK_CLASS}`);
  function createArtwork(container) {
    const image = container.ownerDocument.createElementNS(HTML_NS, "img");
    image.className = ARTWORK_CLASS;
    image.alt = "";
    image.setAttribute("referrerpolicy", "no-referrer");
    image.addEventListener("load", () => {
      image.hidden = false;
    });
    container.prepend(image);
    return image;
  }
  function removeArtwork(card) {
    findArtwork(card)?.remove();
  }
  function showArtwork(card, src) {
    if (!isUsableSrc(src)) {
      removeArtwork(card);
      return;
    }
    const container = card.querySelector(INFO_CONTAINER_SELECTOR);
    if (!container) return;
    const image = findArtwork(card) ?? createArtwork(container);
    if (image.getAttribute("src") === src) return;
    image.hidden = true;
    image.setAttribute("src", src);
  }

  // src/controllers.js
  var NOT_AVAILABLE = "NS_ERROR_NOT_AVAILABLE";
  var TITLE_SELECTOR = ".zen-media-title";
  var ARTIST_SELECTOR = ".zen-media-artist";
  function readMetadata(controller) {
    try {
      return controller.getMetadata();
    } catch (error) {
      if (error?.name === NOT_AVAILABLE) return null;
      throw error;
    }
  }
  function sessionOf({ linkedBrowser: browser }) {
    const controller = browser?.browsingContext?.mediaController;
    if (!controller) return null;
    const metadata = readMetadata(controller);
    return metadata && { browser, metadata };
  }
  function mediaSessions({ tabs }) {
    return [...tabs].map(sessionOf).filter((session) => session !== null);
  }
  var labelText = (card, selector) => card.querySelector(selector)?.textContent ?? "";
  function readCardTrack(card) {
    return { title: labelText(card, TITLE_SELECTOR), artist: labelText(card, ARTIST_SELECTOR) };
  }
  var isSameTrack = ({ title, artist }, metadata) => title === metadata.title && artist === metadata.artist;
  function matchCards(cards, sessions) {
    const unclaimed = new Set(sessions);
    const matches = /* @__PURE__ */ new Map();
    for (const card of cards) {
      const shown = readCardTrack(card);
      if (!shown.title) continue;
      const session = unclaimed.values().find(({ metadata }) => isSameTrack(shown, metadata));
      if (!session) continue;
      unclaimed.delete(session);
      matches.set(card, session);
    }
    return matches;
  }

  // src/runtime.js
  var TOOLBAR_SELECTOR = "#zen-media-controls-toolbar";
  var CARD_SELECTOR = ":scope > .zen-media-card";
  var TRACK_LABEL_SELECTOR = ".zen-media-title, .zen-media-artist";
  var ARTWORK_CSS_PX = 36;
  var WATCHED_MUTATIONS = { childList: true, characterData: true, subtree: true };
  var cardsIn = (toolbar) => [...toolbar.querySelectorAll(CARD_SELECTOR)];
  var elementOf = (node) => node.nodeType === node.ELEMENT_NODE ? node : node.parentElement;
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
  function startMediaViz({ window: window2, gBrowser }) {
    const toolbar = window2.document.querySelector(TOOLBAR_SELECTOR);
    if (!toolbar) throw new Error(`${TOOLBAR_SELECTOR} not found`);
    const teardown = new AbortController();
    const watchedControllers = /* @__PURE__ */ new WeakSet();
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
          minPx: ARTWORK_CSS_PX * window2.devicePixelRatio
        });
      } catch (error) {
        logError(error);
      }
    }
    const observer = new window2.MutationObserver((records) => {
      if (records.some((record) => isTrackChange(toolbar, record))) refresh();
    });
    observer.observe(toolbar, WATCHED_MUTATIONS);
    refresh();
    return {
      destroy() {
        observer.disconnect();
        teardown.abort();
        cardsIn(toolbar).forEach(removeArtwork);
      }
    };
  }

  // src/install.js
  function install(window2) {
    window2.ZenMediaViz?.destroy();
    try {
      const mediaViz = startMediaViz({ window: window2, gBrowser: window2.gBrowser });
      const handle = {
        destroy() {
          mediaViz.destroy();
          if (window2.ZenMediaViz === handle) delete window2.ZenMediaViz;
        }
      };
      window2.ZenMediaViz = handle;
      window2.addUnloadListener?.(handle.destroy);
    } catch (error) {
      logError(error);
    }
  }

  // src/index.js
  install(window);
})();
