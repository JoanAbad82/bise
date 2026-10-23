//! The processes agents leave running (a dev server, a watcher, a
//! backgrounded bash job, one a script detached with nohup) and the ones
//! that ended in the last 24 h: the `processes` event's rows
//! (docs/processes.md). An observation, never a decision: the hub
//! re-derives the running ones from the process table and the agents' bg
//! folders; only the ended ones are kept (`<hub>/procs/ended.jsonl`).

use serde::{Deserialize, Serialize};

/// How the process came to run.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
#[serde(tag = "is", rename_all = "snake_case")]
pub enum ProcKind {
    /// the agent's backgrounded bash command `n` (its `bg/<n>.*` slot);
    /// `pid` is its process group
    Bg { n: u32 },
    /// started by one of the agent's commands, but outside its bg jobs
    /// (a script, nohup, setsid, a daemon): its tree's root
    Detached,
    /// a kind this version doesn't know (a newer hub)
    #[serde(other)]
    Unknown,
}

/// Whether it runs, and how it ended.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
#[serde(tag = "is", rename_all = "snake_case")]
pub enum ProcState {
    Running,
    /// it ended by itself, with that exit code (its bg slot's `.rc`; a
    /// detached one's code isn't known: -1)
    Exited { rc: i32 },
    /// he stopped it (`proc_stop`)
    StoppedByYou,
    /// killed with its agent (the agent stopped or dropped, the hub quit)
    StoppedWith,
    /// a state this version doesn't know (a newer hub)
    #[serde(other)]
    Unknown,
}

/// Where its output can be read (`proc_out`): the app never gets a path.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
#[serde(rename_all = "snake_case")]
pub enum OutKind {
    /// its bg job's output file (an ended one: the copy the hub kept)
    Bg,
    /// a detached one whose stdout is a regular file the hub can read
    File,
    /// no output kept: it doesn't write to a file bise can read
    None,
    #[serde(other)]
    Unknown,
}

/// One process tree an agent left running, or one that ended in the last
/// 24 h. Its key is (`agent`, `id`).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct Proc {
    /// `bg3` (the agent's bg job 3), `p<pid>.<start s>` (a detached one):
    /// stable while it runs, the key `proc_out` and `proc_stop` take
    pub id: String,
    pub agent: String,
    pub kind: ProcKind,
    /// a bg job's command as the agent typed it; a detached one's root's
    /// command line
    pub cmd: String,
    /// the root's working folder, when known
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub cwd: Option<String>,
    /// the tree's root (a bg job: its process group)
    pub pid: u32,
    pub started_ms: u64,
    /// the TCP ports the tree listens on, lowest first
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub ports: Vec<u16>,
    /// `http://127.0.0.1:<first port>` once it listens
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
    /// what it is, for a known server command ("dev server", "http
    /// server")
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    pub state: ProcState,
    /// when it ended (any state but running)
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ended_ms: Option<u64>,
    /// the tree's sum, from the hub's last scan (0 once ended): cpu in
    /// percent of one core, resident memory in MB, how many processes
    #[serde(default)]
    pub cpu: f64,
    #[serde(default)]
    pub rss_mb: u32,
    #[serde(default)]
    pub procs: u32,
    pub out: OutKind,
}

impl Proc {
    pub fn running(&self) -> bool {
        self.state == ProcState::Running
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn kinds_and_states_are_tagged_and_a_newer_one_reads_as_unknown() {
        assert_eq!(serde_json::to_value(ProcKind::Bg { n: 3 }).unwrap(), json!({"is": "bg", "n": 3}));
        assert_eq!(serde_json::to_value(ProcState::Exited { rc: 1 }).unwrap(), json!({"is": "exited", "rc": 1}));
        assert_eq!(serde_json::to_value(ProcState::StoppedByYou).unwrap(), json!({"is": "stopped_by_you"}));
        assert_eq!(serde_json::from_value::<ProcKind>(json!({"is": "container"})).unwrap(), ProcKind::Unknown);
        assert_eq!(serde_json::from_value::<ProcState>(json!({"is": "paused", "at": 1})).unwrap(), ProcState::Unknown);
        assert_eq!(serde_json::from_value::<OutKind>(json!("pipe")).unwrap(), OutKind::Unknown);
    }
}
