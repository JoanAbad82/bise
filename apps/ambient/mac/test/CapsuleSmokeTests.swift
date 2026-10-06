// A launch smoke for the capsule (lead m_6814): Capsule() is what crashed
// at launch in 3ee3c710 (a KVC call on a private WebKit key threw in
// Capsule.init). Run by build.sh --test through the swift interpreter
// (cat'ed after Support, Shape, Always, Visibility and Capsule): it builds
// the panel and its web view in this process, never orders it in, loads
// no page, and never starts the app itself.

import AppKit
import WebKit

var failures = 0
func law(_ name: String, _ ok: Bool) {
    if ok { print("ok   \(name)") } else { print("FAIL \(name)"); failures += 1 }
}

_ = NSApplication.shared
NSApp.setActivationPolicy(.prohibited)   // no Dock icon, no menu bar, nothing on screen

MainActor.assumeIsolated {
    let c = Capsule()
    law("launch smoke: Capsule() builds without throwing", c.panel.contentView != nil)
    law("launch smoke: the web view is the first-click one", c.web is CapsuleWebView)
    law("launch smoke: nothing on screen at launch", !c.panel.isVisible && c.hidden)
    law("launch smoke: made invisible (alpha 0) until its first show (main m_8012)", c.panel.alphaValue == 0)
    law("launch smoke: the panel never animates or casts a shadow",
        c.panel.animationBehavior == .none && !c.panel.hasShadow)

    // harness A (card #428): made far off every screen, from init
    let screens = NSScreen.screens.map(\.frame)
    let before = Set(NSApp.windows.map { ObjectIdentifier($0) })
    let off = Capsule(offScreen: true)
    law("harness smoke: the panel is made off every screen", !Placement.touches(off.panel.frame, screens: screens))
    law("harness smoke: invisible until placed and shown", off.panel.alphaValue == 0 && !off.panel.isVisible)
    let made = NSApp.windows.filter { !before.contains(ObjectIdentifier($0)) }
    law("harness smoke: no other window made on a screen (no radius probe)",
        made.allSatisfy { !Placement.touches($0.frame, screens: screens) })
    off.apply(CapsuleShape(w: 524, h: 900, radius: 26, note: nil, glass: CGRect(x: 84, y: 0, width: 440, height: 900)))
    law("harness smoke: placed by its first app_size, still off every screen", !Placement.touches(off.panel.frame, screens: screens))

    // bise's window (S4): never shown at launch, made off every screen
    let dw = DesktopWindow(offScreen: true, defaults: UserDefaults(suiteName: "dev.bise.ambient.smoke") ?? .standard)
    law("window smoke: built, not shown at launch, invisible", dw.window.contentView != nil && !dw.window.isVisible && dw.hidden && dw.window.alphaValue == 0)
    law("window smoke: made off every screen", !Placement.touches(dw.window.frame, screens: screens))
    law("window smoke: a normal window: titled, hidden title bar, full-size content",
        dw.window.styleMask.contains(.titled) && dw.window.styleMask.contains(.fullSizeContentView) && dw.window.titlebarAppearsTransparent && dw.window.titleVisibility == .hidden)
    law("window smoke: its web view routes the ⌘ keys (DesktopWebView), never released on close", dw.web.superview != nil && !dw.window.isReleasedWhenClosed)
    law("window smoke: no route before the page says one: bise's thread", dw.lastRoute == "bise")

    // harness A: one simulated key window at a time (amb-tools m_8542)
    CapsulePanel.simulatedKeys = true
    let bar2 = Capsule(offScreen: true)
    let win2 = DesktopWindow(offScreen: true, defaults: UserDefaults(suiteName: "dev.bise.ambient.smoke") ?? .standard)
    SimKeys.take(win2.window)
    law("sim keys: the window has them", win2.window.isKeyWindow && !bar2.panel.isKeyWindow)
    bar2.focus(true)
    law("sim keys: the spotlight over the window takes them from it", bar2.panel.isKeyWindow && !win2.window.isKeyWindow)
    win2.window.orderFrontRegardless()
    bar2.focus(false)
    law("sim keys: the bar closing gives them back to the window", win2.window.isKeyWindow && !bar2.panel.isKeyWindow)
    win2.window.orderOut(nil)
    bar2.panel.orderOut(nil)
    CapsulePanel.simulatedKeys = false

    // KeepOff (proof run #2: AppKit's TUINSWindow made at 0,0,500,500): every
    // window of the process, any class, made, moved or ordered in, stays off
    KeepOff.install()
    final class OtherWindow: NSWindow {}   // like AppKit's own (TUINSWindow)
    let w1 = OtherWindow(contentRect: NSRect(x: 0, y: 0, width: 500, height: 500), styleMask: .borderless, backing: .buffered, defer: false)
    law("keep-off: a window made at 0,0,500,500 is made off every screen", !Placement.touches(w1.frame, screens: screens) && w1.frame.size == NSSize(width: 500, height: 500))
    w1.setFrame(NSRect(x: 100, y: 100, width: 300, height: 200), display: false)
    law("keep-off: setFrame onto a screen lands off it", !Placement.touches(w1.frame, screens: screens))
    w1.setFrameOrigin(NSPoint(x: 10, y: 10))
    law("keep-off: setFrameOrigin onto a screen lands off it", !Placement.touches(w1.frame, screens: screens))
    w1.setFrameTopLeftPoint(NSPoint(x: 10, y: 600))
    law("keep-off: setFrameTopLeftPoint onto a screen lands off it", !Placement.touches(w1.frame, screens: screens))
    let p1 = NSPanel(contentRect: NSRect(x: 0, y: 0, width: 200, height: 100), styleMask: [.borderless, .nonactivatingPanel], backing: .buffered, defer: true)
    law("keep-off: an NSPanel too", !Placement.touches(p1.frame, screens: screens))
}

if failures > 0 { print("\(failures) failed"); exit(1) }
print("all CapsuleSmoke laws hold")
