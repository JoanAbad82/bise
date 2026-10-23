//! `/running` (designer's page running-procs): the project's processes
//! full screen, grouped by agent: the running ones (one that ends while
//! it is open keeps its place, its new state), tab the ones ended today
//! (running.rs draws the rows). In an agent's view it opens on that agent's rows.
//! Open, it follows the list (`processes/list` with `watch`: the hub
//! sends it again every 2 s); closed, it stops.
//!
//! Keys: ↑↓ (j/k) move, ⏎ its output, o opens its port (asked first:
//! nothing answers, a flash says so, as page-unreach), s stops it (no
//! question: `stopping…` until the hub's row says `stopped by you`), a
//! goes to its agent, tab the ended ones only, / searches, esc back.
//!
//! The output, every kind alike (designer m_38541: one head, one key
//! line): the hub's `process/output` and `process/follow` in a full
//! screen view (running_out.rs) that follows the end until he scrolls
//! up; its last 64 KB, then what it writes. One with no output says so
//! in one dim line.

use crate::app::App;
use crate::running::{self as rows, Filter};
use crate::running_out::{self as out, Text, View};
use crate::theme::{dim, faint, text};
use bise_proto::rows::{OutKind, Proc};
use bise_proto::words::running;
use crossterm::event::{KeyCode, KeyEvent, KeyEventKind, KeyModifiers};
use ratatui::layout::Rect;
use ratatui::style::{Modifier, Style};
use ratatui::text::{Line, Span};
use ratatui::widgets::{Clear, Paragraph};
use ratatui::Frame;
use serde_json::json;
use std::collections::HashSet;
use std::time::{Duration, Instant};
use unicode_width::UnicodeWidthStr;

/// A process's key: (agent, id).
pub(crate) type Key = (String, String);

/// The open screen.
#[derive(Default)]
pub(crate) struct Screen {
    /// the hub's last list (None: not answered yet)
    pub(crate) items: Option<Vec<Proc>>,
    pub(crate) filter: Filter,
    pub(crate) query: String,
    /// `/` has the keys
    pub(crate) typing: bool,
    /// the selected row
    pub(crate) sel: Option<Key>,
    /// the agent whose first row takes the selection when the list comes
    pub(crate) want: Option<String>,
    /// the ones he stopped, until the hub's row ends
    pub(crate) stopping: HashSet<Key>,
    /// the rows the running view showed running since it opened (or since
    /// tab): one that ends or that he stops keeps its place, its new
    /// state, until he leaves or presses tab
    pub(crate) kept: HashSet<Key>,
    /// what the last key did, for 6 s
    pub(crate) note: Option<(String, Instant)>,
    /// the first list row shown
    pub(crate) top: usize,
    /// the output read from the hub, when open
    pub(crate) out: Option<Out>,
}

/// One process's output, read from the hub.
#[derive(Default)]
pub(crate) struct Out {
    pub(crate) key: Key,
    pub(crate) text: Text,
    pub(crate) view: View,
    /// the hub answered once (before: nothing to say yet)
    pub(crate) got: bool,
    /// `/`: the find's text, and whether it has the keys
    pub(crate) find: String,
    pub(crate) finding: bool,
    /// the hit in view
    pub(crate) hit: Option<usize>,
    /// the output's rows in the last frame
    pub(crate) rows: usize,
}

const NOTE_FOR: Duration = Duration::from_secs(6);

/// `/running` opens the screen and follows the list.
pub(crate) fn open(app: &mut App) {
    let want = app.sb.focused_task();
    app.running = Some(Screen { want, ..Default::default() });
    app.sb.call("processes/list", json!({"watch": true}), crate::sb::rpc::Then::Processes);
}

/// The screen goes: the list and an output stop coming.
pub(crate) fn close(app: &mut App) {
    let Some(sc) = app.running.take() else { return };
    if let Some(o) = sc.out {
        follow(app, &o.key, false);
    }
    app.sb.call("processes/list", json!({"watch": false}), crate::sb::rpc::Then::Shown);
}

fn follow(app: &mut App, (agent, id): &Key, on: bool) {
    app.sb.call("process/follow", json!({"agent": agent, "id": id, "on": on}), crate::sb::rpc::Then::Shown);
}

