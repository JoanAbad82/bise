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

if failures > 0 { print("\(failures) failed"); exit(1) }
print("all MenuRows laws hold")
