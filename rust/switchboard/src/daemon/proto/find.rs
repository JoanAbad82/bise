//! `thread/find` (⌘F over a whole thread, thread-perf, architect m_26633):
//! a worker reads the agent's transcript through its offset index
//! (tindex.rs), folds it a chunk at a time, keeps the entries that hold the
//! needle (`bise_proto::thread::find`'s rule) and answers one `thread_hits`. Never
//! on the hub's loop. A newer find of the same connection and agent moves
//! the rid it watches: the older search stops at its next chunk and sends
//! nothing.

use super::super::tindex::Indexes;
use super::*;
use bise_proto::thread::find::{hits, FindHit, MAX_HITS};
use bise_proto::thread::Line;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;

/// Transcript lines folded at once (a fold starts at an entry's first line).
const CHUNK: usize = 4000;
/// A chunk holding a single entry (a very long tools run) grows to this.
const CHUNK_MAX: usize = 64_000;

/// Every hit of `needle` in the transcript at `path` up to its last
/// complete line, and that line. `fold` folds lines that start at an
/// entry's first line; `stop` says a newer find replaced this one (None
/// then).
pub(super) fn search(ix: &Indexes, path: &Path, needle: &str, fold: &dyn Fn(&[Line]) -> Vec<pthread::Entry>, stop: &dyn Fn() -> bool) -> Option<(Vec<FindHit>, u64)> {
    let t = ix.build(path);
    let upto = t.lines();
    let mut out: Vec<FindHit> = Vec::new();
    let (mut start, mut chunk) = (1, CHUNK);
    while start <= upto {
        if stop() {
            return None;
        }
        let end = (start + chunk).min(upto + 1);
        let lines: Vec<Line> = t.read(path, start, end).into_iter().map(|(p, ts, l)| (p as u64, ts.unwrap_or(0), l)).collect();
        let mut entries = fold(&lines);
        let last = end > upto;
        // the last entry may go on in the next chunk: folded again from its first line there
        let next = match (last, entries.len()) {
            (true, _) => end,
            (false, 0) => end,
            (false, 1) if chunk < CHUNK_MAX => {
                chunk *= 2;
                continue;
            }
            (false, 1) => end,
            (false, _) => entries.pop().map_or(end, |e| (e.pos as usize).max(start + 1)),
        };
        out.extend(hits(&entries, needle));
        if out.len() > 2 * MAX_HITS {
            out.drain(..out.len() - MAX_HITS);
        }
        start = next;
        chunk = CHUNK;
    }
    if out.len() > MAX_HITS {
        out.drain(..out.len() - MAX_HITS);
    }
    Some((out, upto as u64))
}

impl Shell {
    /// `thread/find {agent, needle, rid}` of connection `id`: the search
    /// goes to a worker; its `thread_hits` comes back through the loop
    /// (`Msg::Typed`).
    pub(in crate::daemon) fn proto_find(&mut self, id: ClientId, tag: &str, project: String, agent: String, needle: String, rid: u64) {
        let Some(dir) = self.dir_of(&agent) else { return self.proto_error(id, tag, &format!("no agent {agent}")) };
        let path = self.transcript(&dir);
        let cur = self.finds.entry((id, agent.clone())).or_insert_with(|| Arc::new(AtomicU64::new(0))).clone();
        cur.store(rid, Ordering::SeqCst);
        let facts = self.facts();
        let (ix, tx) = (self.tix.clone(), self.tx.clone());
        std::thread::spawn(move || {
            // a notice's provider is named by its id here (no catalog off the loop): never in find's words
            let ctx = Ctx { open_cards: &facts.open, page: &|p: &str| facts.page(p), provider: &|i: &str, k: &str| if i.is_empty() { k.to_string() } else { i.to_string() }, width: &width, offset: &offset, attached: &crate::attached::split };
            let fold = |lines: &[Line]| pthread::fold(lines, &ctx);
            let stop = || cur.load(Ordering::SeqCst) != rid;
            let Some((hits, upto)) = search(&ix, &path, &needle, &fold, &stop) else { return };
            let v = HubEv::ThreadHits { project, agent, rid, needle, hits, upto }.to_value();
            let _ = tx.send(Msg::Typed { to: Typed::Answer(id), v });
        });
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    fn scratch(name: &str) -> PathBuf {
        let d = std::env::temp_dir().join(format!("sb-find-{name}-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&d);
        std::fs::create_dir_all(&d).unwrap();
        d
    }

    /// A fold for the test: an entry per line starting 'E', the lines after it its text.
    fn fold(lines: &[Line]) -> Vec<pthread::Entry> {
        let mut out: Vec<pthread::Entry> = Vec::new();
        for (pos, ts, l) in lines {
            match (l.strip_prefix('E'), out.last_mut()) {
                (Some(t), _) => out.push(serde_json::from_value(serde_json::json!({"pos": pos, "at_ms": ts, "kind": "agent", "text": t})).unwrap()),
                (None, Some(e)) => {
                    e.text.push('\n');
                    e.text.push_str(l);
                }
                (None, None) => {}
            }
        }
        out
    }

    #[test]
    fn finds_every_entry_across_chunks_as_one_fold_would() {
        let d = scratch("chunks");
        let p = d.join("t.log");
        let mut f = std::fs::File::create(&p).unwrap();
        let mut want = Vec::new();
        let mut pos = 0;
        for e in 0..6000 {
            pos += 1;
            let start = pos;
            writeln!(f, "1\tE entry {e}").unwrap();
            // entries of 1 to 4 lines; the word in the last line of every 97th
            for k in 0..(e % 4) {
                pos += 1;
                writeln!(f, "1\tline {k}{}", if e % 97 == 0 && k + 1 == e % 4 { " kumquat" } else { "" }).unwrap();
            }
            if e % 97 == 0 && e % 4 > 0 {
                want.push(start as u64);
            }
        }
        drop(f);
        let ix = Indexes::default();
        let (got, upto) = search(&ix, &p, "KUMQUAT", &fold, &|| false).unwrap();
        assert_eq!(upto, pos as u64);
        assert_eq!(got.iter().map(|h| h.pos).collect::<Vec<_>>(), want);
        assert!(got.iter().all(|h| h.n == 1));
    }

    #[test]
    fn a_newer_find_stops_it() {
        let d = scratch("stop");
        let p = d.join("t.log");
        std::fs::write(&p, "1\tE kumquat\n").unwrap();
        assert!(search(&Indexes::default(), &p, "kumquat", &fold, &|| true).is_none());
    }

    #[test]
    fn a_single_long_entry_is_folded_whole() {
        let d = scratch("long");
        let p = d.join("t.log");
        let mut f = std::fs::File::create(&p).unwrap();
        writeln!(f, "1\tE first").unwrap();
        for _ in 0..(CHUNK * 2) {
            writeln!(f, "1\tmore").unwrap();
        }
        writeln!(f, "1\tthe kumquat at its end").unwrap();
        writeln!(f, "1\tE second").unwrap();
        drop(f);
        let (got, _) = search(&Indexes::default(), &p, "kumquat", &fold, &|| false).unwrap();
        assert_eq!(got, vec![FindHit { pos: 1, n: 1 }]);
    }
}
