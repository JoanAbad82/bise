//! `/running`'s ⏎ on a background job whose output file is on this
//! machine: the TUI steps aside and `less -R +F <file>` takes the
//! terminal (a real pager: it follows the end, ctrl+c stops following,
//! / searches, q quits), then the TUI comes back as it was. The screen
//! asks ([`ask`]); the UI loop runs it between two frames ([`run_if_asked`]).
//!
//! While less runs, bise ignores SIGINT and SIGQUIT (ctrl+c in less goes
//! to the whole foreground group, bise included); less gets the default
//! handlers back before it starts. Its prompt is the process's head
//! (`pnpm dev  perf · storefront · ∿ running · 14 min · …`).

use std::path::PathBuf;
use std::sync::Mutex;

/// The file and the head asked for, until the loop takes them.
static ASKED: Mutex<Option<(PathBuf, String)>> = Mutex::new(None);

/// `less` on `file` with `head` as its prompt, before the next frame.
pub(crate) fn ask(file: PathBuf, head: String) {
    if let Ok(mut a) = ASKED.lock() {
        *a = Some((file, head));
    }
}

/// What [`ask`] left, taken (tests read it too).
pub(crate) fn take() -> Option<(PathBuf, String)> {
    ASKED.lock().ok().and_then(|mut a| a.take())
}

/// `less`'s prompt for `head`: its `?`, `:`, `.`, `%` and `\` escaped
/// (they are the prompt language's), then where it is in the file.
pub(crate) fn prompt(head: &str) -> String {
    let mut out = String::with_capacity(head.len() + 16);
    for c in head.chars() {
        if matches!(c, '?' | ':' | '.' | '%' | '\\') {
            out.push('\\');
        }
        out.push(c);
    }
    out
}

/// The command line: `less -R +F -P<prompt> <file>`.
pub(crate) fn argv(file: &std::path::Path, head: &str) -> Vec<String> {
    vec!["less".into(), "-R".into(), "+F".into(), format!("-Ps{}", prompt(head)), "--".into(), file.to_string_lossy().into_owned()]
}

/// Runs what [`ask`] left, if anything: the terminal back to its own
/// modes, less in front until it quits, the TUI's modes again and a
/// whole redraw. True when it ran (the loop draws again).
pub(crate) fn run_if_asked(terminal: &mut crate::links::Tui) -> std::io::Result<bool> {
    let Some((file, head)) = take() else { return Ok(false) };
    crate::crash::restore_terminal();
    let ran = run(&argv(&file, &head));
    crate::run::enter_ui_modes()?;
    terminal.clear()?;
    if let Err(e) = ran {
        crate::crash::note(format!("less: {e}"));
    }
    Ok(true)
}

#[cfg(unix)]
fn run(argv: &[String]) -> std::io::Result<()> {
    use std::os::unix::process::CommandExt;
    let mut c = std::process::Command::new(&argv[0]);
    c.args(&argv[1..]);
    // SAFETY: signal() is async-signal-safe; the child only resets two
    // handlers before its exec
    unsafe {
        c.pre_exec(|| {
            libc::signal(libc::SIGINT, libc::SIG_DFL);
            libc::signal(libc::SIGQUIT, libc::SIG_DFL);
            Ok(())
        });
    }
    // SAFETY: bise ignores the two while less runs, then takes its own back
    let (int, quit) = unsafe { (libc::signal(libc::SIGINT, libc::SIG_IGN), libc::signal(libc::SIGQUIT, libc::SIG_IGN)) };
    let r = c.status().map(|_| ());
    unsafe {
        libc::signal(libc::SIGINT, int);
        libc::signal(libc::SIGQUIT, quit);
    }
    r
}

#[cfg(not(unix))]
fn run(argv: &[String]) -> std::io::Result<()> {
    std::process::Command::new(&argv[0]).args(&argv[1..]).status().map(|_| ())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_prompt_escapes_less_s_own_marks() {
        assert_eq!(prompt("pnpm dev  perf · localhost:5173 · cpu 12% · a.b?"), "pnpm dev  perf · localhost\\:5173 · cpu 12\\% · a\\.b\\?");
        let a = argv(std::path::Path::new("/h/agents/perf/tmp/bg/3.out"), "x");
        assert_eq!(a, ["less", "-R", "+F", "-Psx", "--", "/h/agents/perf/tmp/bg/3.out"]);
    }
}
