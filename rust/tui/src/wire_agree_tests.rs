//! The TUI's feed events and the hub's fold read the same transcript
//! lines through bise-proto's one parser (`thread::lines`, architect
//! m_10476): for the same lines they say the same words. The proof of
//! that move; each new entry kind adds its pair here.

use super::*;
use bise_proto::thread::{fold, Ctx, EntryKind};

fn lines() -> Vec<&'static str> {
    vec![
        "sb you : make it fast\\nplease",
        "  obs: turn_started",
        "  obs: assistant: <think>hmm</think>\\non it",
        "tool #1 bash : cargo test -q",
        "tool_intent #1 : running the tests",
        "sb msg-in : ambient-lead m_3 : nice : really",
        "sb sent : main : m_9 : 1 : cart \\: or checkout?",
        "sb msg-you : docs : done here",
        "sb stopped : stopped by you",
        "  obs: turn_done: failed: 500",
        "  obs: provider_retry: 2/10 · provider 529 (transient) · retry in 4s",
        "  obs: turn_done: failed: interrupted by main",
        "  obs: turn_stalled: budget",
        "core rejected: no pending completion",
        "sb warn : the inbox is full",
        "sb spawn : docs started",
        "sb undelivered : perf : then \\: the warm run",
    ]
}

/// (kind, text, who) of each TUI event the fold also makes an entry of.
fn tui_words(ls: &[&str]) -> Vec<(EntryKind, String, String)> {
    let mut out = Vec::new();
    for l in ls {
        match parse_line(l) {
            Some(Ev::You(t, ..)) => out.push((EntryKind::You, t, String::new())),
            Some(Ev::Assistant(t)) => {
                // run.rs makes its thinking a section, its head the shared
                // words (no time: these lines have none); the fold puts it
                // on the reply, or alone when nothing is visible
                let thought = split_thinking(&t).is_some();
                let vis = split_thinking(&t).map(|(_, v)| v).unwrap_or(t);
                let vis = crate::unescape_md(&vis).trim().to_string();
                match (thought, vis.is_empty()) {
                    (_, false) => out.push((EntryKind::Agent, vis, String::new())),
                    (true, true) => out.push((EntryKind::Thinking, words::thought_for(0), String::new())),
                    (false, true) => {}
                }
            }
            Some(Ev::AgentMsg { from, to, text, level: 3, .. }) if from.is_empty() => out.push((EntryKind::ToAgent, text, to)),
            Some(Ev::AgentMsg { from, text, level: 3, .. }) => out.push((EntryKind::FromAgent, text, from)),
            Some(Ev::AgentMsg { text, level: 2, .. }) => out.push((EntryKind::Agent, text, String::new())),
            Some(Ev::Info(t)) if l.starts_with("sb stopped") => out.push((EntryKind::Stopped, t, String::new())),
            Some(Ev::Info(t) | Ev::Warn(t) | Ev::Err(t)) => out.push((EntryKind::Notice, t, String::new())),
            Some(Ev::Undelivered { name, text, .. }) => out.push((EntryKind::NotDelivered, text, name)),
            _ => {}
        }
    }
    out
}

#[test]
fn the_tui_and_the_fold_say_the_same_words_for_the_same_lines() {
    let ls = lines();
    let numbered: Vec<bise_proto::thread::Line> = ls.iter().enumerate().map(|(i, l)| (i as u64 + 1, 0, l.to_string())).collect();
    let none = |_: &str| None;
    let entries = fold(&numbered, &Ctx { open_cards: &[], page: &none, provider: &crate::models::provider_name });
    let folded: Vec<(EntryKind, String, String)> = entries
        .iter()
        .filter(|e| e.kind != EntryKind::Tools)
        .map(|e| {
            let who = e.from.clone().or_else(|| e.to.clone()).or_else(|| e.not_delivered.as_ref().map(|d| d.to.clone()));
            (e.kind, e.text.clone(), who.unwrap_or_default())
        })
        .collect();
    assert_eq!(folded, tui_words(&ls));
    assert_eq!(folded.len(), 14, "{folded:?}");
}

/// architect m_10999: the TUI's gauge (usage::current over its events)
/// and the hub's seed (lines::current_usage over the transcript's lines)
/// read the same usage for the same lines, by the one rule.
#[test]
fn the_tui_and_the_hub_read_the_same_current_usage() {
    let u1 = "  obs: usage: model=mistral/codestral-latest in=1200 out=30";
    let u2 = "  obs: usage: model=mistral/codestral-latest in=42000 out=310";
    let done = "  obs: compaction_done: the summary";
    for ls in [vec![u1], vec![u1, "sb you : hi", u2], vec![u1, done], vec![u1, done, u2], vec!["sb you : hi"]] {
        let evs: Vec<Ev> = ls.iter().filter_map(|l| parse_line(l)).collect();
        let tui = crate::usage::current(&evs).map(|u| (u.model.clone(), u.input, u.output, u.short()));
        let hub = bise_proto::thread::lines::current_usage(ls.iter().map(|l| bise_proto::thread::lines::usage_mark(l)))
            .and_then(|t| bise_session::usage_line::parse(&t))
            .map(|u| (u.model.clone(), u.input, u.output, words::short_words(u.input + u.output, crate::models::context_window(&u.model))));
        assert_eq!(tui, hub, "{ls:?}");
    }
}

/// A failed turn's words come from one place (`thread::words`), which the
/// fold's notice entries will call too.
#[test]
fn a_failed_turn_reads_through_the_shared_words() {
    assert!(matches!(parse_line("  obs: turn_done: failed: 500"), Some(Ev::Err(t)) if t == "turn failed: 500"));
    assert!(matches!(parse_line("  obs: provider_retry: 2/10 · 529 · retry in 4s"), Some(Ev::Warn(t)) if t == words::provider_retry("2/10 · 529 · retry in 4s")));
    assert!(matches!(parse_line("  obs: turn_done: failed: your ChatGPT sign-in expired. x"), Some(Ev::Warn(t)) if t == EXPIRED_TUI));
}
