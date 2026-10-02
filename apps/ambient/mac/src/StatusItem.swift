// StatusItem: the menu-bar `:*` (SPEC §1), always there, accent pink while
// something needs you (a card, or, while bise is hidden, an agent main
// started). A click means "what's going on": bise shows, open on the
// agents and the inbox (the fn + 0 view). A right click (or ⌃ click) opens
// the small menu.

import AppKit

// the words (signed off by ambient: never "capsule" on screen)
enum MenuWords {
    static let talk = "type to main"
    static let talkKeys = "fn space"
    static let show = "show bise"
    static let hide = "hide bise"
    static let hideKeys = "fn ."
    static let quit = "quit bise ambient"
}

@MainActor
final class StatusItem: NSObject {
    var onClick: (() -> Void)?
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

    // "type to main      fn space": the keys right-aligned, dim
    private func entry(_ title: String, _ keys: String?, _ action: Selector) -> NSMenuItem {
        let it = NSMenuItem(title: title, action: action, keyEquivalent: "")
        it.target = self
        if let keys {
            let p = NSMutableParagraphStyle()
            p.tabStops = [NSTextTab(textAlignment: .right, location: 200)]
            let s = NSMutableAttributedString(string: title, attributes: [.font: NSFont.menuFont(ofSize: 0), .paragraphStyle: p])
            s.append(NSAttributedString(string: "\t" + keys, attributes: [
                .font: NSFont(name: "JetBrains Mono", size: 11.5) ?? NSFont.monospacedSystemFont(ofSize: 11.5, weight: .regular),
                .foregroundColor: NSColor.secondaryLabelColor, .paragraphStyle: p,
            ]))
            it.attributedTitle = s
        }
        return it
    }

    @objc private func clicked() {
        let e = NSApp.currentEvent
        if e?.type == .rightMouseUp || e?.modifierFlags.contains(.control) == true {
            let m = NSMenu()
            m.addItem(entry(MenuWords.talk, MenuWords.talkKeys, #selector(spotlight)))
            m.addItem(entry(isHidden() ? MenuWords.show : MenuWords.hide, MenuWords.hideKeys, #selector(toggle)))
            m.addItem(.separator())
            m.addItem(entry(MenuWords.quit, nil, #selector(quit)))
            item.menu = m
            item.button?.performClick(nil)
            item.menu = nil
        } else {
            onClick?()
        }
    }

    @objc private func spotlight() { onSpotlight?() }
    @objc private func toggle() { onToggle?() }
    @objc private func quit() { NSApp.terminate(nil) }
}
