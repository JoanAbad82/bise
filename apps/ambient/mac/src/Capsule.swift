// Capsule: the floating glass panel top right (SPEC §1): a non-activating
// NSPanel on every Space, an NSVisualEffectView (.hudWindow, dark) masked
// to the web UI's rounded rects (the capsule, and the needs-you note under
// it), and a transparent WKWebView on top that draws the tint, the strokes
// and everything else. The bridge: events go in through
// window.ambient.recv(ev); the page's cmds come out through
// window.webkit.messageHandlers.bise.postMessage(cmd).

import AppKit
import WebKit

final class CapsulePanel: NSPanel {
    override var canBecomeKey: Bool { true }
    override var canBecomeMain: Bool { false }
}

// the page's boxes in CSS px (app_size): the capsule at the top right of
// the web view, and the optional note under it, same width, same right edge
struct CapsuleShape: Equatable {
    var w: CGFloat = 360
    var h: CGFloat = 84
    var radius: CGFloat = 44
    var note: Note? = nil
    struct Note: Equatable { var y: CGFloat; var h: CGFloat; var radius: CGFloat }

    // the window must hold both boxes
    var box: NSSize {
        var hh = h
        if let n = note { hh = max(hh, n.y + n.h) }
        return NSSize(width: w, height: hh)
    }

    static func from(_ c: [String: Any], maxHeight: CGFloat) -> CapsuleShape? {
        func num(_ o: [String: Any], _ k: String) -> CGFloat? { (o[k] as? NSNumber).map { CGFloat($0.doubleValue) } }
        guard let w = num(c, "w"), let h = num(c, "h"), w >= 40, h >= 20 else { return nil }
        var s = CapsuleShape(w: min(w, 900), h: min(h, maxHeight), radius: num(c, "radius") ?? 40, note: nil)
        if let n = c["note"] as? [String: Any], let y = num(n, "y"), let nh = num(n, "h"), nh > 0 {
            s.note = Note(y: y, h: min(nh, max(0, maxHeight - y)), radius: num(n, "radius") ?? 24)
        }
        return s
    }
}

// macOS's own window corner radius (the user: the capsule's corners match
// the system's, idle and open alike, never a pill). Read from an offscreen
// app window with a toolbar (the usual app window: 26 on Tahoe, where a
// titlebar-only window is 16) through the private _cornerRadius, best
// effort; else a table by major version.
@MainActor
func macWindowRadius() -> CGFloat {
    let w = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 400, height: 300),
                     styleMask: [.titled, .closable, .resizable, .fullSizeContentView], backing: .buffered, defer: true)
    w.isReleasedWhenClosed = false
    w.toolbar = NSToolbar(identifier: "bise.radius")
    let sel = NSSelectorFromString("_cornerRadius")
    if w.responds(to: sel), let r = w.value(forKey: "_cornerRadius") as? NSNumber, r.doubleValue > 0, r.doubleValue < 60 {
        return CGFloat(r.doubleValue)
    }
    return ProcessInfo.processInfo.operatingSystemVersion.majorVersion >= 26 ? 26 : 10
}

// WKUserContentController holds its handler strongly: a weak hop
private final class WeakHandler: NSObject, WKScriptMessageHandler {
    weak var target: Capsule?
    init(_ t: Capsule) { target = t }
    func userContentController(_ c: WKUserContentController, didReceive m: WKScriptMessage) {
        MainActor.assumeIsolated { target?.received(m.body) }
    }
}

@MainActor
final class Capsule: NSObject, WKNavigationDelegate {
    var onCmd: (([String: Any]) -> Void)?
    var onReady: (() -> Void)?
    var onHover: ((Bool) -> Void)?           // the mouse over the panel (holds a timed show)
    var onPlaced: (() -> Void)?              // the panel moved (the icon's rect for the page)

