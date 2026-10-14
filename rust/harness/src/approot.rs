//! The app root: the folder that holds bise's own files (the Bend REPLs,
//! sb-core, bend-jsrt, the tool descriptions and prompts). Never the cwd
//! (BISE-163, packaging.md C1): running an installed `bise` inside the dev
//! repo must not pick the repo's REPL.
//!
//! In order:
//!   1. `BISE_APP_ROOT` (run.sh, a hub started by a TUI, a version switch;
//!      a version's `bise.app/Contents/MacOS` counts as the version dir:
//!      what a TUI of before the bundle layout hands over when it follows
//!      a bundle hub, v2026.10.2-30's);
//!   2. the executable's folder when it holds `VERSION` (a version dir, an
//!      installed bundle);
//!   3. dev only: a source tree (it holds `rust/Cargo.toml` and the REPL):
//!      one of the executable's 3 parents (`rust/target/<profile>/` -> the
//!      repo), then, in a debug build, the tree it was built from (a test
//!      binary in an agent's own CARGO_TARGET_DIR). Never the executable's
//!      own folder: a stale repl-live lands in rust/target/debug.

use std::path::{Path, PathBuf};

/// The variable that names the app root.
pub(crate) const ENV: &str = "BISE_APP_ROOT";

/// Where the lookup starts: the environment, the executable, the source tree.
pub(crate) struct Inputs {
    pub(crate) env_root: Option<PathBuf>,
    /// the executable, symlinks resolved (`~/.local/bin/bise` -> its version dir)
    pub(crate) exe: Option<PathBuf>,
    /// the source tree of a debug build (`CARGO_MANIFEST_DIR/../..`), None in release
    pub(crate) dev_tree: Option<PathBuf>,
}

impl Inputs {
    pub(crate) fn from_env() -> Inputs {
        Inputs {
            env_root: std::env::var_os(ENV).filter(|v| !v.is_empty()).map(PathBuf::from),
            exe: std::env::current_exe().ok().map(|p| std::fs::canonicalize(&p).unwrap_or(p)),
            dev_tree: dev_tree(),
        }
    }
}

#[cfg(debug_assertions)]
fn dev_tree() -> Option<PathBuf> {
    let p = Path::new(env!("CARGO_MANIFEST_DIR")).join("../..");
    Some(std::fs::canonicalize(&p).unwrap_or(p))
}

#[cfg(not(debug_assertions))]
fn dev_tree() -> Option<PathBuf> {
    None
}

/// How the root was found (for `bise doctor`).
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub(crate) enum Via {
    Env,
    Bundle,
    DevTree,
}

impl Via {
    /// For `bise doctor`.
    pub(crate) fn describe(self) -> &'static str {
        match self {
            Via::Env => "BISE_APP_ROOT",
            Via::Bundle => "next to the executable",
            Via::DevTree => "dev tree",
        }
    }
}

/// The app root holding `repl` (a file name: repl-live, repl-scripted), or
/// why there is none. `has(dir, name)`: the file exists in dir.
pub(crate) fn find(
    inp: &Inputs,
    repl: &str,
    has: &dyn Fn(&Path, &str) -> bool,
) -> Result<(PathBuf, Via), String> {
    if let Some(r) = &inp.env_root {
        // a version's bundle folder counts as the version dir: an older
        // TUI (before bise_home::exe_home_dir) that follows a bundle
        // hub's exe hands over <root>/bise.app/Contents/MacOS
        let r = bise_home::exe_home_dir(&std::path::absolute(r).unwrap_or_else(|_| r.clone()));
        return if has(&r, repl) {
            Ok((r, Via::Env))
        } else {
            Err(format!("{}={} has no {}", ENV, r.display(), repl))
        };
    }
    // a version's bundle (<root>/bise.app/Contents/MacOS) counts as <root>
    let exe_dir = inp.exe.as_ref().and_then(|e| e.parent()).map(bise_home::exe_home_dir);
    if let Some(d) = &exe_dir {
        if has(d, "VERSION") {
            return if has(d, repl) {
                Ok((d.clone(), Via::Bundle))
            } else {
                Err(format!("{} is missing from {} (reinstall bise)", repl, d.display()))
            };
        }
    }
    let dev = exe_dir
        .iter()
        .flat_map(|d| d.ancestors().skip(1).take(3))
        .map(Path::to_path_buf)
        .chain(inp.dev_tree.clone());
    for d in dev {
        if has(&d, "rust/Cargo.toml") && has(&d, repl) {
            return Ok((d, Via::DevTree));
        }
    }
    Err(missing_words(exe_dir.as_deref(), repl))
}

