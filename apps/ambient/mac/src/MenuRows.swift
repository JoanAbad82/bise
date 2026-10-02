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
    var opened: Int? = nil    // the newest version the user opened (hub's opened_version)

    // versions published since he last opened it (a hub without
    // opened_version: never opened, as amb-web's fixtures/count.json says)
    var unopened: Int { max(0, version - (opened ?? 0)) }

    // state.pages, newest first: the ones with a URL to open
    static func list(_ state: [String: Any]) -> [MenuPage] {
        (state["pages"] as? [[String: Any]] ?? []).compactMap { p in
            guard let id = p["id"] as? String, let url = p["url"] as? String, !url.isEmpty else { return nil }
            return MenuPage(id: id, title: p["title"] as? String ?? id, agent: p["agent"] as? String ?? "",
                            version: (p["version"] as? NSNumber)?.intValue ?? 1, url: url,
                            opened: (p["opened_version"] as? NSNumber)?.intValue)
        }
    }
}

// a standing order an agent keeps (sb every, roadmap B): state.timers from
// the hub (amb-home m_5441), the page it refreshes if any
struct MenuWatch: Equatable {
    var id: Int
    var text: String
    var page: String?

    static func list(_ state: [String: Any]) -> [MenuWatch] {
        (state["timers"] as? [[String: Any]] ?? []).compactMap { t in
            guard let id = (t["id"] as? NSNumber)?.intValue else { return nil }
            let page = (t["page"] as? String).flatMap { $0.isEmpty ? nil : $0 }
            return MenuWatch(id: id, text: t["text"] as? String ?? "", page: page)
        }
    }
}

// the words (signed off by ambient: needs you first, then for you)
enum MenuRows {
    static let forYou = "for you"
    static let needsYou = "needs you"
    static let maxPages = 6
    static let maxWatches = 4
    static let stopWatching = "stop watching"
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

    // "watching the launch · 3 new for you" (its page's title and the
    // versions he hasn't opened); no page: the order's own words, clipped
    static func watch(_ w: MenuWatch, pages: [MenuPage]) -> String {
        if let id = w.page, let p = pages.first(where: { $0.id == id }) {
            let head = "watching " + clip(p.title, titleCut)
            return p.unopened > 0 ? "\(head) · \(p.unopened) new for you" : head
        }
        let words = w.text.split(whereSeparator: \.isNewline).joined(separator: " ").trimmingCharacters(in: .whitespaces)
        return "watching: " + clip(words.isEmpty ? "#\(w.id)" : words, titleCut)
    }

    // the page a watch row opens, if it has one with a URL
    static func watchURL(_ w: MenuWatch, pages: [MenuPage]) -> String? {
        guard let id = w.page else { return nil }
        return pages.first(where: { $0.id == id })?.url
    }

    // the menu-bar icon's number (docs/ambient-app.md §8, amb-web's
    // fixtures/count.json, shared with the web's M.count): the cards waiting
    // + the pages with a version he hasn't opened (a page still being
    // written for the first time is not counted; updating has a version)
    static func count(_ state: [String: Any]) -> Int {
        let cards = (state["cards"] as? [[String: Any]] ?? []).count
        let pages = (state["pages"] as? [[String: Any]] ?? []).filter { p in
            let st = p["state"] as? String ?? "ready"
            let v = (p["version"] as? NSNumber)?.intValue ?? 1
            let opened = (p["opened_version"] as? NSNumber)?.intValue ?? 0
            return st != "writing" && v > opened
        }.count
        return cards + pages
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

// the menu-bar icon's look (ambient's SPEC §0 states, §1 moods): one mood
// wins, the count stays beside it. StatusItem plays the pearl's frames for
// the mood (or draws :* until they exist).
struct IconLook: Equatable {
    enum Mood: String, Equatable { case still, work, listen, done, fail, away }
    var mood: Mood
    var moving: Bool          // play the mood's loop (else its first frame, once)
    var extra: String         // "", "▲" (fail, 8 s), "☾" (away: quiet)
    var count: Int            // the rose pill, never blinking; none at 0

    static let flash = 8.0    // done glint, fail stop

    static func of(working: Bool, count: Int, quiet: Bool, holding: Bool,
                   glintUntil: Double, failedUntil: Double, now: Double, reduceMotion: Bool) -> IconLook {
        let move = !reduceMotion
        if holding { return IconLook(mood: .listen, moving: move, extra: "", count: count) }
        if now < failedUntil { return IconLook(mood: .fail, moving: false, extra: "▲", count: count) }
        if now < glintUntil { return IconLook(mood: .done, moving: move, extra: "", count: count) }
        if quiet { return IconLook(mood: .away, moving: false, extra: "☾", count: count) }
        if working { return IconLook(mood: .work, moving: move, extra: "", count: count) }
        return IconLook(mood: .still, moving: false, extra: "", count: count)
    }

    // frames per second of a mood's loop (listen: faster)
    var fps: Double { mood == .listen ? 24 : 12 }
}
