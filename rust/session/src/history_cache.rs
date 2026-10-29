//! `/debug history` on a long session: the rows of the end first, older
//! ones as pages go up, and the whole history only when a search needs
//! it. One per session folder, kept by its reader (the hub for the
//! window's reads, the TUI in-process for its own screen; architect
//! m_34601): the same rows as [`history`], built by [`history_range`] a
//! window at a time.
//!
//! The log is read again only when its segments changed (another file,
//! or one that grew or shrank): then the rows from the last turn's start
//! on are built again (a turn's rule carries usage that comes after it),
//! the older ones kept. A folder whose files shrank, or another folder,
//! is a new cache (the caller keys it by session folder).

use crate::history::{history_range, Item, Source};
use crate::reader::{read_dir, Log};
use crate::types::Payload;
use crate::Redactor;
use std::path::{Path, PathBuf};

/// The events built at open: the end of the log, enough for a page.
pub const TAIL_EVENTS: usize = 1500;
/// The events one more step up builds.
pub const STEP_EVENTS: usize = 4000;

pub struct HistoryCache {
    dir: PathBuf,
    blobs: PathBuf,
    sizes: Vec<(PathBuf, u64)>,
    log: Log,
    /// the rows of the events `from..`, in order
    rows: Vec<Item>,
    from: usize,
}

fn sizes(dir: &Path) -> Vec<(PathBuf, u64)> {
    let mut v: Vec<(PathBuf, u64)> = std::fs::read_dir(dir)
        .into_iter()
        .flatten()
        .flatten()
        .filter(|e| e.file_name().to_string_lossy().starts_with("events"))
        .filter_map(|e| Some((e.path(), e.metadata().ok()?.len())))
        .collect();
    v.sort();
    v
}

impl HistoryCache {
    /// The session in `dir`, its last [`TAIL_EVENTS`] events built.
    pub fn open(dir: &Path, blobs: &Path, red: &Redactor) -> std::io::Result<HistoryCache> {
        let sizes = sizes(dir);
        let log = read_dir(dir)?;
        let n = log.events.len();
        let mut c = HistoryCache { dir: dir.to_path_buf(), blobs: blobs.to_path_buf(), sizes, log, rows: Vec::new(), from: n };
        c.extend_to(n.saturating_sub(TAIL_EVENTS), red);
        Ok(c)
    }

    pub fn dir(&self) -> &Path {
        &self.dir
    }

    pub fn log(&self) -> &Log {
        &self.log
    }

    /// The events the rows cover start here (0: the whole history).
    pub fn from(&self) -> usize {
        self.from
    }

    /// The rows built so far (the events `from()..`), in order.
    pub fn rows(&self) -> &[Item] {
        &self.rows
    }

    /// Whether the folder's files are no longer the ones read: grown,
    /// shrunk, added or gone.
    pub fn stale(&self) -> bool {
        sizes(&self.dir) != self.sizes
    }

    /// Whether a file shrank or went: the log was rewritten, the cache
    /// cannot be extended (the caller opens it again).
    pub fn rewritten(&self) -> bool {
        let now = sizes(&self.dir);
        self.sizes.iter().any(|(p, n)| now.iter().find(|(q, _)| q == p).is_none_or(|(_, m)| m < n))
    }

    /// Read the log again if it changed, and build again the rows from
    /// its last turn's start (or last compaction) on. True: it changed.
    pub fn refresh(&mut self, red: &Redactor) -> std::io::Result<bool> {
        if !self.stale() {
            return Ok(false);
        }
        let sizes = sizes(&self.dir);
        let log = read_dir(&self.dir)?;
        let old = self.log.events.len().min(log.events.len());
        let redo = self.log.events[..old]
            .iter()
            .rposition(|e| matches!(e.payload, Some(Payload::TurnStarted { .. }) | Some(Payload::CompactionDone(_))))
            .unwrap_or(0)
            .max(self.from);
        self.rows.retain(|r| r.idx < redo);
        self.log = log;
        self.sizes = sizes;
        let src = Source { log: &self.log, blobs: &self.blobs, redact: red };
        let tail = history_range(&src, redo, self.log.events.len());
        self.rows.extend(tail);
        Ok(true)
    }

