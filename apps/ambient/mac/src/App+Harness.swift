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
        hs.statusClick = { [weak self] button, pageUp in self?.harnessStatusClick(button, pageUp: pageUp) ?? [:] }
        hs.away = { [weak self] ms in self?.sayAway(ms) }
        hs.quiet = { [weak self] why in
            guard let self else { return [:] }
            self.harnessQuiet(why)
            return ["on": self.quiet.on, "why": self.quiet.why]
        }
        hs.drop = { [weak self] q in
            let items = (q["paths"] as? [String] ?? []).map { p -> DropItem in
                var dir: ObjCBool = false
                _ = FileManager.default.fileExists(atPath: p, isDirectory: &dir)
                return DropItem(path: p, isDir: dir.boolValue)
            }
            return ["app_drop": self?.dropped(items, link: q["url"] as? String, png: nil) ?? NSNull()]
        }
        hs.front = { [weak self] q in
            guard let self else { return [:] }
            if q["clear"] as? Bool == true { self.harnessFront = nil; return ["front": NSNull()] }
            let s = { (k: String) in q[k] as? String }
            let raw = FrontRaw(app: s("app"), bundle: s("bundle"), title: s("title"), document: s("document"),
                               axURL: s("url"), tabURL: s("tab_url"), selection: s("selection"),
                               texts: q["texts"] as? [String] ?? [])
            self.harnessFront = raw
            let c = FrontRules.build(raw, skip: self.settings.skipBundles)
            return ["context": c.context, "front": c.front]
        }
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
    // reported as its rows, never shown; page_up false = the click as if the
    // page weren't up (lead m_8615: the left click's own fallback branch)
    func harnessStatusClick(_ button: String, pageUp: Bool?) -> [String: Any] {
        let rows = { StatusItem.fallbackRows(quietEnds: self.quietHourEnds, noAccess: false).map(\.json) }
        if button == "right" { return ["menu": "fallback", "rows": rows()] }
        switch IconClick.act(shown: !capsule.hidden) {
        case .close:
            visFeed(.dismiss)
            return ["menu": "closed"]
        case .open:
            if menuView(icon: AmbientApp.harnessIcon, pageUp: pageUp) {
                return ["menu": "dropdown", "anchor": capsule.anchor.name, "icon": anchorIcon()]
            }
            return ["menu": "fallback", "why": pageUp == false ? "the page isn't up (page_up false)" : "the page isn't up", "rows": rows()]
        }
    }

    func anchorIcon() -> Any {
        guard case .menu(let r) = capsule.anchor else { return NSNull() }
        return ["x": r.minX, "y": r.minY, "w": r.width, "h": r.height]
    }

    // the menu-bar pearl as the icon would draw it (lead m_9238: the harness has
    // no status item): IconLook from the app's own inputs, without the 8 s flashes
    func pearlState() -> [String: Any] {
        let i = iconInputs()
        let look = IconLook.of(working: i.working, count: i.count, quiet: quiet.on, holding: talking,
                               glintUntil: -1, failedUntil: -1, now: 0, reduceMotion: reduceMotion)
        return ["mood": look.mood.rawValue, "count": look.count, "extra": look.extra, "quiet": quiet.on, "why": quiet.why]
    }

    func harnessState() -> [String: Any] {
        ["vis": ["pinned": vis.pinned, "hidden": capsule.hidden], "talking": talking, "phase": phase,
         "keys": ["bar": keyFocus.bar],
         "anchor": capsule.anchor.name, "icon": anchorIcon(), "pearl": pearlState(),
         "screen": capsule.screenBox.map { b -> [String: Any] in
             let r = { (f: CGRect) -> [String: Any] in ["x": f.minX, "y": f.minY, "w": f.width, "h": f.height] }
             return ["frame": r(b.frame), "visible": r(b.visible)]
         } ?? NSNull(),
         "win_route": desktop?.route ?? NSNull(),
         "core": ["bise": config.bise, "workspace": config.workspace],
         "hub": memory["hub"] ?? NSNull()]
    }
}
