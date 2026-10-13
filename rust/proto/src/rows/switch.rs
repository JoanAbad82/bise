//! A version switch of the hub (`/reload`, `/restart`, `/version`): where
//! it is, as the hub knows it (architect m_20569/m_20576, amb-home
//! m_20570). The window draws one status line from it
//! ([`crate::thread::words::switch_line`]); a hub restart can't lose it,
//! since every hub says it again at hello.

use serde::{Deserialize, Serialize};

/// Where a switch is.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
#[serde(rename_all = "snake_case")]
pub enum SwitchPhase {
    /// the switch started; the old hub still answers
    Reloading,
    /// the new version's hub is up (its probation runs)
    Up,
    /// the probation passed: the new version is the good one
    Passed,
    /// the new version failed: the hub went back (`reason` says why)
    RolledBack,
    /// a phase this version doesn't know (a newer hub)
    #[serde(other)]
    Unknown,
}

/// The newest switch of this hub: its phase, the version it went to (and
/// from), why it rolled back, and when that phase began (`at_ms`: the
/// window's fade reads it, so an old switch never shows as new).
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct SwitchRow {
    pub phase: SwitchPhase,
    /// the version id it switched to
    pub to: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[cfg_attr(feature = "ts", ts(optional))]
    pub from: Option<String>,
    /// rolled_back: why the new version failed
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[cfg_attr(feature = "ts", ts(optional))]
    pub reason: Option<String>,
    pub at_ms: u64,
}
