//! event-wake: an agent waiting on an event (designer's page event-wake).
//! Its live line, its row's age, and the line of a watch's end; never the
//! accent, only a non-zero rc in red. Also a version switch's status line.
//! The words are the catalog's ([`crate::words::thread`]); the durations
//! and clocks are formats, here (their TS twin is wake.ts, both pinned by
//! fixtures/wait_words.json).

use crate::thread::NoticeLevel;
use crate::words::thread;

/// A version switch's status line (the window's one line under its title
/// bar, architect m_20569): `reloading bise on <to>` while it runs, `✓
/// reloaded on <to>` once the new hub is up (and when its probation
/// passed), `▲ couldn't reload: <why>` when it rolled back. None: a phase
/// this version doesn't know. The window decides how long it shows.
pub fn switch_line(r: &crate::rows::SwitchRow) -> Option<(String, NoticeLevel)> {
    use crate::rows::SwitchPhase::*;
    Some(match r.phase {
        Reloading => (thread::reloading(&r.to), NoticeLevel::Info),
        Up | Passed => (thread::reloaded(&r.to), NoticeLevel::Info),
        RolledBack => (thread::reload_failed(r.reason.as_deref().unwrap_or(thread::reload_failed_why)), NoticeLevel::Warn),
        Unknown => return None,
    })
}

/// How long something that runs now has run (designer's
/// agent-waiting-states, the time rule: what runs now is a duration,
/// never a start on the clock): `40 s`, `3 min`, `2 h`, `2 d`; `short`
/// (the TUI's): `40s`, `3m`, `2h`, `2d`. Callers add their own `for` /
/// `running for`.
pub fn wait_len(ms: u64, short: bool) -> String {
    let s = ms / 1000;
    let (n, unit, tight) = match s {
        0..=59 => (s, "s", "s"),
        60..=3599 => (s / 60, "min", "m"),
        3600..=86_399 => (s / 3600, "h", "h"),
        _ => (s / 86_400, "d", "d"),
    };
    if short { format!("{n}{tight}") } else { format!("{n} {unit}") }
}

/// How long a watch waited, in its end's line: `45s`, `2m04s`, `1h00m`,
/// `24h`, `30h15m`.
pub fn wake_dur(ms: u64) -> String {
    let s = ms / 1000;
    match s {
        0..=59 => format!("{}s", s),
        60..=3599 => format!("{}m{:02}s", s / 60, s % 60),
        _ if s % 3600 / 60 == 0 && s >= 86_400 => format!("{}h", s / 3600),
        _ => format!("{}h{:02}m", s / 3600, s % 3600 / 60),
    }
}

/// What a watch waits for, as a sentence's object: `cargo test`, a
/// file's `build.rc to appear`; a note names the thing itself (`the
/// reindex`, designer m_17730).
pub fn watch_label(kind: crate::rows::WatchKind, what: &str, noted: bool) -> String {
    match kind {
        crate::rows::WatchKind::File if !noted => thread::label_file(what),
        crate::rows::WatchKind::Reply => thread::label_reply(what),
        _ => what.to_string(),
    }
}

/// What a watch waits for, as the end of `continues when …` or `if …`
/// (agent-waiting-states): `cargo bench ends`, `build.rc appears`; a
/// note says the event itself (`the nightly gate goes red`).
pub fn watch_event(kind: crate::rows::WatchKind, what: &str, noted: bool) -> String {
    match kind {
        _ if noted => what.to_string(),
        crate::rows::WatchKind::File => thread::event_appears(what),
        crate::rows::WatchKind::Reply => thread::event_answers(what),
        _ => thread::event_ends(what),
    }
}

const WEEKDAYS: [&str; 7] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const MONTHS: [&str; 12] = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/// An instant on the local clock: its day number and `08:07`. `off`: its
/// own offset (seconds east of UTC), so a DST change between two instants
/// never moves a day.
fn local_day(ms: u64, off: i32) -> (i64, String) {
    let s = (ms / 1000) as i64 + i64::from(off);
    (s.div_euclid(86_400), format!("{:02}:{:02}", s.rem_euclid(86_400) / 3600, s.rem_euclid(3600) / 60))
}

/// A day out of the near ones: its weekday within 6 days (`fri 08:07`),
/// else its date, day then month (`5 oct 08:07`, designer m_22812).
fn far_day(day: i64, gap: i64, hm: &str) -> String {
    if gap <= 6 {
        // day 0 (1970-01-01) was a thursday
        return format!("{} {}", WEEKDAYS[(day + 4).rem_euclid(7) as usize], hm);
    }
    let (_, m, d) = civil(day);
    format!("{} {} {}", d, MONTHS[(m - 1) as usize], hm)
}

