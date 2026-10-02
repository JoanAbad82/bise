// The laws of MenuRows and MenuPage.list, run by build.sh --test through
// the swift interpreter (cat'ed after src/MenuRows.swift).

import Foundation

var failures = 0
func law(_ name: String, _ ok: Bool) {
    if ok { print("ok   \(name)") } else { print("FAIL \(name)"); failures += 1 }
}

let p = MenuPage(id: "w", title: "weekly update", agent: "perf", version: 2, url: "http://127.0.0.1:47123/p/w")
law("a page: title · agent · v2", MenuRows.page(p) == "weekly update · perf · v2")
law("a first version says no v1", MenuRows.page(MenuPage(id: "w", title: "weekly", agent: "perf", version: 1, url: "u")) == "weekly · perf")
law("main's page without agent name: title alone", MenuRows.page(MenuPage(id: "w", title: "weekly", agent: "", version: 1, url: "u")) == "weekly")
law("a card: agent: question", MenuRows.card(agent: "cookies", text: "keep the banner on mobile?") == "cookies: keep the banner on mobile?")
law("a card on one line", MenuRows.card(agent: "a", text: "one\ntwo") == "a: one two")
let long = String(repeating: "x", count: 80)
law("one long word is cut at the limit with …", MenuRows.clip(long, 50).count == 50 && MenuRows.clip(long, 50).hasSuffix("…"))
law("a short row is kept", MenuRows.clip("short", 50) == "short")
let words = "the weekly perf update for the signup flow and the checkout"
law("a title is cut at 40 on a word",
    MenuRows.page(MenuPage(id: "w", title: words, agent: "perf", version: 1, url: "u")) == "the weekly perf update for the signup…  · perf".replacingOccurrences(of: "…  ·", with: "… ·"))
law("a cut never ends inside a word, never past the limit",
    MenuRows.clip(words, 40).count <= 40 && words.hasPrefix(String(MenuRows.clip(words, 40).dropLast())))
law("a card is cut at 50 on a word",
    MenuRows.card(agent: "cookies", text: "keep the banner on mobile, or move it to the footer on small screens?")
        == "cookies: keep the banner on mobile, or move it to…")

let state: [String: Any] = ["pages": [
    ["id": "a", "title": "A", "agent": "x", "version": 3, "url": "http://h/p/a"],
    ["id": "b", "title": "B", "agent": "y", "version": 1],
    ["id": "c", "agent": "z", "version": 1, "url": "http://h/p/c"],
]]
let pages = MenuPage.list(state)
law("state.pages: those with a URL, in order", pages.map(\.id) == ["a", "c"])
law("a page without title shows its id", pages.last?.title == "c")
law("no pages: empty", MenuPage.list([:]).isEmpty)

func look(working: Bool = false, count: Int = 0, quiet: Bool = false, holding: Bool = false,
          glint: Double = -1, failed: Double = -1, now: Double = 0, still: Bool = false) -> IconLook {
    IconLook.of(working: working, count: count, quiet: quiet, holding: holding, glintUntil: glint, failedUntil: failed, now: now, reduceMotion: still)
}
law("at rest: the still pearl, drawn once, nothing beside it", look() == IconLook(mood: .still, moving: false, extra: "", count: 0))
law("agents working: work, turning", look(working: true).mood == .work && look(working: true).moving)
law("things wait: the count beside it, whatever the mood", look(count: 3).count == 3 && look(working: true, count: 2, quiet: true).count == 2)
law("done or a page ready: the done glint for 8 s", look(glint: 8, now: 1).mood == .done && look(glint: 8, now: 9).mood == .still)
law("failed: it stops, ▲ for 8 s", look(working: true, failed: 8, now: 1) == IconLook(mood: .fail, moving: false, extra: "▲", count: 0))
law("quiet: away, ☾, still", look(working: true, quiet: true) == IconLook(mood: .away, moving: false, extra: "☾", count: 0))
law("you hold fn: listen, faster", look(quiet: true, holding: true).mood == .listen && look(holding: true).fps == 24 && look(working: true).fps == 12)
law("reduced motion: never moving", !look(working: true, still: true).moving && !look(holding: true, still: true).moving)

// roadmap B: the standing orders (state.timers, amb-home m_5441)
let wstate: [String: Any] = [
    "pages": [["id": "launch-watch", "title": "the launch", "agent": "watch", "version": 5, "opened_version": 2, "url": "http://h/p/launch-watch"],
              ["id": "seen", "title": "seen page", "agent": "w", "version": 3, "opened_version": 3, "url": "http://h/p/seen"],
              ["id": "old", "title": "old hub", "agent": "w", "version": 4, "url": "http://h/p/old"]],
    "timers": [["id": 3, "agent": "watch", "label": "every 10m", "text": "check HN, X and Reddit for bise", "by": "main", "fired": 2, "page": "launch-watch"],
               ["id": 4, "agent": "w", "label": "every day 07:30", "text": "the morning page", "fired": 0, "page": "seen"],
               ["id": 5, "agent": "w", "label": "every 1h", "text": "look at the\nCI queue", "fired": 0],
               ["agent": "broken"]],
]
let wpages = MenuPage.list(wstate)
let watches = MenuWatch.list(wstate)
law("state.timers: the ones with an id, in order", watches.map(\.id) == [3, 4, 5])
law("no timers in the state: no watch rows", MenuWatch.list(["pages": []]).isEmpty)
law("a page's unopened versions: version − opened_version",
    wpages.first { $0.id == "launch-watch" }?.unopened == 3 && wpages.first { $0.id == "seen" }?.unopened == 0)
law("a hub without opened_version: never opened", wpages.first { $0.id == "old" }?.unopened == 4)
law("a watch with a page: its title and what's new",
    MenuRows.watch(watches[0], pages: wpages) == "watching the launch · 3 new for you")
law("nothing new: no count", MenuRows.watch(watches[1], pages: wpages) == "watching seen page")
law("no page: the order's words on one line",
    MenuRows.watch(watches[2], pages: wpages) == "watching: look at the CI queue")
law("a page not in the state: the order's words",
    MenuRows.watch(MenuWatch(id: 9, text: "x", page: "gone"), pages: wpages) == "watching: x")
law("no words either: its number", MenuRows.watch(MenuWatch(id: 9, text: " ", page: nil), pages: []) == "watching: #9")
law("a watch row opens its page; none without one",
    MenuRows.watchURL(watches[0], pages: wpages) == "http://h/p/launch-watch" && MenuRows.watchURL(watches[2], pages: wpages) == nil)

// the icon's number: amb-web's shared fixture (build.sh --test sets
// AMBIENT_FIXTURES), so the app and the web never drift
let fixtures = ProcessInfo.processInfo.environment["AMBIENT_FIXTURES"] ?? "../web/fixtures"
if let d = FileManager.default.contents(atPath: fixtures + "/count.json"),
   let j = try? JSONSerialization.jsonObject(with: d) as? [String: Any],
   let cases = j["cases"] as? [[String: Any]], !cases.isEmpty {
    for c in cases {
        let got = MenuRows.count(c["state"] as? [String: Any] ?? [:])
        let want = (c["count"] as? NSNumber)?.intValue ?? -1
        law("count.json: \(c["name"] as? String ?? "?") → \(want)", got == want)
    }
} else {
    law("count.json is readable at \(fixtures)", false)
}

if failures > 0 { print("\(failures) failed"); exit(1) }
print("all MenuRows laws hold")
