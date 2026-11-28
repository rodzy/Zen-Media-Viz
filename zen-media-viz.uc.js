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
  function createArtwork(document) {
    const image = document.createElementNS(HTML_NS, "img");
    image.className = ARTWORK_CLASS;
    image.alt = "";
    image.setAttribute("referrerpolicy", "no-referrer");
    image.addEventListener("load", () => {
      image.hidden = false;
    });
    return image;
  }
  var artworkHost = (card, asBackground) => asBackground ? card : card.querySelector(INFO_CONTAINER_SELECTOR);
  function removeArtwork(card) {
    findArtwork(card)?.remove();
  }
  function showArtwork(card, src, { asBackground = false } = {}) {
    if (!isUsableSrc(src)) {
      removeArtwork(card);
      return;
    }
    const host = artworkHost(card, asBackground);
    if (!host) return;
    const image = findArtwork(card) ?? createArtwork(card.ownerDocument);
    if (host.firstElementChild !== image) host.prepend(image);
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
    try {
      const metadata = readMetadata(controller);
      return metadata && { browser, metadata };
    } catch (error) {
      logError(error);
      return null;
    }
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

  // src/settings.js
  var ARTWORK_STYLE_PREF = "zen-media-viz.artwork-style";
  var ARTWORK_STYLES = ["small", "large", "background"];
  var DEFAULT_STYLE = "small";
  function readStoredStyle(prefs) {
    try {
      return prefs.getStringPref(ARTWORK_STYLE_PREF, DEFAULT_STYLE);
    } catch {
      return DEFAULT_STYLE;
    }
  }
  function readArtworkStyle(prefs) {
    const style = readStoredStyle(prefs);
    return ARTWORK_STYLES.includes(style) ? style : DEFAULT_STYLE;
  }
  function watchArtworkStyle(prefs, onChange, { signal }) {
    const observer = { observe: () => onChange(readArtworkStyle(prefs)) };
    prefs.addObserver(ARTWORK_STYLE_PREF, observer);
    signal.addEventListener("abort", () => prefs.removeObserver(ARTWORK_STYLE_PREF, observer), {
      once: true
    });
  }

  // src/runtime.js
  var TOOLBAR_SELECTOR = "#zen-media-controls-toolbar";
  var CARD_SELECTOR = ":scope > .zen-media-card";
  var TRACK_LABEL_SELECTOR = ".zen-media-title, .zen-media-artist";
  var STYLE_ATTRIBUTE = "zen-media-viz-style";
  var COVER_CSS_PX = 240;
  var BACKGROUND_CSS_PX = 400;
  var ARTWORK_CSS_PX = { small: 48, large: COVER_CSS_PX, background: BACKGROUND_CSS_PX };
  var WATCHED_MUTATIONS = { childList: true, characterData: true, subtree: true };
  var cardsIn = (toolbar) => [...toolbar.querySelectorAll(CARD_SELECTOR)];
  var elementOf = (node) => node.nodeType === node.ELEMENT_NODE ? node : node.parentElement;
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
    const watched = /* @__PURE__ */ new WeakSet();
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
  function watchPixelRatio(window2, onChange, { signal }) {
    const query = window2.matchMedia(`(resolution: ${window2.devicePixelRatio}dppx)`);
    const rearm = () => {
      onChange();
      watchPixelRatio(window2, onChange, { signal });
    };
    query.addEventListener("change", rearm, { once: true, signal });
  }
  function artworkRefresher({ window: window2, gBrowser, toolbar }, teardown) {
    const refresh = () => {
      try {
        const sessions = mediaSessions(gBrowser);
        sessions.forEach(watchController);
        renderArtwork(cardsIn(toolbar), sessions, {
          style: toolbar.getAttribute(STYLE_ATTRIBUTE),
          pixelRatio: window2.devicePixelRatio
        });
      } catch (error) {
        logError(error);
      }
    };
    const watchController = controllerWatcher(refresh, teardown);
    return refresh;
  }
  function startMediaViz({ window: window2, gBrowser, prefs }) {
    const toolbar = window2.document.querySelector(TOOLBAR_SELECTOR);
    if (!toolbar) throw new Error(`${TOOLBAR_SELECTOR} not found`);
    const teardown = new AbortController();
    const refresh = artworkRefresher({ window: window2, gBrowser, toolbar }, teardown);
    const applyStyle = (style) => {
      toolbar.setAttribute(STYLE_ATTRIBUTE, style);
      refresh();
    };
    watchArtworkStyle(prefs, applyStyle, teardown);
    watchPixelRatio(window2, refresh, teardown);
    const observer = observeTrackChanges(window2, toolbar, refresh);
    applyStyle(readArtworkStyle(prefs));
    return {
      destroy() {
        observer.disconnect();
        teardown.abort();
        toolbar.removeAttribute(STYLE_ATTRIBUTE);
        cardsIn(toolbar).forEach(removeArtwork);
      }
    };
  }

  // src/install.js
  function destroyPrevious(window2) {
    try {
      window2.ZenMediaViz?.destroy();
    } catch (error) {
      logError(error);
    }
  }
  function install(window2) {
    destroyPrevious(window2);
    try {
      const mediaViz = startMediaViz({
        window: window2,
        gBrowser: window2.gBrowser,
        prefs: window2.Services.prefs
      });
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
