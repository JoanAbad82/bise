// Tab: a Chromium browser's active tab URL, through AppleScript, only when
// he already allowed bise to automate that browser (never asks: a
// prompt at fn would be in his face). Cut from the Swift app's Browser.
// One script at a time: a second asker waits for the same answer.

import AppKit

@MainActor
enum Tab {
    private static let queue = DispatchQueue(label: "bise.helper.tab", qos: .userInitiated)
    private static var waiters: [@MainActor (String?) -> Void]? = nil

    static let browsers: Set<String> = ["com.google.Chrome", "company.thebrowser.Browser", "com.brave.Browser", "com.microsoft.edgemac"]

    nonisolated static func script(_ bundle: String) -> String {
        let lit = "\"" + bundle.replacingOccurrences(of: "\\", with: "\\\\").replacingOccurrences(of: "\"", with: "\\\"") + "\""
        return "tell application id \(lit) to get URL of active tab of front window"
    }

    static func active(_ bundle: String, _ done: @escaping @MainActor (String?) -> Void) {
        if waiters != nil { waiters?.append(done); return }
        waiters = [done]
        queue.async {
            var url: String? = nil
            if allowed(bundle) {
                var err: NSDictionary?
                url = NSAppleScript(source: script(bundle))?.executeAndReturnError(&err).stringValue
            }
            DispatchQueue.main.async {
                MainActor.assumeIsolated {
                    let all = waiters ?? []
                    waiters = nil
                    for w in all { w(url) }
                }
            }
        }
    }

    // Automation already granted for `bundle` (asks nobody)
    nonisolated private static func allowed(_ bundle: String) -> Bool {
        let target = NSAppleEventDescriptor(bundleIdentifier: bundle)
        guard let desc = target.aeDesc else { return false }
        let any = AEEventClass(typeWildCard)
        return AEDeterminePermissionToAutomateTarget(desc, any, AEEventID(typeWildCard), false) == noErr
    }
}
