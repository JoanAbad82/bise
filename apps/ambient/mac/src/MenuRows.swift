// MenuRows: what the menu-bar :* menu lists (pure: the laws in
// test/MenuRowsTests.swift): "for you", the newest pages, and "needs
// you", the inbox's cards. StatusItem.swift draws them.

import Foundation

struct MenuPage: Equatable {
    var id: String
    var title: String
    var agent: String
    var version: Int
    var url: String

    // state.pages, newest first: the ones with a URL to open
    static func list(_ state: [String: Any]) -> [MenuPage] {
        (state["pages"] as? [[String: Any]] ?? []).compactMap { p in
            guard let id = p["id"] as? String, let url = p["url"] as? String, !url.isEmpty else { return nil }
            return MenuPage(id: id, title: p["title"] as? String ?? id, agent: p["agent"] as? String ?? "",
                            version: (p["version"] as? NSNumber)?.intValue ?? 1, url: url)
        }
    }
}

// the words (signed off by ambient: needs you first, then for you)
enum MenuRows {
    static let forYou = "for you"
    static let needsYou = "needs you"
    static let maxPages = 6
    static let maxCards = 9
    static let titleCut = 40
    static let cardCut = 50

    // "title · agent · v2" (no version mark on a first version)
    static func page(_ p: MenuPage) -> String {
        var parts = [clip(p.title, titleCut)]
        if !p.agent.isEmpty { parts.append(p.agent) }
        if p.version > 1 { parts.append("v\(p.version)") }
        return parts.joined(separator: " · ")
    }

    // "agent: question" on one line
    static func card(agent: String, text: String) -> String {
        let flat = text.split(whereSeparator: \.isNewline).joined(separator: " ")
        return clip(agent.isEmpty ? flat : "\(agent): \(flat)", cardCut)
    }

    // at most `max` characters, cut on a word, with …
    static func clip(_ s: String, _ max: Int) -> String {
        let t = s.trimmingCharacters(in: .whitespaces)
        guard t.count > max else { return t }
        var head = String(t.prefix(max - 1))
        // the cut falls inside a word: back to its start (unless it's one long word)
        let next = t[t.index(t.startIndex, offsetBy: max - 1)]
        if next != " ", let sp = head.lastIndex(of: " ") { head = String(head[..<sp]) }
        return head.trimmingCharacters(in: .whitespaces) + "…"
    }
}

// the menu-bar icon's look (ambient's SPEC §0 states), on today's glyph
// until the marble: one state wins, the count stays beside it
struct IconLook: Equatable {
    enum Tint: Equatable { case dim, normal, bright, olive, ember }
    var tint: Tint
    var moving: Bool          // the slow turn (a pulse on the glyph for now)
    var extra: String         // "", "▲" (failed, 8 s), "☾" (quiet)
    var count: Int            // rose, never blinking; none at 0

    static let flash = 8.0    // done / page ready glint, failed stop

    static func of(working: Bool, count: Int, quiet: Bool, holding: Bool,
                   glintUntil: Double, failedUntil: Double, now: Double, reduceMotion: Bool) -> IconLook {
        let still = reduceMotion
        if holding { return IconLook(tint: .bright, moving: !still, extra: "", count: count) }
        if now < failedUntil { return IconLook(tint: .normal, moving: false, extra: "▲", count: count) }
        if now < glintUntil { return IconLook(tint: .olive, moving: working && !still, extra: "", count: count) }
        if quiet { return IconLook(tint: .ember, moving: false, extra: "☾", count: count) }
        if working { return IconLook(tint: .normal, moving: !still, extra: "", count: count) }
        return IconLook(tint: .dim, moving: false, extra: "", count: count)
    }
}
