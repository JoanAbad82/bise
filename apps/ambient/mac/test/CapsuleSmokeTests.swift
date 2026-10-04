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
    law("launch smoke: the panel never animates or casts a shadow",
        c.panel.animationBehavior == .none && !c.panel.hasShadow)
}

if failures > 0 { print("\(failures) failed"); exit(1) }
print("all CapsuleSmoke laws hold")
