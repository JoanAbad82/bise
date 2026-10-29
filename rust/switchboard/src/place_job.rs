//! A worktree job of sb-core's (hub-loop, docs/issues/32): its fx
//! `worktree_create` and `worktree_drop` (bend/hub/place.bend), run off the
//! hub's loop by daemon/place_work.rs. Pure data; the decision is sb-core's.

use serde_json::Value;

#[derive(Clone, Debug, PartialEq)]
pub enum Job {
    /// Make task `name`'s worktree (the shell picks its path and branch);
    /// its end comes back as `Input::Placed`.
    Create { name: String, with_changes: bool },
    /// Save what `dirty`/`unpushed` say would be lost, then remove the
    /// worktree `ws` of task `name`.
    Drop { name: String, ws: Value, dirty: u64, unpushed: u64 },
}

/// Tests: what daemon/place_work.rs answers a `worktree_create`, at once
/// (the env's worktree), as the `Input::Placed` the loop would step.
#[cfg(test)]
pub(crate) fn placed_now(env: &mut dyn crate::core::Env, e: &crate::core::Effect) -> Option<crate::core::Input> {
    let crate::core::Effect::Place(Job::Create { name, with_changes }) = e else { return None };
    Some(match env.worktree_create(name, *with_changes) {
        Ok(ws) => crate::core::Input::Placed { name: name.clone(), ws: serde_json::to_value(ws).ok()?, err: String::new() },
        Err(err) => crate::core::Input::Placed { name: name.clone(), ws: Value::Null, err },
    })
}
