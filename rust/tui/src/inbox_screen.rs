//! `/inbox` full screen (inbox-history pick A, designer m_24225 (7)):
//! what waits for him on top, then his past answers by day, from the
//! hub's record (`inbox/history`, kept fresh by `inbox/recorded`). The
//! rows are inbox_list.rs's (pure); this file asks, draws and takes the
//! keys. ⏎ on a waiting one opens it to answer (as ctrl+N); ⏎ on a past
//! one opens its asker's thread at his answer, esc back here
//! (sb/inbox.rs). Nothing waiting: it opens on the history. ctrl+1-9
//! close it and open their item, as everywhere.

use crate::app::App;
use crate::inbox_list::{self as list, Pick, Row};
use crate::theme::{self, accent, dim, faint, text};
use bise_proto::inbox::InboxRecord;
use crossterm::event::{KeyCode, KeyEvent, KeyEventKind, KeyModifiers};
use ratatui::style::{Modifier, Style};
use ratatui::text::{Line, Span};
use ratatui::widgets::{Clear, Paragraph};
use ratatui::Frame;
use unicode_width::UnicodeWidthStr;

/// The open screen.
#[derive(Default)]
pub(crate) struct Screen {
    /// his past answers, newest first (pages appended)
    pub(crate) past: Vec<InboxRecord>,
    /// older ones exist
    pub(crate) more: bool,
    /// a page is on its way
    pub(crate) asking: bool,
    /// the selected row
    pub(crate) sel: Option<Pick>,
    /// the first row shown
    pub(crate) top: usize,
}

/// `/inbox`: the screen, its first page asked.
pub(crate) fn open(app: &mut App) {
    app.inbox = Some(Screen { asking: true, ..Default::default() });
    app.sb.call("inbox/history", serde_json::json!({}), crate::sb::rpc::Then::Inbox(None));
}

thread_local! {
    /// The screen while he looks at an answer in its thread (⏎ on a past
    /// one): esc brings it back as he left it, the same row selected.
    static PARKED: std::cell::RefCell<Option<Screen>> = const { std::cell::RefCell::new(None) };
}

/// Put the screen aside (the jump to an answer).
pub(crate) fn park(app: &mut App) {
    let sc = app.inbox.take();
    PARKED.with(|p| *p.borrow_mut() = sc);
}

/// The screen put aside comes back, its first page asked again (records
/// changed while it was away); none put aside: a new one.
pub(crate) fn unpark(app: &mut App) {
    let Some(mut sc) = PARKED.with(|p| p.borrow_mut().take()) else { return open(app) };
    sc.asking = true;
    app.inbox = Some(sc);
    app.sb.call("inbox/history", serde_json::json!({}), crate::sb::rpc::Then::Inbox(None));
}

/// `inbox/history`'s answer: the first page (`before` None), or the next.
pub(crate) fn answered(app: &mut App, before: Option<u64>, ev: bise_proto::hub::HubEv) {
    let bise_proto::hub::HubEv::InboxHistory { page, .. } = ev else { return };
    let Some(sc) = app.inbox.as_mut() else { return };
    sc.asking = false;
    if before.is_none() {
        sc.past.clear();
    }
    for r in page.items {
        if !sc.past.iter().any(|p| p.card == r.card) {
            sc.past.push(r);
        }
    }
    sc.more = page.more;
}

/// `inbox/recorded`: a card closed or got its answer's position.
pub(crate) fn recorded(app: &mut App, r: InboxRecord) {
    let Some(sc) = app.inbox.as_mut() else { return };
    match sc.past.iter_mut().find(|p| p.card == r.card) {
        Some(p) => *p = r,
        None => {
            let at = sc.past.iter().position(|p| p.card < r.card).unwrap_or(sc.past.len());
            sc.past.insert(at, r);
        }
    }
}

fn rows(app: &App) -> Vec<Row> {
    let Some(sc) = app.inbox.as_ref() else { return Vec::new() };
    let now = crate::when::now_ms();
    list::rows(&crate::sb::inbox::waiting(app), &sc.past, sc.more, now, crate::when::offset_at(now))
}

/// One row's line: the selected one marked `›`.
fn line(r: &Row, picked: bool, width: usize) -> Line<'static> {
    let (left, right) = list::text(r, width.saturating_sub(2));
    let mark = Span::styled(if picked { format!("{} ", theme::glyph("›")) } else { "  ".into() }, Style::default().fg(accent()));
    let st = |c| Style::default().fg(c);
    let body = match r {
        Row::WaitHead(_) => st(accent()).add_modifier(Modifier::BOLD),
        Row::Wait(_) | Row::Past { done: true, .. } => st(text()),
        Row::Day(_) => st(dim()).add_modifier(Modifier::BOLD),
        Row::Past { done: false, .. } | Row::Said { .. } => st(dim()),
        Row::Empty | Row::More => st(faint()),
    };
    let gap = width.saturating_sub(2 + left.width() + right.width()).max(1);
    let mut spans = vec![mark, Span::styled(left, body)];
    if !right.is_empty() {
        spans.push(Span::raw(" ".repeat(gap)));
        spans.push(Span::styled(right, st(faint())));
    }
    Line::from(spans)
}

