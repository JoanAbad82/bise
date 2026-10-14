//! `bise office run <script.ts>`, `bise office inspect <file>`,
//! `bise office check <file>` (docs/office.md; plan §2, §9.2-3).
//!
//! The script runs in bend-jsrt's script mode (`rust/jsrt/src/script.rs`):
//! this module finds the engine and the bundle in the app root, gives it
//! its scope, and relays its lines (`bise_proto::office`):
//!
//! - the scope is the agent's worktree (`BEND_WORKDIR`, else the current
//!   folder) and its `$TMPDIR`, passed as `--root` arguments; jsrt's door
//!   checks every path against them and reads no environment for it;
//! - jsrt starts with `bise_home::env`'s [`Child::Script`] environment;
//! - a `wrote` line becomes the request `sb artifact add <path>` sends on
//!   `SB_SOCKET` (built by `switchboard::cli::build`), with `known_only`
//!   unless the script asked `{ artifact: true }`: whether the file is an
//!   artifact is the hub's call. Its words go back to jsrt (`run.write`
//!   resolves with them) and to stdout.
//!
//! stdout: the script's logs and the hub's words; stderr: the failure;
//! exit 1 on any failure.

use std::io::{BufRead, BufReader, Write};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::time::Duration;

use bise_home::env::Child;
use bise_proto::office::{HarnessCmd, JsrtEv};
use serde_json::{json, Value};

const USAGE: &str = "usage: bise office run <script.ts> | bise office inspect <file> | bise office check <file>

A script reads and writes files only under the agent's worktree (BEND_WORKDIR) and $TMPDIR.
Outside an agent there is no BEND_WORKDIR: the scope is the current folder, so run it from
your home and the script may use your whole home. docs/office.md";
/// Where the bundle sits in an app root (a version dir, the dev tree).
const BUNDLE: &str = "office/dist/office.js";

pub fn main(args: &[String]) -> i32 {
    let (mode, file) = match args {
        [m, f] if matches!(m.as_str(), "run" | "inspect" | "check") => (m.as_str(), f.as_str()),
        [h] if matches!(h.as_str(), "--help" | "-h" | "help") => {
            println!("{USAGE}");
            return 0;
        }
        _ => {
            eprintln!("{USAGE}");
            return 2;
        }
    };
    let root = match crate::approot::locate(BUNDLE) {
        Ok((r, _)) => r,
        Err(e) => {
            eprintln!("bise office: {e}");
            return 1;
        }
    };
    let Some(jsrt) = crate::approot::jsrt_bin(&root) else {
        eprintln!("bise office: no bend-jsrt in {}", root.display());
        return 1;
    };
    let cwd = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    let roots = roots(std::env::var("BEND_WORKDIR").ok(), &cwd, &std::env::temp_dir());
    let mut cmd = Command::new(&jsrt);
    cmd.args(jsrt_args(mode, file, &root.join(BUNDLE), &roots))
        .current_dir(&cwd)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::inherit());
    bise_home::env::for_child(Child::Script, std::iter::empty::<(&str, &str)>()).apply(&mut cmd);
    let mut child = match cmd.spawn() {
        Ok(c) => c,
        Err(e) => {
            eprintln!("bise office: {}: {e}", jsrt.display());
            return 1;
        }
    };
    let (Some(to_jsrt), Some(from_jsrt)) = (child.stdin.take(), child.stdout.take()) else {
        eprintln!("bise office: no pipe to bend-jsrt");
        return 1;
    };
    let hub = Hub::from_env();
    let end = relay(BufReader::new(from_jsrt), to_jsrt, |p, a| hub.tell(p, a), &mut std::io::stdout());
    let status = child.wait().ok().and_then(|s| s.code());
    match end {
        End::Done => 0,
        End::Failed(m) => {
            eprintln!("{m}");
            1
        }
        End::Silent => {
            eprintln!("bise office: bend-jsrt stopped without a word (exit {status:?}; out of memory?)");
            1
        }
    }
}