/// The hub's list (`processes/list`'s answer, `hub/processes`).
pub(crate) fn listed(app: &mut App, items: &[Proc]) {
    let order = app.sb.agent_names();
    let Some(sc) = app.running.as_mut() else { return };
    // a stop is done when its row no longer runs
    sc.stopping.retain(|k| items.iter().any(|p| (&p.agent, &p.id) == (&k.0, &k.1) && p.running()));
    sc.items = Some(items.to_vec());
    if sc.filter == Filter::Running {
        sc.kept.extend(items.iter().filter(|p| p.running()).map(key));
    }
    let shown = rows::flat(&rows::groups(items, &order, sc.filter, &sc.query, &sc.kept)).into_iter().map(key).collect::<Vec<_>>();
    if let Some(a) = sc.want.take() {
        sc.sel = shown.iter().find(|k| k.0 == a).cloned().or(sc.sel.take());
    }
    if sc.sel.as_ref().is_none_or(|s| !shown.contains(s)) {
        sc.sel = shown.first().cloned();
    }
}

/// A range of output (`process/output`'s answer, its notifications).
pub(crate) fn output(app: &mut App, agent: &str, id: &str, at: u64, data: &str) {
    use base64::Engine;
    let Some(o) = app.running.as_mut().and_then(|s| s.out.as_mut()).filter(|o| (o.key.0.as_str(), o.key.1.as_str()) == (agent, id)) else {
        return;
    };
    let bytes = base64::engine::general_purpose::STANDARD.decode(data).unwrap_or_default();
    o.got = true;
    let before = o.text.all().len();
    o.text.push(at, &bytes);
    // scrolled up, the lines stay where he put them
    if !o.view.follows() {
        o.view.up += o.text.all().len().saturating_sub(before);
    }
}

fn key(p: &Proc) -> Key {
    (p.agent.clone(), p.id.clone())
}

fn order(app: &App) -> Vec<String> {
    app.sb.agent_names()
}

/// The rows in order, as the list shows them.
fn shown(app: &App) -> Vec<Proc> {
    let Some(sc) = app.running.as_ref() else { return Vec::new() };
    let items = sc.items.as_deref().unwrap_or(&[]);
    rows::flat(&rows::groups(items, &order(app), sc.filter, &sc.query, &sc.kept)).into_iter().cloned().collect()
}

fn selected(app: &App) -> Option<Proc> {
    let sel = app.running.as_ref()?.sel.clone()?;
    shown(app).into_iter().find(|p| key(p) == sel)
}

fn note(app: &mut App, s: String) {
    if let Some(sc) = app.running.as_mut() {
        sc.note = Some((s, Instant::now()));
    }
}

// ---- the actions ----

/// ⏎: its output, read from the hub and followed while it runs.
fn open_output(app: &mut App, p: &Proc) {
    let k = key(p);
    if let Some(sc) = app.running.as_mut() {
        sc.out = Some(Out { key: k.clone(), ..Default::default() });
    }
    if p.out == OutKind::None {
        return;
    }
    app.sb.call("process/output", json!({"agent": k.0, "id": k.1}), crate::sb::rpc::Then::ProcOut);
    if p.running() {
        follow(app, &k, true);
    }
}

/// o: its port in the browser, when something answers there.
fn open_port(app: &mut App, p: &Proc) {
    if !p.running() {
        return note(app, running::ended_no_open.to_string());
    }
    let Some(port) = p.ports.first().copied().filter(|_| p.running()) else {
        return note(app, running::no_port.to_string());
    };
    if !crate::artifacts::answers(port) {
        return note(app, running::not_answering(port));
    }
    crate::links::open(&format!("http://127.0.0.1:{port}"));
    note(app, running::opening(port));
}

/// s: stop it, no question; the row says `stopping…` until it ends.
fn stop(app: &mut App, p: &Proc) {
    if !p.running() {
        return note(app, running::already_ended.to_string());
    }
    let k = key(p);
    if let Some(sc) = app.running.as_mut() {
        sc.stopping.insert(k.clone());
    }
    app.sb.call("process/stop", json!({"agent": k.0, "id": k.1}), crate::sb::rpc::Then::Shown);
}

fn project(app: &App) -> String {
    bise_home::hub_id::project_of_id(&app.sb.project()).to_string()
}

// ---- drawing ----

