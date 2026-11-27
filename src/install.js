import { logError } from "./log.js";
import { startMediaViz } from "./runtime.js";

export function install(window) {
  window.ZenMediaViz?.destroy();
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