/// Why there is no app root, in the words its reader can act on: inside
/// a `.app` (the desktop app's bise, `Contents/Resources/bin`), the app's
/// own runtime is missing and reinstalling it is the fix (no variable to
/// set: an app gets none); else how a developer points at one. The
/// window draws these words as they are (CoreEv::Broken).
pub(crate) fn missing_words(exe_dir: Option<&Path>, repl: &str) -> String {
    let dir = exe_dir.map(|d| d.display().to_string()).unwrap_or_else(|| "unknown".into());
    if dir.contains(".app/Contents/") {
        return format!("bise's runtime is missing: no {} in {}. reinstall bise", repl, dir);
    }
    format!(
        "{} not found: no VERSION next to the executable ({}); set {} to the folder that holds it, or build it in the repo with ./run.sh",
        repl, dir, ENV
    )
}

/// The V8 engine the runtime runs `run_typescript` with, handed to the
/// REPLs as BEND_JSRT_BIN: `bend-jsrt` in the app root (a version dir, a
/// bundle), else the dev tree's debug build (./run.sh builds it), else its
/// release build; else the test setting BEND_JSRT_BIN (a test's tree has
/// none built). Never an engine of another version when the root has one.
pub(crate) fn jsrt_bin(root: &std::path::Path) -> Option<std::path::PathBuf> {
    let found = [
        "bend-jsrt",
        "rust/jsrt/target/debug/bend-jsrt",
        "rust/jsrt/target/release/bend-jsrt",
    ]
    .iter()
    .map(|rel| root.join(rel))
    .find(|p| p.exists());
    found
        .map(|p| std::path::absolute(&p).unwrap_or(p))
        .or_else(|| bise_home::env::test_setting("BEND_JSRT_BIN").map(std::path::PathBuf::from))
}

/// `find` on the real environment and file system.
pub(crate) fn locate(repl: &str) -> Result<(PathBuf, Via), String> {
    find(&Inputs::from_env(), repl, &|d, f| d.join(f).exists())
}

