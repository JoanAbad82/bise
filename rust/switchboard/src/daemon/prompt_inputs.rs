//! What a live REPL's prompt was built from (its plugins and skills
//! fingerprints), and whether a session's prompt predates its plugins:
//! the number kept in `<agent dir>/prompt-plugins.fp`. Read by
//! `repl_starts` at each start and by the shell's plugin watch.

use std::path::{Path, PathBuf};

/// A hash of a REPL's spawn keys (never the keys themselves, kept).
/// The plugins fingerprint of a workspace's roots (built-in, user,
/// `<ws>/.agents/plugins`, the enable state).
/// In an agent's dir: the plugins fingerprint its REPL's prompt was
/// last built with.
pub(super) const PROMPT_PLUGINS_FILE: &str = "prompt-plugins.fp";

/// Whether a session's prompt predates its plugins: the fingerprint of
/// its last start differs from `fp` (none recorded: a session from
/// before this file, its prompt rebuilt once).
pub(super) fn prompt_is_stale(adir: &Path, fp: u64) -> bool {
    std::fs::read_to_string(adir.join(PROMPT_PLUGINS_FILE)).map(|s| s.trim() != fp.to_string()).unwrap_or(true)
}

/// What a live REPL's prompt was built from: its workspace, whether it is
/// main, the plugins fingerprint of its roots and the skills fingerprint
/// of the skill folders its startup scan reads.
pub(super) struct PromptInputs {
    pub(super) ws: PathBuf,
    pub(super) main: bool,
    /// prompts::desktop_on at its start: bise-pages (prompts/skills-all)
    pub(super) desktop: bool,
    pub(super) plugins: u64,
    pub(super) skills: u64,
}

impl PromptInputs {
    /// The one number kept in `<agent dir>/prompt-plugins.fp`.
    pub(super) fn combined(&self) -> u64 {
        use std::hash::{Hash, Hasher};
        let mut h = std::collections::hash_map::DefaultHasher::new();
        self.plugins.hash(&mut h);
        self.skills.hash(&mut h);
        h.finish()
    }
}

pub(super) fn plugins_fingerprint(ws: &Path) -> u64 {
    bend_plugins::resolve::fingerprint(&bend_plugins::resolve::Roots::standard(Some(ws)))
}
