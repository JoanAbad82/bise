// Edge: the screen-edge glow and the shot's pink corners (SPEC §1, §3).
// One full-screen, click-through, transparent window per screen, above
// everything, each with a transparent WKWebView on the web UI's edge.html
// (the shader is amb-web's). They are ordered out when nothing shows, so
// WebKit stops drawing them.

import AppKit
import WebKit

@MainActor
final class Edge: NSObject, WKNavigationDelegate {
    private struct Overlay {
        let screen: NSScreen
        let window: NSWindow
        let web: WKWebView
        var ready = false
    }

    private var overlays: [Overlay] = []
    private var webDir: String?
    private var glowing = false         // a talk is on and the glow is allowed
    private var until = Date.distantPast   // keep shown until (fades, corners)
    private var hideJob: DispatchWorkItem?
    private var lastSetup: [[String: Any]] = []   // replayed into a page once loaded
    var pinnedScreen: (() -> NSScreen?)?          // harness A: set and nil = no overlay on any screen

    func load(webDir dir: String?) {
        webDir = dir
        rebuild()
    }

    // a screen came or went: one overlay per screen again
    func rebuild() {
        for o in overlays { o.window.orderOut(nil); o.web.navigationDelegate = nil }
        overlays = []
        guard let dir = webDir else { return }
        let page = URL(fileURLWithPath: dir).appendingPathComponent("edge.html")
        guard FileManager.default.fileExists(atPath: page.path) else {
            Log.say("edge: no \(page.path), no glow")
            return
        }
        // harness A: none at all (nothing on his screens)
        for s in pinnedScreen.map({ $0().map { [$0] } ?? [] }) ?? NSScreen.screens {
            // made far off every screen, deferred and invisible (main m_8012);
            // show() puts it on its screen right before ordering it in
            let o = Placement.offScreen.frame.origin
            let w = NSWindow(contentRect: NSRect(origin: o, size: s.frame.size), styleMask: .borderless, backing: .buffered, defer: true)
            w.alphaValue = 0
            w.isOpaque = false
            w.backgroundColor = .clear
            w.hasShadow = false
            w.ignoresMouseEvents = true
            w.level = .screenSaver
            w.collectionBehavior = [.canJoinAllSpaces, .stationary, .fullScreenAuxiliary, .ignoresCycle]
            w.isReleasedWhenClosed = false
            let conf = WKWebViewConfiguration()
            conf.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
            conf.userContentController.addUserScript(WKUserScript(source: Capsule.bootJS, injectionTime: .atDocumentStart, forMainFrameOnly: true))
            let web = WKWebView(frame: NSRect(origin: .zero, size: s.frame.size), configuration: conf)
            web.setValue(false, forKey: "drawsBackground")
            web.underPageBackgroundColor = .clear
            web.autoresizingMask = [.width, .height]
            web.isInspectable = true
            web.navigationDelegate = self
            w.contentView = web
            web.loadFileURL(page, allowingReadAccessTo: URL(fileURLWithPath: dir))
            overlays.append(Overlay(screen: s, window: w, web: web))
        }
    }

    func reload() {
        for i in overlays.indices { overlays[i].ready = false; overlays[i].web.reload() }
    }

    func webView(_ w: WKWebView, didFinish n: WKNavigation!) {
        guard let i = overlays.firstIndex(where: { $0.web === w }) else { return }
        overlays[i].ready = true
        for ev in lastSetup { send(ev, to: i) }
    }

    func webViewWebContentProcessDidTerminate(_ w: WKWebView) {
        if let i = overlays.firstIndex(where: { $0.web === w }) { overlays[i].ready = false }
        w.reload()
    }

    // settings-like events every page needs, even one loaded later
    func setup(_ ev: [String: Any]) {
        if let k = ev["ev"] as? String { lastSetup.removeAll { ($0["ev"] as? String) == k } }
        lastSetup.append(ev)
        post(ev)
    }

    // QA (--qa only): each screen's overlay window and web view, for its snapshots
    var views: [(window: NSWindow, web: WKWebView)] { overlays.map { ($0.window, $0.web) } }

    // to every screen's page
    func post(_ ev: [String: Any]) {
        for i in overlays.indices { send(ev, to: i) }
    }

    private func send(_ ev: [String: Any], to i: Int) {
        guard overlays[i].ready, let s = JSON.string(ev) else { return }
        overlays[i].web.evaluateJavaScript("window.ambient && window.ambient.recv(\(s))", completionHandler: nil)
    }

    // the glow: on while you talk (if allowed), then 1.2 s to fade out
    func glow(_ on: Bool) {
        guard on != glowing else { return }
        glowing = on
        if on { show(for: 0) } else { show(for: 1.2) }
    }

    // the corners: app_shot to the page of the screen the window is on
    // (frame in that screen's CSS px, top-left origin), shown 1.6 s
    func corners(_ ev: [String: Any], cgBounds: CGRect) {
        let center = CGPoint(x: cgBounds.midX, y: cgBounds.midY)
        guard let mainH = NSScreen.screens.first?.frame.height else { return }
        for (i, o) in overlays.enumerated() {
            let f = o.screen.frame
            // CG global coords: top-left of the main screen, y down
            let top = mainH - f.maxY
            let cgScreen = CGRect(x: f.minX, y: top, width: f.width, height: f.height)
            guard cgScreen.contains(center) else { continue }
            var e = ev
            e["frame"] = ["x": cgBounds.minX - f.minX, "y": cgBounds.minY - top, "w": cgBounds.width, "h": cgBounds.height]
            show(for: 1.6)
            send(e, to: i)
        }
    }

    private func show(for seconds: Double) {
        guard !overlays.isEmpty else { return }
        let end = Date().addingTimeInterval(seconds)
        if end > until { until = end }
        for o in overlays where !o.window.isVisible {
            o.window.setFrame(o.screen.frame, display: false)
            o.window.alphaValue = 1
            o.window.orderFrontRegardless()
        }
        hideJob?.cancel()
        let job = DispatchWorkItem { [weak self] in
            MainActor.assumeIsolated {
                guard let self, !self.glowing, Date() >= self.until else { return }
                for o in self.overlays { o.window.orderOut(nil); o.window.alphaValue = 0 }
            }
        }
        hideJob = job
        DispatchQueue.main.asyncAfter(deadline: .now() + max(seconds, 0) + 0.05, execute: job)
    }
}
