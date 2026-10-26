//! The I/O of a local site's recipe (site-revive; the decisions are
//! `artifacts_serve`'s, pure): who listens on a port (lsof, parsed by
//! `proto_view::processes`, no second parser), its argv (macOS
//! `KERN_PROCARGS2`, Linux `/proc/<pid>/cmdline`) and folder, and the
//! bytes its `GET /` answers. Called off the hub's loop: by the add's
//! thread (daemon/art.rs) and by the page server's door
//! (pages/artifact/live.rs). Reads only: starting a server is
//! daemon/revive.rs's.

use crate::artifacts_serve::{self as serve, Holder, Serve};
use crate::proto_view::processes as pv;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::time::Duration;

/// `GET /`'s body, at most this much (a bigger index.html is no static
/// site we copy anyway).
const BODY_MAX: u64 = 8 * 1024 * 1024;

fn run(cmd: &str, args: &[&str]) -> String {
    Command::new(cmd)
        .args(args)
        .stdin(Stdio::null())
        .stderr(Stdio::null())
        .output()
        .map(|o| String::from_utf8_lossy(&o.stdout).to_string())
        .unwrap_or_default()
}

/// The process listening on `port`, with its argv and folder; None:
/// nothing listens (or lsof is missing, or it is not ours to read).
pub fn listening(port: u16) -> Option<(u32, Vec<String>, String)> {
    let out = run("lsof", &["-nP", &format!("-iTCP:{port}"), "-sTCP:LISTEN", "-Fpn"]);
    let pid = serve::listener(&pv::lsof_ports(&out), port)?;
    let files = pv::lsof_files(&run("lsof", &["-nP", "-a", "-p", &pid.to_string(), "-d", "cwd", "-Fpftn"]));
    let cwd = files.get(&pid)?.cwd.clone()?;
    let argv = argv_of(pid)?;
    Some((pid, argv, cwd))
}

/// Who holds the recipe's port now.
pub fn holder(s: &Serve) -> Holder {
    serve::holder(s, listening(s.port).map(|(_, argv, cwd)| (argv, cwd)))
}

#[cfg(target_os = "macos")]
fn argv_of(pid: u32) -> Option<Vec<String>> {
    let mut mib = [libc::CTL_KERN, libc::KERN_PROCARGS2, pid as libc::c_int];
    let mut size: libc::size_t = 0;
    // SAFETY: a size query, then a read into a buffer of that size
    unsafe {
        if libc::sysctl(mib.as_mut_ptr(), 3, std::ptr::null_mut(), &mut size, std::ptr::null_mut(), 0) != 0 {
            return None;
        }
        let mut buf = vec![0u8; size];
        if libc::sysctl(mib.as_mut_ptr(), 3, buf.as_mut_ptr().cast(), &mut size, std::ptr::null_mut(), 0) != 0 {
            return None;
        }
        buf.truncate(size);
        serve::procargs2(&buf)
    }
}

#[cfg(not(target_os = "macos"))]
fn argv_of(pid: u32) -> Option<Vec<String>> {
    Some(serve::cmdline(&std::fs::read(format!("/proc/{pid}/cmdline")).ok()?)).filter(|a| !a.is_empty())
}

/// The body of `GET /` on `port` when it answers 200 with a plain body
/// (no chunks); None otherwise.
pub fn get_root(port: u16) -> Option<Vec<u8>> {
    let addr = std::net::SocketAddr::from(([127, 0, 0, 1], port));
    let mut s = std::net::TcpStream::connect_timeout(&addr, Duration::from_millis(800)).ok()?;
    s.set_read_timeout(Some(Duration::from_secs(3))).ok()?;
    s.write_all(format!("GET / HTTP/1.0\r\nHost: 127.0.0.1:{port}\r\nConnection: close\r\n\r\n").as_bytes()).ok()?;
    let mut out = Vec::new();
    s.take(BODY_MAX).read_to_end(&mut out).ok()?;
    let at = out.windows(4).position(|w| w == b"\r\n\r\n")?;
    let head = String::from_utf8_lossy(&out[..at]).to_ascii_lowercase();
    let ok = head.lines().next().is_some_and(|l| l.split_whitespace().nth(1) == Some("200"));
    (ok && !head.contains("transfer-encoding: chunked")).then(|| out[at + 4..].to_vec())
}

/// What the add keeps for a local link: its recipe, and the folder a
/// static site serves (bise copies it). None: not a local link, or
/// nothing listens there now.
pub fn recipe(link: &str) -> Option<(Serve, Option<PathBuf>)> {
    let port = serve::local_port(link)?;
    let (_, argv, cwd) = listening(port)?;
    let root = get_root(port).and_then(|body| serve::static_root(&body, Path::new(&cwd), |p| std::fs::read(p).ok()));
    Some((Serve { argv, cwd, port }, root))
}

/// Whether `pid` still runs.
pub fn alive(pid: u32) -> bool {
    // SAFETY: signal 0 only asks
    pid > 0 && unsafe { libc::kill(pid as libc::pid_t, 0) } == 0
}

/// The last `n` lines of a file (a revived server's output).
pub fn tail(file: &Path, n: usize) -> String {
    let text = std::fs::read_to_string(file).unwrap_or_default();
    let lines: Vec<&str> = text.lines().collect();
    lines[lines.len().saturating_sub(n)..].join("\n")
}
