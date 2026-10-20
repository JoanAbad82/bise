//! `/log`: the raw session of the agent in view, read
//! from its session log (`~/.bise/sessions/<id>/`, rust/session), in a
//! full screen. Two views: the full history (every entry in order, the
//! turns and the compactions as rules) and what the model got for one
//! request (the system prompt, the tools and the context the log held
//! right before it, compaction applied). Read-only: the log is read
//! once at open (`r` reads it again); every text is redacted.
//!
//! Keys: ↑↓ (j/k) move between entries, space or ⏎ opens one, ctrl+o
//! opens them all, / searches (n/N), f filters roles and tools, tab
//! switches views, [ ] change the request, g/G top/bottom, esc closes.
//!
//! Here: the state ([`View`]) and how it loads and moves; the keys in
//! `keys.rs`, the words, rows and the frame in `rows.rs`.
//!
//! Shipped to everyone ([`SHIPPED`]; false would bring back the dev
//! build or `BISE_DEV=1` only). Later: an "export for a bug report" action (the
//! redacted entries to a file) fits here; not built yet.

// the rows: bise_session's builder, the hub's typed `log` read uses it too
use bise_session::history as model;
mod keys;
mod rows;
#[cfg(test)]
mod tests;
pub(crate) use keys::{mouse, on_key};
pub(crate) use rows::*;

use crate::{theme, App};
use bise_session::reader::Log;
use bise_session::Redactor;
use crossterm::event::{KeyCode, KeyEvent, KeyEventKind, KeyModifiers};
use model::{Body, Item, Request, Role};
use ratatui::layout::Rect;
use ratatui::style::{Modifier, Style};
use ratatui::text::{Line, Span};
use ratatui::widgets::{Clear, Paragraph};
use ratatui::Frame;
use std::collections::{HashMap, HashSet};
use std::path::{Path, PathBuf};
use std::sync::OnceLock;
use unicode_width::UnicodeWidthStr;

/// `/log` for everyone (false: the dev build or `BISE_DEV=1` only).
pub(crate) const SHIPPED: bool = true;

/// The hub's state folder (`~/.bise/hubs/<hub>`): the TUI's socket's
/// folder, set once at connect.
static HUB_DIR: OnceLock<PathBuf> = OnceLock::new();

pub(crate) fn set_hub_dir(socket: &Path) {
    if let Some(d) = socket.parent() {
        let _ = HUB_DIR.set(d.to_path_buf());
    }
}

/// Whether `/log` is offered: shipped, the dev build (the hub runs in
/// bise's source tree), or `BISE_DEV=1`.
pub(crate) fn enabled(app: &App) -> bool {
    SHIPPED || crate::sb::release::dev(app) || std::env::var("BISE_DEV").is_ok_and(|v| !v.is_empty() && v != "0")
}

/// The `/log` command, for the popup and `/help` when enabled: the
/// catalog's (bise_proto::commands::LOG, the window's too).
pub(crate) const COMMAND: crate::commands::Cmd = bise_proto::commands::LOG;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub(crate) enum Mode {
    History,
    Model,
}

/// The `/` field: what is typed, and whether it still takes keys.
#[derive(Clone, Debug, Default)]
pub(crate) struct Search {
    pub(crate) text: String,
    pub(crate) typing: bool,
}

/// The filter picker: its rows (role keys, then `tool:<name>`) and the
/// cursor.
#[derive(Clone, Debug, Default)]
pub(crate) struct Picker {
    pub(crate) rows: Vec<String>,
    pub(crate) sel: usize,
}

