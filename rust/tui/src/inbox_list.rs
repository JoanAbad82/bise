//! `/inbox`'s list (inbox-history pick A, designer m_24225 (7)), pure:
//! what waits for him on top, then his past answers by day, from the
//! hub's record (`inbox/history`, bise_proto::inbox). The words are
//! bise_proto's (`line2`, `words::day_head`): the desktop says the same.
//!
//! Rows: `waiting for you · N` (accent), one row per open card in the
//! inbox's order (`3  perf  webp or avif for the hero?`), then a day
//! head (`today`, `yesterday`, `oct 12`) and each past card on two lines:
//! `✓ perf  webp or avif for the hero?` with `14:02` on the right, and
//! under it `you: avif · in the inbox`; a withdrawn one `–`, dim,
//! `withdrawn: <why>`. The same at 80 and 150 columns: the question cuts.

use bise_proto::inbox::{words, InboxRecord, InboxState};
use bise_proto::words::inbox;
use unicode_width::UnicodeWidthStr;

/// One open card, as the strip numbers it.
#[derive(Clone, Debug, PartialEq, Eq)]
pub(crate) struct Waiting {
    pub(crate) n: usize,
    pub(crate) id: u64,
    pub(crate) agent: String,
    pub(crate) text: String,
    /// its age as the strip says it (`now`, `6m`), in the time column
    pub(crate) age: String,
}

/// What the selection can land on.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub(crate) enum Pick {
    /// an open card: ⏎ opens it to answer
    Card(u64),
    /// a past one: ⏎ goes to his answer in its thread
    Past(u64),
}

/// One row of the list.
#[derive(Clone, Debug, PartialEq, Eq)]
pub(crate) enum Row {
    /// `waiting for you · 3`
    WaitHead(usize),
    Wait(Waiting),
    /// a day's head over its answers
    Day(String),
    /// a past card's first line: its sign (`✓`, `–`), asker, question,
    /// time; the second line comes next as [`Row::Said`]
    Past { card: u64, done: bool, asker: String, question: String, time: String },
    Said { card: u64, done: bool, text: String },
    /// nothing answered yet
    Empty,
    /// older ones exist: they load at the end
    More,
}

impl Row {
    /// The pick this row selects (a past card's two lines select it).
    pub(crate) fn pick(&self) -> Option<Pick> {
        match self {
            Row::Wait(w) => Some(Pick::Card(w.id)),
            Row::Past { card, .. } | Row::Said { card, .. } => Some(Pick::Past(*card)),
            _ => None,
        }
    }
}

/// The list: the waiting ones, then the past ones by day, newest first.
/// `now` and `off` (seconds east): the day heads at his time.
pub(crate) fn rows(waiting: &[Waiting], past: &[InboxRecord], more: bool, now: u64, off: i32) -> Vec<Row> {
    let mut out = Vec::new();
    if !waiting.is_empty() {
        out.push(Row::WaitHead(waiting.len()));
        out.extend(waiting.iter().cloned().map(Row::Wait));
    }
    let mut day: Option<u64> = None;
    for r in past {
        if day.is_none_or(|d| !words::same_day(d, r.at_ms, off)) {
            out.push(Row::Day(words::day_head(r.at_ms, now, off)));
            day = Some(r.at_ms);
        }
        let done = r.state == InboxState::Answered;
        out.push(Row::Past { card: r.card, done, asker: r.asker.clone(), question: one_line(&r.question), time: words::hour(r.at_ms, off) });
        out.push(Row::Said { card: r.card, done, text: r.line2.clone() });
    }
    if past.is_empty() {
        out.push(Row::Empty);
    } else if more {
        out.push(Row::More);
    }
    out
}

/// The picks in order (↑↓ walk them).
pub(crate) fn picks(rows: &[Row]) -> Vec<Pick> {
    let mut out: Vec<Pick> = Vec::new();
    for p in rows.iter().filter_map(Row::pick) {
        if out.last() != Some(&p) {
            out.push(p);
        }
    }
    out
}

/// The pick on open: the first waiting card, else the newest answer.
pub(crate) fn first(rows: &[Row]) -> Option<Pick> {
    picks(rows).first().copied()
}

/// The pick `d` steps from `cur` (clamped).
pub(crate) fn step(rows: &[Row], cur: Option<Pick>, d: isize) -> Option<Pick> {
    let ps = picks(rows);
    let i = cur.and_then(|c| ps.iter().position(|p| *p == c)).unwrap_or(0) as isize;
    let j = (i + d).clamp(0, ps.len() as isize - 1);
    ps.get(j as usize).copied()
}

/// A row's text in `width` columns: (left, right). The caller styles it.
pub(crate) fn text(r: &Row, width: usize) -> (String, String) {
    match r {
        Row::WaitHead(n) => (inbox::list_waiting(n), String::new()),
        Row::Wait(w) => {
            let head = format!("{}  {}  ", w.n, w.agent);
            let room = width.saturating_sub(head.width() + w.age.width() + 2);
            (format!("{head}{}", cut(&one_line(&w.text), room)), w.age.clone())
        }
        Row::Day(d) => (d.clone(), String::new()),
        Row::Past { done, asker, question, time, .. } => {
            let head = format!("{} {asker}  ", if *done { "✓" } else { "–" });
            let room = width.saturating_sub(head.width() + time.width() + 2);
            (format!("{head}{}", cut(question, room)), time.clone())
        }
        Row::Said { text, .. } => (format!("  {}", cut(text, width.saturating_sub(2))), String::new()),
        Row::Empty => (inbox::list_empty.into(), String::new()),
        Row::More => (inbox::list_older.into(), String::new()),
    }
}

