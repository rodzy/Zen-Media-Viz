import { isUsableSrc } from "./artwork.js";

const HTML_NS = "http://www.w3.org/1999/xhtml";
const ARTWORK_CLASS = "zen-media-viz-artwork";
const INFO_CONTAINER_SELECTOR = ".zen-media-info-container";

const findArtwork = (card) => card.querySelector(`.${ARTWORK_CLASS}`);

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

export function removeArtwork(card) {
  findArtwork(card)?.remove();
}

export function showArtwork(card, src) {
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