/// The screen while open.
pub(crate) struct View {
    pub(crate) agent: String,
    log: Log,
    blobs: PathBuf,
    redact: Redactor,
    pub(crate) mode: Mode,
    history: Vec<Item>,
    requests: Vec<Request>,
    /// the request of the model view (an index of `requests`)
    pub(crate) req: usize,
    model: Vec<Item>,
    /// the entries whose fold differs from the default, per view
    flipped: [HashSet<usize>; 2],
    /// ctrl+o: everything open
    all_open: bool,
    /// the shown entries (indexes of the view's items) and the cursor
    /// among them
    vis: Vec<usize>,
    pub(crate) sel: usize,
    /// the first row on screen: (index in `vis`, row in that entry)
    top: (usize, usize),
    /// the filtered-out keys (a role key, or `tool:<name>`)
    pub(crate) off: HashSet<String>,
    pub(crate) picker: Option<Picker>,
    pub(crate) search: Option<Search>,
    /// the shown entries that match the search (indexes in `vis`)
    hits: Vec<usize>,
    /// the rows of each entry, by (view, item, width, open)
    cache: HashMap<(u8, usize), (usize, bool, Vec<Line<'static>>)>,
    /// rows shown by the last frame (paging)
    page: usize,
    /// a word under the top bar (the log could not be read, ...)
    pub(crate) note: String,
    /// the width of the last frame (the default folds depend on it)
    width: usize,
    /// the request bodies logged by `BISE_DEBUG_REQUESTS` (ms, file)
    dumps: Vec<(u64, PathBuf)>,
    /// the model view's request has its exact body (its first entry)
    exact: bool,
    /// where the cursor was when `/` opened (esc in the field goes back)
    origin: (usize, (usize, usize)),
    /// `n` or `N` went round the end: "back to the first" (until a key)
    wrapped: &'static str,
}

/// The session folder of `agent` in this hub: `agents/<agent>/session`
/// holds its id.
fn session_dir(agent: &str) -> Result<PathBuf, String> {
    let hub = HUB_DIR.get().ok_or("no hub folder known")?;
    let idf = hub.join("agents").join(agent).join("session");
    let id = std::fs::read_to_string(&idf).map_err(|_| format!("{agent} has no session log yet ({})", idf.display()))?;
    let id = id.trim();
    if id.is_empty() {
        return Err(format!("{agent} has no session log yet"));
    }
    Ok(bise_home::Home::from_env().sessions_dir().join(id))
}

/// `/log [N]` on the agent in view: the screen, or why not.
pub(crate) fn open(app: &mut App, typed: &str) -> Result<(), String> {
    let agent = app.sb.focus.clone();
    let dir = session_dir(&agent)?;
    let req: Option<u64> = typed.split_whitespace().nth(1).and_then(|w| w.trim_start_matches('#').parse().ok());
    let mut v = View::load(agent, &dir)?;
    if let Some(n) = req {
        // requests count from 1 in the log (a REPL restart starts its own
        // numbers again: the position, never the REPL's number)
        match (n as usize).checked_sub(1).filter(|&i| i < v.requests.len()) {
            Some(i) => {
                v.req = i;
                v.set_mode(Mode::Model);
            }
            None => v.note = format!("no request {n} in this log: the last one is {}", v.requests.len()),
        }
    }
    app.logview = Some(v);
    Ok(())
}

impl View {
    pub(crate) fn load(agent: String, dir: &Path) -> Result<View, String> {
        let log = bise_session::read_dir(dir).map_err(|e| format!("cannot read {}: {e}", dir.display()))?;
        let home = bise_home::Home::from_env();
        let redact = Redactor::from_home(&home.auth_file(), &home.env_files());
        let dumps = HUB_DIR.get().map(|h| model::request_files(&h.join("agents").join(&agent).join("requests"))).unwrap_or_default();
        let mut v = View::of(agent, log, home.blobs_dir(), redact);
        v.dumps = dumps;
        Ok(v)
    }

    pub(crate) fn of(agent: String, log: Log, blobs: PathBuf, redact: Redactor) -> View {
        let src = model::Source { log: &log, blobs: &blobs, redact: &redact };
        let history = model::history(&src);
        let requests = model::requests(&log);
        let mut v = View {
            agent,
            log,
            blobs,
            redact,
            mode: Mode::History,
            history,
            req: requests.len().saturating_sub(1),
            requests,
            model: Vec::new(),
            flipped: [HashSet::new(), HashSet::new()],
            all_open: false,
            vis: Vec::new(),
            sel: 0,
            top: (0, 0),
            off: HashSet::new(),
            picker: None,
            search: None,
            hits: Vec::new(),
            cache: HashMap::new(),
            page: 20,
            note: String::new(),
            width: 100,
            dumps: Vec::new(),
            exact: false,
            origin: (0, (0, 0)),
            wrapped: "",
        };
        v.refilter();
        v.bottom();
        v
    }

