//! sb-core's effects, typed (issue 25, chunk R): one item of a step's
//! `"fx"` list is read as a `bise_proto::core::Fx` through serde, and
//! [`plain`] turns the ones that need nothing of the hub's state into the
//! hub's [`Effect`] at once; the others (the journal, a reply, a delivery,
//! the client's effects, ...) go back to `Hub::effect` (core_link.rs).
//! [`delivery`] writes the text a delivery puts in the agent's context.
//! Pure: no I/O, no hub.

use super::{join_fields, line, Effect};
use bise_proto::core::Fx as CoreFx;
use serde_json::Value;

/// One effect of sb-core, read.
#[derive(Debug, PartialEq)]
pub(super) enum Plain {
    /// the hub's effect, nothing else to do
    Effect(Effect),
    /// nothing to do (`rt`: the runtime state comes with the view)
    Nothing,
    /// an effect on the hub's state: `Hub::effect` runs it
    Hub(CoreFx),
    /// not an effect this hub runs: skipped, with the log line that says
    /// why (a newer sb-core, a version switch in flight: never a crash)
    Skip(String),
}

/// One item of sb-core's `"fx"` list.
pub(super) fn read(f: &Value) -> Plain {
    match CoreFx::decode(f.clone()) {
        Ok(CoreFx::Unknown { tag, raw }) => Plain::Skip(format!("sb-core: unknown effect {} (skipped): {}", tag, raw)),
        Ok(fx) => plain(fx),
        Err(e) => Plain::Skip(format!("sb-core: bad effect ({}, skipped): {}", e, f)),
    }
}

/// The hub's effect of `f` when it needs nothing of the hub's state.
pub(super) fn plain(f: CoreFx) -> Plain {
    let e = match f {
        CoreFx::Rt(_) => return Plain::Nothing,
        CoreFx::Spawn(s) => Effect::Spawn { agent: s.agent, resume: s.resume, crash_note: s.crash_note },
        CoreFx::Kill(k) => Effect::Kill { agent: k.agent },
        CoreFx::Say(s) => Effect::Say { agent: s.agent, text: s.text },
        CoreFx::Passthrough(p) => Effect::Passthrough { agent: p.agent, line: p.line },
        // C2: a multi-field line (`answered`) comes as `fields`
        CoreFx::Line(l) => {
            let text = match l.fields {
                Some(fields) => join_fields(&fields),
                None => l.text.unwrap_or_default(),
            };
            line(&l.agent, &l.kind, &text)
        }
        CoreFx::XDeliver(x) => Effect::XDeliver { xid: x.xid, project: x.project, kind: x.kind, text: x.text, context: x.context, parts: x.parts },
        CoreFx::XReply(x) => Effect::XReply { hub: x.hub, xid: x.xid, text: x.text },
        CoreFx::Route(r) => Effect::Route { rid: r.rid, to: r.to, name: r.name, text: r.text, due_ms: r.due_ms, why: r.why },
        CoreFx::RouteAsk(r) => Effect::RouteAsk { rid: r.rid, text: r.text },
        CoreFx::RouteDone(r) => Effect::RouteDone { rid: r.rid, state: r.state, to: r.to, xid: r.xid },
        CoreFx::JobEnd(j) => Effect::JobEnd { agent: j.agent, state: j.state, label: j.label, summary: j.summary, key: j.key },
        CoreFx::FollowedEnd(j) => Effect::FollowedEnd {
            project: j.project,
            agent: j.agent,
            key: j.key,
            state: j.state,
            label: j.label,
            summary: j.summary,
        },
        // a gate card's verdict (approvals), not the client's yes/no
        CoreFx::Confirm(c) if c.card.is_some() => Effect::Confirm {
            card: c.card.unwrap_or(0),
            agent: c.agent.unwrap_or_default(),
            text: c.text,
        },
        other => return Plain::Hub(other),
    };
    Plain::Effect(e)
}

