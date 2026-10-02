// The laws of ShowPlan (the fallback order of opening a page), run by
// build.sh --test through the swift interpreter (cat'ed after
// src/PageOpen.swift and src/ShowPlan.swift). Never touches a socket.

import Foundation

var failures = 0
func law(_ name: String, _ ok: Bool) {
    if ok { print("ok   \(name)") } else { print("FAIL \(name)"); failures += 1 }
}

law("the broker showed it: done", ShowPlan.after(.ok) == .done)
law("no broker (no socket, connect refused): the AppleScript path", ShowPlan.after(.noBroker) == .fallback)
law("no_browser, not_set_up, bad_args: the AppleScript path",
    ShowPlan.after(.refused("no_browser")) == .fallback && ShowPlan.after(.refused("not_set_up")) == .fallback
        && ShowPlan.after(.refused("bad_args")) == .fallback)
law("a broken reply or write: the AppleScript path", ShowPlan.after(.broken("x")) == .fallback)
law("sent but late: done (never the page twice)", ShowPlan.after(.late) == .done)

law("reply ok", ShowPlan.outcome(reply: ["id": 1, "ok": true, "result": ["tab_id": 3] as [String: Any]], id: 1) == .ok)
law("reply error code", ShowPlan.outcome(reply: ["id": 1, "ok": false, "error": ["code": "no_browser"]], id: 1) == .refused("no_browser"))
law("an error without code is still a refusal", ShowPlan.outcome(reply: ["id": 1, "ok": false], id: 1) == .refused("error"))
law("a line for another id: keep reading", ShowPlan.outcome(reply: ["id": 2, "ok": true], id: 1) == nil)
law("a line that isn't JSON: broken", ShowPlan.outcome(reply: nil, id: 1) == .broken("not JSON"))

let ls = ShowPlan.lines(url: "http://h:1/p/a?x", prefix: "http://h:1/p/a", id: 7)
law("the command hello first: role ctl, no agent", ls[0]["op"] as? String == "hello" && ls[0]["role"] as? String == "ctl" && ls[0]["agent"] == nil)
law("then show with url and url_prefix",
    ls[1]["op"] as? String == "show" && (ls[1]["id"] as? Int) == 7
        && ((ls[1]["args"] as? [String: Any])?["url_prefix"] as? String) == "http://h:1/p/a"
        && ((ls[1]["args"] as? [String: Any])?["url"] as? String) == "http://h:1/p/a?x")

let base = "http://127.0.0.1:47123"
law("prefix of a page version: the page's own URL", ShowPlan.prefix(for: base + "/p/w/v/3#b", pagesURL: base) == base + "/p/w")
law("prefix of another URL: itself", ShowPlan.prefix(for: "https://bise.dev/x", pagesURL: base) == "https://bise.dev/x")
law("prefix without pages_url: itself", ShowPlan.prefix(for: base + "/p/w", pagesURL: nil) == base + "/p/w")

if failures > 0 { print("\(failures) failed"); exit(1) }
print("all ShowPlan laws hold")
