use super::*;
use crate::rows::ReportKind;
use crate::thread::lines::{publish_in, report_in};
use crate::thread::words::{one_line, summary};
use crate::thread::{page, EntryKind, Line, PageRef, ReportRef};

fn lines() -> Vec<Line> {
    let l = |pos: u64, line: &str| (pos, 1_000 + pos, line.to_string());
    vec![
        l(1, "sb you : make it fast"),
        l(2, "  obs: turn_started"),
        l(3, "  obs: assistant: <think>hmm</think>on it"),
        l(4, "tool #1 bash : cargo test -q"),
        l(5, "tool_intent #1 : running the tests"),
        l(6, "tool_result #1 ok : 3 failed"),
        l(7, "tool #2 read_file : {\"path\":\"a.rs\"}"),
        l(8, "tool #3 bash : sb land \"fast\""),
        l(9, "tool_intent #3 : landing the fix"),
        l(10, "sb msg-in : ambient-lead m_3 : nice"),
        l(11, "second line"),
        l(12, "tool #4 bash : sb report done \"the e2e takes 40 s\""),
        l(13, "sb card : #9 question @perf : which bench?\\n1. cold\\n2. warm"),
        l(14, "tool #5 bash : sb page publish $TMPDIR/n.html --id perf-notes"),
        l(15, "  obs: turn_done: completed"),
    ]
}

fn ctx_with<'a>(open: &'a [u64], page: &'a dyn Fn(&str) -> Option<PageRef>) -> Ctx<'a> {
    Ctx { open_cards: open, page }
}

#[test]
fn a_thread_folds_into_entries() {
    let page = |id: &str| (id == "perf-notes").then(|| PageRef { id: id.into(), title: "Perf notes".into(), v: Some(2), url: "http://p/perf-notes".into() });
    let e = fold(&lines(), &ctx_with(&[9], &page));
    let kinds: Vec<EntryKind> = e.iter().map(|e| e.kind).collect();
    use EntryKind::*;
    assert_eq!(kinds, [You, Agent, Tools, FromAgent, Report, Card, Page]);
    assert_eq!((e[0].pos, e[0].at_ms, e[0].text.as_str()), (1, 1001, "make it fast"));
    assert_eq!(e[1].text, "on it", "no thinking");
    let t = e[2].tools.as_ref().unwrap();
    assert_eq!((e[2].pos, t.count, t.items[0].text.as_str(), t.items[2].land), (4, 3, "running the tests", true));
    assert_eq!(t.summary, "read 1 file, ran 2 commands");
    assert_eq!(e[2].text, t.summary);
    assert_eq!((e[3].text.as_str(), e[3].from.as_deref()), ("nice\nsecond line", Some("ambient-lead")));
    assert_eq!(e[4].report, Some(ReportRef { kind: ReportKind::Done }));
    let c = e[5].card.as_ref().unwrap();
    assert_eq!((c.id, c.question.as_str(), c.options.len(), c.answered), (9, "which bench?", 2, false));
    assert_eq!(e[6].page.as_ref().unwrap().v, Some(2));
    assert_eq!(e[6].text, "Perf notes v2");
    // closed card: answered
    assert!(fold(&lines(), &ctx_with(&[], &page))[5].card.as_ref().unwrap().answered);
}

/// An interrupt's 'stopped' line (sb-core, architect m_9650 D) is an
/// entry of its own at its position, and ends the message before it.
#[test]
fn a_stopped_line_is_a_stopped_entry() {
    let page = |_: &str| None;
    let ls = vec![
        (1, 1001, "sb you : go".to_string()),
        (2, 1002, "  obs: assistant: working on".to_string()),
        (3, 1003, "sb stopped : stopped".to_string()),
        (4, 1004, "a line after".to_string()),
    ];
    let e = fold(&ls, &ctx_with(&[], &page));
    let kinds: Vec<EntryKind> = e.iter().map(|e| e.kind).collect();
    assert_eq!(kinds, [EntryKind::You, EntryKind::Agent, EntryKind::Stopped]);
    assert_eq!((e[2].pos, e[2].text.as_str()), (3, "stopped"));
    assert_eq!(e[1].text, "working on", "the line after the stop doesn't join the agent's message");
}

