//! shared-guard (architect m_25463, docs/issues/28-shared-folder-stays-clean.md):
//! each task's uncommitted files in the shared folder, counted for
//! sb-core's nudge (`shared_wip` input: `bend/hub/core.bend`
//! `shared_wip`) and for the board (`rows::Agent::shared_wip`).
//!
//! Pure: the shared folder's `git status` and the tasks' claims in, rows
//! out; the shell (`daemon/shared_wip.rs`) runs git and sends the rows.
//! Owns the runtime state [`SharedWip`] (one field of `core::Hub`): when
//! each (agent, file) was first seen uncommitted, and the last count. Lost
//! on restart by design: the clock of a file starts again.
//!
//! Only claimed files count (`Agent::files`: the file tools' writes, in
//! the shared folder). A change made with bash is not counted here: `sb
//! land` names it in its left-out note.

use std::collections::{BTreeMap, BTreeSet};

/// How often the hub counts (ms): one `git status` a minute at most.
pub const CHECK_MS: u64 = 60_000;

/// One task's uncommitted files in the shared folder.
#[derive(Clone, Debug, PartialEq)]
pub struct Row {
    pub agent: String,
    /// its claimed files still uncommitted
    pub n: usize,
    /// the oldest one's age, in minutes (0 when `n` is 0)
    pub age_min: u64,
    /// a few of them, for the words
    pub some: Vec<String>,
}

impl Row {
    /// What bise tells the agent (sb-core decides whether it goes).
    pub fn nudge(&self) -> String {
        format!(
            "[bise] You have {} in the shared folder ({}), the oldest for {}. Uncommitted files there block the other agents' `sb land`. Land them now with `sb land \"<message>\"` once your check passes, or move your work to its own worktree with `sb move {} new --with-changes`.",
            files(self.n),
            self.list(),
            minutes(self.age_min),
            self.agent
        )
    }

    /// main's one line.
    pub fn note(&self) -> String {
        format!(
            "shared folder: @{} has {} there ({}), the oldest for {}; i asked it to land them or move to a worktree.",
            self.agent,
            files(self.n),
            self.list(),
            minutes(self.age_min)
        )
    }

    fn list(&self) -> String {
        let mut s = self.some.join(", ");
        if self.n > self.some.len() {
            s.push_str(", …");
        }
        s
    }
}

fn files(n: usize) -> String {
    if n == 1 {
        "1 uncommitted file".into()
    } else {
        format!("{} uncommitted files", n)
    }
}

fn minutes(m: u64) -> String {
    if m < 1 {
        "less than a minute".into()
    } else if m == 1 {
        "1 minute".into()
    } else {
        format!("{} minutes", m)
    }
}

/// The runtime state of the count.
#[derive(Debug, Default)]
pub struct SharedWip {
    /// agent → its uncommitted claimed files → first seen (ms)
    seen: BTreeMap<String, BTreeMap<String, u64>>,
    /// when it last counted (ms; 0: never)
    last: u64,
}

impl SharedWip {
    /// Time to count again.
    pub fn due(&self, now: u64) -> bool {
        self.last == 0 || now.saturating_sub(self.last) >= CHECK_MS
    }

    /// A count starts (its `git status` runs off the loop): not due again
    /// for a minute.
    pub fn start(&mut self, now: u64) {
        self.last = now.max(1);
    }

    /// Nothing to count (no task in the shared folder, or no git): an
    /// agent that had files gets its zero row from the next count.
    pub fn idle(&self) -> bool {
        self.seen.is_empty()
    }

