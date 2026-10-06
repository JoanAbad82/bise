// App, split out of App.swift (rule 6, mechanical): harness A's wiring (Harness.swift drives the real app).
// The same AmbientApp; its state lives in App.swift.

import AppKit

extension AmbientApp {
    // MARK: harness A (Harness.swift): the real app, driven by a socket

    func harnessSetup() {
        guard let hs = harness else { return }
        hs.bar = { [unowned self] in self.capsule }
        hs.win = { [weak self] in self?.desktop }
        hs.winOp = { [weak self] op, q in
            guard let self else { return }
            switch op {
            case "win_open": self.openWindow((q["route"] as? String).flatMap(WinRoute.valid))
            case "win_close": self.desktop?.close()
            default: self.command(["cmd": "app_window", "route": q["route"] ?? NSNull(), "open": q["open"] ?? NSNull()])   // deeplink: the bar's own path
            }
        }
        DesktopWindow.tap = { [weak hs] who, ev in hs?.note(who, ev) }
        hs.keyEvent = { [weak self] t, e in self?.keys.qaEvent(t, e) ?? false }
        hs.appState = { [weak self] in self?.harnessState() ?? [:] }
        Log.tap = { [weak hs] line in MainActor.assumeIsolated { hs?.note("log", line) } }
        Capsule.tap = { [weak hs] who, ev in hs?.note(who, ev) }
        Capsule.frameGuard = { [weak hs] w in hs?.check(w) ?? true }
        hs.start()
    }

    func harnessState() -> [String: Any] {
        ["vis": ["pinned": vis.pinned, "hidden": capsule.hidden], "talking": talking, "phase": phase,
         "keys": ["bar": keyFocus.bar],
         "win_route": desktop?.route ?? NSNull(),
         "core": ["bise": config.bise, "workspace": config.workspace],
         "hub": memory["hub"] ?? NSNull()]
    }
}