    /// Build the rows down to event `to` (no further than built).
    fn extend_to(&mut self, to: usize, red: &Redactor) {
        if to >= self.from {
            return;
        }
        let src = Source { log: &self.log, blobs: &self.blobs, redact: red };
        let mut older = history_range(&src, to, self.from);
        older.append(&mut self.rows);
        self.rows = older;
        self.from = to;
    }

    /// Every row (the whole log built, once).
    pub fn all(&mut self, red: &Redactor) -> &[Item] {
        self.extend_to(0, red);
        &self.rows
    }

    /// One page: the newest rows with a pos under `before` (all: none),
    /// newest first until `max_rows` rows or `max_bytes` bytes of
    /// bodies (one row always), built further up as needed; oldest
    /// first, with whether older rows remain.
    pub fn page(&mut self, red: &Redactor, before: Option<u64>, max_rows: usize, max_bytes: usize) -> (Vec<Item>, bool) {
        let under = |rows: &[Item]| rows.iter().filter(|r| before.is_none_or(|b| r.pos < b)).count();
        while self.from > 0 && under(&self.rows) <= max_rows {
            self.extend_to(self.from.saturating_sub(STEP_EVENTS), red);
        }
        let end = self.rows.iter().position(|r| before.is_some_and(|b| r.pos >= b)).unwrap_or(self.rows.len());
        let mut start = end;
        let mut bytes = 0;
        while start > 0 {
            let n = self.rows[start - 1].body.text().len();
            if start < end && (end - start >= max_rows || bytes + n > max_bytes) {
                break;
            }
            bytes += n;
            start -= 1;
        }
        let more = start > 0 || self.from > 0;
        (self.rows[start..end].to_vec(), more)
    }

    /// The pos of every row that holds `needle` (any case) in its head,
    /// body, tool, meta or rule, oldest first: the whole history, built
    /// once for it.
    pub fn find(&mut self, red: &Redactor, needle: &str) -> Vec<u64> {
        let n = needle.trim().to_lowercase();
        if n.is_empty() {
            return Vec::new();
        }
        let has = |s: &str| s.to_lowercase().contains(&n);
        self.all(red)
            .iter()
            .filter(|r| has(&r.head) || has(r.body.text()) || has(&r.tool) || has(&r.meta) || r.rule.as_deref().is_some_and(has))
            .map(|r| r.pos)
            .collect()
    }
}

/// The caches a reader keeps (the hub: one per agent read), bounded:
/// at most `max` (the least recently read goes first), and one no one
/// read for `idle_ms` goes (architect m_34775: a cache can hold ~40k
/// rows).
pub struct Caches {
    max: usize,
    idle_ms: u64,
    /// (session folder, last read ms, cache), most recent last
    all: Vec<(PathBuf, u64, HistoryCache)>,
}

impl Caches {
    pub fn new(max: usize, idle_ms: u64) -> Caches {
        Caches { max, idle_ms, all: Vec::new() }
    }

    /// The cache of `dir`, read at `now_ms`: kept, refreshed when its
    /// files changed, opened again when they were rewritten, else
    /// opened; the old and the extra ones dropped.
    pub fn get(&mut self, dir: &Path, blobs: &Path, red: &Redactor, now_ms: u64) -> std::io::Result<&mut HistoryCache> {
        let idle = self.idle_ms;
        self.all.retain(|(_, at, _)| now_ms.saturating_sub(*at) < idle);
        let found = self.all.iter().position(|(d, _, _)| d == dir);
        let c = match found {
            Some(i) => {
                let (_, _, mut c) = self.all.remove(i);
                if c.rewritten() {
                    c = HistoryCache::open(dir, blobs, red)?;
                } else {
                    c.refresh(red)?;
                }
                c
            }
            None => HistoryCache::open(dir, blobs, red)?,
        };
        while self.all.len() + 1 > self.max.max(1) {
            self.all.remove(0);
        }
        self.all.push((dir.to_path_buf(), now_ms, c));
        Ok(&mut self.all.last_mut().expect("just pushed").2)
    }

    /// The folders kept, least recently read first.
    pub fn kept(&self) -> Vec<&Path> {
        self.all.iter().map(|(d, _, _)| d.as_path()).collect()
    }
}

#[cfg(test)]
mod tests;