/// The app root of another executable (the TUI re-execs as the hub's
/// version): a version dir, or the source tree of a dev build
/// (`<tree>/rust/target/<profile>/bise` -> `<tree>`, never
/// `rust/target/<profile>`). Neither the environment nor our own dev tree
/// count: they are ours, not `exe`'s.
pub(crate) fn of_exe(exe: &Path, repl: &str, has: &dyn Fn(&Path, &str) -> bool) -> Option<PathBuf> {
    let inp = Inputs { env_root: None, exe: Some(exe.to_path_buf()), dev_tree: None };
    find(&inp, repl, has).ok().map(|(root, _)| root)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashSet;

    fn fs(files: &[&str]) -> impl Fn(&Path, &str) -> bool {
        let set: HashSet<String> = files.iter().map(|s| s.to_string()).collect();
        move |d: &Path, f: &str| set.contains(&d.join(f).to_string_lossy().to_string())
    }

    fn inp(env: Option<&str>, exe: &str, dev: Option<&str>) -> Inputs {
        Inputs {
            env_root: env.map(PathBuf::from),
            exe: Some(PathBuf::from(exe)),
            dev_tree: dev.map(PathBuf::from),
        }
    }

    #[test]
    fn env_wins_and_must_hold_the_repl() {
        let has = fs(&["/r/repl-live", "/v/VERSION", "/v/repl-live"]);
        assert_eq!(find(&inp(Some("/r"), "/v/bise", None), "repl-live", &has), Ok(("/r".into(), Via::Env)));
        let err = find(&inp(Some("/x"), "/v/bise", None), "repl-live", &has).unwrap_err();
        assert!(err.contains("BISE_APP_ROOT=/x has no repl-live"), "{err}");
    }

    #[test]
    fn an_env_root_in_a_version_bundle_is_the_version_dir() {
        // v2026.10.2-30's TUI follows a bundle hub's exe and sets
        // BISE_APP_ROOT to the exe's folder (its of_exe knows no bundle)
        let d = std::env::temp_dir().join(format!("approot-bundle-{}", std::process::id()));
        let v = d.join("v1");
        let macos = v.join("bise.app/Contents/MacOS");
        std::fs::create_dir_all(&macos).unwrap();
        std::fs::write(v.join("VERSION"), "id=v1\n").unwrap();
        std::fs::write(v.join("repl-live"), "").unwrap();
        let real = |d: &Path, f: &str| d.join(f).exists();
        let got = find(&inp(Some(macos.to_str().unwrap()), "/elsewhere/bise", None), "repl-live", &real);
        assert_eq!(got, Ok((v.clone(), Via::Env)));
        // any other folder without the REPL stays an error
        let other = v.join("bise.app/Contents");
        let err = find(&inp(Some(other.to_str().unwrap()), "/elsewhere/bise", None), "repl-live", &real).unwrap_err();
        assert!(err.contains("has no repl-live"), "{err}");
        let _ = std::fs::remove_dir_all(&d);
    }

    #[test]
    fn a_version_dir_is_its_own_root() {
        let has = fs(&["/v/VERSION", "/v/repl-live", "/v/repl-scripted"]);
        assert_eq!(find(&inp(None, "/v/bise", None), "repl-live", &has), Ok(("/v".into(), Via::Bundle)));
        // a broken bundle is an error, never a fallback to a dev tree
        let has = fs(&["/v/VERSION", "/src/repl-live"]);
        let err = find(&inp(None, "/v/bise", Some("/src")), "repl-live", &has).unwrap_err();
        assert!(err.contains("repl-live is missing from /v"), "{err}");
    }

    #[test]
    fn the_dev_tree_is_found_from_the_executable_never_the_cwd() {
        // a stale repl-live next to the dev binary is not the tree's
        let has = fs(&["/repo/repl-live", "/repo/rust/Cargo.toml", "/repo/rust/target/debug/repl-live"]);
        let got = find(&inp(None, "/repo/rust/target/debug/bise", None), "repl-live", &has);
        assert_eq!(got, Ok(("/repo".into(), Via::DevTree)));
        // an agent's own CARGO_TARGET_DIR: the source tree of a debug build
        let has = fs(&["/wt/repl-live", "/wt/rust/Cargo.toml", "/tmp/t/debug/repl-live"]);
        let got = find(&inp(None, "/tmp/t/debug/bise", Some("/wt")), "repl-live", &has);
        assert_eq!(got, Ok(("/wt".into(), Via::DevTree)));
        // a folder with a REPL but no sources is not a dev tree
        assert!(find(&inp(None, "/x/bin/bise", None), "repl-live", &fs(&["/x/repl-live"])).is_err());
    }

    #[test]
    fn nothing_found_says_how_to_fix() {
        let err = find(&inp(None, "/usr/local/bin/bise", None), "repl-live", &fs(&[])).unwrap_err();
        assert!(err.contains("set BISE_APP_ROOT"), "{err}");
        // the desktop app's bise: its runtime is missing, reinstall; never a variable to set
        let err = find(&inp(None, "/Applications/bise.app/Contents/Resources/bin/bise", None), "repl-live", &fs(&[])).unwrap_err();
        assert_eq!(err, "bise's runtime is missing: no repl-live in /Applications/bise.app/Contents/Resources/bin. reinstall bise");
    }

    #[test]
    fn a_packed_app_is_a_version_dir_found_with_no_env() {
        let bin = "/Applications/bise.app/Contents/Resources/bin";
        let has = fs(&[&format!("{bin}/VERSION"), &format!("{bin}/repl-live")]);
        assert_eq!(find(&inp(None, &format!("{bin}/bise"), None), "repl-live", &has), Ok((bin.into(), Via::Bundle)));
    }

    #[test]
    fn another_executables_root_is_its_version_dir_or_its_source_tree() {
        let has = fs(&["/v/VERSION", "/v/repl-live", "/repo/repl-live", "/repo/rust/Cargo.toml"]);
        assert_eq!(of_exe(Path::new("/v/bise"), "repl-live", &has), Some("/v".into()));
        // a dev tree's debug build: the tree, not rust/target/debug
        let got = of_exe(Path::new("/repo/rust/target/debug/bise"), "repl-live", &has);
        assert_eq!(got, Some("/repo".into()));
        assert_eq!(of_exe(Path::new("/x/bise"), "repl-live", &has), None);
    }
}
