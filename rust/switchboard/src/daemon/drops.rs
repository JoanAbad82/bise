//! A stop or a /drop, after the step that made it: the dropped tasks'
//! temp folders and worktree folders, the processes the stopped and
//! dropped agents started (BISE-230, BISE-243). sb-core decided; this is
//! the shell's cleanup, its slow parts on threads.

use super::*;

impl Shell {
    /// After each step: the agents newly archived or stopped.
    pub(super) fn downs_after_step(&mut self) {
        // a /drop: the dropped task's worktree folders (gate.sh's too)
        if !self.booting && self.hub.st.agents.values().any(|a| a.lifecycle == Lifecycle::Archived && !self.archived.contains(&a.dir)) {
            let now = self.archived_dirs();
            let names: BTreeSet<String> = self
                .hub
                .st
                .agents
                .values()
                .filter(|a| now.contains(&a.dir) && !self.archived.contains(&a.dir))
                .flat_map(|a| [a.name.clone(), a.dir.clone()].into_iter().chain(a.aliases.iter().cloned()))
                .collect();
            // their temp folders (approvals-design.md §7.1); run/ stays
            // with the rest of the agent's folder; off the loop (hub-loop:
            // a tmp/ can hold GBs)
            let tmps: Vec<PathBuf> = now.difference(&self.archived).map(|d| self.opts.paths.agent_tmp(d)).collect();
            std::thread::spawn(move || tmps.iter().for_each(|t| crate::sweep::remove_agent_tmp(t)));
            self.archived = now;
            self.sweep_worktrees(Some(names));
        }
        // a stop or a /drop: the processes the agent started (BISE-243)
        if !self.booting {
            let now = self.down_dirs();
            let new: BTreeSet<String> = now.difference(&self.down).cloned().collect();
            self.down = now;
            if !new.is_empty() {
                self.reap_procs(Some(new));
            }
        }
    }

    pub(super) fn archived_dirs(&self) -> BTreeSet<String> {
        self.hub.st.agents.values().filter(|a| a.lifecycle == Lifecycle::Archived).map(|a| a.dir.clone()).collect()
    }

    pub(super) fn down_dirs(&self) -> BTreeSet<String> {
        self.hub
            .st
            .agents
            .values()
            .filter(|a| matches!(a.lifecycle, Lifecycle::Archived | Lifecycle::Stopped))
            .map(|a| a.dir.clone())
            .collect()
    }

    /// Kill, off the loop, the processes of the agents in `dirs` started
    /// until now (a REPL restored after this is not hit); `None`, at the
    /// start: those of every agent that is not live (stopped, archived,
    /// unknown), left by an earlier hub (BISE-243, `procs`).
    pub(super) fn reap_procs(&self, dirs: Option<BTreeSet<String>>) {
        let hub = self.proc_hub.clone();
        let live: BTreeSet<String> = self
            .hub
            .st
            .agents
            .values()
            .filter(|a| !matches!(a.lifecycle, Lifecycle::Archived | Lifecycle::Stopped))
            .map(|a| a.dir.clone())
            .collect();
        let paths = self.opts.paths.clone();
        let before = crate::util::now_ms();
        // their REPLs' sessions until now, forgotten once reaped
        let reaped: Vec<String> = match &dirs {
            Some(d) => d.iter().cloned().collect(),
            None => self.hub.st.agents.values().filter(|a| !live.contains(&a.dir)).map(|a| a.dir.clone()).collect(),
        };
        let mut sessions = BTreeSet::new();
        for d in reaped {
            let f = paths.agent_dir(&d).join("repl.sids");
            sessions.extend(crate::procs::read_sids(&f));
            let _ = std::fs::remove_file(f);
        }
        std::thread::spawn(move || {
            let (want, what) = match &dirs {
                Some(d) => (
                    crate::procs::Want::Dirs { dirs: d, before },
                    d.iter().cloned().collect::<Vec<_>>().join(", "),
                ),
                None => (crate::procs::Want::NotLive(&live), "agents gone before this start".to_string()),
            };
            let hit = crate::procs::reap(&hub, &want, &sessions, crate::procs::STOP_GRACE);
            if !hit.is_empty() {
                log_line(&paths, &format!("processes of {} killed: {}", what, crate::procs::describe(&hit)));
            }
        });
    }

    /// Clean the task worktree folders (BISE-230, `sweep`) off the loop
    /// (a target is GBs of files): the dropped tasks' (`only`), or every
    /// orphan (the hub's start, the old place too). What is kept for its
    /// work goes to main's thread, for the user to decide.
    pub(super) fn sweep_worktrees(&self, only: Option<BTreeSet<String>>) {
        let mut owners = crate::sweep::Owners::default();
        for a in self.hub.st.agents.values() {
            let names = [a.name.clone(), a.dir.clone()].into_iter().chain(a.aliases.iter().cloned());
            if a.lifecycle == Lifecycle::Archived {
                owners.archived.extend(names);
                continue;
            }
            owners.live.extend(names);
            owners.paths.insert(PathBuf::from(&a.ws.path));
            owners.paths.extend(a.place.iter().map(PathBuf::from));
        }
        let paths = self.opts.paths.clone();
        let prefix = self.env.config.branch_prefix.clone();
        let tx = self.tx.clone();
        std::thread::spawn(move || {
            let now = crate::util::now_ms();
            let mut out = crate::sweep::sweep(&paths.worktrees, &owners, only.as_ref(), now, &prefix);
            if only.is_none() {
                let legacy = paths.legacy_worktrees();
                if legacy != paths.worktrees {
                    out.extend(crate::sweep::sweep(&legacy, &owners, None, now, &prefix));
                    crate::sweep::drop_empty(&legacy);
                }
            }
            for o in out {
                match o {
                    crate::sweep::Outcome::Removed(d) => log_line(&paths, &format!("worktree folder removed: {}", d.display())),
                    crate::sweep::Outcome::Kept(d, why) => {
                        log_line(&paths, &format!("worktree folder kept: {}: {}", d.display(), why));
                        let _ = tx.send(Msg::Notice {
                            kind: "warn".into(),
                            text: format!(
                                "the worktree {} of task @{} is not deleted: {}. Delete it yourself when it is not needed any more",
                                d.display(),
                                crate::sweep::owner_of(&d),
                                why
                            ),
                        });
                    }
                }
            }
        });
    }
}
