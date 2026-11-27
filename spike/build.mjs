import { build } from "esbuild";
import { fileURLToPath } from "node:url";

const {
  outputFiles: [snippet],
} = await build({
  absWorkingDir: fileURLToPath(new URL("..", import.meta.url)),
  entryPoints: ["spike/console.js"],
  write: false,
  bundle: true,
  format: "iife",
  target: "firefox140",
  charset: "utf8",
  legalComments: "none",
  logLevel: "warning",
});

process.stdout.write(snippet.text);