/// The list's lines in `wd` columns (pure but for the clock: `now`).
pub(crate) fn list_lines(sc: &Screen, order: &[String], project: &str, wd: usize, now: u64) -> (Vec<Line<'static>>, Option<usize>) {
    let mut out = Vec::new();
    let mut sel_row = None;
    let Some(items) = sc.items.as_deref() else {
        return (out, None);
    };
    let gs = rows::groups(items, order, sc.filter, &sc.query, &sc.kept);
    if gs.is_empty() {
        let empty = match (sc.query.trim().is_empty(), sc.filter) {
            (false, _) => running::none_match,
            (true, Filter::Ended) => running::empty_ended,
            (true, Filter::Running) => running::empty,
        };
        out.push(Line::from(Span::styled(empty.to_string(), Style::default().fg(dim()))));
        return (out, None);
    }
    for g in &gs {
        out.push(rows::group_line(project, &g.agent));
        for p in &g.rows {
            let k = key(p);
            let selected = sc.sel.as_ref() == Some(&k);
            if selected {
                sel_row = Some(out.len());
            }
            out.push(rows::row(p, now, selected, sc.stopping.contains(&k), wd));
            if selected {
                for t in rows::tip(p) {
                    out.push(rows::tip_line(&t, wd));
                }
            }
        }
    }
    (out, sel_row)
}

/// The head line: `storefront · 3 running · 2 listening` and, at 150
/// columns, the keys on its right.
fn head_line(sc: &Screen, project: &str, wd: usize) -> Line<'static> {
    let wide = wd >= rows::WIDE_FROM;
    let items = sc.items.as_deref().unwrap_or(&[]);
    // before the hub's first answer: no count yet (never '0 running')
    let project_only = sc.items.is_none();
    // the keys on its right at 150 columns; at 80 the head has the row
    let keys_w = if wide { running::keys_head.width().max(running::keys_head_ended.width()) + 3 } else { 0 };
    let room = if wide { wd.saturating_sub(keys_w) } else { wd.saturating_sub(running::ended_today.width() + 3) };
    let left = if project_only { project.to_string() } else { rows::head(project, items, room) };
    let mut spans = vec![Span::styled(left.clone(), Style::default().fg(text()))];
    if sc.typing || !sc.query.is_empty() {
        spans.push(Span::styled(format!("   / {}", sc.query), Style::default().fg(text())));
        if sc.typing {
            spans.push(Span::styled("▏", Style::default().fg(dim())));
        }
    } else if wide {
        let keys = if sc.filter == Filter::Ended { running::keys_head_ended } else { running::keys_head };
        let gap = wd.saturating_sub(left.width() + keys.width()).max(3);
        spans.push(Span::raw(" ".repeat(gap)));
        spans.push(Span::styled(keys.to_string(), Style::default().fg(dim())));
    } else if sc.filter == Filter::Ended {
        spans.push(Span::styled(format!(" · {}", running::ended_today), Style::default().fg(dim())));
    }
    Line::from(spans)
}

pub(crate) fn draw(app: &mut App, frame: &mut Frame) {
    if app.running.is_none() {
        return;
    }
    let full = frame.area();
    crate::pointer::region(full, crate::pointer::Shape::Default);
    frame.render_widget(Clear, full);
    if full.width < 30 || full.height < 10 {
        return;
    }
    // narrow, the frame names the project's folder only (designer m_38541)
    let area = crate::artifacts_screen::draw_frame_at(app, frame, full, running::heading, full.width < rows::WIDE_FROM as u16);
    let project = project(app);
    let now = crate::when::now_ms();
    if app.running.as_ref().is_some_and(|s| s.out.is_some()) {
        return draw_out(app, frame, area, &project, now);
    }
    let order = order(app);
    let Some(sc) = app.running.as_mut() else { return };
    if sc.note.as_ref().is_some_and(|(_, t)| t.elapsed() > NOTE_FOR) {
        sc.note = None;
    }
    let wd = area.width as usize;
    let (body, sel_row) = list_lines(sc, &order, &project, wd, now);
    // the head, a blank row, the list, a blank row, the note or the keys
    let h = (area.height as usize).saturating_sub(4);
    if let Some(r) = sel_row {
        if r < sc.top {
            sc.top = r.saturating_sub(1);
        } else if r + 2 > sc.top + h {
            sc.top = (r + 2).saturating_sub(h);
        }
    }
    sc.top = sc.top.min(body.len().saturating_sub(h));
    let mut lines = vec![head_line(sc, &project, wd), Line::raw("")];
    let shown = body.len().min(sc.top + h) - sc.top.min(body.len());
    lines.extend(body.into_iter().skip(sc.top).take(h));
    lines.extend(std::iter::repeat_n(Line::raw(""), h - shown + 1));
    lines.push(match &sc.note {
        Some((n, _)) => Line::from(Span::styled(n.clone(), Style::default().fg(text()))),
        None => rows::keys_line(wd >= rows::WIDE_FROM),
    });
    frame.render_widget(Paragraph::new(lines), area);
    crate::textlayer::text(area);
}

