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
        hs.statusClick = { [weak self] button in self?.harnessStatusClick(button) ?? [:] }
        hs.keyEvent = { [weak self] t, e in self?.keys.qaEvent(t, e) ?? false }
        hs.appState = { [weak self] in self?.harnessState() ?? [:] }
        Log.tap = { [weak hs] line in MainActor.assumeIsolated { hs?.note("log", line) } }
        Capsule.tap = { [weak hs] who, ev in hs?.note(who, ev) }
        Capsule.frameGuard = { [weak hs] w in hs?.check(w) ?? true }
        hs.start()
    }

    // the pearl's fake rect in harness mode: top right of the off-screen box, like a menu-bar icon
    static let harnessIcon = NSRect(x: Placement.offScreen.frame.maxX - 220, y: Placement.offScreen.frame.maxY - 24, width: 30, height: 24)

    // status_click (amb-tools m_8520): StatusItem's own click path without a
    // status item: left = the dropdown (App.menuView with the fake icon rect;
    // the page not up = the fallback), right = the fallback; the fallback is
    // reported as its rows, never shown
    func harnessStatusClick(_ button: String) -> [String: Any] {
        let rows = { StatusItem.fallbackRows(quiet: self.quiet.paused, noAccess: false).map(\.json) }
        if button == "right" { return ["menu": "fallback", "rows": rows()] }
        switch IconClick.act(shown: !capsule.hidden) {
        case .close:
            visFeed(.dismiss)
            return ["menu": "closed"]
        case .open:
            if menuView(icon: AmbientApp.harnessIcon) {
                return ["menu": "dropdown", "anchor": capsule.anchor.name, "icon": anchorIcon()]
            }
            return ["menu": "fallback", "why": "the page isn't up", "rows": rows()]
        }
    }

    func anchorIcon() -> Any {
        guard case .menu(let r) = capsule.anchor else { return NSNull() }
        return ["x": r.minX, "y": r.minY, "w": r.width, "h": r.height]
    }

    func harnessState() -> [String: Any] {
        ["vis": ["pinned": vis.pinned, "hidden": capsule.hidden], "talking": talking, "phase": phase,
         "keys": ["bar": keyFocus.bar],
         "anchor": capsule.anchor.name, "icon": anchorIcon(),
         "screen": capsule.screenBox.map { b -> [String: Any] in
             let r = { (f: CGRect) -> [String: Any] in ["x": f.minX, "y": f.minY, "w": f.width, "h": f.height] }
             return ["frame": r(b.frame), "visible": r(b.visible)]
         } ?? NSNull(),
         "win_route": desktop?.route ?? NSNull(),
         "core": ["bise": config.bise, "workspace": config.workspace],
         "hub": memory["hub"] ?? NSNull()]
    }
}