    fn mi(&self) -> usize {
        (self.mode == Mode::Model) as usize
    }

    pub(crate) fn items(&self) -> &[Item] {
        match self.mode {
            Mode::History => &self.history,
            Mode::Model => &self.model,
        }
    }

    pub(crate) fn set_mode(&mut self, m: Mode) {
        self.mode = m;
        if m == Mode::Model {
            self.build_model();
        }
        self.refilter();
        if m == Mode::Model {
            self.sel = 0;
            self.top = (0, 0);
        } else {
            self.bottom();
        }
    }

    fn build_model(&mut self) {
        self.cache.retain(|k, _| k.0 == 0);
        self.flipped[1].clear();
        self.model = match self.requests.get(self.req) {
            Some(r) => {
                let src = model::Source { log: &self.log, blobs: &self.blobs, redact: &self.redact };
                model::model_view(&src, r)
            }
            None => Vec::new(),
        };
        self.exact = false;
        // the exact body, when the REPL logged it (BISE_DEBUG_REQUESTS)
        let at = |i: usize| self.requests.get(i).and_then(|r| model::iso_ms(&self.log.events[r.idx].at));
        if let (Some(reply), false) = (at(self.req), self.model.is_empty()) {
            let since = self.req.checked_sub(1).and_then(at).unwrap_or(0);
            if let Some(p) = model::dump_for(&self.dumps, since, reply) {
                let it = model::exact_item(p, &self.redact, &self.model[0]);
                self.model.insert(0, it);
                self.exact = true;
            }
        }
    }

    /// The request of the model view moves by `d` (clamped).
    pub(crate) fn step_request(&mut self, d: isize) {
        if self.requests.is_empty() {
            return;
        }
        let n = self.requests.len() as isize;
        let r = (self.req as isize + d).clamp(0, n - 1) as usize;
        if r != self.req || self.mode != Mode::Model {
            self.req = r;
            self.set_mode(Mode::Model);
        }
    }

    /// The tools of the view's calls and results, sorted.
    fn tools(&self) -> Vec<String> {
        let mut t: Vec<String> = self.items().iter().filter(|i| !i.tool.is_empty()).map(|i| i.tool.clone()).collect();
        t.sort();
        t.dedup();
        t
    }

    fn shown(&self, it: &Item) -> bool {
        if it.rule.is_some() {
            return self.off.is_empty();
        }
        if self.off.contains(it.role.key()) {
            return false;
        }
        it.tool.is_empty() || !self.off.contains(&format!("tool:{}", it.tool))
    }

    /// The shown entries again (a filter or a view changed); the cursor
    /// stays on its entry when it is still shown.
    pub(crate) fn refilter(&mut self) {
        let cur = self.vis.get(self.sel).copied();
        self.vis = (0..self.items().len()).filter(|&i| self.shown(&self.items()[i])).collect();
        self.sel = cur.and_then(|c| self.vis.iter().position(|&i| i >= c)).unwrap_or(0).min(self.vis.len().saturating_sub(1));
        self.top = (self.sel, 0);
        self.rehit();
    }

    fn rehit(&mut self) {
        self.hits.clear();
        let Some(s) = &self.search else { return };
        let needle = s.text.to_ascii_lowercase();
        if needle.is_empty() {
            return;
        }
        let items = self.items();
        self.hits = (0..self.vis.len()).filter(|&k| items[self.vis[k]].hay().contains(&needle)).collect();
    }

    fn bottom(&mut self) {
        self.sel = self.vis.len().saturating_sub(1);
        self.top = (self.sel, 0);
    }

