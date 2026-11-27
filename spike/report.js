const TOOLBAR_SELECTOR = "#zen-media-controls-toolbar";
const TEMPLATE_SELECTOR = "#zen-media-card-template";
const CARD_SELECTOR = ".zen-media-card";
const CSP_SELECTOR = 'meta[http-equiv="Content-Security-Policy"]';

function describeEnvironment({ name, version, platformVersion, OS }) {
  return { name, version, platformVersion, os: OS };
}

function describeElement({ localName, classList }) {
  return [localName, ...classList].join(".");
}

function pathBetween(ancestor, element) {
  const path = [];
  for (let node = element; node && node !== ancestor; node = node.parentElement) {
    path.unshift(describeElement(node));
  }
  return [describeElement(ancestor), ...path];
}

function describeCard(card) {
  const title = card.querySelector(".zen-media-title");
  return {
    hidden: card.hidden,
    title: title?.textContent ?? null,
    artist: card.querySelector(".zen-media-artist")?.textContent ?? null,
    titlePath: title ? pathBetween(card, title) : null,
  };
}

function describeToolbar(document) {
  const toolbar = document.querySelector(TOOLBAR_SELECTOR);
  if (!toolbar) return null;

  return {
    hasTemplate: toolbar.querySelector(TEMPLATE_SELECTOR) !== null,
    cards: [...toolbar.querySelectorAll(CARD_SELECTOR)].map(describeCard),
    html: toolbar.outerHTML,
  };
}

function readMetadata(controller) {
  try {
    return { metadata: controller.getMetadata() };
  } catch ({ name, message }) {
    return { metadataError: { name, message } };
  }
}

function controllerOf(tab) {
  return tab.linkedBrowser?.browsingContext?.mediaController ?? null;
}

function describeTab(tab) {
  const { browserId, currentURI } = tab.linkedBrowser;
  const controller = controllerOf(tab);
  return {
    browserId,
    host: URL.parse(currentURI?.spec ?? "")?.host || null,
    soundPlaying: tab.hasAttribute("soundplaying"),
    id: controller.id,
    isActive: controller.isActive,
    isPlaying: controller.isPlaying,
    isAudible: controller.isAudible,
    playbackState: controller.playbackState,
    supportedKeys: [...controller.supportedKeys],
    ...readMetadata(controller),
  };
}

function describeControllers(tabs) {
  const { active = [], inactive = [] } = Object.groupBy([...tabs].filter(controllerOf), (tab) =>
    controllerOf(tab).isActive ? "active" : "inactive",
  );
  const [firstInactive] = inactive;

  return {
    active: active.map(describeTab),
    inactiveCount: inactive.length,
    inactiveMetadataError: firstInactive
      ? (readMetadata(controllerOf(firstInactive)).metadataError ?? null)
      : null,
  };
}

function describeMembers(object) {
  if (!object) return null;

  return {
    own: Object.getOwnPropertyNames(object).toSorted(),
    prototype: Object.getOwnPropertyNames(Object.getPrototypeOf(object)).toSorted(),
  };
}

export function collectReport({ document, gBrowser, gZenMediaController, appinfo }) {
  return {
    environment: describeEnvironment(appinfo),
    csp: document.querySelector(CSP_SELECTOR)?.getAttribute("content") ?? null,
    toolbar: describeToolbar(document),
    zenMediaController: describeMembers(gZenMediaController),
    controllers: describeControllers(gBrowser.tabs),
  };
}