    let panel: CapsulePanel
    private let effect: NSVisualEffectView
    let web: WKWebView          // QA (--qa only) snapshots it and reads its model
    private(set) var ready = false
    private(set) var hidden = false
    private(set) var shape = CapsuleShape()
    private var shrink: DispatchWorkItem?
    private var webDir: String?
    private var watcher: DirWatcher?
    // the corners of both boxes: macOS's window radius, not the page's
    let radius: CGFloat = macWindowRadius()

    override init() {
        panel = CapsulePanel(contentRect: NSRect(x: 0, y: 0, width: 360, height: 84),
                             styleMask: [.borderless, .nonactivatingPanel], backing: .buffered, defer: false)
        panel.isFloatingPanel = true
        panel.level = .statusBar
        panel.collectionBehavior = [.canJoinAllSpaces, .stationary, .fullScreenAuxiliary, .ignoresCycle]
        panel.hidesOnDeactivate = false
        panel.becomesKeyOnlyIfNeeded = true
        panel.isOpaque = false
        panel.backgroundColor = .clear
        panel.hasShadow = true
        panel.isMovable = false
        panel.isReleasedWhenClosed = false
        panel.appearance = NSAppearance(named: .darkAqua)

        let root = NSView(frame: panel.contentRect(forFrameRect: panel.frame))
        root.autoresizesSubviews = true

        effect = NSVisualEffectView(frame: root.bounds)
        effect.material = .hudWindow
        effect.blendingMode = .behindWindow
        effect.state = .active          // blur even when bise isn't the active app (it never is)
        effect.appearance = NSAppearance(named: .darkAqua)
        effect.autoresizingMask = [.width, .height]
        root.addSubview(effect)

        let conf = WKWebViewConfiguration()
        conf.suppressesIncrementalRendering = true
        conf.mediaTypesRequiringUserActionForPlayback = []
        conf.preferences.setValue(true, forKey: "developerExtrasEnabled")
        conf.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
        conf.userContentController.addUserScript(WKUserScript(source: Capsule.bootJS, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        web = WKWebView(frame: root.bounds, configuration: conf)
        web.setValue(false, forKey: "drawsBackground")
        web.underPageBackgroundColor = .clear
        web.autoresizingMask = [.width, .height]
        web.isInspectable = true
        root.addSubview(web)
        panel.contentView = root

        super.init()
        root.addTrackingArea(NSTrackingArea(rect: .zero, options: [.mouseEnteredAndExited, .activeAlways, .inVisibleRect],
                                            owner: self, userInfo: nil))
        conf.userContentController.add(WeakHandler(self), name: "bise")
        web.navigationDelegate = self
        place(shape.box)
        applyMask()
    }

    // in the page before its own scripts: the app's marks
    static let bootJS = """
    window.ambientApp = {mac: true};
    (function () {
      var mark = function () { document.documentElement && document.documentElement.classList.add('app'); };
      if (document.documentElement) mark(); else document.addEventListener('DOMContentLoaded', mark);
    })();
    """

    @objc func mouseEntered(with e: NSEvent) { onHover?(true) }
    @objc func mouseExited(with e: NSEvent) { onHover?(false) }

    // MARK: the page

    func load(webDir dir: String?) {
        webDir = dir
        ready = false
        watcher = nil
        guard let dir else { web.loadHTMLString(Capsule.missing("no web UI dir given (--web)"), baseURL: nil); return }
        let index = URL(fileURLWithPath: dir).appendingPathComponent("index.html")
        guard FileManager.default.fileExists(atPath: index.path) else {
            web.loadHTMLString(Capsule.missing("no \(index.path)"), baseURL: nil); return
        }
        web.loadFileURL(index, allowingReadAccessTo: URL(fileURLWithPath: dir))
        // live dev: a change under the web dir reloads the page
        watcher = DirWatcher(path: dir) { [weak self] in self?.reload() }
    }

    func reload() {
        Log.say("capsule: reload")
        ready = false
        web.reload()
    }

    private static func missing(_ why: String) -> String {
        let esc = why.replacingOccurrences(of: "&", with: "&amp;").replacingOccurrences(of: "<", with: "&lt;")
        return "<html><body style='margin:0;font:13px -apple-system;color:#ffffffa0;background:#2a2224cc;height:100vh;display:flex;align-items:center;justify-content:center;padding:0 24px;text-align:center'>bise ambient: \(esc)</body></html>"
    }

    // an event for the page (dropped until it's loaded: App replays what matters)
    func post(_ ev: [String: Any]) {
        guard ready, let s = JSON.string(ev) else { return }
        web.evaluateJavaScript("window.ambient && window.ambient.recv(\(s))", completionHandler: nil)
    }

    fileprivate func received(_ body: Any) {
        guard let cmd = body as? [String: Any], cmd["cmd"] is String else {
            Log.say("capsule: not a cmd: \(body)")
            return
        }
        onCmd?(cmd)
    }

    func webView(_ w: WKWebView, didFinish n: WKNavigation!) {
        ready = true
        onReady?()
    }

    func webViewWebContentProcessDidTerminate(_ w: WKWebView) {
        Log.say("capsule: web content died, reloading")
        ready = false
        w.reload()
    }

    // links leave the capsule: the browser opens them
    func webView(_ w: WKWebView, decidePolicyFor a: WKNavigationAction, decisionHandler: @escaping @MainActor (WKNavigationActionPolicy) -> Void) {
        if let url = a.request.url, a.navigationType == .linkActivated || a.targetFrame == nil, !url.isFileURL {
            NSWorkspace.shared.open(url)
            decisionHandler(.cancel)
            return
        }
        decisionHandler(.allow)
    }

    // MARK: the frame

    // the capsule's screen (Placement): the first one (the menu bar's),
    // or the mouse's when each display has its own menu bar; picked again
    // at launch, on a display change or a wake, and when you call bise
    private var screenIndex = 0
    private var screen: NSScreen? {
        let all = NSScreen.screens
        return all.indices.contains(screenIndex) ? all[screenIndex] : all.first
    }

    func pickScreen() {
        let boxes = NSScreen.screens.map { ScreenBox(frame: $0.frame, visible: $0.visibleFrame) }
        let i = Placement.screen(boxes, mouse: NSEvent.mouseLocation, separateSpaces: NSScreen.screensHaveSeparateSpaces) ?? 0
        guard i != screenIndex || panel.screen == nil else { return }
        screenIndex = i
        place(panel.frame.size)
        applyMask()
    }

    var maxHeight: CGFloat { (screen?.frame.height ?? 900) * 0.7 }

    // SPEC §1: 20 px from the screen's right edge, 12 px under the menu
    // bar, never off the screen (Placement.frame)
    private func place(_ size: NSSize) {
        guard let s = screen else { return }
        let f = Placement.frame(size, on: ScreenBox(frame: s.frame, visible: s.visibleFrame))
        let moved = f.origin != panel.frame.origin || f.size != panel.frame.size
        panel.setFrame(f, display: true)
        if moved { onPlaced?() }
    }

    // app_size: the window grows at once, shrinks 650 ms after the last
    // app_size (so a per-frame spring never resizes it each frame); the
    // blur mask follows every app_size
    func apply(_ s: CapsuleShape) {
        shape = s
        let want = s.box
        let cur = panel.frame.size
        if want.width > cur.width + 0.5 || want.height > cur.height + 0.5 {
            place(NSSize(width: max(want.width, cur.width), height: max(want.height, cur.height)))
        }
        applyMask()
        shrink?.cancel()
        if abs(want.width - panel.frame.width) > 0.5 || abs(want.height - panel.frame.height) > 0.5 {
            let job = DispatchWorkItem { [weak self] in
                MainActor.assumeIsolated {
                    guard let self else { return }
                    self.place(self.shape.box)
                    self.applyMask()
                }
            }
            shrink = job
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.65, execute: job)
        }
    }

    func screensChanged() {
        if !NSScreen.screens.indices.contains(screenIndex) { screenIndex = 0 }
        pickScreen()
        place(panel.frame.size)
        applyMask()
    }

    // the blur only under the page's boxes (top right anchored, flipped coords)
    private func applyMask() {
        let size = panel.frame.size
        let s = shape
        let r = radius
        let img = NSImage(size: size, flipped: true) { _ in
            NSColor.black.setFill()
            let x = size.width - s.w
            NSBezierPath(roundedRect: NSRect(x: x, y: 0, width: s.w, height: s.h), xRadius: r, yRadius: r).fill()
            if let n = s.note {
                NSBezierPath(roundedRect: NSRect(x: x, y: n.y, width: s.w, height: n.h), xRadius: r, yRadius: r).fill()
            }
            return true
        }
        effect.maskImage = img
        panel.invalidateShadow()
        // the web view paints a beat later: the shadow follows it
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [weak self] in self?.panel.invalidateShadow() }
    }

