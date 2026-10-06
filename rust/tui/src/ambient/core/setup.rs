//! The window's setup commands (bise desktop S11, core side; amb-home's
//! file in amb-core's core, seams agreed m_9134): `prefs_set`,
//! `sign_in`, `key_set`, `key_remove`, `found_scan`, `project_add`,
//! `project_remove`, `project_move`, `project_rename` (proto::draft's
//! `AppCmd`), answered by `prefs`, `accounts`, `found`, the projects list
//! read again, or `error {cmd, text}`; and the agent plugins (P.1):
//! `plugins`, `plugin_set`, `plugin_login`, `plugin_logout`, answered by
//! `plugins` (the TUI's /plugins functions, crate::plugins). All I/O through
//! [`crate::ambient::setup::SetupPorts`]; the jobs that end later (a walk,
//! a sign-in) come back on the tick. A key is never in an event.

use super::Core;
use crate::ambient::setup::{rank, Done, RegistryOp, SetupPorts};
use bise_proto::draft::AppCmd;
use serde_json::json;
use std::path::{Path, PathBuf};
use std::sync::mpsc::{channel, Receiver, Sender};

/// The commands this file answers (never a hub's, never another of the
/// core's own).
pub const TAGS: &[&str] = &[
    "prefs_set",
    "sign_in",
    "key_set",
    "key_remove",
    "found_scan",
    "project_add",
    "project_remove",
    "project_move",
    "project_rename",
    "plugins",
    "plugin_set",
    "plugin_login",
    "plugin_logout",
];

pub(crate) struct Setup {
    ports: SetupPorts,
    tx: Sender<Done>,
    rx: Receiver<Done>,
    /// the provider whose sign-in runs (one at a time)
    signing: Option<String>,
    /// the plugin servers whose login runs (their browser is open)
    logins: Vec<String>,
}

impl Core {
    /// The setup's ports (the binary's live ones, or a test's).
    pub fn set_setup(&mut self, ports: SetupPorts) {
        let (tx, rx) = channel();
        self.setup = Some(Setup { ports, tx, rx, signing: None, logins: Vec::new() });
    }

    /// What the window needs first: his preferences and his accounts (at
    /// the core's start and at each `shown`: the window opens later).
    pub fn app_start(&mut self) {
        self.emit_prefs();
        self.emit_accounts();
    }

    fn emit_prefs(&mut self) {
        let Some(s) = &self.setup else { return };
        let prefs = bise_home::prefs::for_window((s.ports.prefs)());
        self.emit(json!({"ev": "prefs", "prefs": prefs}));
    }

    fn emit_accounts(&mut self) {
        let Some(s) = &self.setup else { return };
        let items = (s.ports.accounts)();
        self.emit(json!({"ev": "accounts", "items": items}));
    }

    fn setup_error(&mut self, cmd: &str, text: &str) {
        self.emit(json!({"ev": "error", "cmd": cmd, "text": text}));
    }

    /// The folder of project `id` (a hub id of the registry, never home).
    fn project_path(&self, id: &str) -> Result<PathBuf, String> {
        let s = self.setup.as_ref().ok_or("this core has no setup")?;
        let rows = (s.ports.rows)();
        match rows.iter().find(|r| r.id == id) {
            Some(r) if r.home => Err("bise's home stays first and can't change".into()),
            Some(r) => Ok(r.path.clone()),
            None => Err(format!("there's no project {id}")),
        }
    }

