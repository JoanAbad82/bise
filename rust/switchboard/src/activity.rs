//! `hub/activity` (les bims, architect m_27581), the pure part: the
//! activity event of one of sb-core's journal events, as the hub runs its
//! `journal` effect (core_doing.rs; a boot replay runs none, so a client
//! never gets old activity). A projection of what sb-core already
//! decided and journaled: a message sent (`message_sent`) or a report
//! (`reported`). No decision here, and nothing of a body, a report's
//! text or a tool's args goes into the event (`bise_proto::activity`).

use bise_proto::activity::{ActivityEv, MsgMode, Party};
use bise_proto::rows::ReportKind;
use serde_json::Value;

/// The activity event of journal event `ev`, if it is one.
pub fn of_journal(ev: &Value) -> Option<ActivityEv> {
    let s = |v: &Value, k: &str| v.get(k).and_then(Value::as_str).unwrap_or("").to_string();
    let n = |v: &Value, k: &str| v.get(k).and_then(Value::as_u64).unwrap_or(0);
    let b = |v: &Value, k: &str| v.get(k).and_then(Value::as_bool).unwrap_or(false);
    match ev.get("type").and_then(Value::as_str)? {
        "message_sent" => {
            let m = ev.get("msg")?;
            Some(ActivityEv::Message {
                id: m.get("id")?.as_u64()?,
                from: Party::of_word(&s(m, "from")),
                to: Party::of_word(&s(m, "to")),
                mode: if b(m, "queued") { MsgMode::Queued } else { MsgMode::Steer },
                expects_reply: b(m, "expect_reply"),
                at_ms: n(m, "created_ms"),
            })
        }
        "reported" => {
            let r = ev.get("report")?;
            Some(ActivityEv::Report { agent: s(ev, "name"), report: report_kind(&s(r, "kind"))?, at_ms: n(r, "at_ms") })
        }
        _ => None,
    }
}

/// A report's kind; none for the turn-end note sb-core writes by itself
/// (`turn`: no report the agent made).
fn report_kind(k: &str) -> Option<ReportKind> {
    match k {
        "progress" => Some(ReportKind::Progress),
        "done" => Some(ReportKind::Done),
        "failed" | "turn_failed" => Some(ReportKind::Failed),
        "blocked" => Some(ReportKind::Blocked),
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    const SECRET: &str = "s3cret-body cargo test --token=abc";

    fn msg(id: u64, from: &str, to: &str, queued: bool, expect: bool) -> Value {
        json!({"type": "message_sent", "msg": {"id": id, "thread": id, "from": from, "to": to, "expect_reply": expect,
            "auto": false, "text": SECRET, "created_ms": 1000 + id, "plain": false, "queued": queued, "parts": SECRET}})
    }

    fn report(name: &str, kind: &str) -> Value {
        json!({"type": "reported", "name": name, "report": {"at_ms": 77, "kind": kind, "summary": SECRET,
            "decisions": [SECRET], "auto": false, "step": null, "of": null, "result": {"label": SECRET}}})
    }

    /// (a) every message sent is exactly one Message event, its ends typed.
    #[test]
    fn a_message_sent_is_one_message_event() {
        assert_eq!(
            of_journal(&msg(4, "user", "main", false, false)),
            Some(ActivityEv::Message {
                id: 4,
                from: Party::You,
                to: Party::Agent { name: "main".into() },
                mode: MsgMode::Steer,
                expects_reply: false,
                at_ms: 1004
            })
        );
        assert_eq!(
            of_journal(&msg(5, "main", "docs", true, true)),
            Some(ActivityEv::Message {
                id: 5,
                from: Party::Agent { name: "main".into() },
                to: Party::Agent { name: "docs".into() },
                mode: MsgMode::Queued,
                expects_reply: true,
                at_ms: 1005
            })
        );
        assert!(matches!(of_journal(&msg(6, "switchboard", "a", false, false)), Some(ActivityEv::Message { from: Party::Bise, .. })));
    }

    /// (a) every report an agent made is one Report event; sb-core's own
    /// turn-end note is none.
    #[test]
    fn a_report_is_one_report_event() {
        for (k, want) in [("progress", ReportKind::Progress), ("done", ReportKind::Done), ("failed", ReportKind::Failed),
                          ("blocked", ReportKind::Blocked), ("turn_failed", ReportKind::Failed)] {
            assert_eq!(of_journal(&report("docs", k)), Some(ActivityEv::Report { agent: "docs".into(), report: want, at_ms: 77 }), "{k}");
        }
        assert_eq!(of_journal(&report("docs", "turn")), None);
    }

    #[test]
    fn other_journal_events_are_none() {
        for ev in [json!({"type": "message_state", "id": 3, "state": "delivered"}), json!({"type": "card_opened", "card": {}}),
                   json!({"type": "declared", "name": "a"}), json!({}), json!({"type": "message_sent"})] {
            assert_eq!(of_journal(&ev), None, "{ev}");
        }
    }

    /// (b) nothing of a body, a report's text or args leaves.
    #[test]
    fn no_text_leaves() {
        let evs = [msg(1, "user", "main", false, false), msg(2, "a", "b", true, true), report("a", "done"), report("a", "blocked")];
        for ev in evs {
            let out = serde_json::to_string(&of_journal(&ev).unwrap()).unwrap();
            assert!(!out.contains("s3cret") && !out.contains("token") && !out.contains("summary") && !out.contains("text"), "{out}");
        }
    }
}
