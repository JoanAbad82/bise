// StatusItem: the menu-bar `:*` (SPEC §1), always there, accent pink while
// something needs you. A click opens the spotlight (slice 1: fn + space
// comes with the keys); a right click (or ⌃ click) opens the small menu.

import AppKit

// the words (ambient's W; placeholders until signed off)
enum MenuWords {
    static let talk = "type to main"
    static let show = "show the capsule"
    static let hide = "hide the capsule"
    static let quit = "quit bise ambient"
}

@MainActor
final class StatusItem: NSObject {
    var onSpotlight: (() -> Void)?
    var onToggle: (() -> Void)?
    var isHidden: () -> Bool = { false }

    private let item = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
    private var needsYou = false

    override init() {
        super.init()
        if let b = item.button {
            b.target = self
            b.action = #selector(clicked)
            b.sendAction(on: [.leftMouseUp, .rightMouseUp])
        }
        draw()
    }

    func setNeedsYou(_ on: Bool) {
        guard on != needsYou else { return }
        needsYou = on
        draw()
    }

    private func draw() {
        let font = NSFont(name: "JetBrains Mono", size: 13) ?? NSFont.monospacedSystemFont(ofSize: 13, weight: .semibold)
        var attrs: [NSAttributedString.Key: Any] = [.font: font, .baselineOffset: 0.5]
        if needsYou { attrs[.foregroundColor] = NSColor(srgbRed: 0xf4 / 255, green: 0xa6 / 255, blue: 0xb0 / 255, alpha: 1) }
        item.button?.attributedTitle = NSAttributedString(string: ":*", attributes: attrs)
    }

    @objc private func clicked() {
        let e = NSApp.currentEvent
        if e?.type == .rightMouseUp || e?.modifierFlags.contains(.control) == true {
            let m = NSMenu()
            m.addItem(withTitle: MenuWords.talk, action: #selector(spotlight), keyEquivalent: "").target = self
            m.addItem(withTitle: isHidden() ? MenuWords.show : MenuWords.hide, action: #selector(toggle), keyEquivalent: "").target = self
            m.addItem(.separator())
            m.addItem(withTitle: MenuWords.quit, action: #selector(quit), keyEquivalent: "").target = self
            item.menu = m
            item.button?.performClick(nil)
            item.menu = nil
        } else {
            onSpotlight?()
        }
    }

    @objc private func spotlight() { onSpotlight?() }
    @objc private func toggle() { onToggle?() }
    @objc private func quit() { NSApp.terminate(nil) }
}
