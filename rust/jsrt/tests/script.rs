// bend-jsrt's script mode (src/script.rs), run as `bise office run` runs
// it: the real bundle (office/dist/office.js), the door's roots, and the
// host's part played here (each `wrote` line answered on stdin).

use std::io::{BufRead, BufReader, Write};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};

use serde_json::json;

fn repo() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../..")
}

fn bundle() -> PathBuf {
    repo().join("office/dist/office.js")
}

struct Dir(PathBuf);

impl Drop for Dir {
    fn drop(&mut self) {
        let _ = std::fs::remove_dir_all(&self.0);
    }
}

/// A worktree (`work`, the script's folder), a tmp root and a folder
/// outside both.
fn scratch(name: &str) -> (Dir, PathBuf, PathBuf, PathBuf) {
    let top = std::env::temp_dir().join(format!("jsrt-script-{}-{name}", std::process::id()));
    let _ = std::fs::remove_dir_all(&top);
    let (work, tmp, out) = (top.join("work"), top.join("tmp"), top.join("out"));
    for d in [&work, &tmp, &out] {
        std::fs::create_dir_all(d).unwrap();
    }
    (Dir(top), work, tmp, out)
}

/// Run `mode` on `file` in `work`; answer each `wrote` with `answer`.
/// The exit code and every stdout line.
fn run(mode: &str, file: &str, work: &Path, tmp: &Path, answer: &str) -> (i32, Vec<String>) {
    let mut child = Command::new(env!("CARGO_BIN_EXE_bend-jsrt"))
        .args([mode, file, "--bundle"])
        .arg(bundle())
        .arg("--root")
        .arg(work)
        .arg("--root")
        .arg(tmp)
        .arg("--host")
        .current_dir(work)
        .env_clear()
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()
        .unwrap();
    let mut to = child.stdin.take().unwrap();
    let mut lines = Vec::new();
    for l in BufReader::new(child.stdout.take().unwrap()).lines() {
        let l = l.unwrap();
        if l.contains(r#""ev":"wrote""#) {
            writeln!(to, "{answer}").unwrap();
            to.flush().unwrap();
        }
        lines.push(l);
    }
    (child.wait().unwrap().code().unwrap_or(-1), lines)
}

fn script(work: &Path, code: &str) -> String {
    std::fs::write(work.join("s.ts"), code).unwrap();
    "s.ts".into()
}

const OK: &str = r#"{"cmd":"answer","ok":true,"text":"added copy (doc) · v1"}"#;