    // MARK: shown, hidden, keys

    // the page grows the capsule out of the icon (SPEC §0): show orders the
    // panel in at once; hide lets the page shrink it back first (`after` s),
    // a show in between cancels the order out
    private var outJob: DispatchWorkItem?

    func show() {
        hidden = false
        outJob?.cancel()
        outJob = nil
        panel.orderFrontRegardless()
    }

    func hide(after: Double = 0) {
        hidden = true
        focus(false)
        outJob?.cancel()
        guard after > 0 else { panel.orderOut(nil); return }
        let job = DispatchWorkItem { [weak self] in
            MainActor.assumeIsolated { guard let self, self.hidden else { return }; self.panel.orderOut(nil) }
        }
        outJob = job
        DispatchQueue.main.asyncAfter(deadline: .now() + after, execute: job)
    }

    private var keysFrom: NSRunningApplication?

    // app_focus: the spotlight field types; off gives the keys back
    func focus(_ on: Bool) {
        if on {
            let front = NSWorkspace.shared.frontmostApplication
            if front?.processIdentifier != ProcessInfo.processInfo.processIdentifier { keysFrom = front }
            if hidden { show() }
            panel.makeKeyAndOrderFront(nil)
            panel.makeFirstResponder(web)
        } else if panel.isKeyWindow {
            panel.resignKey()
            keysFrom?.activate()
            keysFrom = nil
        }
    }
}

