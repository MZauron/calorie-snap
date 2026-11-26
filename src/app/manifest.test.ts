import { describe, expect, it } from "vitest";
import manifest from "./manifest";

describe("web manifest", () => {
  it("opens full screen with the app's name and the forest-green theme", () => {
    const m = manifest();
    expect(m.name).toBe("Calorie Snap");
    expect(m.display).toBe("standalone");
    expect(m.theme_color).toBe("#1F6B47");
    expect(m.icons?.length).toBeGreaterThan(0);
  });
});
