import { describe, expect, it } from "vitest";
import { MOD_NAME } from "../src/index.js";

describe("test harness", () => {
  it("imports mod source", () => {
    expect(MOD_NAME).toBe("zen-media-viz");
  });
});
