//! Places, the hub's side (docs/issues/28): where `sb move` takes a task,
//! and the shared folder's uncommitted files (the daemon's `git status`,
//! off the loop) counted per task (shared_wip.rs) into one sb-core
//! `shared_wip` input each; sb-core decides the nudge.

use super::*;

impl Hub {
    /// BISE-136: the private worktree `a` works in (None: its own
    /// workspace, shared checkout or hub worktree).
    /// `sb move <agent> <place>`: the target's ws (None: a new worktree,
    /// /isolate's path). An agent alone in its worktree does not leave
    /// it: the folder would be left behind with no one (drop it instead).
    pub(super) fn move_target(&self, agent: &str, place: &str) -> Result<Option<Workspace>, String> {
        let name = self.st.resolve(agent).ok_or_else(|| format!("no agent named {}", agent))?;
        let a = &self.st.agents[&name];
        let target = match place {
            "new" => None,
            crate::place::SHARED => self.st.agents.get(MAIN).map(|m| m.ws.clone()),
            p => Some(crate::place::find_worktree(&self.st, p)?),
        };
        if a.ws.mode == Mode::Worktree && !a.ws.dropped {
            let id = a.ws.place_id(&a.dir);
            let others = crate::place::places(&self.st, &BTreeMap::new())
                .into_iter()
                .find(|p| p.id == id)
                .is_some_and(|p| p.agents.iter().any(|n| *n != name));
            let same = target.as_ref().is_some_and(|w| w.place_id(&a.dir) == id);
            if !others && !same {
                return Err(format!(
                    "@{} is alone in its worktree: moving it would leave the folder behind; drop it instead",
                    name
                ));
            }
        }
        Ok(target)
    }

    /// `Input::SharedStatus`: the shared folder's dirty paths, tallied
    /// per task; a moved count refreshes the board (`· N unlanded`, no
    /// sb-core step marks it), each row goes to sb-core.
    pub(super) fn shared_status(&mut self, fx: &mut Fx, env: &mut dyn Env, dirty: BTreeSet<String>, now: u64) {
        let agents = crate::shared_wip::claims(&self.st, Path::new(&self.workspace));
        let rows = self.shared_wip.tally(&dirty, &agents, now);
        if !rows.is_empty() {
            fx.push(Effect::State);
        }
        for row in rows {
            let (text, note) = (row.nudge(), row.note());
            let wip = ci::SharedWip { agent: row.agent, n: row.n as u64, age_min: row.age_min, text, note };
            self.core(fx, env, None, In::SharedWip(wip));
        }
    }
}
