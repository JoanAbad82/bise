// A failed tool call inside a program rejects that call's promise (a
// ToolError carrying the whole failure text) instead of ending the
// program. The host (bend/runtime/main.bend) records a failure as
// {"error": text} in the results file and re-runs the program; these
// tests play the host's part, round by round: exit 42 = the next tool
// request, 0 = the program's value, 43 = the program failed.

use std::path::PathBuf;
use std::process::Command;

fn scratch(name: &str) -> PathBuf {
    let dir = std::env::temp_dir().join(format!("jsrt-tool-reject-{}-{name}", std::process::id()));
    let _ = std::fs::remove_dir_all(&dir);
    std::fs::create_dir_all(&dir).unwrap();
    dir
}

// one round with these recorded results: (exit code, stdout)
fn round(dir: &PathBuf, program: &str, results: &str) -> (i32, String) {
    let prog = dir.join("prog.ts");
    let res = dir.join("results.json");
    std::fs::write(&prog, program).unwrap();
    std::fs::write(&res, results).unwrap();
    let out = Command::new(env!("CARGO_BIN_EXE_bend-jsrt"))
        .arg(&prog)
        .arg(&res)
        .current_dir(dir)
        .output()
        .unwrap();
    (out.status.code().unwrap_or(-1), String::from_utf8_lossy(&out.stdout).trim().to_string())
}

// the failure text mcp-errors (1512faac) builds for a masked gateway error
const FAIL: &str = "mcp tool error: google_drive_mcp.search_files answered: Error calling tool 'search_files'\nsent: {\"query\":\"a\"}\nparameters: query (string|null), page_size (integer|null)";

fn fail_entry() -> String {
    format!("{{\"error\": {}}}", serde_json_str(FAIL))
}

fn serde_json_str(s: &str) -> String {
    let mut o = String::from("\"");
    for c in s.chars() {
        match c {
            '"' => o.push_str("\\\""),
            '\\' => o.push_str("\\\\"),
            '\n' => o.push_str("\\n"),
            c => o.push(c),
        }
    }
    o.push('"');
    o
}

const ALL_SETTLED: &str = r#"
async function main() {
  const qs = ['a', 'b'];
  const rs = await Promise.allSettled(qs.map((q) => tools.google_drive_mcp.search_files({ query: q })));
  return rs.map((r) => r.status === 'fulfilled'
    ? 'ok ' + r.value
    : 'err ' + r.reason.name + ' ' + r.reason.tool + ' ' + r.reason.message);
}
"#;

#[test]
fn all_settled_gets_the_failure_and_the_success() {
    let dir = scratch("settled");
    // round 1: the first call goes out
    let (code, out) = round(&dir, ALL_SETTLED, "[]");
    assert_eq!(code, 42, "{out}");
    assert!(out.contains("google_drive_mcp.search_files") && out.contains("\"a\""), "{out}");
    // round 2: the first failed; the program goes on to the second call
    let (code, out) = round(&dir, ALL_SETTLED, &format!("[{}]", fail_entry()));
    assert_eq!(code, 42, "the failure must not end the program: {out}");
    assert!(out.contains("\"b\""), "{out}");
    // round 3: both outcomes, the failure's whole text
    let results = format!("[{}, \"2 files\"]", fail_entry());
    let (code, out) = round(&dir, ALL_SETTLED, &results);
    assert_eq!(code, 0, "{out}");
    let v: Vec<String> = parse_str_array(&out);
    assert_eq!(v[0], format!("err ToolError google_drive_mcp.search_files {FAIL}"));
    assert_eq!(v[1], "ok 2 files");
    // replay: the same results give the same rejection at the same place
    let (code2, out2) = round(&dir, ALL_SETTLED, &results);
    assert_eq!((code2, out2), (0, out));
    let _ = std::fs::remove_dir_all(&dir);
}

#[test]
fn try_catch_catches_and_later_calls_get_their_own_results() {
    let dir = scratch("catch");
    let program = r#"
      let first;
      try { first = await bash('false'); } catch (e) { first = 'caught: ' + e.message; }
      const second = await bash('echo hi');
      return first + ' | ' + second;
    "#;
    let (code, out) = round(&dir, program, "[{\"error\": \"denied by the user: not on main\"}]");
    assert_eq!(code, 42, "{out}");
    assert!(out.contains("echo hi"), "{out}");
    let (code, out) = round(&dir, program, "[{\"error\": \"denied by the user: not on main\"}, \"hi\"]");
    assert_eq!(code, 0, "{out}");
    assert_eq!(out, "caught: denied by the user: not on main | hi");
    let _ = std::fs::remove_dir_all(&dir);
}

#[test]
fn an_uncaught_failure_ends_the_program_with_its_whole_text() {
    let dir = scratch("uncaught");
    let program = "const a = await tools.google_drive_mcp.search_files({query: 'a'}); return 'never ' + a;";
    let (code, out) = round(&dir, program, &format!("[{}]", fail_entry()));
    assert_eq!(code, 43, "{out}");
    let want = format!("{{\"error\": {}}}", serde_json_str(&format!("program call failed: {FAIL}")));
    assert_eq!(out, want);
    // Promise.all rejects with the failed call's error
    let program = "return await Promise.all([bash('a'), bash('b')]);";
    let (code, out) = round(&dir, program, "[\"one\", {\"error\": \"no such tool\"}]");
    assert_eq!(code, 43, "{out}");
    assert_eq!(out, "{\"error\": \"program call failed: no such tool\"}");
    let _ = std::fs::remove_dir_all(&dir);
}

#[test]
fn a_success_still_reads_as_its_value() {
    let dir = scratch("ok");
    // a JSON text parses, a plain one stays a string, an object a tool
    // returned as text is never taken for a failure
    let program = "const a = await x(); const b = await y(); const c = await z(); return [a.n, b, c.error];";
    let (code, out) = round(&dir, program, "[\"{\\\"n\\\": 3}\", \"plain\", \"{\\\"error\\\": \\\"its own field\\\"}\"]");
    assert_eq!(code, 0, "{out}");
    assert_eq!(out, "[3,\"plain\",\"its own field\"]");
    let _ = std::fs::remove_dir_all(&dir);
}

// the program's value here is always a JSON array of strings
fn parse_str_array(s: &str) -> Vec<String> {
    let inner = s.trim().trim_start_matches('[').trim_end_matches(']');
    let mut out = Vec::new();
    let mut cur = String::new();
    let mut in_str = false;
    let mut chars = inner.chars();
    while let Some(c) = chars.next() {
        match (in_str, c) {
            (false, '"') => in_str = true,
            (true, '"') => {
                in_str = false;
                out.push(std::mem::take(&mut cur));
            }
            (true, '\\') => match chars.next() {
                Some('n') => cur.push('\n'),
                Some(o) => cur.push(o),
                None => {}
            },
            (true, c) => cur.push(c),
            _ => {}
        }
    }
    out
}