/// The folders a script may use: the worktree, then the tmp folder (once).
fn roots(workdir: Option<String>, cwd: &Path, tmp: &Path) -> Vec<PathBuf> {
    let work = workdir.filter(|w| !w.is_empty()).map(PathBuf::from).unwrap_or_else(|| cwd.to_path_buf());
    let mut out = vec![work];
    if !out.iter().any(|r| r == tmp) {
        out.push(tmp.to_path_buf());
    }
    out
}

fn jsrt_args(mode: &str, file: &str, bundle: &Path, roots: &[PathBuf]) -> Vec<String> {
    let mode = if mode == "run" { "script" } else { mode };
    let mut a = vec![mode.to_string(), file.to_string(), "--bundle".into(), bundle.to_string_lossy().to_string()];
    for r in roots {
        a.push("--root".into());
        a.push(r.to_string_lossy().to_string());
    }
    a.push("--host".into());
    a
}

/// How the script ended.
#[derive(Debug, PartialEq)]
enum End {
    Done,
    Failed(String),
    /// jsrt ended without `done` or `error` (killed, out of memory)
    Silent,
}

/// Read jsrt's lines until it ends: logs to `out`, each `wrote` told to
/// the hub (`tell`) and answered.
fn relay(from: impl BufRead, mut to: impl Write, mut tell: impl FnMut(&str, bool) -> HarnessCmd, out: &mut impl Write) -> End {
    for line in from.lines() {
        let Ok(line) = line else { break };
        match JsrtEv::decode(&line) {
            Ok(JsrtEv::Log { line }) => {
                let _ = writeln!(out, "{line}");
            }
            Ok(JsrtEv::Wrote { path, artifact }) => {
                let answer = tell(&path, artifact);
                if let HarnessCmd::Answer { text, .. } = &answer {
                    if !text.is_empty() {
                        let _ = writeln!(out, "{text}");
                    }
                }
                let _ = writeln!(to, "{}", answer.to_value());
                let _ = to.flush();
            }
            Ok(JsrtEv::Done) => return End::Done,
            Ok(JsrtEv::Error { message }) => return End::Failed(message),
            // a newer engine's line, or not a line of ours: shown as it is
            Ok(JsrtEv::Unknown { .. }) | Err(_) => {
                let _ = writeln!(out, "{line}");
            }
        }
        let _ = out.flush();
    }
    End::Silent
}

/// The hub of the agent that runs the script, when there is one.
struct Hub {
    socket: Option<(String, String)>,
}

impl Hub {
    fn from_env() -> Hub {
        let var = |k: &str| std::env::var(k).ok().filter(|v| !v.is_empty());
        Hub { socket: var("SB_SOCKET").zip(var("SB_AGENT")) }
    }

    /// `sb artifact add <path>`'s request, the answer's words.
    fn tell(&self, path: &str, artifact: bool) -> HarnessCmd {
        let Some((socket, agent)) = &self.socket else {
            return HarnessCmd::Answer { ok: true, text: format!("{path}: written; no bise agent here (no SB_SOCKET), so not an artifact") };
        };
        let reply = add_request(path, artifact, agent).and_then(|req| {
            switchboard::client::request_retry(Path::new(socket), &req, Duration::from_secs(180), false)
        });
        answer_of(reply)
    }
}

/// The request `sb artifact add <path>` sends, as `agent`; `known_only`
/// unless the script asked for a new artifact.
fn add_request(path: &str, artifact: bool, agent: &str) -> Result<Value, String> {
    let mut req = switchboard::cli::build(&["artifact".into(), "add".into(), path.into()])?;
    req["op"] = json!("agent");
    req["from"] = json!(agent);
    if !artifact {
        req["known_only"] = json!(true);
    }
    Ok(req)
}

