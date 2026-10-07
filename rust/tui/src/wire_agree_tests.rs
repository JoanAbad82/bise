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
    ]
}

/// (kind, text, who) of each TUI event the fold also makes an entry of.
fn tui_words(ls: &[&str]) -> Vec<(EntryKind, String, String)> {
    let mut out = Vec::new();
    for l in ls {
        match parse_line(l) {
            Some(Ev::You(t, ..)) => out.push((EntryKind::You, t, String::new())),
            Some(Ev::Assistant(t)) => {
                let vis = split_thinking(&t).map(|(_, v)| v).unwrap_or(t);
                out.push((EntryKind::Agent, crate::unescape_md(&vis).trim().to_string(), String::new()));
            }
            Some(Ev::AgentMsg { from, to, text, level: 3, .. }) if from.is_empty() => out.push((EntryKind::ToAgent, text, to)),
            Some(Ev::AgentMsg { from, text, level: 3, .. }) => out.push((EntryKind::FromAgent, text, from)),
            Some(Ev::AgentMsg { text, level: 2, .. }) => out.push((EntryKind::Agent, text, String::new())),
            Some(Ev::Info(t)) if l.starts_with("sb stopped") => out.push((EntryKind::Stopped, t, String::new())),
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
    let entries = fold(&numbered, &Ctx { open_cards: &[], page: &none });
    let folded: Vec<(EntryKind, String, String)> = entries
        .iter()
        .filter(|e| e.kind != EntryKind::Tools)
        .map(|e| (e.kind, e.text.clone(), e.from.clone().or_else(|| e.to.clone()).unwrap_or_default()))
        .collect();
    assert_eq!(folded, tui_words(&ls));
    assert_eq!(folded.len(), 6, "{folded:?}");
}

/// A failed turn's words come from one place (`thread::words`), which the
/// fold's notice entries will call too.
#[test]
fn a_failed_turn_reads_through_the_shared_words() {
    assert!(matches!(parse_line("  obs: turn_done: failed: 500"), Some(Ev::Err(t)) if t == "turn failed: 500"));
    assert!(matches!(parse_line("  obs: provider_retry: 2/10 · 529 · retry in 4s"), Some(Ev::Warn(t)) if t == words::provider_retry("2/10 · 529 · retry in 4s")));
    assert!(matches!(parse_line("  obs: turn_done: failed: your ChatGPT sign-in expired. x"), Some(Ev::Warn(t)) if t == EXPIRED_TUI));
}