#[test]
fn a_script_reads_a_file_and_writes_one_the_host_hears_of() {
    let (_d, work, tmp, _) = scratch("rw");
    std::fs::copy(repo().join("office/fixtures/tiny.docx"), work.join("tiny.docx")).unwrap();
    let s = script(&work, r#"
import { run, kindOf } from "@bise/office";
const bytes: Uint8Array = await run.read("tiny.docx");
console.log("kind", kindOf(bytes), bytes.length > 0);
const said = await run.write("copy.docx", bytes, { artifact: true });
console.log("hub:", said);
await run.write("plain.docx", bytes);
"#);
    let (code, lines) = run("script", &s, &work, &tmp, OK);
    assert_eq!(code, 0, "{lines:?}");
    let real = work.canonicalize().unwrap();
    let path = |f: &str| real.join(f).to_string_lossy().to_string();
    let got: Vec<serde_json::Value> = lines.iter().map(|l| serde_json::from_str(l).unwrap()).collect();
    assert_eq!(
        got,
        [
            json!({"ev": "log", "line": "kind docx true"}),
            json!({"ev": "wrote", "path": path("copy.docx"), "artifact": true}),
            json!({"ev": "log", "line": "hub: added copy (doc) · v1"}),
            json!({"ev": "wrote", "path": path("plain.docx")}),
            json!({"ev": "done"}),
        ]
    );
    assert_eq!(std::fs::read(work.join("copy.docx")).unwrap(), std::fs::read(work.join("tiny.docx")).unwrap());
}

#[test]
fn a_door_refusal_fails_the_script_with_the_roots() {
    let (_d, work, tmp, out) = scratch("door");
    std::fs::write(out.join("his.xlsx"), b"x").unwrap();
    let s = script(&work, &format!(r#"
import {{ run }} from "@bise/office";
await run.read({:?});
"#, out.join("his.xlsx").to_str().unwrap()));
    let (code, lines) = run("script", &s, &work, &tmp, OK);
    assert_eq!(code, 1);
    let last = lines.last().unwrap();
    assert!(last.starts_with(r#"{"ev":"error","message":"Error: run.read: "#) && last.contains("is outside; a script may only use files under"), "{last}");
    assert!(last.contains(work.to_str().unwrap()) && last.contains(tmp.to_str().unwrap()), "{last}");
}

#[test]
fn the_host_refusal_is_a_failed_write_with_its_words() {
    let (_d, work, tmp, _) = scratch("host-no");
    let s = script(&work, r#"
import { run } from "@bise/office";
try { await run.write("a.xlsx", new Uint8Array([1, 2])); } catch (e) { console.log(String(e.message)); }
"#);
    let (code, lines) = run("script", &s, &work, &tmp, r#"{"cmd":"answer","ok":false,"text":"hub absent"}"#);
    assert_eq!(code, 0, "{lines:?}");
    assert!(lines[1].contains("a.xlsx is written, but bise made no version of it: hub absent"), "{lines:?}");
    assert_eq!(std::fs::read(work.join("a.xlsx")).unwrap(), [1, 2]);
}

#[test]
fn only_the_office_bundle_can_be_imported() {
    let (_d, work, tmp, _) = scratch("import");
    let s = script(&work, "import fs from \"node:fs\";\nconsole.log(fs);\n");
    let (code, lines) = run("script", &s, &work, &tmp, OK);
    assert_eq!(code, 1);
    assert!(lines.last().unwrap().contains(r#"a script may only import \"@bise/office\", not \"node:fs\""#), "{lines:?}");
}

/// No timers in script mode (architect m_23800): a library that needs one
/// fails here, loudly; the script sees no node or web globals either.
#[test]
fn script_mode_has_no_timers_and_no_host_globals() {
    let (_d, work, tmp, _) = scratch("no-timers-script");
    let s = script(&work, r#"
const g = globalThis as any;
console.log(["setTimeout", "setInterval", "setImmediate", "queueMicrotask", "clearTimeout", "process", "require", "fetch", "Deno"].filter((k) => g[k] !== undefined).join(",") || "none");
"#);
    let (code, lines) = run("script", &s, &work, &tmp, OK);
    assert_eq!(code, 0, "{lines:?}");
    assert_eq!(lines[0], r#"{"ev":"log","line":"none"}"#);
    let s = script(&work, "setTimeout(() => {}, 1);\n");
    let (code, lines) = run("script", &s, &work, &tmp, OK);
    assert_eq!(code, 1);
    assert!(lines.last().unwrap().contains("setTimeout is not defined"), "{lines:?}");
}

#[test]
fn a_promise_that_never_settles_fails() {
    let (_d, work, tmp, _) = scratch("stuck");
    let s = script(&work, "await new Promise(() => {});\n");
    let (code, lines) = run("script", &s, &work, &tmp, OK);
    assert_eq!(code, 1);
    assert!(lines.last().unwrap().contains("waits for something that never comes"), "{lines:?}");
}

#[test]
fn inspect_refuses_a_file_that_is_no_office_file() {
    let (_d, work, tmp, _) = scratch("inspect");
    std::fs::write(work.join("notes.txt"), b"plain words").unwrap();
    let (code, lines) = run("inspect", "notes.txt", &work, &tmp, OK);
    assert_eq!(code, 1);
    assert!(lines.last().unwrap().contains("notes.txt is not an xlsx, pptx or docx file"), "{lines:?}");
}

#[test]
fn a_missing_bundle_names_its_path() {
    let (_d, work, tmp, _) = scratch("bundle");
    let out = Command::new(env!("CARGO_BIN_EXE_bend-jsrt"))
        .args(["script", "s.ts", "--bundle", "/nowhere/office.js", "--root"])
        .arg(&work)
        .arg("--root")
        .arg(&tmp)
        .current_dir(&work)
        .output()
        .unwrap();
    assert_eq!(out.status.code(), Some(1));
    assert!(String::from_utf8_lossy(&out.stdout).contains("the office bundle /nowhere/office.js can't be read"));
}

/// The timers are script mode's only: run_typescript's isolate has none.
#[test]
fn run_typescript_still_has_no_timers() {
    let (_d, work, _, _) = scratch("no-timers");
    let prog = work.join("prog.ts");
    std::fs::write(&prog, "return [globalThis.setTimeout, globalThis.setInterval, globalThis.setImmediate, globalThis.queueMicrotask].every((t) => t === undefined) ? 'none' : 'some';").unwrap();
    let res = work.join("results.json");
    std::fs::write(&res, "").unwrap();
    let out = Command::new(env!("CARGO_BIN_EXE_bend-jsrt")).arg(&prog).arg(&res).current_dir(&work).output().unwrap();
    assert_eq!(String::from_utf8_lossy(&out.stdout).trim(), "none", "{}", String::from_utf8_lossy(&out.stderr));
}
