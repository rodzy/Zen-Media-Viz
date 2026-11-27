const SIZE_PATTERN = /^([1-9]\d*)x([1-9]\d*)$/i;
const SCALABLE_SIZE = { widthPx: Infinity, heightPx: Infinity };

function parseSize(token) {
  if (token.toLowerCase() === "any") return SCALABLE_SIZE;
  const match = SIZE_PATTERN.exec(token);
  if (!match) return null;
  const [, width, height] = match;
  return { widthPx: Number(width), heightPx: Number(height) };
}

export function parseSizes(sizes = "") {
  return sizes
    .split(/\s+/)
    .filter(Boolean)
    .map(parseSize)
    .filter((size) => size !== null);
}

const isImageDataUrl = ({ protocol, pathname }) =>
  protocol === "data:" && pathname.toLowerCase().startsWith("image/");

export function isUsableSrc(src) {
  const url = URL.parse(src);
  if (!url) return false;
  return url.protocol === "https:" || isImageDataUrl(url);
}

function largestWidthPx(sizes) {
  return parseSizes(sizes).reduce((maxPx, { widthPx }) => Math.max(maxPx, widthPx), 0);
}

const narrowest = (images) =>
  images.reduce((best, image) => (image.widthPx < best.widthPx ? image : best));
const widest = (images) =>
  images.reduce((best, image) => (image.widthPx > best.widthPx ? image : best));

export function pickArtwork(artwork, { minPx }) {
  const candidates = artwork
    .filter(({ src }) => isUsableSrc(src))
    .map(({ src, sizes }) => ({ src, widthPx: largestWidthPx(sizes) }));
  if (candidates.length === 0) return null;
  const wideEnough = candidates.filter(({ widthPx }) => widthPx >= minPx);
  return (wideEnough.length > 0 ? narrowest(wideEnough) : widest(candidates)).src;
}
