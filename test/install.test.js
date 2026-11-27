// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { install } from "../src/install.js";
import report from "./fixtures/zen-1.24.3b.json" with { type: "json" };

const [recorded] = report.controllers.active;

function playingTab() {
  const controller = Object.assign(new EventTarget(), { getMetadata: () => recorded.metadata });
  return { linkedBrowser: { browsingContext: { mediaController: controller } } };
}

function mountToolbar() {
  const parsed = new DOMParser().parseFromString(report.toolbar.html, "application/xml");
  document.body.replaceChildren(document.importNode(parsed.documentElement, true));
}

const artworkCount = () => document.querySelectorAll(".zen-media-viz-artwork").length;

function fakeWindow(overrides = {}) {
  return Object.assign(Object.create(window), { gBrowser: { tabs: [playingTab()] } }, overrides);
}

afterEach(() => {
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

describe("install", () => {
  it("starts the mod and exposes it as ZenMediaViz", () => {
    mountToolbar();
    const target = fakeWindow();

    install(target);

    expect(artworkCount()).toBe(1);
    expect(typeof target.ZenMediaViz.destroy).toBe("function");
  });

  it("tears down a previous instance before starting again", () => {
    mountToolbar();
    const target = fakeWindow();
    install(target);
    const previous = target.ZenMediaViz;
    const destroy = vi.spyOn(previous, "destroy");

    install(target);

    expect(destroy).toHaveBeenCalledOnce();
    expect(target.ZenMediaViz).not.toBe(previous);
    expect(artworkCount()).toBe(1);
  });

  it("removes the artwork and the global on destroy", () => {
    mountToolbar();
    const target = fakeWindow();
    install(target);

    target.ZenMediaViz.destroy();

    expect(artworkCount()).toBe(0);
    expect(target.ZenMediaViz).toBeUndefined();
  });

  it("leaves a newer instance in place when an old one is destroyed", () => {
    mountToolbar();
    const target = fakeWindow();
    install(target);
    const stale = target.ZenMediaViz;
    install(target);
    const current = target.ZenMediaViz;

    stale.destroy();

    expect(target.ZenMediaViz).toBe(current);
  });

  it("registers its teardown with Sine's unload listener", () => {
    mountToolbar();
    const addUnloadListener = vi.fn();
    const target = fakeWindow({ addUnloadListener });
    install(target);
    const [unload] = addUnloadListener.mock.calls[0];

    unload();

    expect(artworkCount()).toBe(0);
    expect(target.ZenMediaViz).toBeUndefined();
  });

  it("logs and leaves the window alone when the media toolbar is missing", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const target = fakeWindow();

    install(target);

    expect(error).toHaveBeenCalledWith("[zen-media-viz]", expect.any(Error));
    expect(target.ZenMediaViz).toBeUndefined();
  });
});