    /// One of the window's setup commands.
    pub(super) fn app_cmd(&mut self, c: AppCmd) {
        let Some(s) = &self.setup else {
            return self.setup_error("setup", "this core has no setup");
        };
        let p = &s.ports;
        let (cmd, res): (&str, Result<(), String>) = match c {
            AppCmd::PrefsSet { key, value } => {
                let now = (p.prefs)().unwrap_or_else(|| json!({}));
                let res = bise_home::prefs::set_dotted(&now, &key, value).and_then(|v| (p.write_prefs)(&v));
                if res.is_ok() {
                    self.emit_prefs();
                }
                ("prefs_set", res)
            }
            AppCmd::KeySet { id, key } => {
                let res = (p.key_set)(&id, &key);
                if res.is_ok() {
                    self.emit_accounts();
                }
                ("key_set", res)
            }
            AppCmd::KeyRemove { id } => {
                let res = (p.key_remove)(&id);
                if res.is_ok() {
                    self.emit_accounts();
                }
                ("key_remove", res)
            }
            AppCmd::SignIn { id } => {
                let res = match &s.signing {
                    Some(other) => Err(format!("a sign-in to {other} is still open in your browser")),
                    None => (p.sign_in)(&id, s.tx.clone()),
                };
                if res.is_ok() {
                    if let Some(s) = self.setup.as_mut() {
                        s.signing = Some(id);
                    }
                }
                ("sign_in", res)
            }
            AppCmd::FoundScan { dir } => {
                let dir = dir.filter(|d| !d.trim().is_empty()).map(PathBuf::from).unwrap_or_else(|| p.home_dir.clone());
                (p.scan)(dir, s.tx.clone());
                ("found_scan", Ok(()))
            }
            AppCmd::ProjectAdd { path, land } => {
                let res = (p.add)(Path::new(&path));
                let res = match (res, land) {
                    (Ok(()), Some(trunk)) => {
                        (p.flow)(&bise_home::projects::canonical(Path::new(&path)), trunk).map_err(|e| format!("added; its flow wasn't set: {e}"))
                    }
                    (r, _) => r,
                };
                self.poll_projects(true);
                ("project_add", res)
            }
            AppCmd::ProjectRemove { project } => ("project_remove", self.registry(&project, RegistryOp::Remove)),
            AppCmd::ProjectMove { project, order } => {
                ("project_move", self.registry(&project, |path| RegistryOp::Move(path, order as usize)))
            }
            AppCmd::ProjectRename { project, name } => ("project_rename", self.registry(&project, |path| RegistryOp::Rename(path, name))),
            AppCmd::Plugins { project } => ("plugins", self.emit_plugins(project)),
            AppCmd::PluginSet { project, name, on } => {
                let res = (p.plugin_set)(&name, on);
                let shown = self.emit_plugins(project);
                ("plugin_set", res.and(shown))
            }
            AppCmd::PluginLogin { project, name } => {
                let res = match self.workspace_of(project.as_deref()) {
                    Ok(_) if s.logins.contains(&name) => Err(format!("the login to {name} is still open in your browser")),
                    Ok(ws) => (p.plugin_login)(&ws, &name, project.clone(), s.tx.clone()),
                    Err(e) => Err(e),
                };
                if res.is_ok() {
                    if let Some(s) = self.setup.as_mut() {
                        s.logins.push(name);
                    }
                    let _ = self.emit_plugins(project);
                }
                ("plugin_login", res)
            }
            AppCmd::PluginLogout { project, name } => {
                let res = self.workspace_of(project.as_deref()).and_then(|ws| (p.plugin_logout)(&ws, &name));
                let shown = self.emit_plugins(project);
                ("plugin_logout", res.and(shown))
            }
            other => return self.setup_error("setup", &format!("not a setup command: {other:?}")),
        };
        if let Err(e) = res {
            self.setup_error(cmd, &e);
        }
    }

    /// The folder whose plugins a command means: the project's, else bise's home.
    fn workspace_of(&self, project: Option<&str>) -> Result<PathBuf, String> {
        let s = self.setup.as_ref().ok_or("this core has no setup")?;
        let rows = (s.ports.rows)();
        let row = match project {
            Some(id) => rows.iter().find(|r| r.id == id).ok_or_else(|| format!("there's no project {id}"))?,
            None => rows.iter().find(|r| r.home).ok_or("bise's home isn't in the projects list")?,
        };
        Ok(row.path.clone())
    }

    /// `plugins` for that workspace (its logins still open marked pending).
    fn emit_plugins(&mut self, project: Option<String>) -> Result<(), String> {
        let ws = self.workspace_of(project.as_deref())?;
        let s = self.setup.as_ref().ok_or("this core has no setup")?;
        let items = (s.ports.plugins)(&ws, &s.logins);
        let mut ev = json!({"ev": "plugins", "items": items});
        if let Some(p) = project {
            ev["project"] = json!(p);
        }
        self.emit(ev);
        Ok(())
    }

    /// A change to the list for project `id`, then the list read again.
    fn registry(&mut self, id: &str, op: impl FnOnce(PathBuf) -> RegistryOp) -> Result<(), String> {
        let path = self.project_path(id)?;
        let s = self.setup.as_ref().ok_or("this core has no setup")?;
        (s.ports.registry)(op(path))?;
        self.poll_projects(true);
        Ok(())
    }

    /// The jobs that ended: `found` for a walk, `accounts` (or an error)
    /// for a sign-in.
    pub(super) fn setup_tick(&mut self) {
        let Some(s) = &self.setup else { return };
        let done: Vec<Done> = s.rx.try_iter().collect();
        for d in done {
            match d {
                Done::Scanned { dir, entries } => {
                    let known: Vec<PathBuf> = self.setup.as_ref().map(|s| (s.ports.rows)().into_iter().map(|r| r.path).collect()).unwrap_or_default();
                    let items = rank(entries, &known);
                    self.emit(json!({"ev": "found", "dir": dir.to_string_lossy(), "items": items}));
                }
                Done::SignedIn { id, res } => {
                    if let Some(s) = self.setup.as_mut() {
                        s.signing = None;
                    }
                    if let Err(e) = res {
                        self.setup_error("sign_in", &format!("{id}: {e}"));
                    }
                    self.emit_accounts();
                }
                Done::LoggedIn { name, project, res } => {
                    if let Some(s) = self.setup.as_mut() {
                        s.logins.retain(|n| *n != name);
                    }
                    if let Err(e) = res {
                        self.setup_error("plugin_login", &format!("{name}: {e}"));
                    }
                    let _ = self.emit_plugins(project);
                }
            }
        }
    }
}
