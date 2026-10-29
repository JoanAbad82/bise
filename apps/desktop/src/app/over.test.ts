import { describe, expect, it } from "vitest";
import { overOf } from "./over";

// app/bar-slide (try-gate dc4770c1): slid over at 800, then 1400, the scrim kept every click.
describe("overOf", () => {
  const slid = { what: "side", at: "/p/acme", width: "narrow" } as const;

  it("keeps what slid over on its route and width class", () => {
    expect(overOf(slid, "/p/acme", "narrow")).toBe("side");
    expect(overOf(null, "/p/acme", "narrow")).toBeNull();
  });

  it("closes it when the window goes wide, and back to narrow it stays closed", () => {
    expect(overOf(slid, "/p/acme", "wide")).toBeNull();
    expect(overOf(slid, "/p/acme", "mid")).toBeNull();
    // back under 1000: setOver stored nothing new, the class it opened on is gone with the next slide
    expect(overOf({ ...slid, width: "wide" }, "/p/acme", "narrow")).toBeNull();
  });

  it("closes it when the route moves", () => {
    expect(overOf(slid, "/p/other", "narrow")).toBeNull();
  });
});
