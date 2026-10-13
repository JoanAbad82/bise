//! `/scheduled`'s `watching` group (agent-waiting-states A, designer
//! m_22934): every live agent's alarms after the active timers, `› ◌ main
//! if the nightly gate goes red  →08:07`. ⏎ opens the agent, `x` asks on
//! the row, then `y` stops watching (the hub's `wake/stop`; the agent's
//! thread says `stopped waiting for …`). No alarm: no group. The panel's
//! `watching` rows and the composer rule's `◌ 1 watching` open the
//! screen on one ([`open_on`]).

use crate::sb::Watch;
use crate::theme::{self, accent, dim, faint, text};
use ratatui::style::Style;
use ratatui::text::{Line, Span};
use unicode_width::UnicodeWidthStr;

/// The alarms the screen lists: the search keeps those whose agent or
/// note have it.
pub(crate) fn shown(query: &str, all: &[Watch]) -> Vec<Watch> {
    let q = query.trim().to_lowercase();
    all.iter().filter(|w| q.is_empty() || w.agent.to_lowercase().contains(&q) || w.alarm.note.to_lowercase().contains(&q)).cloned().collect()
}

/// `s` padded or cut (on a word, `…`) to `w` columns.
fn pad_words(s: &str, w: usize) -> String {
    let s = if s.width() <= w {
        s.to_string()
    } else {
        let words: Vec<&str> = s.split_whitespace().collect();
        (1..words.len()).rev().map(|k| format!("{}…", words[..k].join(" "))).find(|c| c.width() <= w).unwrap_or_default()
    };
    let n = w.saturating_sub(s.width());
    format!("{s}{}", " ".repeat(n))
}

/// One alarm's row, in the timers' columns: its agent where theirs is,
/// its note over their name and rhythm, its end where their next run is
/// (`→08:07`, `→tmrw 08:07`). `wide`: the timers' wide columns.
pub(crate) fn row(w: &Watch, selected: bool, width: usize, wide: bool) -> Line<'static> {
    let (agent_w, end_w) = if wide { (14, 26) } else { (13, 12) };
    let note_w = if wide { 34 + 17 } else { width.saturating_sub(4 + agent_w + end_w + 1).max(10) };
    Line::from(vec![
        Span::styled(if selected { format!("{} ", theme::glyph("›")) } else { "  ".into() }, Style::default().fg(accent())),
        Span::styled(format!("{} ", theme::glyph(theme::G_WATCHING)), Style::default().fg(faint())),
        Span::styled(pad_words(&w.agent, agent_w), Style::default().fg(text())),
        Span::styled(pad_words(&w.alarm.note, note_w), Style::default().fg(text())),
        Span::styled(crate::sb::end_short(&w.alarm.end), Style::default().fg(dim())),
    ])
}

/// The row of `x` on an alarm: the question in its place.
pub(crate) fn confirm_row(w: &Watch) -> Line<'static> {
    Line::from(vec![
        Span::styled(format!("{} ", theme::glyph("›")), Style::default().fg(accent())),
        Span::styled(format!("{} ", theme::glyph(theme::G_WATCHING)), Style::default().fg(faint())),
        Span::styled(format!("stop watching? bise won't wake {} {}.", w.agent, w.alarm.note), Style::default().fg(text())),
        Span::raw("   "),
        Span::styled("y", Style::default().fg(text())),
        Span::styled(" stop   ", Style::default().fg(dim())),
        Span::styled("n", Style::default().fg(text())),
        Span::styled(" or ", Style::default().fg(dim())),
        Span::styled("esc", Style::default().fg(text())),
        Span::styled(" keep", Style::default().fg(dim())),
    ])
}

/// `/scheduled` on alarm `id` (None: the first one): the panel's
/// `watching` rows, the composer rule's `◌ 1 watching`.
pub(crate) fn open_on(app: &mut crate::app::App, id: Option<u64>) {
    crate::scheduled_screen::open(app);
    let all = app.sb.watches(crate::when::now_ms());
    let id = id.filter(|id| all.iter().any(|w| w.alarm.id == *id)).or(all.first().map(|w| w.alarm.id));
    if let (Some(sc), Some(id)) = (app.scheduled.as_mut(), id) {
        sc.watch = Some(id);
    }
}

/// `y` after `x` on an alarm: the hub stops watching (its agent's thread
/// says so).
pub(crate) fn stop(app: &mut crate::app::App, w: &Watch) {
    app.sb.call("wake/stop", serde_json::json!({"id": w.alarm.id}), crate::sb::rpc::Then::Shown);
    if let Some(sc) = app.scheduled.as_mut() {
        sc.confirm = None;
        sc.watch = None;
        sc.note = Some((format!("stopped watching: bise won't wake {} {}.", w.agent, w.alarm.note), std::time::Instant::now()));
    }
}

/// The composer rule's `◌ 1 watching`, clicked: /scheduled on the
/// alarms (the panel's mouse asks first). False: elsewhere.
pub(crate) fn click(app: &mut crate::app::App, m: &crossterm::event::MouseEvent) -> bool {
    let hit = app.watching_rect.is_some_and(|r| r.contains((m.column, m.row).into()));
    if hit {
        open_on(app, None);
    }
    hit
}

/// Where the composer rule drew its `◌ 1 watching` (`w` columns at the
/// end of the state's `rect`; 0: none), for [`click`]; the hand over it.
pub(crate) fn place_count(app: &mut crate::app::App, w: u16, rect: ratatui::layout::Rect) {
    app.watching_rect = (w > 0 && app.tail_visible && rect.width > 0).then(|| ratatui::layout::Rect { x: rect.right().saturating_sub(w), width: w.min(rect.width), ..rect });
    if let Some(r) = app.watching_rect {
        crate::pointer::region(r, crate::pointer::Shape::Pointer);
    }
}

/// ⏎ on an alarm: its agent's thread, the screen closed.
pub(crate) fn open_agent(app: &mut crate::app::App, w: &Watch) {
    app.scheduled = None;
    crate::sb::focus(app, &w.agent);
}