/// What a task sent (sb-core's `sent` line, architect m_10203) is a
/// `to_agent` entry: to whom, its id, whether it asks; the card main
/// opens for it, written in the task's feed too, is its card entry.
#[test]
fn a_sent_line_is_the_tasks_own_message() {
    let page = |_: &str| None;
    let ls = vec![
        (1, 1001, "tool #1 bash : sb send main --expect-reply \"cart or checkout?\"".to_string()),
        (2, 1002, "sb sent : main : m_9 : 1 : gift cards: cart \\: or checkout?\\n1. on the cart page\\n2. only at checkout".to_string()),
        (3, 1003, "sb card : #2 question @gift-ui : gift cards: cart or checkout?\\n1. on the cart page\\n2. only at checkout".to_string()),
        (4, 1004, "sb sent : docs : m_11 : 0 : fyi".to_string()),
    ];
    let e = fold(&ls, &ctx_with(&[2], &page));
    let kinds: Vec<EntryKind> = e.iter().map(|e| e.kind).collect();
    assert_eq!(kinds, [EntryKind::Tools, EntryKind::ToAgent, EntryKind::Card, EntryKind::ToAgent]);
    assert_eq!((e[1].to.as_deref(), e[1].msg, e[1].asks), (Some("main"), Some(9), true));
    assert_eq!(e[1].text, "gift cards: cart : or checkout?\n1. on the cart page\n2. only at checkout", "its fields unescaped");
    let c = e[2].card.as_ref().unwrap();
    assert_eq!((c.id, c.options.len(), c.answered), (2, 2, false));
    assert_eq!((e[3].to.as_deref(), e[3].msg, e[3].asks, e[3].text.as_str()), (Some("docs"), Some(11), false, "fyi"));
    let j = serde_json::to_value(&e[3]).unwrap();
    assert_eq!((j["kind"].as_str(), j.get("asks")), (Some("to_agent"), None), "asks: false is left out");
}

/// Law (architect m_9048): a context line attaches only to the 'you'
/// line right before it; a stray one (after anything else, or a second
/// one) is dropped, never attached elsewhere.
#[test]
fn a_context_line_belongs_to_the_you_line_right_before_it() {
    let none = |_: &str| None;
    let ctx = ctx_with(&[], &none);
    let l = |pos: u64, line: &str| (pos, pos, line.to_string());
    let lines = vec![
        l(1, r#"sb you : why is this slow?"#),
        l(2, r#"sb context : {"app":"Safari","url":"https://grafana.acme.test/d/p99"}"#),
        l(3, r#"sb context : {"app":"Mail"}"#),
        l(4, "  obs: assistant: looking"),
        l(5, r#"sb context : {"app":"Notes"}"#),
        l(6, "sb you : and this?"),
        l(7, "  obs: turn_started"),
        l(8, r#"sb context : {"app":"Code"}"#),
        l(9, "sb you : third"),
        l(10, "sb context : not json"),
    ];
    let e = fold(&lines, &ctx);
    assert_eq!(e.len(), 4);
    assert_eq!(e[0].context.as_ref().and_then(|c| c.url.as_deref()), Some("https://grafana.acme.test/d/p99"));
    assert_eq!(e[0].text, "why is this slow?");
    assert!(e[1..].iter().all(|e| e.context.is_none()), "{e:?}");
    assert_eq!(e[2].text, "and this?");
}

#[test]
fn a_page_keeps_the_newest_and_says_what_is_before() {
    let none = |_: &str| None;
    let ctx = ctx_with(&[], &none);
    let (e, before, more) = page(&lines(), &ctx, 60);
    assert_eq!((e.len(), before, more), (7, None, false));
    let (e, before, more) = page(&lines(), &ctx, 2);
    assert_eq!((e.len(), before, more), (2, Some(13), true));
    // a page that doesn't start the thread: its first entry may be cut
    let (e, before, more) = page(&lines()[3..10], &ctx, 60);
    assert_eq!(e[0].kind, EntryKind::FromAgent);
    assert_eq!((before, more), (Some(10), true));
}

#[test]
fn bash_calls_read_as_reports_and_publishes() {
    assert_eq!(report_in(r#"cd x && sb report done "landed \"a\"" --decision y"#), Some((ReportKind::Done, "landed \"a\"".into())));
    assert_eq!(report_in("sb report progress 'half'"), Some((ReportKind::Progress, "half".into())));
    assert_eq!(report_in("sb report nope x"), None);
    assert_eq!(publish_in("sb page publish ./weekly.html"), Some("weekly".into()));
    assert_eq!(summary(&[]), "");
    assert_eq!(one_line("  \nabcdef", 4), "abc…");
}