/// The keys under the list: what ⏎ does on the selected row (designer
/// m_25918, the desktop's rule).
pub(crate) fn keys(sel: Option<Pick>) -> &'static str {
    match sel {
        Some(Pick::Card(_)) => inbox::list_keys_card,
        Some(Pick::Past(_)) => inbox::list_keys_past,
        None => inbox::list_keys_none,
    }
}

fn one_line(s: &str) -> String {
    s.split_whitespace().collect::<Vec<_>>().join(" ")
}

/// `s` in `w` columns, `…` where it cuts.
pub(crate) fn cut(s: &str, w: usize) -> String {
    if s.width() <= w {
        return s.to_string();
    }
    let mut out = String::new();
    for c in s.chars() {
        if out.width() + unicode_width::UnicodeWidthChar::width(c).unwrap_or(0) + 1 > w {
            break;
        }
        out.push(c);
    }
    out.push('…');
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use bise_proto::inbox::{AnswerAt, InboxKind, Where};

    // 2025-09-30 12:41 UTC
    const NOW: u64 = 1_759_236_060_000;
    const DAY: u64 = 86_400_000;

    fn rec(card: u64, at: u64, done: bool) -> InboxRecord {
        InboxRecord {
            card,
            project: "p".into(),
            asker: "perf".into(),
            kind: InboxKind::Question,
            question: "webp or avif\nfor the hero?".into(),
            options: vec![],
            state: if done { InboxState::Answered } else { InboxState::Withdrawn },
            said: done.then(|| "avif".into()),
            pick_n: None,
            at: done.then_some(Where::Inbox),
            reason: (!done).then(|| "moot".into()),
            asked_ms: at,
            at_ms: at,
            thread: done.then(|| AnswerAt { agent: "perf".into(), pos: 9 }),
            line2: if done { "you: avif · in the inbox".into() } else { "withdrawn: moot".into() },
        }
    }

    fn wait(n: usize, id: u64) -> Waiting {
        Waiting { n, id, agent: "docs".into(), text: "ship the readme?".into(), age: "now".into() }
    }

    #[test]
    fn waiting_on_top_then_past_answers_by_day() {
        let rs = rows(&[wait(1, 9)], &[rec(5, NOW, true), rec(4, NOW - 60_000, false), rec(2, NOW - DAY, true)], false, NOW, 0);
        let kinds: Vec<&str> = rs
            .iter()
            .map(|r| match r {
                Row::WaitHead(_) => "head",
                Row::Wait(_) => "wait",
                Row::Day(_) => "day",
                Row::Past { .. } => "past",
                Row::Said { .. } => "said",
                Row::Empty => "empty",
                Row::More => "more",
            })
            .collect();
        assert_eq!(kinds, ["head", "wait", "day", "past", "said", "past", "said", "day", "past", "said"]);
        assert_eq!(rs[2], Row::Day("today".into()));
        assert_eq!(rs[7], Row::Day("yesterday".into()));
    }

    #[test]
    fn nothing_waiting_opens_on_the_history() {
        let rs = rows(&[], &[rec(5, NOW, true)], true, NOW, 0);
        assert_eq!(first(&rs), Some(Pick::Past(5)));
        assert_eq!(rs.last(), Some(&Row::More));
        assert_eq!(rows(&[], &[], false, NOW, 0), vec![Row::Empty]);
    }

    #[test]
    fn the_selection_walks_cards_not_lines() {
        let rs = rows(&[wait(1, 9)], &[rec(5, NOW, true), rec(4, NOW, false)], false, NOW, 0);
        assert_eq!(picks(&rs), vec![Pick::Card(9), Pick::Past(5), Pick::Past(4)]);
        assert_eq!(step(&rs, Some(Pick::Card(9)), 1), Some(Pick::Past(5)));
        assert_eq!(step(&rs, Some(Pick::Past(4)), 1), Some(Pick::Past(4)));
        assert_eq!(step(&rs, Some(Pick::Card(9)), -1), Some(Pick::Card(9)));
    }

    #[test]
    fn a_row_fits_80_and_150_columns() {
        let rs = rows(&[], &[rec(5, NOW, true), rec(4, NOW, false)], false, NOW, 0);
        for w in [80, 150, 30] {
            for r in &rs {
                let (l, rt) = text(r, w);
                assert!(l.width() + rt.width() < w.max(l.width() + 1), "{w}: {l} {rt}");
            }
        }
        assert_eq!(text(&rs[1], 80), ("✓ perf  webp or avif for the hero?".into(), "12:41".into()));
        assert_eq!(text(&rs[2], 80).0, "  you: avif · in the inbox");
        assert_eq!(text(&rs[4], 80).0, "  withdrawn: moot");
        assert!(text(&rs[1], 20).0.ends_with('…'));
    }
}
