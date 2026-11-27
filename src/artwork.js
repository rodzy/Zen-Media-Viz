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

function largestEdgePx(sizes) {
  return parseSizes(sizes).reduce(
    (maxPx, { widthPx, heightPx }) => Math.max(maxPx, Math.min(widthPx, heightPx)),
    0,
  );
}

const smallest = (images) =>
  images.reduce((best, image) => (image.edgePx < best.edgePx ? image : best));
const largest = (images) =>
  images.reduce((best, image) => (image.edgePx > best.edgePx ? image : best));

export function pickArtwork(artwork, { minPx }) {
  const candidates = artwork
    .filter(({ src }) => isUsableSrc(src))
    .map(({ src, sizes }) => ({ src, edgePx: largestEdgePx(sizes) }));
  if (candidates.length === 0) return null;
  const bigEnough = candidates.filter(({ edgePx }) => edgePx >= minPx);
  return (bigEnough.length > 0 ? smallest(bigEnough) : largest(candidates)).src;
}
