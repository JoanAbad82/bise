//! An offset index over a transcript (thread-perf, architect m_26633): the
//! byte offset of every `STEP`-th line, so a page of a long thread reads its
//! own lines, not the file from line 1. A transcript only grows: the index
//! is extended with the new bytes; a file that shrank or was replaced (its
//! inode changed) is indexed again. Only complete lines (ending in a
//! newline) are counted, so a line being written is not a page's yet.
//!
//! `Indexes` is the Shell's, shared with the workers that build an index
//! the first time a thread is paged and with `thread/find`: a page asked
//! before its index exists is read the old way, once (history.rs).

use std::collections::HashMap;
use std::io::{BufRead, BufReader, Read, Seek, SeekFrom};
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};

/// One offset kept every this many lines.
pub(super) const STEP: usize = 256;

/// A transcript line as history.rs gives it: its position (from 1), its
/// time (ms, None when the stamp does not parse), the line.
pub(super) type TLine = (usize, Option<u64>, String);

#[derive(Debug, Default, Clone)]
pub(super) struct TIndex {
    /// offs[k]: the byte offset of line k * STEP + 1
    offs: Vec<u64>,
    /// complete lines indexed
    lines: usize,
    /// bytes indexed (the end of the last complete line)
    end: u64,
    ino: u64,
}

fn ino_of(m: &std::fs::Metadata) -> u64 {
    use std::os::unix::fs::MetadataExt;
    m.ino()
}

impl TIndex {
    /// The index of the file at `path` (an empty one when it doesn't exist).
    pub(super) fn build(path: &Path) -> TIndex {
        let mut ix = TIndex::default();
        ix.extend(path);
        ix
    }

    /// Complete lines in the file.
    pub(super) fn lines(&self) -> usize {
        self.lines
    }

    /// Reads what was appended since; the file shrank or was replaced:
    /// indexed again from its start.
    pub(super) fn extend(&mut self, path: &Path) {
        let Ok(m) = std::fs::metadata(path) else {
            *self = TIndex::default();
            return;
        };
        if m.len() < self.end || (self.ino != 0 && ino_of(&m) != self.ino) {
            *self = TIndex::default();
        }
        self.ino = ino_of(&m);
        if m.len() == self.end {
            return;
        }
        let Ok(mut f) = std::fs::File::open(path) else { return };
        if f.seek(SeekFrom::Start(self.end)).is_err() {
            return;
        }
        let mut r = BufReader::with_capacity(1 << 16, f);
        let mut at = self.end;
        loop {
            let buf = match r.fill_buf() {
                Ok([]) | Err(_) => break,
                Ok(b) => b,
            };
            let n = buf.len();
            for (i, c) in buf.iter().enumerate() {
                if *c == b'\n' {
                    if self.lines % STEP == 0 {
                        self.offs.push(self.end);
                    }
                    self.lines += 1;
                    self.end = at + i as u64 + 1;
                }
            }
            at += n as u64;
            r.consume(n);
        }
    }

    /// The lines at positions [from, before), from 1, as `transcript_page`.
    pub(super) fn read(&self, path: &Path, from: usize, before: usize) -> Vec<TLine> {
        let from = from.max(1);
        let before = before.min(self.lines + 1);
        if from >= before {
            return Vec::new();
        }
        let k = (from - 1) / STEP;
        let Some(&off) = self.offs.get(k) else { return Vec::new() };
        let Ok(mut f) = std::fs::File::open(path) else { return Vec::new() };
        if f.seek(SeekFrom::Start(off)).is_err() {
            return Vec::new();
        }
        let mut out = Vec::new();
        let r = BufReader::new(f.take(self.end - off));
        for (i, l) in r.lines().enumerate() {
            let pos = k * STEP + 1 + i;
            if pos >= before {
                break;
            }
            let Ok(l) = l else { break };
            if pos >= from {
                if let Some((ms, line)) = l.split_once('\t') {
                    out.push((pos, ms.parse().ok(), line.to_string()));
                }
            }
        }
        out
    }
}

/// Every transcript's index, by path: the Shell's, shared with its workers.
#[derive(Clone, Default)]
pub(super) struct Indexes {
    map: Arc<Mutex<HashMap<PathBuf, TIndex>>>,
    /// paths a worker is indexing now (one worker each)
    building: Arc<Mutex<std::collections::HashSet<PathBuf>>>,
}

impl Indexes {
    /// `f` over the fresh index of `path`, when it has one (extended with
    /// what was appended since: a few new lines, cheap).
    pub(super) fn with<T>(&self, path: &Path, f: impl FnOnce(&TIndex) -> T) -> Option<T> {
        let mut map = self.map.lock().ok()?;
        let ix = map.get_mut(path)?;
        ix.extend(path);
        Some(f(ix))
    }