fn answer_of(reply: Result<Value, String>) -> HarnessCmd {
    match reply {
        Ok(v) if v.get("ok") == Some(&json!(true)) => {
            HarnessCmd::Answer { ok: true, text: v.get("text").and_then(Value::as_str).unwrap_or("").to_string() }
        }
        Ok(v) => HarnessCmd::Answer { ok: false, text: v.get("error").and_then(Value::as_str).unwrap_or("the hub said no").to_string() },
        Err(e) => HarnessCmd::Answer { ok: false, text: e },
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_scope_is_the_worktree_then_tmp() {
        let (cwd, tmp) = (Path::new("/w/sub"), Path::new("/t"));
        assert_eq!(roots(Some("/w".into()), cwd, tmp), vec![PathBuf::from("/w"), "/t".into()]);
        assert_eq!(roots(None, cwd, tmp), vec![PathBuf::from("/w/sub"), "/t".into()]);
        assert_eq!(roots(Some(String::new()), cwd, tmp)[0], PathBuf::from("/w/sub"));
        assert_eq!(roots(Some("/t".into()), cwd, tmp), vec![PathBuf::from("/t")]);
    }

    #[test]
    fn jsrt_gets_the_mode_the_bundle_the_roots_and_host() {
        let a = jsrt_args("run", "s.ts", Path::new("/app/office/dist/office.js"), &["/w".into(), "/t".into()]);
        assert_eq!(a, ["script", "s.ts", "--bundle", "/app/office/dist/office.js", "--root", "/w", "--root", "/t", "--host"]);
        assert_eq!(jsrt_args("check", "q.xlsx", Path::new("/b"), &["/w".into()])[0], "check");
    }

    /// The exact request `sb artifact add` sends, plus `known_only` for a
    /// plain `run.write` (architect m_23785).
    #[test]
    fn a_write_is_the_sb_artifact_add_request() {
        let r = add_request("/w/q3.pptx", false, "deck").unwrap();
        assert_eq!((r["cmd"].as_str(), r["do"].as_str(), r["target"].as_str()), (Some("artifact"), Some("add"), Some("/w/q3.pptx")));
        assert_eq!((r["op"].as_str(), r["from"].as_str(), r["known_only"].as_bool()), (Some("agent"), Some("deck"), Some(true)));
        let r = add_request("/w/q3.pptx", true, "deck").unwrap();
        assert!(r.get("known_only").is_none());
    }

    #[test]
    fn the_hubs_reply_becomes_the_answer() {
        let ok = answer_of(Ok(json!({"ok": true, "text": "added q3 (slides) · v1"})));
        assert_eq!(ok, HarnessCmd::Answer { ok: true, text: "added q3 (slides) · v1".into() });
        assert_eq!(answer_of(Ok(json!({"ok": false, "error": "no file"}))), HarnessCmd::Answer { ok: false, text: "no file".into() });
        assert_eq!(answer_of(Err("hub absent".into())), HarnessCmd::Answer { ok: false, text: "hub absent".into() });
    }

    #[test]
    fn relays_logs_writes_and_the_end() {
        let lines = [
            r#"{"ev":"log","line":"3 slides"}"#,
            r#"{"ev":"wrote","path":"/w/q3.pptx"}"#,
            r#"{"ev":"progress","n":1}"#,
            r#"{"ev":"done"}"#,
            r#"{"ev":"log","line":"never read"}"#,
        ]
        .join("\n");
        let (mut to, mut out, mut told) = (Vec::new(), Vec::new(), Vec::new());
        let end = relay(lines.as_bytes(), &mut to, |p, a| {
            told.push((p.to_string(), a));
            HarnessCmd::Answer { ok: true, text: "q3 · v2".into() }
        }, &mut out);
        assert_eq!(end, End::Done);
        assert_eq!(told, [("/w/q3.pptx".to_string(), false)]);
        assert_eq!(String::from_utf8(to).unwrap(), "{\"cmd\":\"answer\",\"ok\":true,\"text\":\"q3 · v2\"}\n");
        assert_eq!(String::from_utf8(out).unwrap(), "3 slides\nq3 · v2\n{\"ev\":\"progress\",\"n\":1}\n");
        let end = relay(r#"{"ev":"error","message":"run.read: no file at x"}"#.as_bytes(), Vec::new(), |_, _| unreachable!(), &mut Vec::new());
        assert_eq!(end, End::Failed("run.read: no file at x".into()));
        assert_eq!(relay(&b""[..], Vec::new(), |_, _| unreachable!(), &mut Vec::new()), End::Silent);
    }
}
