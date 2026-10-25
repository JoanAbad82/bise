//! The REPL a bridge serves (`plugins serve --parent PID`), and the one
//! way the bridge learns it is gone: [`Parent::watch`].
//!
//! The bridge is started detached (`nohup ... &` from a sh that exits at
//! once), so its parent is launchd from the start: no `PR_SET_PDEATHSIG`,
//! no pipe from the REPL. It watches the REPL's pid instead, by event:
//! kqueue `EVFILT_PROC`/`NOTE_EXIT` on macOS, a pidfd on Linux, the exit
//! seen within milliseconds however the REPL ends (a stop, a signal, a
//! crash). Only where neither exists, a `kill(0)` poll every [`POLL`].
//!
//! A pid the system reused is not the parent: the start time (`ps
//! lstart`) is read at [`Parent::new`] and compared again right after
//! the watch is registered (the window where the REPL dies and its pid
//! is reused before the registration); once registered, the event is
//! that process's own. Release-53 (agents/new): a bridge left after the
//! app closed, its 500 ms poll still asleep.

use std::sync::mpsc::Sender;
use std::time::Duration;

/// The poll of the fallback (no kqueue, no pidfd).
pub const POLL: Duration = Duration::from_millis(500);
/// How often the fallback reads the parent's start time again (one `ps`).
const IDENTITY_EVERY: u64 = 20;

/// The REPL, by pid and start time.
pub struct Parent {
    pid: u32,
    started: Option<String>,
}

impl Parent {
    pub fn new(pid: u32) -> Parent {
        Parent { pid, started: started(pid) }
    }

    /// `deep`: compare the start time too (a reused pid is not it).
    pub fn alive(&self, deep: bool) -> bool {
        let Ok(p) = i32::try_from(self.pid) else { return false };
        // SAFETY: kill(2) with signal 0 only checks; a positive pid
        if p <= 0 || unsafe { libc::kill(p, 0) } != 0 {
            return false;
        }
        !deep || self.started.is_none() || started(self.pid) == self.started
    }

    /// Send one `()` on `gone` when the parent exits (at once when it is
    /// already gone or its pid is another process now), from a thread
    /// of its own.
    pub fn watch(self, gone: Sender<()>) {
        std::thread::spawn(move || {
            if exit_event(&self) == Watch::Unsupported {
                self.poll();
            }
            let _ = gone.send(());
        });
    }

    /// The fallback: until `alive` says no.
    fn poll(&self) {
        let mut tick = 0u64;
        while self.alive(tick.is_multiple_of(IDENTITY_EVERY)) {
            std::thread::sleep(POLL);
            tick += 1;
        }
    }
}

#[derive(Debug, PartialEq)]
enum Watch {
    /// the parent exited (or was already gone, or is not it any more)
    Gone,
    /// no event here: poll
    Unsupported,
}

fn errno() -> i32 {
    std::io::Error::last_os_error().raw_os_error().unwrap_or(0)
}

/// Block until the parent's exit event (macOS: kqueue NOTE_EXIT).
#[cfg(any(target_os = "macos", target_os = "ios", target_os = "freebsd"))]
fn exit_event(p: &Parent) -> Watch {
    let Ok(pid) = i32::try_from(p.pid) else { return Watch::Gone };
    if pid <= 0 {
        return Watch::Gone;
    }
    // SAFETY: a kqueue of our own, closed on every path below; the
    // kevent structs are plain data, zeroed then filled
    unsafe {
        let kq = libc::kqueue();
        if kq < 0 {
            return Watch::Unsupported;
        }
        let mut ev: libc::kevent = std::mem::zeroed();
        ev.ident = pid as libc::uintptr_t;
        ev.filter = libc::EVFILT_PROC;
        ev.flags = libc::EV_ADD | libc::EV_ONESHOT;
        ev.fflags = libc::NOTE_EXIT;
        if libc::kevent(kq, &ev, 1, std::ptr::null_mut(), 0, std::ptr::null()) < 0 {
            let e = errno();
            libc::close(kq);
            return if e == libc::ESRCH { Watch::Gone } else { Watch::Unsupported };
        }
        // registered: the pid is the parent's only if its start time
        // still is (it may have died and been reused before)
        if !p.alive(true) {
            libc::close(kq);
            return Watch::Gone;
        }
        let mut out: libc::kevent = std::mem::zeroed();
        loop {
            let n = libc::kevent(kq, std::ptr::null(), 0, &mut out, 1, std::ptr::null());
            if n > 0 {
                break;
            }
            if n < 0 && errno() != libc::EINTR {
                libc::close(kq);
                return Watch::Unsupported;
            }
        }
        libc::close(kq);
        Watch::Gone
    }
}

