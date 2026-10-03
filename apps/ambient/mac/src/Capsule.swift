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

// the page's boxes (app_size): CapsuleShape, Shape.swift

// one click acts (the user's dogfood, B1): WKWebView turned the first click
// on the non-key panel into a focus click; this view takes it as a click.
// The click also gives the bar the keys (round 9, ambient m_6521: 'a click
// on it gives it focus'), like Spotlight: the panel is non-activating, so
// his app stays the active app and gets the keys back when the bar goes.
final class CapsuleWebView: WKWebView {
    override func acceptsFirstMouse(for event: NSEvent?) -> Bool { true }
    override var needsPanelToBecomeKey: Bool { true }
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
    // the panel is never ordered in at launch: hidden until the first show
    // (false here made the first fn hold after a launch show nothing:
    // Visibility said shown, the app saw no change, no orderFront)
    private(set) var hidden = true
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
        // round 9 (ambient m_6521): no window shadow, the page draws the
        // glass's own (0 30 80 -24, 92 px under it in the box)
        panel.hasShadow = false
        panel.isMovable = false
        // no window animation of macOS's own on order in/out (the user, m_6567:
        // no grow, no zoom; the page's fade and 4 px lift are the only motion)
        panel.animationBehavior = .none
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
        web = CapsuleWebView(frame: root.bounds, configuration: conf)
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
        let all = NSScreen.screens
        let boxes = all.map { ScreenBox(frame: $0.frame, visible: $0.visibleFrame) }
        // round 9: the screen with his key window (NSScreen.main, read before
        // the bar takes the keys), else the mouse's
        let keyScreen = panel.isKeyWindow ? screenIndex : NSScreen.main.flatMap { m in all.firstIndex { $0 == m } }
        let i = Placement.activeScreen(boxes, keyWindowScreen: keyScreen, mouse: NSEvent.mouseLocation) ?? 0
        guard i != screenIndex || panel.screen == nil else { return }
        screenIndex = i
        place(panel.frame.size)
        applyMask()
    }

    var maxHeight: CGFloat { (screen?.frame.height ?? 900) * 0.7 }

    // round 9 (ambient m_6521): the glass centered on the screen, its top
    // 170 px below the screen's top, the pearl at its left, growing down;
    // never off the screen (Placement.bar)
    private func place(_ size: NSSize) {
        guard let s = screen else { return }
        let f = Placement.bar(size, glass: shape.glass, on: ScreenBox(frame: s.frame, visible: s.visibleFrame))
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

    // the blur only under the glass and the note (CapsuleShape.blurRects),
    // never behind the pearl: it floats with no background (L1)
    private func applyMask() {
        let size = panel.frame.size
        let rects = shape.blurRects(panel: size)
        // the page's radius (round 9: 26, its strokes' own), so the blur's
        // corners and the drawn strokes never part
        let r = shape.radius > 0 ? shape.radius : radius
        let img = NSImage(size: size, flipped: true) { _ in
            NSColor.black.setFill()
            for b in rects { NSBezierPath(roundedRect: b, xRadius: r, yRadius: r).fill() }
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

    // fade: reduced motion (SPEC §1): the whole panel, its native glass too,
    // fades in place in 0.2 s; never a scale, never a move
    // (the user, main m_6567, ambient m_6575: no grow on appear; the page
    // fades and lifts 4 px; reduced motion: a 0.15 s fade only)
    static let fadeTime = 0.15
    // the page's own leave: opacity and 4 px up in 0.12 s, then the panel goes
    static let leaveTime = 0.12

    func show(fade: Bool = false) {
        hidden = false
        outJob?.cancel()
        outJob = nil
        if fade && !panel.isVisible { panel.alphaValue = 0 }
        panel.orderFrontRegardless()
        if fade {
            NSAnimationContext.runAnimationGroup { c in
                c.duration = Capsule.fadeTime
                panel.animator().alphaValue = 1
            }
        } else {
            panel.alphaValue = 1
        }
    }

    func hide(after: Double = 0, fade: Bool = false) {
        hidden = true
        focus(false)
        outJob?.cancel()
        guard after > 0 else { panel.orderOut(nil); panel.alphaValue = 1; return }
        if fade {
            NSAnimationContext.runAnimationGroup { c in
                c.duration = min(after, Capsule.fadeTime)
                panel.animator().alphaValue = 0
            }
        }
        let job = DispatchWorkItem { [weak self] in
            MainActor.assumeIsolated {
                guard let self, self.hidden else { return }
                self.panel.orderOut(nil)
                self.panel.alphaValue = 1
            }
        }
        outJob = job
        DispatchQueue.main.asyncAfter(deadline: .now() + after, execute: job)
    }

    private var keysFrom: NSRunningApplication?
    var onKeyFocus: ((Bool) -> Void)?   // the bar took the keys (true) or gave them back

    // the panel's key state, however it came (focus(true), a click): his
    // app is remembered to get the keys back, and App hears it (app_focused)
    func watchKey() {
        let nc = NotificationCenter.default
        nc.addObserver(forName: NSWindow.didBecomeKeyNotification, object: panel, queue: .main) { [weak self] _ in
            MainActor.assumeIsolated {
                guard let self else { return }
                let front = NSWorkspace.shared.frontmostApplication
                if front?.processIdentifier != ProcessInfo.processInfo.processIdentifier { self.keysFrom = front }
                self.onKeyFocus?(true)
            }
        }
        nc.addObserver(forName: NSWindow.didResignKeyNotification, object: panel, queue: .main) { [weak self] _ in
            MainActor.assumeIsolated { self?.onKeyFocus?(false) }
        }
    }

    // what he opens takes the keys like Spotlight (round 9); off gives them back
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
