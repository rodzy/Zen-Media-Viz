import { logError } from "./log.js";

const NOT_AVAILABLE = "NS_ERROR_NOT_AVAILABLE";
const TITLE_SELECTOR = ".zen-media-title";
const ARTIST_SELECTOR = ".zen-media-artist";

export function readMetadata(controller) {
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

export function mediaSessions({ tabs }) {
  return [...tabs].map(sessionOf).filter((session) => session !== null);
}

const labelText = (card, selector) => card.querySelector(selector)?.textContent ?? "";

export function readCardTrack(card) {
  return { title: labelText(card, TITLE_SELECTOR), artist: labelText(card, ARTIST_SELECTOR) };
}

const isSameTrack = ({ title, artist }, metadata) =>
  title === metadata.title && artist === metadata.artist;

export function matchCards(cards, sessions) {
  const unclaimed = new Set(sessions);
  const matches = new Map();
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
