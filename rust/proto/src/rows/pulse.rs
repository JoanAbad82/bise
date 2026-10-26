//! A project's pulse (the H1 projects sidebar, architect m_44800): its
//! agents' busy time over the last 7 days in 8 h buckets, the age of its
//! last activity, the one "last news" line, and the times of the week's
//! artifacts and of main's entries written for him. The hub computes it
//! (switchboard's `pulse.rs`, pure; `daemon/pulse.rs` sends it as
//! `hub/pulse` and writes it in `view.json`); the window only formats
//! numbers and ages, its words are the words catalog's.
//!
//! "Since he last looked" is his view state, not the hub's: the prefs key
//! [`seen_key`] (`seen.<project>`, ms, in `prefs.json`, set with the
//! app's `prefs_set` when he opens the project; the window's TS builds it
//! from `SEEN_PREFIX` in `app_methods.gen.ts`, never a string of its
//! own). New artifacts = `artifacts_at > seen`; unread = `said_at >
//! seen`. Plain arithmetic on these fields, done by whoever draws them.
//!
//! Buckets are 8 h in ms from `from_ms`: across a DST change in the week
//! the later boundaries are an hour off the local clock (by design,
//! architect m_44825).

use serde::{Deserialize, Serialize};

/// The prefs key prefix of "when he last looked at a project".
pub const SEEN_PREFIX: &str = "seen.";

/// The prefs key of when he last looked at `project` (its hub id).
pub fn seen_key(project: &str) -> String {
    format!("{SEEN_PREFIX}{project}")
}

/// The buckets a pulse has: 7 days of 8 h.
pub const PULSE_BUCKETS: usize = 21;
/// One bucket, in ms (8 h).
pub const PULSE_BUCKET_MS: u64 = 8 * 3_600_000;
/// The most times `artifacts_at` and `said_at` keep (the newest).
pub const PULSE_CAP: usize = 99;

/// One project's pulse.
#[derive(Clone, Debug, Default, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct Pulse {
    /// the start of the first bucket: a local 00:00, 08:00 or 16:00
    pub from_ms: u64,
    /// [`PULSE_BUCKETS`] buckets of 8 h from `from_ms`, oldest first
    /// (bucket i starts at `from_ms + i * 8 h`): the sum of its agents'
    /// turn time in it (turn start to turn end); parallel agents add up.
    /// A stopped hub's buckets stop moving: draw them from `from_ms`
    #[serde(default)]
    pub busy_ms: Vec<u64>,
    /// its last activity: the latest turn end, or now while a turn runs
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_ms: Option<u64>,
    /// the one "last news" the hub picked (none: nothing to say)
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub news: Option<News>,
    /// when the week's artifacts were made or changed, newest first, at
    /// most [`PULSE_CAP`]: new ones = `artifacts_at > seen.<project>`
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub artifacts_at: Vec<u64>,
    /// when main's thread got an entry written for him this week (main's
    /// words, an agent's, bise's; never his own), newest first, at most
    /// [`PULSE_CAP`]: unread = `said_at > seen.<project>`
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub said_at: Vec<u64>,
    /// the hub is still reading the week's transcripts: the buckets and
    /// `said_at` hold only what came since it started
    #[serde(default, skip_serializing_if = "std::ops::Not::not")]
    pub counting: bool,
}

/// The "last news" of a project: what happened (or will) and when.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct News {
    pub at_ms: u64,
    pub what: NewsWhat,
}

/// What the news is. `at_ms` is past for all but `scheduled` (its next run).
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum NewsWhat {
    /// an agent failed
    Failed { agent: String },
    /// an agent's commits landed on the project's trunk (`target`)
    Landed { agent: String, sha: String, target: String },
    /// an artifact was made or changed
    Artifact { id: String, title: String },
    /// a scheduled task runs next (`id`: its timer's)
    Scheduled { id: String, name: String },
    /// a newer hub's kind
    #[serde(other)]
    Unknown,
}
