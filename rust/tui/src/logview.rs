//! `/debug`: the agent in view, in a full screen, two tabs.
//! `/debug history`: its raw session (`~/.bise/sessions/<id>/`), every
//! entry in order, the turns and compactions as rules, the end first
//! (bise_session::history_cache: older events built as you go up, the
//! whole log for a search). `/debug completion [provider]`: a request
//! of its ring (bise_session::reqlog) exactly as the provider got it, cut
//! into rows by bise_session::completion; with a provider, the body
//! that provider's family would get, made by the runtime through the hub
//! (`log/completion`). Read-only; every text is redacted.
//!
//! Keys: ↑↓ (j/k) move between entries, space or ⏎ opens one, ctrl+o
//! opens them all, / searches (n/N), f filters roles and tools, tab
//! switches tabs, [ ] change the request, r the raw JSON, g/G
//! top/bottom, esc closes.
//!
//! Here: the state ([`View`]) and how it loads and moves; the keys in
//! `keys.rs`, the words, rows and the frame in `rows.rs`.
//!
//! Shipped to everyone ([`SHIPPED`]; false would bring back the dev
//! build or `BISE_DEV=1` only). Later: an "export for a bug report" action (the
//! redacted entries to a file) fits here; not built yet.

// the rows: bise_session's builder, the hub's typed `log` read uses it too
use bise_session::history as model;
mod comp;
mod keys;
mod rows;
#[cfg(test)]
mod tests;
pub(crate) use keys::{mouse, on_key};
pub(crate) use rows::*;

use crate::{theme, App};
use bise_session::history_cache::HistoryCache;
use bise_session::{reqlog, Redactor};
use crossterm::event::{KeyCode, KeyEvent, KeyEventKind, KeyModifiers};
use model::{Body, Item, Role};
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

