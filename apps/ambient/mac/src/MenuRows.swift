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
    var waiting: Int? = nil   // its items waiting for him (hub's `waiting`: sb page waiting's lines)

    // versions published since he last opened it (a hub without
    // opened_version: never opened, as amb-web's fixtures/count.json says)
    var unopened: Int { max(0, version - (opened ?? 0)) }

    // state.pages, newest first: the ones with a URL to open
    static func list(_ state: [String: Any]) -> [MenuPage] {
        (state["pages"] as? [[String: Any]] ?? []).compactMap { p in
            guard let id = p["id"] as? String, let url = p["url"] as? String, !url.isEmpty else { return nil }
            return MenuPage(id: id, title: p["title"] as? String ?? id, agent: p["agent"] as? String ?? "",
                            version: (p["version"] as? NSNumber)?.intValue ?? 1, url: url,
                            opened: (p["opened_version"] as? NSNumber)?.intValue,
                            waiting: (p["waiting"] as? NSNumber)?.intValue)
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

// one row of the menu-bar menu, as StatusItem draws it and QA reads it
struct MenuItemOut: Equatable {
    enum Kind: String { case access, header, card, page, watch, stop, talk, toggle, settings, quit, separator }
    var kind: Kind
    var title: String = ""
    var keys: String? = nil
    var ref: String? = nil          // a card id, a page URL, a timer id
    var enabled = true
    var indent = 0

    var json: [String: Any] {
        var d: [String: Any] = ["kind": kind.rawValue, "title": title, "enabled": enabled]
        if let keys { d["keys"] = keys }
        if let ref { d["ref"] = ref }
        if indent > 0 { d["indent"] = indent }
        return d
    }
}

struct MenuCard: Equatable {
    var id: String
    var agent: String
    var text: String
}

// the words (signed off by ambient: needs you first, then for you)
enum MenuRows {
    // the whole menu (right click on the icon): needs you, for you, what
    // agents watch, then the keys and quit; the words of the fixed rows
    // come from StatusItem's and the settings' word lists
    static func items(cards: [MenuCard], pages: [MenuPage], watches: [MenuWatch], hidden: Bool,
                      words: (talk: String, talkKeys: String, show: String, hide: String, hideKeys: String,
                              settings: String, settingsKeys: String, quit: String),
                      noAccess: Bool = false) -> [MenuItemOut] {
        var out: [MenuItemOut] = []
        // fn can't be heard (this binary isn't trusted): first, until it is
        if noAccess {
            out.append(MenuItemOut(kind: .access, title: needsAccess))
            out.append(MenuItemOut(kind: .separator))
        }
        let cs = cards.prefix(maxCards)
        if !cs.isEmpty {
            out.append(MenuItemOut(kind: .header, title: needsYou, enabled: false))
            for c in cs { out.append(MenuItemOut(kind: .card, title: card(agent: c.agent, text: c.text), ref: c.id)) }
            out.append(MenuItemOut(kind: .separator))
        }
        let ps = pages.prefix(maxPages)
        if !ps.isEmpty {
            out.append(MenuItemOut(kind: .header, title: forYou, enabled: false))
            for p in ps { out.append(MenuItemOut(kind: .page, title: page(p), ref: p.url)) }
            out.append(MenuItemOut(kind: .separator))
        }
        let ws = watches.prefix(maxWatches)
        if !ws.isEmpty {
            for w in ws {
                let url = watchURL(w, pages: pages)
                out.append(MenuItemOut(kind: .watch, title: watch(w, pages: pages), ref: url, enabled: url != nil))
                out.append(MenuItemOut(kind: .stop, title: stopWatching, ref: String(w.id), indent: 1))
            }
            out.append(MenuItemOut(kind: .separator))
        }
        out.append(MenuItemOut(kind: .talk, title: words.talk, keys: words.talkKeys))
        out.append(MenuItemOut(kind: .toggle, title: hidden ? words.show : words.hide, keys: words.hideKeys))
        out.append(MenuItemOut(kind: .settings, title: words.settings, keys: words.settingsKeys))
        out.append(MenuItemOut(kind: .separator))
        out.append(MenuItemOut(kind: .quit, title: words.quit))
        return out
    }

    static let needsAccess = "fn needs Accessibility · open settings"
    static let forYou = "for you"
    static let needsYou = "needs you"
    static let maxPages = 6
    static let maxWatches = 4
    static let stopWatching = "stop watching"
    static let maxCards = 9
    static let titleCut = 40
    static let cardCut = 50

    // "title · agent · v2" (no version mark on a first version); the
    // ambient surfaces speak as bise, main is plumbing: never 'main'
    static func page(_ p: MenuPage) -> String {
        var parts = [clip(p.title, titleCut)]
        if !p.agent.isEmpty && p.agent != "main" { parts.append(p.agent) }
        if p.version > 1 { parts.append("v\(p.version)") }
        return parts.joined(separator: " · ")
    }

    // "watching the launch · 3 wait for you" (ambient m_6022: the count's
    // wording; 'new' would read like unread pages) (its page's title and the
    // items on it waiting for him, pm's B m_6007: not its versions, so a
    // tick with nothing new for him adds nothing); no page: the order's own
    // words, clipped
    static func watch(_ w: MenuWatch, pages: [MenuPage]) -> String {
        if let id = w.page, let p = pages.first(where: { $0.id == id }) {
            let head = "watching " + clip(p.title, titleCut)
            let n = p.waiting ?? 0
            return n > 0 ? "\(head) · \(n) wait for you" : head
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

    // "agent: question" on one line (main's cards: the question alone)
    static func card(agent: String, text: String) -> String {
        let flat = text.split(whereSeparator: \.isNewline).joined(separator: " ")
        return clip(agent.isEmpty || agent == "main" ? flat : "\(agent): \(flat)", cardCut)
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