// a directory watched for changes (FSEvents), debounced 200 ms
@MainActor
final class DirWatcher {
    private var stream: FSEventStreamRef?
    private let changed: () -> Void
    private var pending = false

    init(path: String, changed: @escaping () -> Void) {
        self.changed = changed
        var ctx = FSEventStreamContext(version: 0, info: Unmanaged.passUnretained(self).toOpaque(), retain: nil, release: nil, copyDescription: nil)
        let cb: FSEventStreamCallback = { _, info, _, _, _, _ in
            guard let info else { return }
            let me = Unmanaged<DirWatcher>.fromOpaque(info).takeUnretainedValue()
            MainActor.assumeIsolated { me.fire() }
        }
        stream = FSEventStreamCreate(nil, cb, &ctx, [path] as CFArray, FSEventStreamEventId(kFSEventStreamEventIdSinceNow), 0.15,
                                     FSEventStreamCreateFlags(kFSEventStreamCreateFlagFileEvents | kFSEventStreamCreateFlagNoDefer))
        if let s = stream {
            FSEventStreamSetDispatchQueue(s, DispatchQueue.main)
            FSEventStreamStart(s)
        }
    }

    isolated deinit {
        if let s = stream { FSEventStreamStop(s); FSEventStreamInvalidate(s); FSEventStreamRelease(s) }
    }

    private func fire() {
        guard !pending else { return }
        pending = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) { [weak self] in
            MainActor.assumeIsolated {
                self?.pending = false
                self?.changed()
            }
        }
    }
}