    /// Builds `path`'s index here (a worker's call): the whole file read
    /// once, outside the lock; then kept.
    pub(super) fn build(&self, path: &Path) -> TIndex {
        if let Some(ix) = self.with(path, Clone::clone) {
            return ix;
        }
        let ix = TIndex::build(path);
        if let Ok(mut map) = self.map.lock() {
            map.entry(path.to_path_buf()).or_insert_with(|| ix.clone());
        }
        ix
    }

    /// `path` has no index yet: a worker builds it, off the hub's loop
    /// (one at a time per path). True when it has one already.
    pub(super) fn ensure(&self, path: &Path) -> bool {
        if self.has(path) {
            return true;
        }
        let Ok(mut b) = self.building.lock() else { return false };
        if !b.insert(path.to_path_buf()) {
            return false;
        }
        let (me, p) = (self.clone(), path.to_path_buf());
        std::thread::spawn(move || {
            me.build(&p);
            if let Ok(mut b) = me.building.lock() {
                b.remove(&p);
            }
        });
        false
    }

    /// Whether `path` has an index (a page then reads through it).
    pub(super) fn has(&self, path: &Path) -> bool {
        self.map.lock().is_ok_and(|m| m.contains_key(path))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    /// A fresh scratch dir for one test.
    fn scratch(name: &str) -> PathBuf {
        let d = std::env::temp_dir().join(format!("sb-tindex-{name}-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&d);
        std::fs::create_dir_all(&d).unwrap();
        d
    }

    fn write(path: &Path, from: usize, to: usize, append: bool) {
        let mut f = std::fs::OpenOptions::new().create(true).append(append).write(true).truncate(!append).open(path).unwrap();
        for i in from..=to {
            writeln!(f, "{}\tline {}", 1000 + i, i).unwrap();
        }
    }
    fn old_page(path: &Path, before: usize, count: usize) -> Vec<TLine> {
        let all = std::fs::read_to_string(path).unwrap();
        let from = before.saturating_sub(count).max(1);
        all.lines()
            .enumerate()
            .map(|(i, l)| (i + 1, l))
            .filter(|(p, _)| *p >= from && *p < before)
            .filter_map(|(p, l)| l.split_once('\t').map(|(ms, line)| (p, ms.parse().ok(), line.to_string())))
            .collect()
    }

    #[test]
    fn a_page_through_the_index_is_the_page_read_from_line_1() {
        let dir = scratch("page");
        let p = dir.join("t.log");
        write(&p, 1, 2000, false);
        let ix = TIndex::build(&p);
        assert_eq!(ix.lines(), 2000);
        for (before, count) in [(2001_usize, 50_usize), (1500, 300), (257, 256), (258, 1), (10, 50), (1, 5), (5000, 10)] {
            let from = before.saturating_sub(count).max(1);
            assert_eq!(ix.read(&p, from, before), old_page(&p, before, count), "before {before} count {count}");
        }
    }

    #[test]
    fn appends_extend_it_and_a_half_written_line_waits() {
        let dir = scratch("appends");
        let p = dir.join("t.log");
        write(&p, 1, 300, false);
        let mut ix = TIndex::build(&p);
        write(&p, 301, 700, true);
        let mut f = std::fs::OpenOptions::new().append(true).open(&p).unwrap();
        write!(f, "9999\thalf").unwrap();
        ix.extend(&p);
        assert_eq!(ix.lines(), 700);
        assert_eq!(ix.read(&p, 690, 800).last().map(|l| l.0), Some(700));
        writeln!(f, " done").unwrap();
        ix.extend(&p);
        assert_eq!(ix.lines(), 701);
        assert_eq!(ix.read(&p, 701, 702), vec![(701, Some(9999), "half done".to_string())]);
    }

    #[test]
    fn a_replaced_or_shorter_file_is_indexed_again() {
        let dir = scratch("replaced");
        let p = dir.join("t.log");
        write(&p, 1, 600, false);
        let mut ix = TIndex::build(&p);
        write(&p, 1, 40, false);
        ix.extend(&p);
        assert_eq!(ix.lines(), 40);
        assert_eq!(ix.read(&p, 1, 41), old_page(&p, 41, 40));
        let q = dir.join("u.log");
        write(&q, 1, 90, false);
        std::fs::rename(&q, &p).unwrap();
        ix.extend(&p);
        assert_eq!(ix.lines(), 90);
    }

    #[test]
    fn indexes_build_once_and_serve_fresh_pages() {
        let dir = scratch("indexes");
        let p = dir.join("t.log");
        write(&p, 1, 1000, false);
        let ixs = Indexes::default();
        assert!(!ixs.has(&p));
        assert_eq!(ixs.build(&p).lines(), 1000);
        write(&p, 1001, 1010, true);
        assert_eq!(ixs.with(&p, |ix| ix.read(&p, 1005, 1011).len()), Some(6));
        let q = dir.join("u.log");
        write(&q, 1, 10, false);
        assert!(!ixs.ensure(&q), "a worker builds it");
        for _ in 0..200 {
            if ixs.has(&q) {
                break;
            }
            std::thread::sleep(std::time::Duration::from_millis(5));
        }
        assert!(ixs.ensure(&q));
    }
}
