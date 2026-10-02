// StatusItem: the menu-bar `:*` (SPEC §1, §8 "out of the way"), always
// there and the status at a glance: still at rest, a quiet pulse while
// agents work (until ambient's design), the count of items waiting for you
// next to it (none at 0), accent pink while there are some. A click opens
// the menu; an option-click shows bise (the capsule). A right click opens
// the menu: "needs you" (the cards: a click opens bise on one), "for you"
// (the newest pages: a click opens one), then the keys and quit.

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
    var onOpen: (() -> Void)?                // option-click: show bise
    var onSpotlight: (() -> Void)?
    var onToggle: (() -> Void)?
    var onPage: ((String) -> Void)?          // a page's URL
    var onCard: ((String) -> Void)?          // a card's id
    var isHidden: () -> Bool = { false }
    var pages: () -> [MenuPage] = { [] }
    var cards: () -> [Card] = { [] }

    private let item = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
    private var needsYou = false
    private var working = false
    private var count = 0
    private var pulse: Timer?
    private var dim = false

    override init() {
        super.init()
        if let b = item.button {
            b.target = self
            b.action = #selector(clicked)
            b.sendAction(on: [.leftMouseUp, .rightMouseUp])
        }
        draw()
    }

    func setNeedsYou(_ on: Bool) { set(working: working, count: on ? max(count, 1) : 0) }

    // the status: agents working, items waiting
    func set(working w: Bool, count c: Int) {
        guard w != working || c != count else { return }
        working = w
        count = c
        needsYou = c > 0
        if w, pulse == nil {
            // a quiet pulse of the glyph, ~1 s (ambient's design replaces it)
            pulse = Timer.scheduledTimer(withTimeInterval: 0.9, repeats: true) { [weak self] _ in
                MainActor.assumeIsolated { guard let self else { return }; self.dim.toggle(); self.draw() }
            }
        } else if !w {
            pulse?.invalidate()
            pulse = nil
            dim = false
        }
        draw()
    }

    private func draw() {
        let font = NSFont(name: "JetBrains Mono", size: 13) ?? NSFont.monospacedSystemFont(ofSize: 13, weight: .semibold)
        let base: NSColor = needsYou ? NSColor(srgbRed: 0xf4 / 255, green: 0xa6 / 255, blue: 0xb0 / 255, alpha: 1) : .labelColor
        let glyph: [NSAttributedString.Key: Any] = [.font: font, .baselineOffset: 0.5,
                                                    .foregroundColor: base.withAlphaComponent(dim ? 0.45 : 1)]
        let title = NSMutableAttributedString(string: ":*", attributes: glyph)
        if count > 0 {
            let small = NSFont(name: "JetBrains Mono", size: 11) ?? NSFont.monospacedDigitSystemFont(ofSize: 11, weight: .semibold)
            title.append(NSAttributedString(string: " \(count)", attributes: [.font: small, .baselineOffset: 1, .foregroundColor: base]))
        }
        item.button?.attributedTitle = title
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
        if e?.modifierFlags.contains(.option) == true && e?.type != .rightMouseUp {
            onOpen?()
        } else {
            let m = NSMenu()
            // needs you first: it is what is waiting
            let cs = cards().prefix(MenuRows.maxCards)
            if !cs.isEmpty {
                m.addItem(header(MenuRows.needsYou))
                for c in cs {
                    let it = entry(MenuRows.card(agent: c.agent, text: c.text), nil, #selector(card(_:)))
                    it.representedObject = c.id
                    m.addItem(it)
                }
                m.addItem(.separator())
            }
            let ps = pages().prefix(MenuRows.maxPages)
            if !ps.isEmpty {
                m.addItem(header(MenuRows.forYou))
                for p in ps {
                    let it = entry(MenuRows.page(p), nil, #selector(page(_:)))
                    it.representedObject = p.url
                    m.addItem(it)
                }
                m.addItem(.separator())
            }
            m.addItem(entry(MenuWords.talk, MenuWords.talkKeys, #selector(spotlight)))
            m.addItem(entry(isHidden() ? MenuWords.show : MenuWords.hide, MenuWords.hideKeys, #selector(toggle)))
            m.addItem(.separator())
            m.addItem(entry(MenuWords.quit, nil, #selector(quit)))
            item.menu = m
            item.button?.performClick(nil)
            item.menu = nil
        }
    }

    private func header(_ title: String) -> NSMenuItem {
        if #available(macOS 14.0, *) { return NSMenuItem.sectionHeader(title: title) }
        let it = NSMenuItem(title: title, action: nil, keyEquivalent: "")
        it.isEnabled = false
        return it
    }

    @objc private func page(_ sender: NSMenuItem) { if let u = sender.representedObject as? String { onPage?(u) } }
    @objc private func card(_ sender: NSMenuItem) { if let id = sender.representedObject as? String { onCard?(id) } }
    @objc private func spotlight() { onSpotlight?() }
    @objc private func toggle() { onToggle?() }
    @objc private func quit() { NSApp.terminate(nil) }
}
