//! The helper app (C5): where `bise Computer Use.app` is, the link to it,
//! and its start when its socket is missing.
//!
//! The broker outlives the version it started from: an update flips
//! `current` and prunes the old version dir, the helper inside it with it
//! (`ps` names the broker by `current/bise`, so prune can't see it runs).
//! So the path found at start is a cache: gone, the broker looks again
//! (`Opts::find_helper`), and finds the version in use through `current`.

use std::io::{BufRead, BufReader};
use std::os::unix::net::UnixStream;
use std::path::{Path, PathBuf};
use std::sync::atomic::Ordering;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use serde_json::Value;

use super::{fail_link, incoming, lock, log, write_state, HelperLink, Shared, Writer, HELPER_APP};
use crate::proto::err;

/// Where `bise Computer Use.app` is: `$BISE_CU_HELPER`, the app root
/// (`$BISE_APP_ROOT`), next to this executable (the helper ships in the
/// version dir), its install's `current`, then /Applications and
/// ~/Applications. Opened by path (`open -g <path>`): it registers the app
/// with LaunchServices, where a bundle id lookup would fail before its
/// first launch (cu-apps).
pub fn find_helper(home: &Path) -> Option<PathBuf> {
    let env = |k: &str| std::env::var_os(k).filter(|v| !v.is_empty()).map(PathBuf::from);
    let exe = std::env::current_exe().ok();
    let test = bise_home::env::test_setting("BISE_CU_HELPER").map(PathBuf::from);
    helper_candidates(test, env("BISE_APP_ROOT"), exe.as_deref(), home).into_iter().find(|p| p.is_dir())
}

/// [`find_helper`]'s places, in order (pure but for `canonicalize`). For
/// the executable, both as resolved (its own version first) and as named:
/// a pruned version dir no longer resolves, but its path still says the
/// install (`<prefix>/versions/<id>`), whose `current` has the helper of
/// the version in use.
pub fn helper_candidates(test: Option<PathBuf>, app_root: Option<PathBuf>, exe: Option<&Path>, home: &Path) -> Vec<PathBuf> {
    let app = format!("{}.app", HELPER_APP);
    let mut c: Vec<PathBuf> = Vec::new();
    c.extend(test);
    c.extend(app_root.map(|r| r.join(&app)));
    if let Some(exe) = exe {
        let resolved = exe.canonicalize().ok();
        for e in resolved.iter().map(PathBuf::as_path).chain([exe]) {
            let Some(dir) = e.parent() else { continue };
            c.push(bise_home::exe_home_dir(dir).join(&app));
            let version = bundle_root(dir).unwrap_or(dir);
            if let Some(prefix) = version.parent().filter(|v| v.file_name().is_some_and(|n| n == "versions")).and_then(Path::parent) {
                c.push(prefix.join("current").join(&app));
            }
        }
    }
    c.push(PathBuf::from("/Applications").join(&app));
    c.push(home.join("Applications").join(&app));
    let mut seen = std::collections::HashSet::new();
    c.retain(|p| seen.insert(p.clone()));
    c
}

/// `<root>/<x>.app/Contents/MacOS` -> `<root>`, by names only (the folder
/// may be gone; [`bise_home::exe_home_dir`] needs it there).
fn bundle_root(dir: &Path) -> Option<&Path> {
    let contents = dir.parent().filter(|_| dir.file_name().is_some_and(|n| n == "MacOS"))?;
    let app = contents.parent().filter(|_| contents.file_name().is_some_and(|n| n == "Contents"))?;
    app.file_name().filter(|n| n.to_string_lossy().ends_with(".app"))?;
    app.parent()
}

/// The helper's path: the cached one while it is there, else found again
/// (logged when it moves). None: not installed.
pub(super) fn helper_app(sh: &Shared) -> Option<PathBuf> {
    let mut cached = lock(&sh.helper_app);
    if cached.as_deref().is_some_and(Path::is_dir) {
        return cached.clone();
    }
    let found = (sh.opts.find_helper)(&sh.opts.paths.home);
    if found != *cached {
        let show = |p: &Option<PathBuf>| p.as_ref().map_or("none".to_string(), |p| p.display().to_string());
        log(&format!("helper app: {} is gone, now {}", show(&cached), show(&found)));
        *cached = found.clone();
    }
    found
}

pub(super) fn helper_installed(sh: &Shared) -> bool {
    helper_app(sh).is_some()
}

/// The cached path, for `full_status` (never looks again).
pub(super) fn helper_app_cached(sh: &Shared) -> Option<PathBuf> {
    lock(&sh.helper_app).clone()
}

pub(super) fn new_cache(opts: &super::Opts) -> Mutex<Option<PathBuf>> {
    Mutex::new(opts.helper_app.clone())
}