/// The screen's lines in `width` × `height`: the rows from `top`, kept so
/// the selection shows, the keys at the bottom.
pub(crate) fn lines(sc: &mut Screen, rows: &[Row], width: usize, height: usize) -> Vec<Line<'static>> {
    if sc.sel.is_none_or(|p| !list::picks(rows).contains(&p)) {
        sc.sel = list::first(rows);
    }
    let room = height.saturating_sub(2).max(1);
    let at = rows.iter().position(|r| r.pick().is_some() && r.pick() == sc.sel).unwrap_or(0);
    // a past one's two lines both show; its day head too when it is first
    let head = if at > 0 && matches!(rows[at - 1], Row::Day(_) | Row::WaitHead(_)) { at - 1 } else { at };
    if head < sc.top {
        sc.top = head;
    } else if at + 2 > sc.top + room {
        sc.top = (at + 2).saturating_sub(room);
    }
    let mut out: Vec<Line> = rows.iter().skip(sc.top).take(room).map(|r| line(r, r.pick().is_some() && r.pick() == sc.sel && !matches!(r, Row::Said { .. }), width)).collect();
    out.resize(room, Line::default());
    out.push(Line::default());
    out.push(Line::from(Span::styled(list::KEYS, Style::default().fg(dim()))));
    out
}

pub(crate) fn draw(app: &mut App, frame: &mut Frame) {
    if app.inbox.is_none() {
        return;
    }
    let full = frame.area();
    crate::pointer::region(full, crate::pointer::Shape::Default);
    frame.render_widget(Clear, full);
    if full.width < 30 || full.height < 10 {
        return;
    }
    let area = crate::artifacts_screen::draw_frame(app, frame, full, "inbox");
    let rows = rows(app);
    let Some(sc) = app.inbox.as_mut() else { return };
    let out = lines(sc, &rows, area.width as usize, area.height as usize);
    frame.render_widget(Paragraph::new(out), area);
    crate::textlayer::text(area);
}

/// The next page, when the selection reached the last answers.
fn more(app: &mut App, rows: &[Row]) {
    let Some(sc) = app.inbox.as_mut() else { return };
    let last = list::picks(rows).last().copied();
    let Some(Pick::Past(card)) = sc.sel.filter(|p| Some(*p) == last) else { return };
    if sc.more && !sc.asking {
        sc.asking = true;
        app.sb.call("inbox/history", serde_json::json!({"before": card}), crate::sb::rpc::Then::Inbox(Some(card)));
    }
}

/// ⏎: a waiting one opens to answer; a past one, its answer in its thread.
fn enter(app: &mut App) {
    let Some(sel) = app.inbox.as_ref().and_then(|s| s.sel) else { return };
    match sel {
        Pick::Card(id) => {
            app.inbox = None;
            crate::sb::inbox::open_waiting(app, id);
        }
        Pick::Past(card) => {
            let Some(r) = app.inbox.as_ref().and_then(|s| s.past.iter().find(|r| r.card == card)).cloned() else { return };
            let (agent, pos) = match &r.thread {
                Some(at) => (at.agent.clone(), Some(at.pos)),
                None => (r.asker.clone(), None),
            };
            crate::sb::inbox::to_answer(app, &agent, pos, true);
        }
    }
}

pub(crate) fn on_key(app: &mut App, k: &KeyEvent) -> bool {
    if app.inbox.is_none() {
        return k.code == KeyCode::Esc && k.kind == KeyEventKind::Press && crate::sb::inbox::esc_back(app);
    }
    if k.kind != KeyEventKind::Press {
        return true;
    }
    let ctrl = k.modifiers.contains(KeyModifiers::CONTROL);
    match k.code {
        // ctrl+1-9 as everywhere: the screen goes, their item opens
        KeyCode::Char(c) if ctrl && c.is_ascii_digit() => {
            app.inbox = None;
            return false;
        }
        KeyCode::Char('c' | 'g') if ctrl => app.inbox = None,
        KeyCode::Esc => app.inbox = None,
        KeyCode::Enter => enter(app),
        KeyCode::Up | KeyCode::Down | KeyCode::PageUp | KeyCode::PageDown | KeyCode::Home | KeyCode::End | KeyCode::Char('k' | 'j') => {
            let by = match k.code {
                KeyCode::Up | KeyCode::Char('k') => -1,
                KeyCode::Down | KeyCode::Char('j') => 1,
                KeyCode::PageUp => -10,
                KeyCode::PageDown => 10,
                KeyCode::Home => -100_000,
                _ => 100_000,
            };
            let rows = rows(app);
            if let Some(sc) = app.inbox.as_mut() {
                sc.sel = list::step(&rows, sc.sel, by);
            }
            more(app, &rows);
        }
        _ => {}
    }
    true
}

#[cfg(test)]
#[path = "inbox_screen_tests.rs"]
mod tests;
