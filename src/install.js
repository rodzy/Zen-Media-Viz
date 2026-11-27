import { logError } from "./log.js";
import { startMediaViz } from "./runtime.js";

function destroyPrevious(window) {
  try {
    window.ZenMediaViz?.destroy();
  } catch (error) {
    logError(error);
  }
}

export function install(window) {
  destroyPrevious(window);
  try {
    const mediaViz = startMediaViz({ window, gBrowser: window.gBrowser });
    const handle = {
      destroy() {
        mediaViz.destroy();
        if (window.ZenMediaViz === handle) delete window.ZenMediaViz;
      },
    };
    window.ZenMediaViz = handle;
    window.addUnloadListener?.(handle.destroy);
  } catch (error) {
    logError(error);
  }
}