pub(super) fn connect_helper(sh: &Arc<Shared>) -> Option<()> {
    let s = UnixStream::connect(&sh.opts.paths.app_socket).ok()?;
    s.set_read_timeout(Some(Duration::from_secs(5))).ok()?;
    let rd = s.try_clone().ok()?;
    let mut lines = BufReader::new(rd).lines();
    let hello: Value = serde_json::from_str(&lines.next()?.ok()?).ok()?;
    let hello = hello.get("hello")?.clone();
    s.set_read_timeout(None).ok()?;
    let w: Writer = Arc::new(Mutex::new(s.try_clone().ok()?));
    let id = {
        let mut inner = lock(&sh.inner);
        inner.next += 1;
        let id = inner.next;
        inner.helper = Some(HelperLink { id, w, hello });
        inner.streams.push(s);
        id
    };
    log("helper connected");
    let sh2 = sh.clone();
    std::thread::spawn(move || {
        for line in lines {
            let Ok(line) = line else { break };
            if let Ok(msg) = serde_json::from_str::<Value>(&line) {
                incoming(&sh2, id, &msg);
            }
        }
        lock(&sh2.inner).helper.take_if(|h| h.id == id);
        fail_link(&sh2, id, err("no_helper", "the bise Computer Use app quit during the action; try again"));
        log("helper gone");
        write_state(&sh2);
    });
    write_state(sh);
    Some(())
}

/// The helper's link id: connected, else connect, else start it and wait.
pub(super) fn helper(sh: &Arc<Shared>) -> Result<u64, Value> {
    if let Some(h) = &lock(&sh.inner).helper {
        return Ok(h.id);
    }
    let _g = lock(&sh.helper_gate);
    let id = || lock(&sh.inner).helper.as_ref().map(|h| h.id);
    if let Some(i) = id() {
        return Ok(i);
    }
    let app = if sh.opts.launch_helper { helper_app(sh) } else { None };
    if let (None, Some(app)) = (connect_helper(sh), &app) {
        // -g: never in front (the user's rule: computer use never steals focus)
        sh.launches.fetch_add(1, Ordering::SeqCst);
        lock(&sh.launched).push(app.clone());
        let opened = std::process::Command::new(&sh.opts.opener)
            .arg("-g")
            .arg(app)
            .args(["--args", "--socket"])
            .arg(&sh.opts.paths.app_socket)
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
            .status();
        if !opened.as_ref().is_ok_and(|s| s.success()) {
            log(&format!("open -g {}: {:?}", app.display(), opened));
        }
        let t0 = Instant::now();
        while t0.elapsed() < sh.opts.helper_wait && connect_helper(sh).is_none() {
            std::thread::sleep(Duration::from_millis(200));
        }
    }
    id().ok_or_else(|| {
        if app.is_some() || !sh.opts.launch_helper {
            err("no_helper", "the bise Computer Use app doesn't answer; ask the user to run /computer-use")
        } else {
            err("no_helper", "the bise Computer Use app isn't installed; ask the user to run /computer-use")
        }
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    /// A broker started as `<prefix>/current/bise` from version `a`, then
    /// `a` pruned and `current` flipped to `b`: the helper is `b`'s, found
    /// through the named path and through the install's `current`.
    #[test]
    fn a_pruned_version_finds_the_helper_through_current() {
        let t = std::env::temp_dir().join(format!("cu-helper-find-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&t);
        let versions = t.join("versions");
        let app = format!("{}.app", HELPER_APP);
        std::fs::create_dir_all(versions.join("b").join(&app)).unwrap();
        std::os::unix::fs::symlink("versions/b", t.join("current")).unwrap();
        let home = t.join("home");
        let first = |exe: &Path| helper_candidates(None, None, Some(exe), &home).into_iter().find(|p| p.is_dir());
        let want = Some(t.join("current").join(&app));
        // named through `current` (how the shim starts it)
        let by_link = first(&t.join("current/bise"));
        assert_eq!(by_link.map(|p| p.canonicalize().unwrap()), Some(versions.join("b").join(&app).canonicalize().unwrap()));
        // the resolved path of the pruned version, as macOS may give it
        assert_eq!(first(&versions.join("a/bise")), want);
        // a pruned version that ran from a signed bundle (tcc-sign)
        assert_eq!(first(&versions.join("a/bise.app/Contents/MacOS/bise")), want);
        // its own version first while it is there
        std::fs::create_dir_all(versions.join("a").join(&app)).unwrap();
        assert_eq!(first(&versions.join("a/bise")), Some(versions.join("a").join(&app)));
        // no install around it: /Applications, ~/Applications (never a made-up current)
        let c = helper_candidates(None, None, Some(&t.join("x/bise")), &home);
        assert!(!c.iter().any(|p| p.ends_with(format!("current/{}", app))), "{c:?}");
        let _ = std::fs::remove_dir_all(&t);
    }
}
