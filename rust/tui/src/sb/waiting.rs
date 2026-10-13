//! The waits in the TUI (agent-waiting-states A, designer m_22899 and
//! m_22934): bise-proto's words (`pause_of`, `alarms_of`) with the
//! terminal's short ages, fitted to its rows. A PAUSE (a watch that
//! `resumes` the agent) is the feed's live line and the top edge's
//! `… continues when cargo bench ends · 3m`; an ALARM (the agent is free)
//! is a row of the panel's `watching` section, `◌ main  →08:07` with
//! `if the nightly gate goes red` under it, and without the panel (80 columns) one faint
//! `◌ 1 watching` on the composer's rule that opens /scheduled.

use super::*;
use bise_proto::thread::words::{alarms_of, pause_of, Alarm, PauseLine};
use unicode_width::UnicodeWidthStr;

/// One alarm of a live agent, as the panel, the rule and /scheduled
/// show it.
#[derive(Clone, Debug, PartialEq, Eq)]
pub(crate) struct Watch {
    pub(crate) agent: String,
    pub(crate) alarm: Alarm,
}

impl Sb {
    /// The live words of the agent in view when it pauses on an event, in
    /// `room` columns: `continues when cargo bench ends · 3m`; only the
    /// note cuts, after a whole word.
    pub(crate) fn waiting_words(&self, now: u64, room: usize) -> Option<String> {
        let a = self.agent(&self.focus).filter(|a| a.waits_event())?;
        let l = pause_of(&a.watching, now, true)?;
        Some(pause_fit(&l, room))
    }

    /// Every live agent's alarms, in the panel's order (its numbers),
    /// each agent's oldest first.
    pub(crate) fn watches(&self, now: u64) -> Vec<Watch> {
        self.blocks()
            .into_iter()
            .flat_map(|(_, agents)| agents)
            .flat_map(|a| alarms_of(&a.name, &a.watching, now, &crate::when::offset_at).into_iter().map(|alarm| Watch { agent: a.name.clone(), alarm }))
            .collect()
    }
}

/// `note` cut after a whole word with `…` in `room` columns; None when
/// fewer than `min` words fit.
fn word_cut(note: &str, room: usize, min: usize) -> Option<String> {
    if note.width() <= room {
        return Some(note.to_string());
    }
    let words: Vec<&str> = note.split_whitespace().collect();
    (min..words.len()).rev().map(|k| format!("{}…", words[..k].join(" "))).find(|c| c.width() <= room)
}

/// A pause line in `room` columns: `<state> <note><more> · <dur>`, the
/// note cut after a whole word with `…`; under 2 words it goes
/// (`continues when… · 3m`).
pub(crate) fn pause_fit(l: &PauseLine, room: usize) -> String {
    let fixed = format!("{} {} · {}", l.state, l.more, l.dur).width();
    match word_cut(&l.note, room.saturating_sub(fixed), 2) {
        Some(note) => format!("{} {}{} · {}", l.state, note, l.more, l.dur),
        None => format!("{}…{} · {}", l.state, l.more, l.dur),
    }
}

/// An alarm's end in the terminal (designer m_22934), the clock always
/// whole: `→08:07`, `→tmrw 08:07`, `→fri 08:07`, beyond 6 days `→5
/// oct`; "" when the hub doesn't say.
pub(crate) fn end_short(end: &str) -> String {
    if end.is_empty() {
        return String::new();
    }
    let arrow = if crate::theme::ascii_mode() { "->" } else { "→" };
    let parts: Vec<&str> = end.split(' ').collect();
    let at = match parts.as_slice() {
        ["tomorrow", hm] => format!("tmrw {hm}"),
        [day, month, _] => format!("{day} {month}"),
        _ => end.to_string(),
    };
    format!("{arrow}{at}")
}

/// An alarm in the panel's `watching` section, `w` columns (designer
/// m_22997): row 1 ` ◌ main          →08:07 `, the `◌` faint in the
/// number column, the agent dim, its end dim at the right, both whole;
/// row 2 the note, faint, under the name, cut on a word with `…` (under
/// 2 words of its event it goes, never `if the…`, and row 1 stays alone).
pub(crate) fn watch_rows(wt: &Watch, w: usize, bg: Option<Color>) -> Vec<Line<'static>> {
    let g = crate::theme::glyph(G_WATCHING);
    let end = end_short(&wt.alarm.end);
    let lead = format!(" {g} ");
    let right = if end.is_empty() { String::new() } else { format!("  {end}") };
    // 1 column of margin on the right
    let name = super::panel::fit(&wt.agent, w.saturating_sub(lead.width() + right.width() + 1));
    let used = lead.width() + name.width() + right.width();
    let mut rows = vec![vec![
        Span::styled(lead.clone(), Style::default().fg(faint())),
        Span::styled(name, Style::default().fg(dim())),
        Span::raw(" ".repeat(w.saturating_sub(used + 1))),
        Span::styled(right, Style::default().fg(dim())),
        Span::raw(" "),
    ]];
    let indent = lead.width();
    let min = if wt.alarm.note.starts_with("if ") { 3 } else { 2 };
    if let Some(note) = word_cut(&wt.alarm.note, w.saturating_sub(indent + 1), min) {
        let pad = w.saturating_sub(indent + note.width());
        rows.push(vec![Span::raw(" ".repeat(indent)), Span::styled(note, Style::default().fg(faint())), Span::raw(" ".repeat(pad))]);
    }
    rows.into_iter()
        .map(|spans| match bg {
            Some(bg) => Line::from(spans.into_iter().map(|s| { let st = s.style.bg(bg); s.style(st) }).collect::<Vec<_>>()),
            None => Line::from(spans),
        })
        .collect()
}

/// The panel's `watching` section (designer's mock): 1 blank row, its
/// title, then one row per alarm; a click on one opens /scheduled on
/// it. Nothing without an alarm.
pub(super) fn watching_lines(sb: &Sb, w: usize, lines: &mut Vec<Line<'static>>, owners: &mut Vec<(usize, super::panel::Hit)>) {
    let all = sb.watches(crate::when::now_ms());
    if all.is_empty() {
        return;
    }
    lines.push(Line::from(""));
    owners.push((lines.len(), super::panel::Hit::Watch(None)));
    lines.push(Line::from(Span::styled(" watching", Style::default().fg(text()))));
    for wt in &all {
        for row in watch_rows(wt, w, None) {
            owners.push((lines.len(), super::panel::Hit::Watch(Some(wt.alarm.id))));
            lines.push(row);
        }
    }
}

/// The composer rule's states without the panel (`bare`; designer's
/// mock at 80 columns): each ends in a faint `◌ 1 watching`, then the
/// count alone (the last resort); and the count's width (0: no alarm,
/// or the panel shows them, `states` as they were).
pub(crate) fn rule_states(sb: &Sb, bare: bool, states: Vec<Vec<Span<'static>>>) -> (Vec<Vec<Span<'static>>>, u16) {
    let n = sb.watches(crate::when::now_ms()).len();
    if !bare || n == 0 {
        return (states, 0);
    }
    let count = Span::styled(format!("{} {} watching", crate::theme::glyph(G_WATCHING), n), Style::default().fg(faint()));
    let w = count.content.width() as u16;
    let mut out: Vec<Vec<Span<'static>>> = states
        .into_iter()
        .filter(|s| !s.is_empty())
        .map(|mut s| {
            s.push(Span::styled(" · ", Style::default().fg(dim())));
            s.push(count.clone());
            s
        })
        .collect();
    out.push(vec![count]);
    (out, w)
}

#[cfg(test)]
#[path = "waiting_tests.rs"]
mod tests;