/// The output's lines: its head, a rule, the window, the keys.
pub(crate) fn out_lines(o: &Out, p: Option<&Proc>, project: &str, stopping: bool, wd: usize, h: usize, now: u64) -> Vec<Line<'static>> {
    let mut lines = Vec::new();
    let (cmd, rest) = p.map(|p| rows::out_head(p, project, now, stopping, wd)).unwrap_or_else(|| (o.key.1.clone(), String::new()));
    lines.push(Line::from(vec![
        Span::styled(cmd, Style::default().fg(text()).add_modifier(Modifier::BOLD)),
        Span::styled(format!("  {rest}"), Style::default().fg(dim())),
    ]));
    lines.push(Line::from(Span::styled("─".repeat(wd), Style::default().fg(faint()))));
    let room = h.saturating_sub(3);
    let all = o.text.all();
    if p.is_some_and(|p| p.out == OutKind::None) || (o.got && all.is_empty() && p.is_some_and(|p| !p.running())) {
        lines.push(Line::from(Span::styled(running::no_output.to_string(), Style::default().fg(dim()))));
    } else {
        let top = o.view.top(all.len(), room);
        let hits = out::hits(&all, &o.find);
        for (i, l) in all.iter().enumerate().skip(top).take(room) {
            let st = match (o.hit == Some(i), hits.contains(&i)) {
                (true, _) => Style::default().fg(text()).add_modifier(Modifier::REVERSED),
                (false, true) => Style::default().fg(text()).add_modifier(Modifier::UNDERLINED),
                _ => Style::default().fg(text()),
            };
            lines.push(Line::from(Span::styled(rows::clip(l, wd), st)));
        }
    }
    while lines.len() < h.saturating_sub(1) {
        lines.push(Line::raw(""));
    }
    lines.push(if o.finding || !o.find.is_empty() {
        let cursor = if o.finding { "▏" } else { "" };
        Line::from(Span::styled(format!("/ {}{cursor}", o.find), Style::default().fg(text())))
    } else {
        Line::from(Span::styled(running::keys_output.to_string(), Style::default().fg(dim())))
    });
    lines
}

fn draw_out(app: &mut App, frame: &mut Frame, area: Rect, project: &str, now: u64) {
    let items = app.running.as_ref().and_then(|s| s.items.clone()).unwrap_or_default();
    let Some(sc) = app.running.as_mut() else { return };
    let Some(o) = sc.out.as_mut() else { return };
    let p = items.iter().find(|p| key(p) == o.key);
    let stopping = sc.stopping.contains(&o.key);
    o.rows = (area.height as usize).saturating_sub(3);
    let lines = out_lines(o, p, project, stopping, area.width as usize, area.height as usize, now);
    frame.render_widget(Paragraph::new(lines), area);
    crate::textlayer::text(area);
}

// ---- keys ----

pub(crate) fn on_key(app: &mut App, k: &KeyEvent) -> bool {
    let Some(sc) = app.running.as_ref() else { return false };
    if k.kind != KeyEventKind::Press {
        return true;
    }
    let ctrl = k.modifiers.contains(KeyModifiers::CONTROL);
    if ctrl && matches!(k.code, KeyCode::Char('c') | KeyCode::Char('g')) {
        close(app);
        return true;
    }
    if sc.out.is_some() {
        out_key(app, k);
        return true;
    }
    if sc.typing {
        let Some(sc) = app.running.as_mut() else { return true };
        match k.code {
            KeyCode::Esc => {
                sc.typing = false;
                sc.query.clear();
            }
            KeyCode::Enter => sc.typing = false,
            KeyCode::Backspace => {
                sc.query.pop();
            }
            KeyCode::Char(c) => sc.query.push(c),
            _ => {}
        }
        reselect(app);
        return true;
    }
    match k.code {
        KeyCode::Esc | KeyCode::Char('q') => close(app),
        KeyCode::Up | KeyCode::Char('k') => step(app, -1),
        KeyCode::Down | KeyCode::Char('j') => step(app, 1),
        KeyCode::Tab => {
            if let Some(sc) = app.running.as_mut() {
                sc.filter = if sc.filter == Filter::Running { Filter::Ended } else { Filter::Running };
                // a new view: the ended ones the running view kept go
                sc.kept = sc.items.iter().flatten().filter(|p| p.running()).map(key).collect();
            }
            reselect(app);
        }
        KeyCode::Char('/') => {
            if let Some(sc) = app.running.as_mut() {
                sc.typing = true;
            }
        }
        KeyCode::Enter => {
            if let Some(p) = selected(app) {
                open_output(app, &p);
            }
        }
        KeyCode::Char('o') => {
            if let Some(p) = selected(app) {
                open_port(app, &p);
            }
        }
        KeyCode::Char('s') => {
            if let Some(p) = selected(app) {
                stop(app, &p);
            }
        }
        KeyCode::Char('a') => {
            if let Some(p) = selected(app) {
                close(app);
                crate::sb::focus(app, &p.agent);
            }
        }
        _ => {}
    }
    true
}