/// The `/debug` command, for the popup and `/help`: the catalog's
/// (bise_proto::commands::DEBUG, the window's too).
pub(crate) const COMMAND: crate::commands::Cmd = bise_proto::commands::DEBUG;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub(crate) enum Mode {
    History,
    Completion,
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
    redact: Redactor,
    pub(crate) mode: Mode,
    /// the history, its end built first
    hc: HistoryCache,
    /// the completion tab's rows (comp.rs) and what they are
    comp: Vec<Item>,
    pub(crate) comp_of: comp::Shown,
    /// the agent's request ring, oldest first, and the one shown
    slots: Vec<reqlog::Slot>,
    pub(crate) slot: Option<usize>,
    req_dir: PathBuf,
    /// `r`: each row its slice of the body as sent
    pub(crate) raw: bool,
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

/// What `/debug` asks: the tab, and for completion the provider.
#[derive(Clone, Debug, PartialEq, Eq)]
pub(crate) enum Ask {
    History,
    Completion(Option<String>),
}

/// `/debug [history | completion [provider]]`: the ask, or the usage.
pub(crate) fn parse(typed: &str) -> Result<Ask, String> {
    let mut w = typed.split_whitespace().skip(1);
    match (w.next(), w.next(), w.next()) {
        (None, ..) | (Some("history"), None, _) => Ok(Ask::History),
        (Some("completion"), p, None) => Ok(Ask::Completion(p.map(str::to_string))),
        _ => Err("usage: /debug [history | completion [provider]]".into()),
    }
}

/// `/debug ...` on the agent in view: the screen, or why not. A
/// completion for another provider asks the hub (its runtime renders
/// it): the tab opens and its rows come with the answer.
pub(crate) fn open(app: &mut App, typed: &str) -> Result<(), String> {
    let ask = parse(typed)?;
    let agent = app.sb.focus.clone();
    let dir = session_dir(&agent)?;
    let mut v = View::load(agent.clone(), &dir)?;
    if let Ask::Completion(p) = &ask {
        v.set_mode(Mode::Completion);
        if let Some(p) = p {
            v.ask_hub(app, p.clone());
        }
    }
    app.logview = Some(v);
    Ok(())
}

impl View {
    pub(crate) fn load(agent: String, dir: &Path) -> Result<View, String> {
        let home = bise_home::Home::from_env();
        let redact = Redactor::from_home(&home.auth_file(), &home.env_files());
        let req_dir = HUB_DIR.get().map(|h| h.join("agents").join(&agent).join("requests")).unwrap_or_default();
        View::of(agent, dir, &home.blobs_dir(), req_dir, redact)
    }

    pub(crate) fn of(agent: String, dir: &Path, blobs: &Path, req_dir: PathBuf, redact: Redactor) -> Result<View, String> {
        let hc = HistoryCache::open(dir, blobs, &redact).map_err(|e| format!("cannot read {}: {e}", dir.display()))?;
        let mut v = View {
            agent,
            redact,
            mode: Mode::History,
            hc,
            comp: Vec::new(),
            comp_of: comp::Shown::default(),
            slots: Vec::new(),
            slot: None,
            req_dir,
            raw: false,
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
            origin: (0, (0, 0)),
            wrapped: "",
        };
        v.refilter();
        v.bottom();
        Ok(v)
    }

    fn mi(&self) -> usize {
        (self.mode == Mode::Completion) as usize
    }

    pub(crate) fn items(&self) -> &[Item] {
        match self.mode {
            Mode::History => self.hc.rows(),
            Mode::Completion => &self.comp,
        }
    }

    /// The events of the log, and how many are not built yet (above).
    pub(crate) fn events(&self) -> (usize, usize) {
        (self.hc.log().events.len(), self.hc.from())
    }

    pub(crate) fn set_mode(&mut self, m: Mode) {
        self.mode = m;
        if m == Mode::Completion && self.comp.is_empty() {
            self.read_ring(None);
        }
        self.refilter();
        if m == Mode::Completion {
            self.sel = 0;
            self.top = (0, 0);
        } else {
            self.bottom();
        }
    }

    /// The history built up to `to` more events above (all: None), the
    /// cursor, folds and search kept on their entries.
    pub(crate) fn grow(&mut self, all: bool) {
        if self.hc.from() == 0 {
            return;
        }
        let before = self.hc.rows().len();
        if all {
            self.hc.all(&self.redact);
        } else {
            let first = self.hc.rows().first().map(|r| r.pos);
            self.hc.page(&self.redact, first, 1, usize::MAX);
        }
        let added = self.hc.rows().len() - before;
        if self.mode != Mode::History || added == 0 {
            return;
        }
        self.flipped[0] = self.flipped[0].iter().map(|i| i + added).collect();
        self.cache.retain(|k, _| k.0 != 0);
        let cur = self.vis.get(self.sel).map(|i| i + added);
        let top = (self.vis.get(self.top.0).map(|i| i + added), self.top.1);
        self.vis = (0..self.items().len()).filter(|&i| self.shown(&self.items()[i])).collect();
        self.sel = cur.and_then(|c| self.vis.iter().position(|&i| i == c)).unwrap_or(0);
        self.top = (top.0.and_then(|t| self.vis.iter().position(|&i| i == t)).unwrap_or(self.sel), top.1);
        self.rehit();
    }

    /// The ring read again and request `slot` (an index of the ring;
    /// none: the newest) shown as sent, in rows.
    pub(crate) fn read_ring(&mut self, slot: Option<usize>) {
        self.slots = reqlog::slots(&self.req_dir);
        let ready: Vec<usize> = (0..self.slots.len()).filter(|&i| self.slots[i].meta().is_some()).collect();
        self.slot = slot.filter(|i| ready.contains(i)).or(ready.last().copied());
        let got = match self.slot {
            None => Err("no request kept yet: the agent has not called its model since its start".to_string()),
            Some(i) => reqlog::body(&self.slots[i], &bise_home::Home::from_env().images_dir()).and_then(|b| comp::of_body(&b, self.raw, &self.redact)),
        };
        match got {
            Ok((items, shown)) => {
                self.comp = items;
                self.comp_of = shown;
                self.note.clear();
            }
            Err(e) => {
                self.comp.clear();
                self.comp_of = comp::Shown::default();
                self.note = e;
            }
        }
        self.after_comp();
    }

    /// The hub's answer for a provider (`log/completion`, sb/rpc.rs):
    /// its rows replace the tab's.
    pub(crate) fn hub_rows(&mut self, c: &bise_proto::log::Completion) {
        let (items, shown) = comp::of_rows(&c.rows, &c.family, c.bytes, c.shown_as.clone());
        self.comp = items;
        self.comp_of = shown;
        self.slots = reqlog::slots(&self.req_dir);
        self.slot = self.slots.iter().position(|s| s.n as u64 == c.slot.slot);
        self.note.clear();
        self.after_comp();
    }

    fn after_comp(&mut self) {
        self.cache.retain(|k, _| k.0 == 0);
        self.flipped[1].clear();
        if self.mode == Mode::Completion {
            self.refilter();
            self.sel = 0;
            self.top = (0, 0);
        }
    }

    /// `/debug completion <provider>`: the hub renders the shown request
    /// for that provider (the agent's runtime; none here).
    fn ask_hub(&mut self, app: &mut App, provider: String) {
        let slot = self.slot.map(|i| self.slots[i].n as u64);
        let params = serde_json::json!({"agent": self.agent, "slot": slot, "provider": provider, "raw": self.raw});
        app.sb.call("log/completion", params, crate::sb::rpc::Then::Completion);
        self.note = format!("asking the hub for {provider}'s body…");
    }

    /// `[` `]`: the request before or after in the ring (as sent).
    pub(crate) fn step_request(&mut self, d: isize) {
        let ready: Vec<usize> = (0..self.slots.len()).filter(|&i| self.slots[i].meta().is_some()).collect();
        if self.mode != Mode::Completion {
            self.set_mode(Mode::Completion);
            return;
        }
        let at = self.slot.and_then(|s| ready.iter().position(|&i| i == s)).unwrap_or(ready.len().saturating_sub(1)) as isize;
        let to = (at + d).clamp(0, ready.len() as isize - 1);
        if let Some(&i) = ready.get(to as usize) {
            self.read_ring(Some(i));
        }
    }

    /// `r`: the rows as the body's raw slices, or drawn.
    pub(crate) fn toggle_raw(&mut self) {
        self.raw = !self.raw;
        self.read_ring(self.slot);
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
        // the whole history: a search finds what was never scrolled to
        self.grow(true);
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
