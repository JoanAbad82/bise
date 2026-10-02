// StatusItem: the menu-bar `:*` (SPEC §1, §8 "out of the way"), always
// there and the status at a glance: still at rest, a quiet pulse while
// agents work (until ambient's design), the count of items waiting for you
// next to it (none at 0, rose), and SPEC §0's states (done glint, failed
// stop, quiet ember, fn held). A click (or ⌥ click) shows bise's full view
// (vision §3 G); a right click (or ⌃ click) opens
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
    var onOpen: (() -> Void)?                // a click: bise's full view (show + app_key 0)
    var onSpotlight: (() -> Void)?
    var onToggle: (() -> Void)?
    var onPage: ((String) -> Void)?          // a page's URL
    var onCard: ((String) -> Void)?          // a card's id
    var isHidden: () -> Bool = { false }
    var pages: () -> [MenuPage] = { [] }
    var cards: () -> [Card] = { [] }

    private let item = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
    // what the icon says (SPEC §0): the inputs, then IconLook decides
    private var working = false
    private var count = 0
    private var quiet = false
    private var holding = false
    private var glintUntil = -1.0
    private var failedUntil = -1.0
    var reduceMotion = false { didSet { refresh() } }
    private var pulse: Timer?
    private var dim = false
    private var later: DispatchWorkItem?

    override init() {
        super.init()
        if let b = item.button {
            b.target = self
            b.action = #selector(clicked)
            b.sendAction(on: [.leftMouseUp, .rightMouseUp])
        }
        refresh()
    }

    private var now: Double { ProcessInfo.processInfo.systemUptime }

    func set(working w: Bool, count c: Int) { working = w; count = c; refresh() }
    func set(quiet q: Bool) { quiet = q; refresh() }
    func set(holding h: Bool) { holding = h; refresh() }
    // an agent done or a page ready: an olive glint, 8 s
    func glint() { glintUntil = now + IconLook.flash; refresh() }
    // an agent failed: the glyph stops, ▲, 8 s
    func failed() { failedUntil = now + IconLook.flash; refresh() }

    private func refresh() {
        let look = IconLook.of(working: working, count: count, quiet: quiet, holding: holding,
                               glintUntil: glintUntil, failedUntil: failedUntil, now: now, reduceMotion: reduceMotion)
        if look.moving, pulse == nil {
            // the slow turn, for now a pulse of the glyph (the marble replaces it)
            pulse = Timer.scheduledTimer(withTimeInterval: holding ? 0.45 : 0.9, repeats: true) { [weak self] _ in
                MainActor.assumeIsolated { guard let self else { return }; self.dim.toggle(); self.refresh() }
            }
        } else if !look.moving {
            pulse?.invalidate()
            pulse = nil
            dim = false
        }
        draw(look)
        // a glint or a stop ends by itself
        later?.cancel()
        let ends = [glintUntil, failedUntil].filter { $0 > now }.min()
        if let e = ends {
            let job = DispatchWorkItem { [weak self] in MainActor.assumeIsolated { self?.refresh() } }
            later = job
            DispatchQueue.main.asyncAfter(deadline: .now() + (e - now) + 0.05, execute: job)
        }
    }

    private static let rose = NSColor(srgbRed: 0xf4 / 255, green: 0xa6 / 255, blue: 0xb0 / 255, alpha: 1)
    private static let olive = NSColor(srgbRed: 0xb8 / 255, green: 0xc0 / 255, blue: 0x7a / 255, alpha: 1)
    private static let ember = NSColor(srgbRed: 0xd9 / 255, green: 0x93 / 255, blue: 0x6a / 255, alpha: 0.75)

    private func draw(_ look: IconLook) {
        let font = NSFont(name: "JetBrains Mono", size: 13) ?? NSFont.monospacedSystemFont(ofSize: 13, weight: .semibold)
        let small = NSFont(name: "JetBrains Mono", size: 11) ?? NSFont.monospacedDigitSystemFont(ofSize: 11, weight: .semibold)
        var color: NSColor
        switch look.tint {
        case .dim: color = NSColor.labelColor.withAlphaComponent(0.6)
        case .normal: color = .labelColor
        case .bright: color = .labelColor
        case .olive: color = StatusItem.olive
        case .ember: color = StatusItem.ember
        }
        if dim { color = color.withAlphaComponent(color.alphaComponent * 0.5) }
        let title = NSMutableAttributedString(string: ":*", attributes: [
            .font: look.tint == .bright ? NSFont.monospacedSystemFont(ofSize: 13, weight: .heavy) : font,
            .baselineOffset: 0.5, .foregroundColor: color])
        if !look.extra.isEmpty {
            title.append(NSAttributedString(string: " " + look.extra, attributes: [.font: small, .baselineOffset: 1, .foregroundColor: NSColor.secondaryLabelColor]))
        }
        if look.count > 0 {
            title.append(NSAttributedString(string: " \(look.count)", attributes: [.font: small, .baselineOffset: 1, .foregroundColor: StatusItem.rose]))
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
        let menu = e?.type == .rightMouseUp || e?.modifierFlags.contains(.control) == true
        if !menu {
            onOpen?()   // a click (or ⌥ click) on the icon: bise's full view
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
