//! A project's pulse, the pure part (the H1 projects sidebar, architect
//! m_44800 and m_44825; the shape is bise_proto's `rows::Pulse`): the
//! 7-day window and its 8 h buckets, the agents' turns read from their
//! transcript lines, main's entries written for him, the one "last news"
//! and the caps. The shell (`daemon/pulse.rs`) feeds it: the week's lines
//! from the one transcript reader (`daemon/usage.rs`'s fill, on a
//! thread), the live lines as the feed writes them, the news candidates
//! at its 60 s check. It decides nothing about anyone: it only counts.
//!
//! Turns: a turn runs from its `turn_started` line to its `turn_done`.
//! A turn left open (a crash, a kill) ends at the line before the next
//! `turn_started`, else (the transcript's tail, the agent not busy now)
//! at the last line the fill read. The fill counts the lines written
//! before it started, the live side the ones after, so no line counts
//! twice; a turn the fill saw start and the live side saw end is one
//! turn ([`Turns::merge`]).
//!
//! Said: main's thread folded by bise_proto's fold (the one entry
//! reader), its entries counted by `EntryKind::for_him` (the one rule).
//! The fold runs on what is not settled yet, never on a line alone, so
//! an entry on several lines counts once ([`Said`]).
//!
//! No file, no clock: times and the UTC offset come in as arguments.

use bise_proto::rows::{News, NewsWhat, PULSE_BUCKETS, PULSE_BUCKET_MS, PULSE_CAP};
use bise_proto::thread::lines::{self, Obs, Rec, TurnEnd};
use bise_proto::thread::{self, Ctx, Line};
use bise_proto::Pos;
use std::collections::BTreeMap;

/// The window: [`PULSE_BUCKETS`] buckets of 8 h (7 days).
pub const WINDOW_MS: u64 = PULSE_BUCKETS as u64 * PULSE_BUCKET_MS;
/// How far back a past event can be the news.
pub const NEWS_MS: u64 = 86_400_000;
/// A buffer of main's lines folded at once in the fill (bounds the fold).
const SETTLE_EVERY: usize = 2_000;

/// The start of the window that ends with the bucket holding `now`: a
/// local 00:00, 08:00 or 16:00 (`offset`: seconds east of UTC at a
/// moment, bise_home::clock::offset_at), between 160 h and 168 h before
/// `now`, so `now` is always in the last bucket.
pub fn window_from(now: u64, offset: &dyn Fn(u64) -> i32) -> u64 {
    let c = now.saturating_sub(WINDOW_MS - PULSE_BUCKET_MS);
    let floor = |off: i32| {
        let local = c as i64 + off as i64 * 1000;
        c - local.rem_euclid(PULSE_BUCKET_MS as i64) as u64
    };
    // the boundary at its own offset: the one at `c` may differ across a
    // DST change; either floor stays in (c - 8 h, c]
    let first = floor(offset(c));
    let at_first = offset(first);
    if at_first != offset(c) {
        floor(at_first)
    } else {
        first
    }
}

/// The busy time per bucket of the window from `from`: each turn
/// (start, end) clipped to each bucket; parallel turns add up.
pub fn buckets(turns: impl IntoIterator<Item = (u64, u64)>, from: u64) -> Vec<u64> {
    let mut b = vec![0u64; PULSE_BUCKETS];
    let end = from + WINDOW_MS;
    for (s, e) in turns {
        let (s, e) = (s.max(from), e.min(end));
        if s >= e {
            continue;
        }
        let first = ((s - from) / PULSE_BUCKET_MS) as usize;
        let last = ((e - 1 - from) / PULSE_BUCKET_MS) as usize;
        for (i, slot) in b.iter_mut().enumerate().take(last + 1).skip(first) {
            let lo = from + i as u64 * PULSE_BUCKET_MS;
            *slot += e.min(lo + PULSE_BUCKET_MS) - s.max(lo);
        }
    }
    b
}

/// `at` newest first, the newest [`PULSE_CAP`] kept.
pub fn cap(mut at: Vec<u64>) -> Vec<u64> {
    at.sort_unstable_by(|a, b| b.cmp(a));
    at.truncate(PULSE_CAP);
    at
}

