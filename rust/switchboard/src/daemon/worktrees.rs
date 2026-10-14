//! The typed `worktrees` event on the hub's side (bise desktop S7 emitter
//! 3): the repo's worktrees, each with the agent working there, whether
//! it has changes not committed (untracked files included, architect
//! m_8711) and its commits ahead of and behind the trunk. Git runs in a
//! thread (never on the hub's loop); the rows are pure
//! (`proto_view::worktrees`). Sent at a typed hello, on `worktrees`, and
//! when an agent comes, goes, starts or ends a turn (`proto_on`): never on
//! a timer.

use super::rpc::Typed;
use super::*;
use crate::diff;
use crate::model::Mode;
use crate::proto_view;
use bise_proto::hub::HubEv;
use bise_proto::rows::Worktree;

impl Shell {
    /// shared-guard (`crate::shared_wip`): on the tick, about once a
    /// minute, when a task works in the shared folder (or one had files
    /// there): one `git status` of it in a thread, back as
    /// `Input::SharedStatus`; the hub counts, sb-core decides the nudge.
    pub(super) fn shared_wip_check(&mut self) {
        let now = now_ms();
        if !self.hub.shared_wip.due(now) {
            return;
        }
        let ws = PathBuf::from(&self.hub.workspace);
        let some = crate::shared_wip::claims(&self.hub.st, &ws).iter().any(|(_, fs)| !fs.is_empty());
        if !some && self.hub.shared_wip.idle() {
            return;
        }
        self.hub.shared_wip.start(now);
        let tx = self.tx.clone();
        std::thread::spawn(move || {
            let st = crate::worktree::is_git_dir(&ws).then(|| crate::worktree::git(&ws, &["status", "--porcelain=v1", "-z", "--untracked-files=all"]));
            if let Some(Ok(z)) = st {
                let _ = tx.send(Msg::In(Input::SharedStatus { dirty: crate::shared_wip::parse_status(&z), now: now_ms() }));
            }
        });
    }

    /// What makes the worktrees change: each agent's status and folder.
    pub(super) fn worktrees_key(&self) -> String {
        let st = &self.hub.st;
        st.agents.iter().map(|(n, a)| format!("{n}:{:?}:{}:{}", a.status(), a.ws.path, a.ws.dropped)).collect::<Vec<_>>().join("|")
    }

    /// Scan the worktrees in a thread; `worktrees` goes `to` (an answer,
    /// or a hub-wide notification).
    pub(super) fn worktrees_typed(&mut self, to: Typed) {
        if to.is_empty() {
            return;
        }
        let shared = PathBuf::from(&self.hub.workspace);
        let agents: Vec<(String, String)> = self
            .hub
            .st
            .agents
            .iter()
            .filter(|(_, a)| a.ws.mode == Mode::Worktree && !a.ws.dropped && a.status() != crate::model::Status::Archived)
            .map(|(n, a)| (n.clone(), a.ws.path.clone()))
            .collect();
        let project = self.project();
        let tx = self.tx.clone();
        std::thread::spawn(move || {
            let v = HubEv::Worktrees { project, items: scan(&shared, &agents) }.to_value();
            let _ = tx.send(Msg::Typed { to, v });
        });
    }
}

/// The repo's worktrees at `shared` (none: not a git repo).
fn scan(shared: &Path, agents: &[(String, String)]) -> Vec<Worktree> {
    let Ok(list) = crate::worktree::git(shared, &["worktree", "list", "--porcelain"]) else { return Vec::new() };
    let trunk = diff::trunk(shared);
    proto_view::worktrees(&proto_view::worktree_list(&list), agents, |path| facts(Path::new(path), &trunk))
}

/// (dirty, ahead, behind) of the checkout at `dir` (a folder gone: clean
/// and even).
fn facts(dir: &Path, trunk: &str) -> (bool, u32, u32) {
    let git = |args: &[&str]| crate::worktree::git(dir, args).ok();
    let dirty = git(&["status", "--porcelain"]).is_some_and(|s| !s.trim().is_empty());
    let (behind, ahead) = git(&["rev-list", "--left-right", "--count", &format!("{trunk}...HEAD")]).and_then(|s| proto_view::left_right(&s)).unwrap_or((0, 0));
    (dirty, ahead, behind)
}