/// The selection back on a shown row after the filter or the search moved.
fn reselect(app: &mut App) {
    let rows: Vec<Key> = shown(app).iter().map(key).collect();
    if let Some(sc) = app.running.as_mut() {
        if sc.sel.as_ref().is_none_or(|s| !rows.contains(s)) {
            sc.sel = rows.first().cloned();
        }
        sc.top = 0;
    }
}

fn step(app: &mut App, d: isize) {
    let rows: Vec<Key> = shown(app).iter().map(key).collect();
    let Some(sc) = app.running.as_mut() else { return };
    if rows.is_empty() {
        return;
    }
    let at = sc.sel.as_ref().and_then(|s| rows.iter().position(|r| r == s)).unwrap_or(0);
    let to = (at as isize + d).clamp(0, rows.len() as isize - 1) as usize;
    sc.sel = Some(rows[to].clone());
}

fn out_key(app: &mut App, k: &KeyEvent) {
    let items = app.running.as_ref().and_then(|s| s.items.clone()).unwrap_or_default();
    let Some(sc) = app.running.as_mut() else { return };
    let Some(o) = sc.out.as_mut() else { return };
    let len = o.text.all().len();
    let h = o.rows.max(1);
    if o.finding {
        match k.code {
            KeyCode::Esc => {
                o.finding = false;
                o.find.clear();
                o.hit = None;
            }
            KeyCode::Enter => {
                o.finding = false;
                let lines = o.text.all();
                o.hit = out::next_hit(&out::hits(&lines, &o.find), None, false);
                if let Some(i) = o.hit {
                    o.view.show(i, len, h);
                }
            }
            KeyCode::Backspace => {
                o.find.pop();
            }
            KeyCode::Char(c) => o.find.push(c),
            _ => {}
        }
        return;
    }
    match k.code {
        KeyCode::Esc | KeyCode::Char('q') => {
            if let Some(o) = sc.out.take() {
                follow(app, &o.key, false);
            }
        }
        KeyCode::Up | KeyCode::Char('k') => o.view.scroll(-1, len, h),
        KeyCode::Down | KeyCode::Char('j') => o.view.scroll(1, len, h),
        KeyCode::PageUp => o.view.scroll(-(h as isize), len, h),
        KeyCode::PageDown | KeyCode::Char(' ') => o.view.scroll(h as isize, len, h),
        KeyCode::End | KeyCode::Char('G') => o.view = View::default(),
        KeyCode::Home | KeyCode::Char('g') => o.view.scroll(-(len as isize), len, h),
        KeyCode::Char('/') => {
            o.finding = true;
            o.find.clear();
        }
        KeyCode::Char('n') | KeyCode::Char('N') => {
            let lines = o.text.all();
            o.hit = out::next_hit(&out::hits(&lines, &o.find), o.hit, k.code == KeyCode::Char('N'));
            if let Some(i) = o.hit {
                o.view.show(i, len, h);
            }
        }
        KeyCode::Char('o') | KeyCode::Char('s') => {
            let key = o.key.clone();
            if let Some(p) = items.into_iter().find(|p| self::key(p) == key) {
                if k.code == KeyCode::Char('o') {
                    open_port(app, &p);
                } else {
                    stop(app, &p);
                }
            }
        }
        _ => {}
    }
}

#[cfg(test)]
#[path = "running_screen_tests.rs"]
mod tests;