/// What's ahead, on the clock (agent-waiting-states, the time rule): the
/// clock part alone, the caller says `until` / `next` / `→`: `08:07`
/// today, `tomorrow 08:07`, `fri 08:07` within 6 days, `5 oct 08:07`
/// beyond. An instant already past reads as today's clock. Its TS twin is
/// apps/desktop/src/thread/wake.ts `clockAhead`; both read
/// fixtures/wait_words.json.
pub fn clock_ahead(at_ms: u64, at_off_s: i32, now_ms: u64, now_off_s: i32) -> String {
    let ((ad, hm), (nd, _)) = (local_day(at_ms, at_off_s), local_day(now_ms, now_off_s));
    match ad - nd {
        gap if gap <= 0 => hm,
        1 => format!("tomorrow {}", hm),
        gap => far_day(ad, gap, &hm),
    }
}

/// A clock that's past, only in a hover or a detail and always relative
/// (`set yesterday 08:07`, never `tue 08:07` alone): `at 08:07` today
/// (designer m_23038: `set at 08:07`), `yesterday 08:07`, `tue 08:07`
/// within 6 days, `5 oct 08:07` beyond. TS twin: wake.ts `clockPast`.
pub fn clock_past(at_ms: u64, at_off_s: i32, now_ms: u64, now_off_s: i32) -> String {
    let ((ad, hm), (nd, _)) = (local_day(at_ms, at_off_s), local_day(now_ms, now_off_s));
    match nd - ad {
        gap if gap <= 0 => format!("at {}", hm),
        1 => format!("yesterday {}", hm),
        gap => far_day(ad, gap, &hm),
    }
}

/// A day number (days since 1970-01-01) as its year, month (1-12) and day
/// (Howard Hinnant's civil_from_days).
fn civil(z: i64) -> (i64, i64, i64) {
    let z = z + 719_468;
    let era = z.div_euclid(146_097);
    let doe = z.rem_euclid(146_097);
    let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    (yoe + era * 400 + i64::from(m <= 2), m, d)
}

/// A pause's line (agent-waiting-states, his pick A): its turn ended, it
/// continues when an event comes (a watch it set with `resumes`) or
/// another agent answers. In parts: `state` (`continues when`, whole),
/// `note` (`cargo bench ends`, `search answers`: the only part a surface
/// cuts, on a word, with `…`), `who` (the agent it waits on, its name
/// opens it; empty for a watch), `more` (` and 1 more`), then ` · ` and
/// `dur`, whole (`running for 3 min` for a command or a pid, `1 min` for a
/// reply, `for 3 min` else; the TUI's `3m`). `len` is the bare duration
/// the head chip and the right bar's row end on (`3 min`, `3m`). `title`
/// lists every pause, oldest first, one a line. What runs now is a
/// duration, never a start on the clock.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct PauseLine {
    pub state: String,
    pub note: String,
    pub who: String,
    pub more: String,
    pub dur: String,
    pub len: String,
    pub title: String,
}

/// An agent's pause line at `now_ms`; None: nothing it continues on (an
/// alarm is no pause and says nothing here, see [`alarms`]). A reply it
/// is held on (`waiting_on` an agent, inside its turn) runs since the ask
/// when an earlier hold left its reply watch (ask-wait), else since its
/// status; its watches that resume it (a reply still pending after the
/// hold among them) count only while it is idle. TS twin: wake.ts
/// `pauseLine`; both read fixtures/wait_words.json.
pub fn pause_line(a: &crate::rows::Agent, now_ms: u64, short: bool) -> Option<PauseLine> {
    use crate::rows::{Status, WaitingOn, WatchKind};
    let state = thread::pause_state.to_string();
    if let Some(WaitingOn::Agent { name }) = &a.waiting_on {
        let asked = a.watching.iter().filter(|w| w.kind == WatchKind::Reply && w.what == *name).map(|w| w.since_ms).min();
        let len = wait_len(now_ms.saturating_sub(asked.unwrap_or(a.since_ms).min(a.since_ms)), short);
        let note = thread::event_answers(name);
        let title = format!("{} {} · {}", state, note, len);
        return Some(PauseLine { state, note, who: name.clone(), more: String::new(), dur: len.clone(), len, title });
    }
    if a.status != Status::Idle {
        return None;
    }
    pause_of(&a.watching, now_ms, short)
}

/// The watch half of [`pause_line`]: the line of an idle agent's watches
/// that resume it (the TUI's agent isn't a rows::Agent); None: none.
pub fn pause_of(watching: &[crate::rows::AgentWatch], now_ms: u64, short: bool) -> Option<PauseLine> {
    use crate::rows::{AgentWatch, WatchKind};
    let state = thread::pause_state.to_string();
    let mut ws: Vec<&AgentWatch> = watching.iter().filter(|w| w.resumes).collect();
    ws.sort_by_key(|w| (w.since_ms, w.id));
    let first = *ws.first()?;
    let len = |w: &AgentWatch| wait_len(now_ms.saturating_sub(w.since_ms), short);
    let dur = |w: &AgentWatch| match w.kind {
        _ if short => len(w),
        WatchKind::Bg | WatchKind::Pid => thread::pause_running_for(len(w)),
        WatchKind::Reply => len(w),
        _ => thread::pause_for(len(w)),
    };
    let event = |w: &AgentWatch| watch_event(w.kind, &w.what, w.noted);
    let more = match ws.len() - 1 {
        0 => String::new(),
        n => thread::pause_more(n),
    };
    let title = ws.iter().map(|w| format!("{} {} · {}", state, event(w), dur(w))).collect::<Vec<_>>().join("\n");
    // a reply's line names the agent it waits on (its name opens it)
    let who = if first.kind == WatchKind::Reply { first.what.clone() } else { String::new() };
    Some(PauseLine { note: event(first), who, more, dur: dur(first), len: len(first), title, state })
}

