import { isUsableSrc } from "./artwork.js";

const HTML_NS = "http://www.w3.org/1999/xhtml";
const ARTWORK_CLASS = "zen-media-viz-artwork";
const INFO_CONTAINER_SELECTOR = ".zen-media-info-container";

const findArtwork = (card) => card.querySelector(`.${ARTWORK_CLASS}`);

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

const artworkHost = (card, asBackground) =>
  asBackground ? card : card.querySelector(INFO_CONTAINER_SELECTOR);

export function removeArtwork(card) {
  findArtwork(card)?.remove();
}

export function showArtwork(card, src, { asBackground = false } = {}) {
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
