// bise-mac-helper: a child of bise's Electron app (src/main spawns it),
// typed JSON lines on stdin/stdout (Helper.swift). Never a window, never
// in the Dock, never active.

import AppKit

MainActor.assumeIsolated {
    let app = NSApplication.shared
    _ = app.setActivationPolicy(.prohibited)
    let helper = Helper()
    helper.start()
    withExtendedLifetime(helper) { app.run() }
}
