import { describe, expect, it } from "vitest";
import { W } from "./Capsule";
import { answeredOver, errorOver, heardOver } from "./over";

describe("capsule/over: a talk the core ends without a send (amb-core m_21857, designer m_21945)", () => {
  it("says the core's two terminal errors in the app's words, with the voice key's link", () => {
    expect(errorOver(null, "talk_start", "voice needs a key. /voice picks one.")).toEqual({
      ev: "talk_over",
      said: "bise needs a voice key to hear you.",
      link: { label: "settings › voice", route: "settings/voice" },
    });
    expect(errorOver(undefined, null, "main didn't get it: bise isn't reachable. try again in a moment.")).toEqual({ ev: "talk_over", said: "bise didn't get it. try again in a moment." });
  });
  it("passes every other error of the core through, and never a project's or another command's", () => {
    expect(errorOver(null, null, "the mic is busy")).toEqual({ ev: "talk_over", said: "the mic is busy" });
    expect(errorOver("shop-1a2b", null, "x")).toBeNull();
    expect(errorOver(null, "send", "x")).toBeNull();
  });
  it("nothing heard only on a final empty 'heard'", () => {
    expect(heardOver("  ", true)).toEqual({ ev: "talk_over", said: "i didn't hear anything. hold fn and talk." });
    expect(heardOver("", false)).toBeNull();
    expect(heardOver("hello", true)).toBeNull();
  });
  it("an answered card says its project, then fades", () => {
    expect(answeredOver("checkout")).toEqual({ ev: "talk_over", said: "✓ answered checkout", fades: true });
    expect(W.answered("checkout")).toBe("✓ answered checkout");
  });
});
