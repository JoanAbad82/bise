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
    let off = Capsule(side: true, offScreen: true)
    law("harness smoke: the panel is made off every screen", !Placement.touches(off.panel.frame, screens: screens))
    law("harness smoke: invisible until placed and shown", off.panel.alphaValue == 0 && !off.panel.isVisible)
    let made = NSApp.windows.filter { !before.contains(ObjectIdentifier($0)) }
    law("harness smoke: no other window made on a screen (no radius probe)",
        made.allSatisfy { !Placement.touches($0.frame, screens: screens) })
    off.apply(CapsuleShape(w: 524, h: 900, radius: 26, note: nil, glass: CGRect(x: 84, y: 0, width: 440, height: 900)))
    law("harness smoke: placed by its first app_size, still off every screen", !Placement.touches(off.panel.frame, screens: screens))
}

if failures > 0 { print("\(failures) failed"); exit(1) }
print("all CapsuleSmoke laws hold")
