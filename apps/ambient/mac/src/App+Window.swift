// App, split out of App.swift (rule 6, mechanical): bise's window (S4, DesktopWindow.swift).
// The same AmbientApp; its state lives in App.swift.

import AppKit

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
            d.onShown = { [weak self] on in self?.windowPolicy(on) }
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

    // a normal app (Dock icon, ⌘Tab) only while the window shows (WinPolicy)
    func windowPolicy(_ shown: Bool) {
        switch WinPolicy.policy(windowShown: shown, harness: harnessMode) {
        case .regular: NSApp.setActivationPolicy(.regular)
        case .accessory: NSApp.setActivationPolicy(.accessory)
        case .unchanged: break
        }
    }

    // the Dock icon (while the window is open) clicked: the window again
    @objc func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows: Bool) -> Bool {
        if !harnessMode { openWindow(nil) }
        return false
    }
}
