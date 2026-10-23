//! A workspace's hub state folder and its agents' folders in it: one
//! owner for the hub (switchboard::paths::Paths calls these) and the
//! clients that read an agent's files on this machine (the TUI's
//! `/running` gives a background job's output to `less`). The hub's
//! socket can live elsewhere (`socket`: a long path moves it to
//! `/tmp/bise-<uid>/<hash>`), so a client finds the state from the
//! workspace, never from the socket's folder.

use std::path::{Path, PathBuf};

/// The hub state folder of `workspace` (canonical when it exists):
/// `SB_STATE_DIR` (a test setting), else `Home::hub_dir(hub_id)`.
pub fn state_dir(workspace: &Path) -> PathBuf {
    match crate::env::test_setting("SB_STATE_DIR") {
        Some(d) => PathBuf::from(d),
        None => {
            let ws = workspace.canonicalize().unwrap_or_else(|_| workspace.to_path_buf());
            crate::Home::from_env().hub_dir(&crate::hub_id(&ws))
        }
    }
}

/// An agent's folder (`dir`: its folder name, the agent row's `dir`).
pub fn agent_dir(state: &Path, dir: &str) -> PathBuf {
    state.join("agents").join(dir)
}

/// The agent's temp folder (approvals-design.md §7.1): its `TMPDIR`,
/// created at spawn, deleted at its /drop.
pub fn agent_tmp(state: &Path, dir: &str) -> PathBuf {
    agent_dir(state, dir).join("tmp")
}

/// Where an agent's background commands keep their files
/// (`BEND_BG_DIR`): `<n>.{slot,pid,cmd,out,in,rc}`, from its temp folder.
pub fn bg_dir_of_tmp(tmp: &Path) -> PathBuf {
    tmp.join("bg")
}

/// The agent's background commands' folder.
pub fn agent_bg(state: &Path, dir: &str) -> PathBuf {
    bg_dir_of_tmp(&agent_tmp(state, dir))
}

/// Background command `n`'s output file.
pub fn bg_out(state: &Path, dir: &str, n: u32) -> PathBuf {
    agent_bg(state, dir).join(format!("{n}.out"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn an_agents_files_sit_in_its_folder() {
        let s = Path::new("/h/hubs/x-0a1b2c3d");
        assert_eq!(agent_tmp(s, "perf"), Path::new("/h/hubs/x-0a1b2c3d/agents/perf/tmp"));
        assert_eq!(agent_bg(s, "perf.2"), Path::new("/h/hubs/x-0a1b2c3d/agents/perf.2/tmp/bg"));
        assert_eq!(bg_out(s, "my agent", 3), Path::new("/h/hubs/x-0a1b2c3d/agents/my agent/tmp/bg/3.out"));
    }
}
