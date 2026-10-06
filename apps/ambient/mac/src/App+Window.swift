// App, split out of App.swift (rule 6, mechanical): bise's window (S4, DesktopWindow.swift).
// The same AmbientApp; its state lives in App.swift.

import AppKit
import UniformTypeIdentifiers

extension AmbientApp {
    // MARK: bise's window (S4, DesktopWindow.swift): never at launch, made at its first open

    func openWindow(_ route: String?) {
        let d = desktop ?? {
            let d = DesktopWindow(offScreen: harnessMode, defaults: defaults)
            d.onCmd = { [weak self] in self?.command($0) }
            d.onDrop = { [weak self] paths in
                // a folder dropped on it = add a project (the core's; S1 owns the registry)
                for p in paths { self?.toCore(["cmd": "project_add", "path": p]) }
                self?.desktop?.post(["ev": "win_drop", "paths": paths])
            }
            d.onShown = { [weak self] on in
                self?.windowPolicy(on)
                if !on { self?.cardSeatChanged() }
            }
            d.onKey = { [weak self] on in if !on { self?.cardSeatChanged() } }
            d.onReady = { [weak self, weak d] in
                for k in ["hub", "state", "phase", "main"] { if let ev = self?.memory[k] { d?.post(ev) } }
            }
            d.load(webDir: config.web)
            desktop = d
            return d
        }()
        Log.say("window: open \(route ?? "where he left it")")
        d.open(route)
    }

    // where a card shows now (CardSeat): the window in front and key, else the bar
    func cardSeat() -> CardSeat {
        let w = desktop
        return CardSeat.seat(windowShown: w.map { !$0.hidden } ?? false, windowKey: w?.window.isKeyWindow ?? false,
                             appFront: NSApp.isActive || CapsulePanel.simulatedKeys)
    }

    // bise's window holds this card: no bar for it, and the bar's page is told
    // so a bar already up (the hello) doesn't turn into the card (amb-tools m_8716, A)
    func holdCard(_ id: String) {
        sayCardSeat(.window)
        heldCard = id
        Log.say("app: card \(id) stays in the window (it's in front)")
    }

    // the bar's page is told each change of seat, once (amb-tools m_8858: a
    // page left at 'window' shows no card, so 'bar' goes even with no card held)
    func sayCardSeat(_ s: CardSeat) {
        guard s != cardSeatSaid else { return }
        cardSeatSaid = s
        capsule.post(["ev": "app_card_seat", "at": s == .window ? "window" : "bar"])
    }

    // the window closed, lost the keys, or another app came in front (lead
    // m_8679, B): a card it held comes to the bar now, bottom centre
    func cardSeatChanged() {
        let seat = cardSeat()
        Log.say("app: card seat \(seat == .window ? "window" : "bar"), held \(heldCard ?? "none")")
        guard seat == .bar else { return }
        sayCardSeat(.bar)
        guard let c = heldCard else { return }
        heldCard = nil
        // pushed now, whatever the page showed while the window held it (amb-tools
        // m_8858: the page shows no card while at:'window', so waiting for its
        // needs dropped the card silently); at:'bar' brings the card back on it
        if cardPush.shows(card: c == "?" ? nil : c) {
            Log.say("app: card \(c) comes to the bar (the window isn't in front)")
            visFeed(.card)
        } else {
            Log.say("app: card \(c) already shown once: it stays in the icon")
        }
    }

    // a normal app (Dock icon, ⌘Tab) only while the window shows (WinPolicy)
    func windowPolicy(_ shown: Bool) {
        switch WinPolicy.policy(windowShown: shown, harness: harnessMode) {
        case .regular: NSApp.setActivationPolicy(.regular)
        case .accessory: NSApp.setActivationPolicy(.accessory)
        case .unchanged: break
        }
    }

    // {cmd:'open_in', app:'terminal'|'editor', project, path} (S8, amb-web's
    // environments): the folder in his terminal or editor (OpenIn), through
    // NSWorkspace only (no shell string); QA and the harness never open it
    func openIn(_ cmd: [String: Any]) {
        guard let kind = (cmd["app"] as? String).flatMap(OpenIn.Kind.init(rawValue:)) else {
            Log.say("app: open_in: app must be terminal or editor"); return
        }
        let fm = FileManager.default
        guard let dir = OpenIn.folder(cmd["path"] as? String, isDir: { p in
            var d: ObjCBool = false
            return fm.fileExists(atPath: p, isDirectory: &d) && d.boolValue
        }) else { Log.say("app: open_in: not a folder: \(cmd["path"] ?? "none")"); return }
        let ws = NSWorkspace.shared
        let running = ws.runningApplications.compactMap(\.bundleIdentifier)
        let installed = (OpenIn.terminals + OpenIn.editors).filter { ws.urlForApplication(withBundleIdentifier: $0) != nil }
        let source = UTType.sourceCode
        let def = ws.urlForApplication(toOpen: source).flatMap { Bundle(url: $0)?.bundleIdentifier }
        let pick = OpenIn.pick(kind, running: running, installed: installed, defaultForSource: def)
        Log.say("app: open_in \(kind.rawValue) \(dir) with \(pick ?? "Finder")")
        if sandbox { harness?.note("app>open_in", ["app": kind.rawValue, "path": dir, "with": pick ?? "Finder"]); return }
        let folder = URL(fileURLWithPath: dir, isDirectory: true)
        guard let id = pick, let app = ws.urlForApplication(withBundleIdentifier: id) else { ws.open(folder); return }
        ws.open([folder], withApplicationAt: app, configuration: NSWorkspace.OpenConfiguration()) { _, err in
            if let err { Log.say("app: open_in failed: \(err.localizedDescription)") }
        }
    }

    // the Dock icon (while the window is open) clicked: the window again
    @objc func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows: Bool) -> Bool {
        if !harnessMode { openWindow(nil) }
        return false
    }
}
