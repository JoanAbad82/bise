// ShowPlan: the order in which a page opens (docs/ambient-pages.md §2.8,
// §4.5), as pure logic (the laws in test/ShowPlanTests.swift). First the
// computer-use broker's C3 `show`: the page in the user's `bise` tab group,
// through the extension, as a ctl command (no agent session, no
// 'bise · ambient' group). When that can't work, today's path (PageOpen's
// AppleScript in a running Chromium browser, else NSWorkspace open).
//
// The broker runs only while a browser with the extension is open (its
// native host starts it): no socket, or a refused connect, means no
// extension, so straight to the fallback; we never start the broker
// (computer use costs no process when it's off). Once the request is sent,
// a late answer most likely means the tab opened: no fallback then, or the
// page would open twice.

import Foundation

enum ShowOutcome: Equatable {
    case ok                    // the broker showed it
    case noBroker              // no socket, or the connect was refused
    case refused(String)       // no_browser, not_set_up, bad_args, timeout (the broker's)
    case late                  // sent, no answer within the wait: probably opened
    case broken(String)        // a write failed, a reply that isn't C3
}

enum ShowStep: Equatable {
    case done
    case fallback              // AppleScript, else open
}

enum ShowPlan {
    static let connectBudget = 0.3   // to reach the broker
    static let replyWait = 1.0       // for its answer once the request is out

    static func after(_ o: ShowOutcome) -> ShowStep {
        switch o {
        case .ok, .late: return .done
        case .noBroker, .refused, .broken: return .fallback
        }
    }

    // the broker's reply line (C3: {id, ok, result|error}) -> an outcome;
    // nil: not our reply (another id), keep reading
    static func outcome(reply: [String: Any]?, id: Int) -> ShowOutcome? {
        guard let r = reply else { return .broken("not JSON") }
        guard (r["id"] as? NSNumber)?.intValue == id else { return nil }
        if r["ok"] as? Bool == true { return .ok }
        let code = (r["error"] as? [String: Any])?["code"] as? String ?? "error"
        return .refused(code)
    }

    // the two C3 lines: the command hello (no ack), then show
    static func lines(url: String, prefix: String, id: Int) -> [[String: Any]] {
        [["op": "hello", "role": "ctl"],
         ["id": id, "op": "show", "args": ["url": url, "url_prefix": prefix]]]
    }

    // url_prefix: the page's own URL under pages_url (a tab on another
    // version or with a fragment counts), else the URL itself
    static func prefix(for url: String, pagesURL: String?) -> String {
        if let base = pagesURL, let ref = PageOpen.pageRef(tab: url, pagesURL: base) { return ref.url }
        return url
    }
}
