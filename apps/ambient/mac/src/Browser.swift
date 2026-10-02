// Browser: open a page (docs/ambient-pages.md §2.8). PageOpen decides; this
// runs its AppleScript (NSAppleScript, on one serial queue: a first run
// waits on macOS's Automation prompt, never on the main thread). Any
// failure, a refused Automation included, falls back to opening the URL.

import AppKit

@MainActor
enum Browser {
    private static let queue = DispatchQueue(label: "dev.bise.ambient.applescript")

    static func open(_ url: String) {
        guard let u = URL(string: url) else { Log.say("browser: bad url \(url)"); return }
        guard PageOpen.isWeb(url) else { NSWorkspace.shared.open(u); return }
        let running = Set(NSWorkspace.shared.runningApplications.compactMap(\.bundleIdentifier))
        let def = NSWorkspace.shared.urlForApplication(toOpen: u).flatMap { Bundle(url: $0)?.bundleIdentifier }
        guard let bundle = PageOpen.pick(running: running, defaultBrowser: def) else {
            NSWorkspace.shared.open(u)
            return
        }
        queue.async {
            let ok = drive(bundle, url)
            if !ok { DispatchQueue.main.async { NSWorkspace.shared.open(u) } }
        }
    }

    // the URL of `bundle`'s active tab, to `done` on the main thread; nil
    // when Automation isn't granted yet (never asked from here: fn must
    // not raise a prompt), the browser has no window, or the script fails
    static func activeTab(_ bundle: String, done: @escaping @MainActor (String?) -> Void) {
        queue.async {
            var url: String? = nil
            if allowed(bundle) { url = run(PageOpen.activeTabScript(bundle))?.stringValue }
            DispatchQueue.main.async { MainActor.assumeIsolated { done(url) } }
        }
    }

    // Automation already granted for `bundle` (asks nobody)
    nonisolated private static func allowed(_ bundle: String) -> Bool {
        let target = NSAppleEventDescriptor(bundleIdentifier: bundle)
        guard let desc = target.aeDesc else { return false }
        let any = AEEventClass(typeWildCard)
        return AEDeterminePermissionToAutomateTarget(desc, any, AEEventID(typeWildCard), false) == noErr
    }

    // on the script queue: the tab forward, or a new tab; false = fall back
    nonisolated private static func drive(_ bundle: String, _ url: String) -> Bool {
        guard let list = run(PageOpen.listScript(bundle)) else { return false }
        let windows = strings2(list)
        if let (w, t) = PageOpen.find(windows, page: url) {
            Log.say("browser: \(bundle) window \(w) tab \(t) has \(url)")
            return run(PageOpen.focusScript(bundle, window: w, tab: t)) != nil
        }
        Log.say("browser: \(bundle) new tab \(url)")
        return run(PageOpen.newTabScript(bundle, url: url)) != nil
    }

    nonisolated private static func run(_ source: String) -> NSAppleEventDescriptor? {
        var err: NSDictionary?
        guard let script = NSAppleScript(source: source) else { return nil }
        let out = script.executeAndReturnError(&err)
        if let err {
            Log.say("browser: script failed \(err[NSAppleScript.errorNumber] ?? "?"): \(err[NSAppleScript.errorMessage] ?? "")")
            return nil
        }
        return out
    }

    // a list of lists of strings (URL of every tab of every window); a
    // single window can come back as a flat list
    nonisolated private static func strings2(_ d: NSAppleEventDescriptor) -> [[String]] {
        func items(_ d: NSAppleEventDescriptor) -> [NSAppleEventDescriptor] {
            guard d.numberOfItems > 0 else { return [] }
            return (1...d.numberOfItems).compactMap { d.atIndex($0) }
        }
        let outer = items(d)
        if outer.allSatisfy({ $0.numberOfItems == 0 && $0.stringValue != nil }) && !outer.isEmpty {
            return [outer.compactMap(\.stringValue)]
        }
        return outer.map { w in items(w).compactMap(\.stringValue) }
    }
}