    /// The fold of item `i` by default: open when its body is short.
    /// The fold of an entry by default: open when its body takes at
    /// most 6 rows at `width` (wrapped), never the system prompt or tools.
    fn default_open(it: &Item, width: usize) -> bool {
        let t = it.body.text();
        if matches!(it.role, Role::System | Role::Tools) || t.len() > 1200 || t.trim_end().lines().count() > 6 {
            return false;
        }
        body_rows(&it.body, body_width(width), it.role == Role::Thinking).len() <= 6
    }

    pub(crate) fn is_open(&self, i: usize) -> bool {
        let it = &self.items()[i];
        if matches!(it.body, Body::None) {
            return false;
        }
        let flipped = self.flipped[self.mi()].contains(&i);
        if self.all_open {
            // ctrl+o: all open but the ones closed since
            !flipped
        } else {
            Self::default_open(it, self.width) != flipped
        }
    }

    pub(crate) fn toggle(&mut self, i: usize) {
        let mi = self.mi();
        if !self.flipped[mi].remove(&i) {
            self.flipped[mi].insert(i);
        }
    }

    pub(crate) fn toggle_all(&mut self) {
        self.all_open = !self.all_open;
        let mi = self.mi();
        self.flipped[mi].clear();
    }

    /// Rows of the shown entry `k` at `width` (cached).
    fn rows(&mut self, k: usize, width: usize) -> &[Line<'static>] {
        let i = self.vis[k];
        let open = self.is_open(i);
        let key = (self.mi() as u8, i);
        let fresh = matches!(self.cache.get(&key), Some((w, o, _)) if *w == width && *o == open);
        if !fresh {
            let mut rows = entry_rows(&self.items()[i], width, open, self.mode, &agent_word(&self.agent));
            // a blank row after each entry: they read apart
            rows.push(Line::from(""));
            self.cache.insert(key, (width, open, rows));
        }
        &self.cache[&key].2
    }

    /// Move the first row so the cursor's header shows.
    fn reveal(&mut self, width: usize, height: usize) {
        if self.vis.is_empty() {
            return;
        }
        if self.sel < self.top.0 || (self.sel == self.top.0 && self.top.1 > 0) {
            self.top = (self.sel, 0);
            return;
        }
        // rows from the top to the cursor's header
        let mut used = self.rows(self.top.0, width).len().saturating_sub(self.top.1);
        for k in self.top.0 + 1..=self.sel {
            if k == self.sel {
                break;
            }
            used += self.rows(k, width).len();
        }
        // the cursor's header and up to 3 rows of its body
        let want = used + self.rows(self.sel, width).len().min(4);
        let mut over = want.saturating_sub(height);
        while over > 0 && self.top.0 < self.sel {
            let left = self.rows(self.top.0, width).len() - self.top.1;
            if left <= over {
                over -= left;
                self.top = (self.top.0 + 1, 0);
            } else {
                self.top.1 += over;
                over = 0;
            }
        }
        self.fill(width, height);
    }

    /// No blank rows under the last entry while there are rows above
    /// the first one shown: the end sits on the bottom row.
    fn fill(&mut self, width: usize, height: usize) {
        let mut below = self.rows(self.top.0, width).len().saturating_sub(self.top.1);
        let mut k = self.top.0 + 1;
        while below < height && k < self.vis.len() {
            below += self.rows(k, width).len();
            k += 1;
        }
        while below < height {
            if self.top.1 > 0 {
                self.top.1 -= 1;
            } else if self.top.0 > 0 {
                let n = self.rows(self.top.0 - 1, width).len();
                self.top = (self.top.0 - 1, n.saturating_sub(1));
            } else {
                break;
            }
            below += 1;
        }
    }

