// Browser: open a page (docs/ambient-pages.md §2.8, §4.5). First the
// computer-use broker's C3 `show` (the user's `bise` tab group, ShowPlan
// says when to stop); then PageOpen's AppleScript (NSAppleScript, on one
// serial queue: a first run waits on macOS's Automation prompt, never on
// the main thread); any failure, a refused Automation included, falls back
// to opening the URL.

import AppKit

@MainActor
enum Browser {
    private static let queue = DispatchQueue(label: "dev.bise.ambient.applescript")
    private static let brokerQueue = DispatchQueue(label: "dev.bise.ambient.broker")
    // the hub's page server (App keeps it current): the url_prefix of a page
    static var pagesURL: String?
    // <bise home>/run/computer-use.sock: BISE_HOME, else ~/.bise
    nonisolated(unsafe) static var socketPath = NSHomeDirectory() + "/.bise/run/computer-use.sock"

    // harness A: never his browser
    nonisolated(unsafe) static var blocked = false

    static func open(_ url: String) {
        if blocked { Log.say("browser: harness: not opened \(url)"); return }
        guard let u = URL(string: url) else { Log.say("browser: bad url \(url)"); return }
        guard PageOpen.isWeb(url) else { NSWorkspace.shared.open(u); return }
        let prefix = ShowPlan.prefix(for: url, pagesURL: pagesURL)
        brokerQueue.async {
            let o = show(url: url, prefix: prefix)
            Log.say("browser: broker show \(o)")
            guard ShowPlan.after(o) == .fallback else { return }
            DispatchQueue.main.async { MainActor.assumeIsolated { scripted(url, u) } }
        }
    }

    // today's path: the tab by AppleScript in a running Chromium browser, else open
    private static func scripted(_ url: String, _ u: URL) {
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

    // the broker's C3 show, blocking (on brokerQueue): connect within
    // ShowPlan.connectBudget, then the answer within ShowPlan.replyWait
    nonisolated private static func show(url: String, prefix: String) -> ShowOutcome {
        let path = socketPath
        guard FileManager.default.fileExists(atPath: path) else { return .noBroker }
        let fd = socket(AF_UNIX, SOCK_STREAM, 0)
        guard fd >= 0 else { return .broken("socket") }
        defer { close(fd) }
        var one: Int32 = 1
        setsockopt(fd, SOL_SOCKET, SO_NOSIGPIPE, &one, socklen_t(MemoryLayout<Int32>.size))
        func timeout(_ s: Double) {
            var tv = timeval(tv_sec: Int(s), tv_usec: Int32((s - Double(Int(s))) * 1_000_000))
            setsockopt(fd, SOL_SOCKET, SO_RCVTIMEO, &tv, socklen_t(MemoryLayout<timeval>.size))
            setsockopt(fd, SOL_SOCKET, SO_SNDTIMEO, &tv, socklen_t(MemoryLayout<timeval>.size))
        }
        timeout(ShowPlan.connectBudget)
        var addr = sockaddr_un()
        addr.sun_family = sa_family_t(AF_UNIX)
        let bytes = Array(path.utf8)
        guard bytes.count < MemoryLayout.size(ofValue: addr.sun_path) else { return .broken("socket path too long") }
        withUnsafeMutableBytes(of: &addr.sun_path) { p in
            for (i, b) in bytes.enumerated() { p[i] = b }
            p[bytes.count] = 0
        }
        let rc = withUnsafePointer(to: &addr) {
            $0.withMemoryRebound(to: sockaddr.self, capacity: 1) { connect(fd, $0, socklen_t(MemoryLayout<sockaddr_un>.size)) }
        }
        // a stale socket file, or nobody listening: no extension connected
        guard rc == 0 else { return .noBroker }
        let id = 1
        var out = Data()
        for l in ShowPlan.lines(url: url, prefix: prefix, id: id) { if let d = JSON.line(l) { out.append(d) } }
        let sent = out.withUnsafeBytes { write(fd, $0.baseAddress, out.count) }
        guard sent == out.count else { return .broken("write") }
        // the request is out: from here a missing answer means "probably opened"
        let end = Date().addingTimeInterval(ShowPlan.replyWait)
        var lines = LineBuffer()
        var buf = [UInt8](repeating: 0, count: 4096)
        while true {
            let left = end.timeIntervalSinceNow
            if left <= 0 { return .late }
            timeout(left)
            let n = read(fd, &buf, buf.count)
            if n == 0 { return .broken("closed") }
            if n < 0 { return errno == EAGAIN || errno == EWOULDBLOCK ? .late : .broken("read") }
            for line in lines.feed(Data(buf[0..<n])) where !line.isEmpty {
                if let o = ShowPlan.outcome(reply: JSON.object(line), id: id) { return o }
            }
        }
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
