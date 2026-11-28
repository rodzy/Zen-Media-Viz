import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import pkg from "../package.json" with { type: "json" };
import theme from "../theme.json" with { type: "json" };

const BROWSER_WINDOW = "chrome://browser/content/browser.xhtml";
const repoFile = (path) => new URL(`../${path}`, import.meta.url);

describe("theme.json", () => {
  it("runs the bundled script in browser windows", () => {
    expect(theme.scripts).toEqual({ "zen-media-viz.uc.js": { include: [BROWSER_WINDOW] } });
  });

  it("points at files that exist in the repository", () => {
    const paths = [...Object.keys(theme.scripts), theme.style.chrome, theme.preferences];

    expect(paths.filter((path) => !existsSync(repoFile(path)))).toEqual([]);
  });

  it("names a script Sine loads as a classic userscript", () => {
    expect(Object.keys(theme.scripts).every((path) => path.endsWith(".uc.js"))).toBe(true);
  });

  it("matches the package version", () => {
    expect(theme.version).toBe(pkg.version);
  });

  it("tells Sine the mod can be disabled without a restart", () => {
    expect(theme.supportsUnload).toBe(true);
  });
});
