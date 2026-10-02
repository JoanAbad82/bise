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
    private var player: Timer?
    private var frame = 0
    private var playing: IconLook.Mood?
    private let pearl = PearlFrames()
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

    // the icon's rect on screen (Cocoa coords), nil before the menu bar shows it
    var iconRect: NSRect? { item.button?.window?.frame }
    var iconWindow: NSWindow? { item.button?.window }

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
        // the mood's loop at its frame rate; a mood that doesn't move: its first frame, once
        let frames = pearl.count(look.mood)
        if look.moving && frames > 1 {
            if playing != look.mood || player == nil {
                player?.invalidate()
                playing = look.mood
                player = Timer.scheduledTimer(withTimeInterval: 1 / look.fps, repeats: true) { [weak self] _ in
                    MainActor.assumeIsolated { guard let self else { return }; self.frame += 1; self.draw(self.currentLook()) }
                }
            }
        } else {
            player?.invalidate()
            player = nil
            playing = nil
            frame = 0
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

    private func currentLook() -> IconLook {
        IconLook.of(working: working, count: count, quiet: quiet, holding: holding,
                    glintUntil: glintUntil, failedUntil: failedUntil, now: now, reduceMotion: reduceMotion)
    }

    private static let rose = NSColor(srgbRed: 0xf4 / 255, green: 0xa6 / 255, blue: 0xb0 / 255, alpha: 1)
    private static let onRose = NSColor(srgbRed: 0x2a / 255, green: 0x14 / 255, blue: 0x1b / 255, alpha: 1)
    private static let fail = NSColor(srgbRed: 0xff / 255, green: 0x9a / 255, blue: 0x8a / 255, alpha: 1)

    // the one seam for the icon's drawing: the pearl's frame (or :* until the
    // frames exist), then the extra (▲ ☾) and the rose count pill
    private func draw(_ look: IconLook) {
        guard let button = item.button else { return }
        let body: NSImage? = pearl.image(look.mood, frame: look.moving ? frame : 0)
        let extraFont = NSFont.systemFont(ofSize: 11, weight: .semibold)
        let pillFont = NSFont.systemFont(ofSize: 10.5, weight: .bold)
        let extraColor = look.extra == "▲" ? StatusItem.fail : NSColor.secondaryLabelColor
        let extra = NSAttributedString(string: look.extra, attributes: [.font: extraFont, .foregroundColor: extraColor])
        let pillText = NSAttributedString(string: look.count > 0 ? "\(look.count)" : "", attributes: [.font: pillFont, .foregroundColor: StatusItem.onRose])
        let h: CGFloat = 18
        let bodyW: CGFloat = body == nil ? 0 : 18
        let extraW = look.extra.isEmpty ? 0 : extra.size().width + 3
        let pillW = look.count > 0 ? max(14, pillText.size().width + 8) : 0
        if body == nil {
            // the fallback: today's :* glyph with the same extras
            let t = NSMutableAttributedString(string: ":*", attributes: [
                .font: NSFont(name: "JetBrains Mono", size: 13) ?? NSFont.monospacedSystemFont(ofSize: 13, weight: .semibold),
                .baselineOffset: 0.5,
                .foregroundColor: look.mood == .still ? NSColor.labelColor.withAlphaComponent(0.6) : NSColor.labelColor])
            if !look.extra.isEmpty { t.append(NSAttributedString(string: " ")); t.append(extra) }
            if look.count > 0 {
                t.append(NSAttributedString(string: " \(look.count)", attributes: [.font: pillFont, .foregroundColor: StatusItem.rose]))
            }
            button.image = nil
            button.attributedTitle = t
            return
        }
        let w = bodyW + extraW + (pillW > 0 ? pillW + 3 : 0)
        let img = NSImage(size: NSSize(width: w, height: h), flipped: false) { _ in
            body?.draw(in: NSRect(x: 0, y: 0, width: 18, height: 18))
            var x = bodyW
            if extraW > 0 {
                let sz = extra.size()
                extra.draw(at: NSPoint(x: x + 2, y: (h - sz.height) / 2))
                x += extraW
            }
            if pillW > 0 {
                let r = NSRect(x: x + 3, y: (h - 14) / 2, width: pillW, height: 14)
                StatusItem.rose.setFill()
                NSBezierPath(roundedRect: r, xRadius: 7, yRadius: 7).fill()
                let sz = pillText.size()
                pillText.draw(at: NSPoint(x: r.midX - sz.width / 2, y: r.midY - sz.height / 2))
            }
            return true
        }
        img.isTemplate = false
        button.attributedTitle = NSAttributedString(string: "")
        button.image = img
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

// the pearl's sprite frames, rendered by amb-web from marble.js into
// apps/ambient/mac/Resources/pearl/ and copied flat into the bundle's
// Resources: <mood>-<NN>.png (+ @2x, @3x), NN from 00 (docs/ambient-app.md §9)
@MainActor
final class PearlFrames {
    private var cache: [IconLook.Mood: [NSImage]] = [:]

    private func load(_ m: IconLook.Mood) -> [NSImage] {
        if let c = cache[m] { return c }
        var out: [NSImage] = []
        while out.count < 240, let img = Bundle.main.image(forResource: String(format: "%@-%02d", m.rawValue, out.count)) {
            out.append(img)
        }
        cache[m] = out
        return out
    }

    func count(_ m: IconLook.Mood) -> Int { load(m).count }

    func image(_ m: IconLook.Mood, frame: Int) -> NSImage? {
        let f = load(m)
        return f.isEmpty ? nil : f[frame % f.count]
    }
}
