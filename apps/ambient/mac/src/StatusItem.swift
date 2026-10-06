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
    // the native fallback menu (S8; ambient signs the words)
    static let open = "open bise"
    static let quietHour = "quiet for 1 h"
    static let quietEnd = "end quiet"
}

@MainActor
final class StatusItem: NSObject {
    var onOpen: (() -> Void)?                // a click: bise's full view (show + app_key 0)
    var onSpotlight: (() -> Void)?
    var onToggle: (() -> Void)?
    var onSettings: (() -> Void)?            // settings… (fn ,)
    var onPage: ((String) -> Void)?          // a page's URL
    var onCard: ((String) -> Void)?          // a card's id
    var isHidden: () -> Bool = { false }
    var pages: () -> [MenuPage] = { [] }
    var watches: () -> [MenuWatch] = { [] }  // standing orders (state.timers)
    var onStopWatch: ((Int) -> Void)?        // a timer's id
    var cards: () -> [Card] = { [] }
    var noAccess: () -> Bool = { false }      // fn can't be heard: the menu's first row
    var onAccess: (() -> Void)?               // that row: System Settings' Accessibility pane
    var onWindow: (() -> Void)?               // open bise (the window, ⌘0)
    var onQuietHour: (() -> Void)?            // quiet for 1 h, or its end
    var isQuietHour: () -> Bool = { false }

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
        if let img = StatusItem.compose(look, frame: look.moving ? frame : 0, pearl: pearl) {
            button.attributedTitle = NSAttributedString(string: "")
            button.imageScaling = .scaleNone   // never shrunk to fit: the item widens
            button.image = img
            return
        }
        // the fallback: today's :* glyph with the same extras
        let t = NSMutableAttributedString(string: ":*", attributes: [
            .font: NSFont(name: "JetBrains Mono", size: 13) ?? NSFont.monospacedSystemFont(ofSize: 13, weight: .semibold),
            .baselineOffset: 0.5,
            .foregroundColor: look.mood == .still ? NSColor.labelColor.withAlphaComponent(0.6) : NSColor.labelColor])
        if !look.extra.isEmpty { t.append(NSAttributedString(string: " ")); t.append(StatusItem.extraText(look)) }
        if look.count > 0 {
            t.append(NSAttributedString(string: " \(look.count)", attributes: [.font: StatusItem.pillFont, .foregroundColor: StatusItem.rose]))
        }
        button.image = nil
        button.attributedTitle = t
    }

    private static let pillFont = NSFont.systemFont(ofSize: 10.5, weight: .bold)

    // ambient's menu-bar sizes (gate run 2, m_5438): the pearl 18 pt in every
    // state (the item grows wider), the extra ~9 pt, the pill 13 pt tall with
    // a 4 pt gap: a circle for one digit, a pill for two
    static let pearlSize: CGFloat = 18
    static let extraSize: CGFloat = 9
    static let pillHeight: CGFloat = 13
    static let pillGap: CGFloat = 4

    private static func extraText(_ look: IconLook) -> NSAttributedString {
        // ▲ in the fail color; ☾ at 55 % of the menu bar's text color (resolved
        // at draw time, so it follows light and dark)
        let extraColor = look.extra == "▲" ? StatusItem.fail : NSColor.labelColor.withAlphaComponent(0.55)
        return NSAttributedString(string: look.extra, attributes: [.font: NSFont.systemFont(ofSize: extraSize, weight: .semibold), .foregroundColor: extraColor])
    }

    // the icon's image for a look (pure: QA's menu-bar shots use it too):
    // the pearl's frame, the extra, the rose pill; nil before the frames exist
    static func compose(_ look: IconLook, frame: Int, pearl: PearlFrames) -> NSImage? {
        guard let body = pearl.image(look.mood, frame: frame) else { return nil }
        let pillText = NSAttributedString(string: look.count > 0 ? "\(look.count)" : "", attributes: [.font: pillFont, .foregroundColor: StatusItem.onRose])
        let h = pearlSize
        let extraW = look.extra.isEmpty ? 0 : ceil(extraText(look).size().width) + 3
        let pillW = look.count > 0 ? max(pillHeight, ceil(pillText.size().width) + 8) : 0
        let w = pearlSize + extraW + (pillW > 0 ? pillGap + pillW : 0)
        let img = NSImage(size: NSSize(width: w, height: h), flipped: false) { _ in
            body.draw(in: NSRect(x: 0, y: 0, width: pearlSize, height: pearlSize))
            var x = pearlSize
            if extraW > 0 {
                let extra = extraText(look)   // here: the color follows the drawing appearance
                let sz = extra.size()
                extra.draw(at: NSPoint(x: x + 2, y: (h - sz.height) / 2))
                x += extraW
            }
            if pillW > 0 {
                let r = NSRect(x: x + pillGap, y: (h - pillHeight) / 2, width: pillW, height: pillHeight)
                StatusItem.rose.setFill()
                NSBezierPath(roundedRect: r, xRadius: pillHeight / 2, yRadius: pillHeight / 2).fill()
                let sz = pillText.size()
                pillText.draw(at: NSPoint(x: r.midX - sz.width / 2, y: r.midY - sz.height / 2))
            }
            return true
        }
        img.isTemplate = false
        return img
    }

    // "type to main      fn space": the keys right-aligned, dim
    private func entry(_ title: String, _ keys: String?, _ action: Selector?) -> NSMenuItem {
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
            onOpen?()   // a click (or ⌥ click) on the icon: the dropdown (the bar's page under it)
        } else {
            fallbackMenu()
        }
    }

    // the native menu (S8): a right click, or a click before the page is up
    func fallbackMenu() {
        let rows = MenuRows.fallback(quiet: isQuietHour(), noAccess: noAccess(),
                                     words: (MenuWords.open, MenuWords.quietHour, MenuWords.quietEnd, SettingsWords.menu, MenuWords.quit))
        show(rows)
    }

    private func show(_ rows: [MenuItemOut]) {
        do {
            let m = NSMenu()
            for r in rows {
                switch r.kind {
                case .separator: m.addItem(.separator())
                case .header: m.addItem(header(r.title))
                default:
                    // real key equivalents (pm's audit): quit ⌘Q, settings ⌘,
                    // drawn by macOS itself, so no dim text next to them
                    let real = StatusItem.realKey(r.kind)
                    let it = entry(r.title, real == nil ? r.keys : nil, StatusItem.action(r.kind))
                    if let real { it.keyEquivalent = real; it.keyEquivalentModifierMask = [.command] }
                    it.indentationLevel = r.indent
                    switch r.kind {
                    case .stop: it.representedObject = Int(r.ref ?? "")
                    default: it.representedObject = r.ref
                    }
                    if !r.enabled { it.action = nil; it.isEnabled = false }
                    m.addItem(it)
                }
            }
            item.menu = m
            item.button?.performClick(nil)
            item.menu = nil
        }
    }

    // the menu's rows (pure, MenuRows.items): drawn here, read by QA
    func rows() -> [MenuItemOut] {
        MenuRows.items(cards: cards().map { MenuCard(id: $0.id, agent: $0.agent, text: $0.text) },
                       pages: pages(), watches: watches(), hidden: isHidden(),
                       words: (MenuWords.talk, MenuWords.talkKeys, MenuWords.show, MenuWords.hide, MenuWords.hideKeys,
                               SettingsWords.menu, SettingsWords.menuKeys, MenuWords.quit),
                       noAccess: noAccess())
    }

    // the rows with a real ⌘ key (the hidden main menu's own: MainMenu)
    static func realKey(_ k: MenuItemOut.Kind) -> String? {
        switch k {
        case .quit: return "q"
        case .settings: return ","
        case .window: return "0"
        default: return nil
        }
    }

    private static func action(_ k: MenuItemOut.Kind) -> Selector? {
        switch k {
        case .access: return #selector(access)
        case .card: return #selector(card(_:))
        case .page, .watch: return #selector(page(_:))
        case .stop: return #selector(stopWatch(_:))
        case .talk: return #selector(spotlight)
        case .toggle: return #selector(toggle)
        case .settings: return #selector(settings)
        case .window: return #selector(window)
        case .quiet: return #selector(quietHour)
        case .quit: return #selector(quit)
        case .header, .separator: return nil
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
    @objc private func access() { onAccess?() }
    @objc private func spotlight() { onSpotlight?() }
    @objc private func toggle() { onToggle?() }
    @objc private func settings() { onSettings?() }
    @objc private func window() { onWindow?() }
    @objc private func quietHour() { onQuietHour?() }
    @objc private func stopWatch(_ sender: NSMenuItem) { if let id = sender.representedObject as? Int { onStopWatch?(id) } }
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