    /// Count. `dirty`: the shared folder's uncommitted paths (relative);
    /// `agents`: each task working in the shared folder, its claimed files
    /// (relative). Out: a row for each agent with files, and one with 0
    /// for an agent that had some (it landed, or left the folder): sb-core
    /// ends its episode.
    pub fn tally(&mut self, dirty: &BTreeSet<String>, agents: &[(String, Vec<String>)], now: u64) -> Vec<Row> {
        self.last = now.max(1);
        let mut rows = Vec::new();
        let mut seen = BTreeMap::new();
        for (agent, claims) in agents {
            let old = self.seen.remove(agent).unwrap_or_default();
            let mine: BTreeMap<String, u64> = claims
                .iter()
                .filter(|p| dirty.contains(*p))
                .map(|p| (p.clone(), old.get(p).copied().unwrap_or(now)))
                .collect();
            if mine.is_empty() {
                if !old.is_empty() {
                    rows.push(Row { agent: agent.clone(), n: 0, age_min: 0, some: Vec::new() });
                }
                continue;
            }
            let first = mine.values().copied().min().unwrap_or(now);
            let mut by_age: Vec<(&u64, &String)> = mine.iter().map(|(p, t)| (t, p)).collect();
            by_age.sort();
            rows.push(Row {
                agent: agent.clone(),
                n: mine.len(),
                age_min: now.saturating_sub(first) / 60_000,
                some: by_age.iter().take(3).map(|(_, p)| (*p).clone()).collect(),
            });
            seen.insert(agent.clone(), mine);
        }
        // an agent gone from the folder (moved, archived) with files left
        for (agent, old) in std::mem::take(&mut self.seen) {
            if !old.is_empty() {
                rows.push(Row { agent, n: 0, age_min: 0, some: Vec::new() });
            }
        }
        self.seen = seen;
        rows
    }

    /// The board's count for `agent`.
    pub fn count(&self, agent: &str) -> u32 {
        self.seen.get(agent).map_or(0, |m| m.len() as u32)
    }
}

/// The active tasks working in the shared folder and their claimed
/// files, relative to it (`workspace`); main is not one.
pub fn claims(st: &crate::model::State, workspace: &std::path::Path) -> Vec<(String, Vec<String>)> {
    use crate::model::{Lifecycle, Mode};
    st.agents
        .values()
        .filter(|a| a.name != crate::model::MAIN && a.lifecycle == Lifecycle::Active && a.ws.mode == Mode::Shared)
        .map(|a| (a.name.clone(), a.files.iter().filter_map(|f| crate::land::relative(workspace, f)).collect()))
        .collect()
}

/// `sb move <agent> <place> --with-changes`: refused unless the place is
/// `new` and the agent works in the shared folder, and while a file of its
/// is also another active agent's (it cannot be split). sb-core refuses
/// the rest (mid-turn, main, no git).
pub fn carry_ok(st: &crate::model::State, agent: &str, place: &str, with_changes: bool) -> Result<(), String> {
    use crate::model::{Lifecycle, Mode};
    if !with_changes {
        return Ok(());
    }
    if place != "new" {
        return Err("--with-changes moves work to a new worktree only: `sb move <agent> new --with-changes`".into());
    }
    let name = st.resolve(agent).ok_or_else(|| format!("no agent named {}", agent))?;
    let a = &st.agents[&name];
    if a.ws.mode != Mode::Shared {
        return Err(format!("@{} does not work in the shared folder: nothing to carry", name));
    }
    let shared: Vec<String> = st
        .agents
        .values()
        .filter(|b| b.name != name && b.lifecycle == Lifecycle::Active && b.ws.mode == Mode::Shared)
        .flat_map(|b| a.files.iter().filter(|f| b.files.contains(*f)).map(move |f| format!("{} (@{})", f, b.name)))
        .collect();
    if shared.is_empty() {
        Ok(())
    } else {
        Err(format!("@{}'s files are also changed by others: {}; land or split them first", name, shared.join(", ")))
    }
}