    /// Scroll by `d` rows (the cursor follows to the top entry shown).
    fn scroll(&mut self, d: isize, width: usize) {
        if self.vis.is_empty() {
            return;
        }
        if d > 0 {
            let mut d = d as usize;
            while d > 0 {
                let n = self.rows(self.top.0, width).len();
                if self.top.1 + 1 < n {
                    self.top.1 += 1;
                } else if self.top.0 + 1 < self.vis.len() {
                    self.top = (self.top.0 + 1, 0);
                } else {
                    break;
                }
                d -= 1;
            }
        } else {
            let mut d = (-d) as usize;
            while d > 0 {
                if self.top.1 > 0 {
                    self.top.1 -= 1;
                } else if self.top.0 > 0 {
                    let n = self.rows(self.top.0 - 1, width).len();
                    self.top = (self.top.0 - 1, n.saturating_sub(1));
                } else {
                    break;
                }
                d -= 1;
            }
        }
        self.sel = if self.top.1 == 0 { self.top.0 } else { (self.top.0 + 1).min(self.vis.len() - 1) };
    }

    /// The next (or previous) search hit from the cursor: the cursor
    /// goes there and its entry opens.
    pub(crate) fn jump(&mut self, forward: bool) {
        if self.hits.is_empty() {
            return;
        }
        let next = if forward {
            self.hits.iter().copied().find(|&k| k > self.sel).unwrap_or_else(|| {
                self.wrapped = "back to the first";
                self.hits[0]
            })
        } else {
            self.hits.iter().rev().copied().find(|&k| k < self.sel).unwrap_or_else(|| {
                self.wrapped = "back to the last";
                *self.hits.last().unwrap()
            })
        };
        self.show_hit(next);
    }

    /// The cursor on the shown entry `next`, opened, at the top.
    fn show_hit(&mut self, next: usize) {
        self.sel = next;
        let i = self.vis[next];
        if !self.is_open(i) && !matches!(self.items()[i].body, Body::None) {
            self.toggle(i);
        }
        self.top = (next, 0);
    }

    /// `/` opens the field; the cursor's place is kept for esc.
    pub(crate) fn start_search(&mut self) {
        self.origin = (self.sel, self.top);
        self.search = Some(Search { text: String::new(), typing: true });
        self.hits.clear();
    }

    /// The field changed: the cursor goes to the first match from where
    /// `/` opened (round the end if none after), or back there.
    pub(crate) fn incsearch(&mut self) {
        self.rehit();
        let (o, top) = self.origin;
        match self.hits.iter().copied().find(|&k| k >= o).or(self.hits.first().copied()) {
            Some(k) => (self.sel, self.top) = (k, (k, 0)),
            None => (self.sel, self.top) = (o.min(self.vis.len().saturating_sub(1)), top),
        }
    }

    /// ⏎ in the field: the cursor's match opens (the next one when the
    /// cursor is on none).
    pub(crate) fn search_done(&mut self) {
        if let Some(s) = self.search.as_mut() {
            s.typing = false;
        }
        if self.hits.contains(&self.sel) {
            self.show_hit(self.sel);
        } else {
            self.jump(true);
        }
    }

    /// esc in the field: no search, the cursor back where it was.
    pub(crate) fn search_cancel(&mut self) {
        self.search = None;
        self.hits.clear();
        let (o, top) = self.origin;
        (self.sel, self.top) = (o.min(self.vis.len().saturating_sub(1)), top);
    }

    /// A search is set (typed and ⏎): `n`/`N` go through it.
    fn searching(&self) -> bool {
        self.search.as_ref().is_some_and(|s| !s.typing && !s.text.is_empty())
    }

    /// `3 of 12` for the key bar, after the wrap note.
    fn hit_label(&self) -> String {
        if self.search.as_ref().is_none_or(|s| s.text.is_empty()) {
            return String::new();
        }
        if self.hits.is_empty() {
            return "no match".into();
        }
        let n = match self.hits.iter().position(|&k| k == self.sel) {
            Some(p) => format!("{} of {}", p + 1, self.hits.len()),
            None => format!("{} matches", self.hits.len()),
        };
        if self.wrapped.is_empty() {
            n
        } else {
            format!("{} {} {n}", self.wrapped, dot())
        }
    }
}
