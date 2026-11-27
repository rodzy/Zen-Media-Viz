/* global gBrowser, Services, copy */
import { collectReport } from "./report.js";

const report = collectReport({
  document,
  gBrowser,
  gZenMediaController: window.gZenMediaController,
  appinfo: Services.appinfo,
});

copy(JSON.stringify(report, null, 2));
console.log("[zen-media-viz] Spike report copied to the clipboard.", report);
