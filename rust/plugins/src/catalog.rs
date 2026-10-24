//! The unified Plugins list (docs/plugins.md, "Contract"): one pure
//! builder, [`rows`], of the wire rows (`bise_proto::app_rows::Plugin`)
//! that the TUI and the desktop's core both show, each in its own process
//! (no hub.sock method: the state is his files). Pure: every input is read
//! by its owner first.
//!
//! Signature only until the chunk "catalog + hub" fills it in.

use crate::model::{SkillEntry, StateV2};
use crate::{connectors, resolve};
use bise_proto::app_rows::Plugin;

/// What the list is built from.
pub struct Inputs<'a> {
    /// the real plugins, built-in, user and workspace (`resolve::resolve`)
    pub resolution: &'a resolve::Resolution,
    /// his Mistral connectors (`connectors::load`)
    pub catalog: &'a connectors::Catalog,
    /// the skills of the skills folders (the skills scanner)
    pub skills: &'a [SkillEntry],
    /// the on/off file (`state::read`)
    pub state: &'a StateV2,
    /// each MCP server's last state (`status::dir`), the logins open in
    /// his browser by name
    pub status_dir: Option<&'a std::path::Path>,
    pub pending_logins: &'a [String],
}

/// The Plugins list: real plugins, connectors, MCP plugins and skills
/// folders, each with its parts and whether it is on.
pub fn rows(inputs: &Inputs) -> Vec<Plugin> {
    let _ = inputs;
    todo!("plugins chunk `catalog + hub`: the one builder")
}
