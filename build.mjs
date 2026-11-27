import { build } from "esbuild";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const pkg = JSON.parse(await readFile(new URL("./package.json", import.meta.url), "utf8"));

await build({
  absWorkingDir: root,
  entryPoints: ["src/index.js"],
  outfile: "zen-media-viz.uc.js",
  bundle: true,
  format: "iife",
  target: "firefox140",
  charset: "utf8",
  legalComments: "none",
  logLevel: "warning",
  banner: {
    js: [
      "// ==UserScript==",
      "// @name         Zen Media Viz",
      `// @version      ${pkg.version}`,
      `// @description  ${pkg.description}`,
      "// @homepage     https://github.com/rodzy/Zen-Media-Viz",
      "// @license      MIT",
      "// ==/UserScript==",
      "// GENERATED FILE. Do not edit by hand: change src/ and run `npm run build`.",
    ].join("\n"),
  },
});
