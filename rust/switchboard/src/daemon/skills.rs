//! The skills a REPL reads, as the hub sees them: its skill folders (by
//! role and the desktop flag) and their fingerprint, which tells a live
//! REPL that a skill came, went, changed or was turned on or off (it
//! reloads at its next idle). The folders, the scan and the fingerprint
//! are `bend_plugins::skills`'s; this module only picks the agent's
//! [`BiseSkills`] and names a stuck path in hub.log.

use std::path::{Path, PathBuf};

use bend_plugins::skills::{self, BiseSkills, Root};

use crate::paths::Paths;

/// An agent's skill folders (`bend_plugins::skills::roots`): main reads
/// the app root's `prompts/skills`, every agent its `prompts/skills-all`
/// where the desktop is on (architect m_12576).
pub(super) fn skill_roots(ws: &Path, app_root: &Path, is_main: bool, desktop: bool) -> Vec<Root> {
    let home = std::env::var_os("HOME").filter(|h| !h.is_empty()).map(PathBuf::from);
    skills::roots(home.as_deref(), ws, Some(app_root), BiseSkills::of(is_main, desktop))
}

/// The fingerprint of `roots` with the on/off state; a path stuck for
/// the first time (a SKILL.md behind macOS's privacy wait) is named once
/// in hub.log.
pub(super) fn skills_fingerprint(paths: &Paths, roots: &[Root]) -> u64 {
    let st = bend_plugins::state::read(&bend_plugins::state::state_path());
    let (fp, stuck) = skills::fingerprint(roots, &st, skills::SCAN_LIMIT);
    for p in stuck {
        super::log_line(paths, &format!("skills scan: skipped {} (no answer in {} s)", p.display(), skills::SCAN_LIMIT.as_secs()));
    }
    fp
}
