const USABLE_PROTOCOLS = new Set(["https:", "data:"]);
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

export function isUsableSrc(src) {
  return USABLE_PROTOCOLS.has(URL.parse(src)?.protocol);
}

function largestWidthPx(sizes) {
  return Math.max(0, ...parseSizes(sizes).map(({ widthPx }) => widthPx));
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