/// An alarm in the right bar's `scheduled & watching` (agent-waiting-states
/// A): its agent is free, bise wakes it if the event comes. `note`: `if
/// the nightly gate goes red` (a surface cuts it on a word); `end`: when
/// it stops watching, the clock part alone (`08:07`, `tomorrow 08:07`; the
/// desktop says `until 08:07`, the TUI `→08:07`), empty when the hub
/// doesn't say; `title`, the hover: `bise wakes main if <event> · set
/// yesterday 08:07 · stops watching at 08:07`.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Alarm {
    pub id: u64,
    pub note: String,
    pub end: String,
    pub title: String,
}

/// An agent's alarms (its watches that don't resume it), oldest first,
/// whatever its status. `off` gives each instant's offset (seconds east
/// of UTC). TS twin: wake.ts `alarms`.
pub fn alarms(a: &crate::rows::Agent, now_ms: u64, off: &dyn Fn(u64) -> i32) -> Vec<Alarm> {
    alarms_of(&a.name, &a.watching, now_ms, off)
}

/// [`alarms`] from an agent's name and watches (the TUI's agent isn't a
/// rows::Agent).
pub fn alarms_of(name: &str, watching: &[crate::rows::AgentWatch], now_ms: u64, off: &dyn Fn(u64) -> i32) -> Vec<Alarm> {
    let mut ws: Vec<&crate::rows::AgentWatch> = watching.iter().filter(|w| !w.resumes).collect();
    ws.sort_by_key(|w| (w.since_ms, w.id));
    ws.into_iter()
        .map(|w| {
            let event = watch_event(w.kind, &w.what, w.noted);
            let set = clock_past(w.since_ms, off(w.since_ms), now_ms, off(now_ms));
            let end = w.until_ms.map(|u| clock_ahead(u, off(u), now_ms, off(now_ms))).unwrap_or_default();
            let mut title = thread::alarm_title(name, &event, set);
            if !end.is_empty() {
                // `at 08:07`, `tomorrow at 08:07`, `fri at 08:07` (designer
                // m_23038): a clock's format, as clock_past's `at 08:07`
                let at = match end.rsplit_once(' ') {
                    Some((day, hm)) => format!("{} at {}", day, hm),
                    None => format!("at {}", end),
                };
                title.push_str(&thread::alarm_stops(at));
            }
            Alarm { id: w.id, note: thread::alarm_if(event), end, title }
        })
        .collect()
}

/// What bise tells an agent when the user stopped its watch (the
/// window's `wake_stop`): `the user stopped watch #3 (cargo test): it
/// won't wake you`.
pub fn watch_stopped(id: u64, what: &str) -> String {
    format!("the user stopped watch #{id} ({what}): it won't wake you")
}

/// A wake entry's head, in parts (` · ` between them), each with whether
/// it is an error (only a non-zero rc): `cargo test ended`, `rc 0`,
/// `after 2m04s`; `the reindex still running after 1h00m`; `stopped
/// waiting for the reindex`; `stopped waiting for npm run dev after 24h`.
pub fn wake_head(f: &crate::thread::WakeFold) -> Vec<(String, bool)> {
    use crate::thread::WakeEv;
    let after = wake_dur(f.after_ms);
    match f.ev {
        WakeEv::Ended => {
            let head = if f.kind == crate::rows::WatchKind::File && !f.noted { thread::wake_appeared(&f.what) } else { thread::wake_ended(&f.what) };
            let mut v = vec![(head, false)];
            if let Some(rc) = f.rc {
                v.push((thread::wake_rc(rc), rc != 0));
            }
            v.push((thread::wake_after(after), false));
            v
        }
        WakeEv::Still => vec![(thread::wake_still(&f.what, after), false)],
        WakeEv::Stopped => vec![(thread::wake_stopped(watch_label(f.kind, &f.what, f.noted)), false)],
        WakeEv::Expired => vec![(thread::wake_expired(watch_label(f.kind, &f.what, f.noted), after), false)],
        WakeEv::Unknown => vec![(f.what.clone(), false)],
    }
}

/// A wake's folded output: `its last 3 lines`, `its last line`; None
/// without one.
pub fn wake_tail(f: &crate::thread::WakeFold) -> Option<String> {
    match f.tail.len() {
        0 => None,
        1 => Some(thread::wake_tail_one.to_string()),
        n => Some(thread::wake_tail(n)),
    }
}