/// The paths of `git status --porcelain=v1 -z --untracked-files=all`
/// (a rename gives both).
pub fn parse_status(z: &str) -> BTreeSet<String> {
    let mut out = BTreeSet::new();
    let mut parts = z.split('\0').filter(|s| !s.is_empty());
    while let Some(e) = parts.next() {
        if e.len() < 4 {
            continue;
        }
        let (xy, path) = e.split_at(3);
        out.insert(path.to_string());
        if xy.starts_with('R') || xy.starts_with('C') {
            if let Some(from) = parts.next() {
                out.insert(from.to_string());
            }
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    fn set(xs: &[&str]) -> BTreeSet<String> {
        xs.iter().map(|s| s.to_string()).collect()
    }

    fn agent(n: &str, fs: &[&str]) -> (String, Vec<String>) {
        (n.into(), fs.iter().map(|s| s.to_string()).collect())
    }

    const MIN: u64 = 60_000;

    #[test]
    fn only_claimed_files_still_uncommitted_count() {
        let mut w = SharedWip::default();
        let rows = w.tally(&set(&["a.rs", "b.rs", "theirs.rs"]), &[agent("t1", &["a.rs", "b.rs", "landed.rs"])], 1_000);
        assert_eq!(rows.len(), 1);
        assert_eq!(rows[0].n, 2);
        assert_eq!(rows[0].age_min, 0);
        assert_eq!(w.count("t1"), 2);
        assert_eq!(w.count("t2"), 0);
    }

    #[test]
    fn the_age_is_the_oldest_files_first_sighting() {
        let mut w = SharedWip::default();
        let t0 = 1_000_000;
        w.tally(&set(&["a.rs"]), &[agent("t1", &["a.rs", "b.rs"])], t0);
        // b.rs shows up later: the age stays a.rs's
        let rows = w.tally(&set(&["a.rs", "b.rs"]), &[agent("t1", &["a.rs", "b.rs"])], t0 + 21 * MIN);
        assert_eq!((rows[0].n, rows[0].age_min), (2, 21));
        assert_eq!(rows[0].some, vec!["a.rs".to_string(), "b.rs".to_string()]);
        // a.rs landed: the clock is b.rs's now (seen 21 min after t0)
        let rows = w.tally(&set(&["b.rs"]), &[agent("t1", &["a.rs", "b.rs"])], t0 + 30 * MIN);
        assert_eq!((rows[0].n, rows[0].age_min), (1, 9));
    }

    #[test]
    fn a_file_landed_then_changed_again_starts_a_new_clock() {
        let mut w = SharedWip::default();
        w.tally(&set(&["a.rs"]), &[agent("t1", &["a.rs"])], MIN);
        w.tally(&set(&[]), &[agent("t1", &["a.rs"])], 30 * MIN);
        let rows = w.tally(&set(&["a.rs"]), &[agent("t1", &["a.rs"])], 31 * MIN);
        assert_eq!(rows[0].age_min, 0);
    }

    #[test]
    fn a_clean_agent_gets_one_zero_row_then_none() {
        let mut w = SharedWip::default();
        w.tally(&set(&["a.rs"]), &[agent("t1", &["a.rs"])], MIN);
        let rows = w.tally(&set(&[]), &[agent("t1", &["a.rs"])], 2 * MIN);
        assert_eq!(rows, vec![Row { agent: "t1".into(), n: 0, age_min: 0, some: vec![] }]);
        assert!(w.tally(&set(&[]), &[agent("t1", &["a.rs"])], 3 * MIN).is_empty());
        // never had any: no row at all
        assert!(w.tally(&set(&[]), &[agent("t2", &[])], 4 * MIN).is_empty());
    }

    #[test]
    fn an_agent_that_left_the_folder_ends_its_episode() {
        let mut w = SharedWip::default();
        w.tally(&set(&["a.rs"]), &[agent("t1", &["a.rs"])], MIN);
        let rows = w.tally(&set(&["a.rs"]), &[], 2 * MIN);
        assert_eq!(rows.len(), 1);
        assert_eq!((rows[0].agent.as_str(), rows[0].n), ("t1", 0));
        assert_eq!(w.count("t1"), 0);
    }

    #[test]
    fn it_counts_once_a_minute() {
        let mut w = SharedWip::default();
        assert!(w.due(5));
        w.tally(&set(&[]), &[], 5);
        assert!(!w.due(5 + CHECK_MS - 1));
        assert!(w.due(5 + CHECK_MS));
    }

    #[test]
    fn status_paths_with_renames_and_spaces() {
        let z = " M src/a.rs\0?? new file.txt\0R  b.rs\0old b.rs\0";
        assert_eq!(parse_status(z), set(&["src/a.rs", "new file.txt", "b.rs", "old b.rs"]));
    }

    #[test]
    fn the_words_name_the_files_and_the_way_out() {
        let r = Row { agent: "t1".into(), n: 9, age_min: 21, some: vec!["a.rs".into(), "b.rs".into(), "c.rs".into()] };
        assert!(r.nudge().contains("9 uncommitted files in the shared folder (a.rs, b.rs, c.rs, …), the oldest for 21 minutes"));
        assert!(r.nudge().contains("sb move t1 new --with-changes"));
        assert!(r.note().starts_with("shared folder: @t1 has 9 uncommitted files"));
        assert_eq!(bise_proto::rows::unlanded(0), None);
        assert_eq!(bise_proto::rows::unlanded(9).as_deref(), Some("9 unlanded"));
    }
}
