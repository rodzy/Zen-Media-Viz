import { build } from "esbuild";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const BUNDLE = "zen-media-viz.uc.js";

const root = fileURLToPath(new URL(".", import.meta.url));
const bundleUrl = new URL(`./${BUNDLE}`, import.meta.url);
const pkg = JSON.parse(await readFile(new URL("./package.json", import.meta.url), "utf8"));
const isCheck = process.argv.includes("--check");

const { outputFiles } = await build({
  absWorkingDir: root,
  entryPoints: ["src/index.js"],
  outfile: BUNDLE,
  write: !isCheck,
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

if (isCheck) {
  const committed = existsSync(bundleUrl) ? await readFile(bundleUrl, "utf8") : null;

  if (committed !== outputFiles[0].text) {
    console.error(`${BUNDLE} is missing or out of date. Run \`npm run build\` and commit it.`);
    process.exit(1);
  }
}
