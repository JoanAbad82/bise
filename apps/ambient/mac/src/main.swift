// Bise Ambient: the macOS shell of bise ambient (docs/ambient-app.md).
// An agent app (LSUIElement: no Dock, no cmd-tab), launched by
// scripts/ambient.sh open --workspace <ws> --bise <exe> [--web <dir>].

import AppKit

signal(SIGPIPE, SIG_IGN)   // the core died mid-write: an error, not our death

MainActor.assumeIsolated {
    let config = Config.parse(CommandLine.arguments, env: ProcessInfo.processInfo.environment)
    let app = NSApplication.shared
    let delegate = AmbientApp(config: config)
    app.delegate = delegate
    app.setActivationPolicy(.accessory)
    withExtendedLifetime(delegate) { app.run() }
}