/// The one "last news" (designer's rule; it may change, not where it
/// lives): the newest past event of the last 24 h, else the next
/// scheduled run, else none. Same time: failed, then landed, then artifact.
pub fn news(candidates: &[News], now: u64) -> Option<News> {
    let rank = |w: &NewsWhat| match w {
        NewsWhat::Failed { .. } => 3,
        NewsWhat::Landed { .. } => 2,
        NewsWhat::Artifact { .. } => 1,
        NewsWhat::Scheduled { .. } | NewsWhat::Unknown => 0,
    };
    let past = candidates
        .iter()
        .filter(|n| !matches!(n.what, NewsWhat::Scheduled { .. } | NewsWhat::Unknown))
        .filter(|n| n.at_ms <= now && n.at_ms + NEWS_MS >= now)
        .max_by_key(|n| (n.at_ms, rank(&n.what)));
    past.or_else(|| candidates.iter().filter(|n| matches!(n.what, NewsWhat::Scheduled { .. }) && n.at_ms >= now).min_by_key(|n| n.at_ms)).cloned()
}

/// What a transcript line is to the turns.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum TurnLine {
    Start,
    Done { failed: bool },
    Other,
}

/// The turn kinds' names on the wire (`turn_started`, `turn_done`), from
/// bise_proto's obs records (their one owner): both line forms, the
/// record and the older text, carry them.
fn turn_kinds() -> &'static [String; 2] {
    use bise_proto::thread::obs::{self as o, ObsRec};
    static KINDS: std::sync::OnceLock<[String; 2]> = std::sync::OnceLock::new();
    KINDS.get_or_init(|| {
        let start = ObsRec::TurnStarted(o::TurnStarted {}).tag().to_string();
        let done = ObsRec::TurnDone(o::TurnDone { end: String::new(), why: String::new() }).tag().to_string();
        [start, done]
    })
}

/// A transcript line (without its time) read for the turns: bise_proto's
/// line reader, after a cheap look for a turn kind's name (most lines
/// never mention one).
pub fn turn_line(line: &str) -> TurnLine {
    if !turn_kinds().iter().any(|k| line.contains(k.as_str())) {
        return TurnLine::Other;
    }
    match lines::read(line) {
        Rec::Obs(Obs::TurnStarted) => TurnLine::Start,
        Rec::Obs(Obs::TurnDone(end)) => TurnLine::Done { failed: matches!(end, TurnEnd::Failed(_)) },
        _ => TurnLine::Other,
    }
}

/// One agent's turns, read forward.
#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct Turns {
    /// (start, end) of each ended turn
    pub closed: Vec<(u64, u64)>,
    /// the running turn's start
    pub open: Option<u64>,
    /// a turn end before any start in what this one read: a reader that
    /// began mid-turn (the live side while the fill reads)
    pub head_done: Option<u64>,
    /// the time of the last line read
    pub last_line: u64,
    /// the last turn end, and whether it failed
    pub last_end: Option<(u64, bool)>,
}

impl Turns {
    /// One line at `ms`.
    pub fn line(&mut self, ms: u64, l: TurnLine) {
        match l {
            TurnLine::Start => {
                // a turn left open (a crash): it ends at the line before
                if let Some(s) = self.open.take() {
                    self.closed.push((s, self.last_line.max(s)));
                }
                self.open = Some(ms);
            }
            TurnLine::Done { failed } => {
                match self.open.take() {
                    Some(s) => self.closed.push((s, ms)),
                    None if self.closed.is_empty() && self.last_end.is_none() => self.head_done = Some(ms),
                    None => {}
                }
                self.last_end = Some((ms, failed));
            }
            TurnLine::Other => {}
        }
        self.last_line = self.last_line.max(ms);
    }

    /// The fill's turns of an agent (`fill`) joined with the live side's
    /// since the fill started (`live`). The fill's open turn ends at the
    /// live side's first turn end when it has one (the fill began
    /// mid-turn: one turn); runs on when the agent is busy now and the
    /// live side saw nothing of it; else it was left open and ends at the
    /// fill's last line.
    pub fn merge(fill: Turns, live: Turns, busy_now: bool) -> Turns {
        let mut t = Turns { closed: fill.closed, open: None, head_done: None, last_line: fill.last_line.max(live.last_line), last_end: live.last_end.or(fill.last_end) };
        if let Some(s) = fill.open {
            match live.head_done {
                Some(d) => t.closed.push((s, d)),
                None if live.closed.is_empty() && live.open.is_none() && busy_now => t.open = Some(s),
                None => t.closed.push((s, fill.last_line.max(s))),
            }
        }
        t.closed.extend(live.closed);
        if live.open.is_some() {
            t.open = live.open;
        }
        t
    }

    /// The turns that ended before `before` go (the state stays small).
    pub fn forget_before(&mut self, before: u64) {
        self.closed.retain(|(_, e)| *e >= before);
    }