/// The text a delivery puts in the agent's context: main's `notes`, the
/// task `status` block (None or "": none), then each message as the
/// recipient reads it.
pub(super) fn delivery(notes: &[String], status: Option<String>, msgs: Vec<String>) -> String {
    let mut parts: Vec<String> = Vec::new();
    if !notes.is_empty() {
        let mut t = String::from("<bise_notes>\n");
        for n in notes {
            t.push_str(&format!("- {}\n", n));
        }
        t.push_str("</bise_notes>");
        parts.push(t);
    }
    parts.extend(status.filter(|s| !s.is_empty()));
    parts.extend(msgs);
    parts.join("\n\n")
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn eff(v: Value) -> Effect {
        match read(&v) {
            Plain::Effect(e) => e,
            p => panic!("not a plain effect: {:?}", p),
        }
    }

    #[test]
    fn a_line_is_its_text_or_its_fields() {
        let text = eff(json!({"fx": "line", "agent": "a", "kind": "you", "text": "go"}));
        assert_eq!(text, line("a", "you", "go"));
        let fields = eff(json!({"fx": "line", "agent": "a", "kind": "sent", "fields": ["b", "x : y", "0"]}));
        assert_eq!(fields, line("a", "sent", "b : x \\: y : 0"));
    }

    #[test]
    fn plain_effects_keep_every_field() {
        assert_eq!(
            eff(json!({"fx": "spawn", "agent": "a", "resume": true, "crash_note": "boom"})),
            Effect::Spawn { agent: "a".into(), resume: true, crash_note: Some("boom".into()) }
        );
        assert_eq!(
            eff(json!({"fx": "spawn", "agent": "w", "resume": false, "crash_note": null})),
            Effect::Spawn { agent: "w".into(), resume: false, crash_note: None }
        );
        assert_eq!(
            eff(json!({"fx": "route_done", "rid": 1, "state": "cancelled", "to": "shop-1", "xid": null})),
            Effect::RouteDone { rid: 1, state: "cancelled".into(), to: "shop-1".into(), xid: None }
        );
        assert_eq!(
            eff(json!({"fx": "xdeliver", "xid": 1, "project": "p", "kind": "ask", "msg": 0, "text": "t", "context": ""})),
            Effect::XDeliver { xid: 1, project: "p".into(), kind: "ask".into(), text: "t".into(), context: "".into(), parts: "".into() }
        );
        assert_eq!(
            eff(json!({"fx": "job_end", "agent": "perf", "state": "done", "label": "l", "summary": "s", "key": 7, "hub": "h"})),
            Effect::JobEnd { agent: "perf".into(), state: "done".into(), label: "l".into(), summary: "s".into(), key: 7 }
        );
    }

    #[test]
    fn a_confirm_with_a_card_is_the_gates_the_other_the_clients() {
        assert_eq!(
            eff(json!({"fx": "confirm", "card": 3, "agent": "t8", "text": "2"})),
            Effect::Confirm { card: 3, agent: "t8".into(), text: "2".into() }
        );
        assert!(matches!(read(&json!({"fx": "confirm", "name": "tq", "text": "archive?"})), Plain::Hub(CoreFx::Confirm(_))));
    }

    #[test]
    fn hub_effects_go_back_rt_is_nothing() {
        for v in [
            json!({"fx": "journal", "ev": {"type": "act_done", "id": 1}}),
            json!({"fx": "reply", "token": 1, "body": {"ok": true}}),
            json!({"fx": "deliver", "mode": "say", "agent": "w", "notes": [], "status": false, "msgs": [{"id": 2, "rel": "hub"}]}),
            json!({"fx": "interrupt", "agent": "t7"}),
            json!({"fx": "notice", "text": "x"}),
            json!({"fx": "focus_main", "name": "g"}),
            json!({"fx": "renamed", "old": "a", "new": "b"}),
        ] {
            assert!(matches!(read(&v), Plain::Hub(_)), "{v}");
        }
        assert_eq!(read(&json!({"fx": "rt", "agent": "w", "run": "idle", "waiting": false, "turn_ms": null, "turns": 0})), Plain::Nothing);
    }

    /// Every effect sb-core was seen to send (chunk 0's capture) is run:
    /// none is skipped (a known tag whose fields don't decode would be).
    #[test]
    fn every_captured_effect_is_read() {
        let fixtures = include_str!("../../proto/fixtures/core_fx.jsonl");
        let mut n = 0;
        for l in fixtures.lines().filter(|l| !l.trim().is_empty()) {
            let v: Value = serde_json::from_str(l).unwrap();
            assert!(!matches!(read(&v), Plain::Skip(_)), "skipped: {l}");
            n += 1;
        }
        assert!(n >= CoreFx::TAGS.len(), "{n} lines");
    }

    #[test]
    fn an_unknown_or_bad_effect_is_skipped_never_a_crash() {
        let unknown = json!({"fx": "teleport", "agent": "a"});
        assert_eq!(read(&unknown), Plain::Skip(format!("sb-core: unknown effect teleport (skipped): {}", unknown)));
        assert!(matches!(read(&json!({"agent": "a"})), Plain::Skip(_)));
        assert!(matches!(read(&json!({"fx": "kill", "agent": 3})), Plain::Skip(_)));
    }

    #[test]
    fn a_delivery_is_notes_then_status_then_messages() {
        assert_eq!(delivery(&[], None, vec!["m".into()]), "m");
        assert_eq!(delivery(&[], Some(String::new()), vec![]), "");
        assert_eq!(
            delivery(&["n1".into(), "n2".into()], Some("S".into()), vec!["a".into(), "b".into()]),
            "<bise_notes>\n- n1\n- n2\n</bise_notes>\n\nS\n\na\n\nb"
        );
    }
}
