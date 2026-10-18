//! Where one message of the hub's loop spent its time (hub-loop): the
//! parts that can hold it are timed where they run, sb-core's answers
//! (`Hub::call`), the git queries sb-core asks for (`Hub::query`), each
//! effect the shell runs (daemon `step`), and the loop watch
//! (daemon/loop_watch.rs) splits each `hub loop busy` line with them:
//! `hub loop busy 12 s on sb spawn from main (git worktree_create 11.2 s,
//! sb-core 0.4 s, shell 0.4 s)`.
//!
//! Parts nest (an effect that runs a step, which calls sb-core): a part's
//! time is its own, without the parts opened inside it. What no part
//! covers is the shell's ("shell").
//!
//! Owns: the current message's split, reset by the loop at each message
//! ([`Spent::reset`]). Read by the watch's thread, written by the loop.

use std::collections::BTreeMap;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

#[derive(Default)]
struct Inner {
    done: BTreeMap<&'static str, Duration>,
    /// the parts open now, innermost last, each since its last resume
    open: Vec<(&'static str, Instant)>,
}

impl Inner {
    fn pause_top(&mut self, now: Instant) {
        if let Some((name, since)) = self.open.last() {
            *self.done.entry(name).or_default() += now.saturating_duration_since(*since);
        }
    }

    /// `name` opens at `now`: the part open before it pauses.
    fn open(&mut self, name: &'static str, now: Instant) {
        self.pause_top(now);
        self.open.push((name, now));
    }

    /// The innermost part closes at `now`: the one before it resumes.
    fn close(&mut self, now: Instant) {
        self.pause_top(now);
        self.open.pop();
        if let Some(top) = self.open.last_mut() {
            top.1 = now;
        }
    }

    /// Each part's time at `now`, the open one included.
    fn at(&self, now: Instant) -> BTreeMap<&'static str, Duration> {
        let mut out = self.done.clone();
        if let Some((name, since)) = self.open.last() {
            *out.entry(name).or_default() += now.saturating_duration_since(*since);
        }
        out
    }
}

/// The split of the message the loop runs (cheap to clone: one Arc).
#[derive(Clone, Default)]
pub struct Spent(Arc<Mutex<Inner>>);

/// An open part: its time counts until it is dropped.
pub struct Part(Spent);

impl Drop for Part {
    fn drop(&mut self) {
        self.0.lock().close(Instant::now());
    }
}

impl Spent {
    fn lock(&self) -> std::sync::MutexGuard<'_, Inner> {
        self.0.lock().unwrap_or_else(|e| e.into_inner())
    }

    /// A new message: nothing spent yet.
    pub fn reset(&self) {
        *self.lock() = Inner::default();
    }

    /// `name` runs until the part is dropped (the part open before it
    /// pauses meanwhile).
    pub fn part(&self, name: &'static str) -> Part {
        self.lock().open(name, Instant::now());
        Part(self.clone())
    }

    /// Each part's time so far, the open ones included.
    pub fn now(&self) -> BTreeMap<&'static str, Duration> {
        self.lock().at(Instant::now())
    }
}

/// The words of a split for a busy spell of `busy`: the 3 longest parts,
/// then the rest as the shell's (`git worktree_create 11.2 s, sb-core
/// 0.4 s, shell 0.4 s`). Parts under 0.05 s are left out.
pub fn words(busy: Duration, parts: &BTreeMap<&'static str, Duration>) -> String {
    let mut ps: Vec<(&str, Duration)> = parts.iter().map(|(k, v)| (*k, *v)).filter(|(_, d)| d.as_millis() >= 50).collect();
    ps.sort_by(|a, b| b.1.cmp(&a.1).then(a.0.cmp(b.0)));
    let named: Duration = ps.iter().take(3).map(|p| p.1).sum();
    let mut out: Vec<String> = ps.iter().take(3).map(|(k, d)| format!("{} {:.1} s", k, d.as_secs_f64())).collect();
    out.push(format!("shell {:.1} s", busy.saturating_sub(named).as_secs_f64()));
    out.join(", ")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_part_inside_another_counts_once() {
        let (t0, ms) = (Instant::now(), Duration::from_millis);
        let mut i = Inner::default();
        i.open("fx spawn", t0);
        i.open("sb-core", t0 + ms(30));
        assert_eq!(i.at(t0 + ms(50)), BTreeMap::from([("fx spawn", ms(30)), ("sb-core", ms(20))]), "the open one counts");
        i.close(t0 + ms(90));
        i.close(t0 + ms(120));
        assert_eq!(i.at(t0 + ms(500)), BTreeMap::from([("fx spawn", ms(60)), ("sb-core", ms(60))]));
    }

    #[test]
    fn a_reset_forgets_the_split_and_a_part_counts_while_open() {
        let s = Spent::default();
        let g = s.part("git worktree_create");
        assert!(s.now().contains_key("git worktree_create"));
        drop(g);
        s.reset();
        assert!(s.now().is_empty());
    }

    #[test]
    fn the_words_name_the_longest_parts_and_the_shell() {
        let ms = Duration::from_millis;
        let parts = BTreeMap::from([("sb-core", ms(400)), ("git worktree_create", ms(11_200)), ("fx Journal", ms(10)), ("fx Spawn", ms(300)), ("fx Say", ms(100))]);
        assert_eq!(words(ms(12_400), &parts), "git worktree_create 11.2 s, sb-core 0.4 s, fx Spawn 0.3 s, shell 0.5 s");
        assert_eq!(words(ms(5_000), &BTreeMap::new()), "shell 5.0 s");
    }
}