    /// Every turn as (start, end), the running one to `now`.
    pub fn intervals(&self, now: u64) -> impl Iterator<Item = (u64, u64)> + '_ {
        self.closed.iter().copied().chain(self.open.map(|s| (s, now.max(s))))
    }

    /// The last activity: the latest turn end, or `now` while one runs.
    pub fn last_ms(&self, now: u64) -> Option<u64> {
        match self.open {
            Some(_) => Some(now),
            None => self.closed.iter().map(|(_, e)| *e).max(),
        }
    }
}

/// The fill's turn reader: one transcript read from its end
/// ([`TurnsBack::line`]), then the turns forward ([`TurnsBack::turns`]).
#[derive(Debug)]
pub struct TurnsBack {
    since: u64,
    until: u64,
    /// the turn lines seen, newest first; a start's previous line too
    evs: Vec<(u64, TurnLine)>,
    after_start: bool,
    /// the time of the first line older than `since` (the reader stops)
    stop: Option<u64>,
    last: Option<u64>,
}

impl TurnsBack {
    /// Reads the lines from `since` on that were written before `until`
    /// (the live side counts from there).
    pub fn new(since: u64, until: u64) -> TurnsBack {
        TurnsBack { since, until, evs: Vec::new(), after_start: false, stop: None, last: None }
    }

    /// One line (`ms`, the line without its time), read from the end;
    /// false: it is older than `since`, the reader can stop.
    pub fn line(&mut self, ms: u64, line: &str) -> bool {
        if ms >= self.until {
            return true;
        }
        self.last.get_or_insert(ms);
        let l = turn_line(line);
        if std::mem::take(&mut self.after_start) {
            // the line before a start: where a turn left open ends
            self.evs.push((ms, TurnLine::Other));
        }
        if ms < self.since {
            self.stop = Some(ms);
            return false;
        }
        if l != TurnLine::Other {
            self.evs.push((ms, l));
            self.after_start = l == TurnLine::Start;
        }
        true
    }

    /// The turns read, forward. A turn end with no start read (it began
    /// before `since`) runs from the line the reader stopped at; the last
    /// line read is the last one.
    pub fn turns(self) -> Turns {
        let mut t = Turns::default();
        for (ms, l) in self.evs.into_iter().rev() {
            t.line(ms, l);
        }
        if let Some(d) = t.head_done.take() {
            t.closed.insert(0, (self.stop.unwrap_or(self.since).min(d), d));
        }
        t.last_line = t.last_line.max(self.last.unwrap_or(0));
        t
    }
}

/// Main's entries written for him: their times by entry, and the lines
/// of the entry that may still grow.
#[derive(Clone, Debug, Default)]
pub struct Said {
    lines: Vec<Line>,
    next: Pos,
    at: BTreeMap<Pos, u64>,
}

impl Said {
    /// One line of main's transcript, in order (positions are this
    /// state's own: only the order matters to the fold).
    pub fn push(&mut self, ms: u64, line: String) {
        self.next += 1;
        self.lines.push((self.next, ms, line));
    }

    /// The fold over what is not settled: each entry for him counted at
    /// its first line's time; the lines of the newest entry stay (it may
    /// go on), the others go.
    pub fn settle(&mut self, ctx: &Ctx) {
        if self.lines.is_empty() {
            return;
        }
        let es = thread::fold(&self.lines, ctx);
        for e in &es {
            if e.kind.for_him() && e.at_ms > 0 {
                self.at.insert(e.pos, e.at_ms);
            } else {
                self.at.remove(&e.pos);
            }
        }
        if es.len() > 1 {
            let cut = thread::tail_start(&self.lines, &es, es.len() - 1);
            self.lines.retain(|l| l.0 >= cut);
        }
    }

    /// Lines pushed in order, settled every few thousand (the fill).
    pub fn push_all(&mut self, lines: impl IntoIterator<Item = (u64, String)>, ctx: &Ctx) {
        for (ms, l) in lines {
            self.push(ms, l);
            if self.lines.len() >= SETTLE_EVERY {
                self.settle(ctx);
            }
        }
        self.settle(ctx);
    }

    /// The times from `since` on, newest first, capped.
    pub fn times(&self, since: u64) -> Vec<u64> {
        cap(self.at.values().copied().filter(|t| *t >= since).collect())
    }

    /// The counted entries older than `before` go.
    pub fn forget_before(&mut self, before: u64) {
        self.at.retain(|_, t| *t >= before);
    }
}

#[cfg(test)]
#[path = "pulse_tests.rs"]
mod tests;