/// Block until the parent's pidfd is readable (Linux 5.3+: it exited).
#[cfg(any(target_os = "linux", target_os = "android"))]
fn exit_event(p: &Parent) -> Watch {
    let Ok(pid) = i32::try_from(p.pid) else { return Watch::Gone };
    if pid <= 0 {
        return Watch::Gone;
    }
    // SAFETY: a pidfd of our own, closed on every path below
    unsafe {
        let fd = libc::syscall(libc::SYS_pidfd_open, pid, 0) as i32;
        if fd < 0 {
            return if errno() == libc::ESRCH { Watch::Gone } else { Watch::Unsupported };
        }
        if !p.alive(true) {
            libc::close(fd);
            return Watch::Gone;
        }
        let mut pfd = libc::pollfd { fd, events: libc::POLLIN, revents: 0 };
        loop {
            let n = libc::poll(&mut pfd, 1, -1);
            if n > 0 {
                break;
            }
            if n < 0 && errno() != libc::EINTR {
                libc::close(fd);
                return Watch::Unsupported;
            }
        }
        libc::close(fd);
        Watch::Gone
    }
}

#[cfg(not(any(target_os = "macos", target_os = "ios", target_os = "freebsd", target_os = "linux", target_os = "android")))]
fn exit_event(_: &Parent) -> Watch {
    Watch::Unsupported
}

/// A process's start time as `ps` says it (None: gone or unreadable).
fn started(pid: u32) -> Option<String> {
    let o = std::process::Command::new("ps")
        .args(["-p", &pid.to_string(), "-o", "lstart="])
        .stderr(std::process::Stdio::null())
        .output()
        .ok()?;
    let s = String::from_utf8_lossy(&o.stdout).trim().to_string();
    (!s.is_empty()).then_some(s)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::mpsc::channel;
    use std::time::Instant;

    #[test]
    fn the_parent_is_its_pid_and_its_start_time() {
        let mut c = std::process::Command::new("sleep").arg("30").spawn().unwrap();
        let p = Parent::new(c.id());
        assert!(p.started.is_some());
        assert!(p.alive(false) && p.alive(true));
        // the same pid with another start time: a reused pid, not it
        let other = Parent { pid: c.id(), started: Some("Thu Jan  1 00:00:00 1970".into()) };
        assert!(other.alive(false) && !other.alive(true));
        c.kill().unwrap();
        c.wait().unwrap();
        assert!(!p.alive(false) && !p.alive(true));
    }

    /// The exit is an event: seen long before the fallback's poll would
    /// have looked twice, and nothing before it.
    #[test]
    fn the_watch_fires_when_the_parent_exits_and_not_before() {
        let mut c = std::process::Command::new("sleep").arg("30").spawn().unwrap();
        let (tx, rx) = channel();
        Parent::new(c.id()).watch(tx);
        assert!(rx.recv_timeout(Duration::from_millis(300)).is_err(), "fired while the parent lives");
        let t0 = Instant::now();
        c.kill().unwrap();
        // not reaped yet: a zombie has exited, kill(0) still finds it
        rx.recv_timeout(Duration::from_secs(2)).expect("the exit seen");
        assert!(t0.elapsed() < Duration::from_secs(2));
        c.wait().unwrap();
    }

    #[test]
    fn a_parent_already_gone_or_reused_fires_at_once() {
        let mut c = std::process::Command::new("sleep").arg("30").spawn().unwrap();
        let (tx, rx) = channel();
        // alive, but with another start time: the pid is someone else's
        Parent { pid: c.id(), started: Some("Thu Jan  1 00:00:00 1970".into()) }.watch(tx);
        rx.recv_timeout(Duration::from_secs(2)).expect("a reused pid is not the parent");
        let gone = Parent::new(c.id());
        c.kill().unwrap();
        c.wait().unwrap();
        let (tx, rx) = channel();
        gone.watch(tx);
        rx.recv_timeout(Duration::from_secs(2)).expect("a dead parent");
    }
}
