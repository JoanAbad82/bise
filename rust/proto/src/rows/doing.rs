//! What an agent is doing now (les bims, architect m_27581): the kind of
//! its current step and since when, on its agents row. The hub sets it
//! from the REPL lines it already reads for every agent (switchboard
//! `doing.rs`) and writes it only while the agent's turn runs.
//!
//! [`DoingKind::of_call`] is the one tool call -> kind mapping: one
//! table of rules ([`RULES`]), so a new tool or build runner is a row.
//! The call's args are read here, inside the hub, never sent: only the
//! kind leaves. (`thread::ToolKind::of` answers another question, the
//! summary's counts; a test keeps the two in agreement.)

use serde::{Deserialize, Serialize};

/// The kind of an agent's current step.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
#[serde(rename_all = "snake_case")]
pub enum DoingKind {
    /// its model thinks or writes (between tool calls)
    Think,
    /// a tool call of no other kind
    Tool,
    /// an edit of a file (edit, write_file, apply_patch)
    Edit,
    /// a search or a read (grep, a web search, a file read)
    Search,
    /// computer use (the user's browser or apps)
    Computer,
    /// an image read or made
    Image,
    /// a page or an artifact published
    Publish,
    /// its context compacts
    Compact,
    /// a build or test run, or the turn paused on a backgrounded command
    Build,
    /// a kind this version doesn't know (a newer hub)
    #[serde(other)]
    Unknown,
}

/// What an agent is doing now and since when (ms).
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct Doing {
    pub kind: DoingKind,
    pub since_ms: u64,
}

/// One rule of [`DoingKind::of_call`]: a call to `tool` ("*": any tool)
/// whose args hold `has` ("": any args) is `kind`. The first rule that
/// matches wins; none: [`DoingKind::Tool`].
pub struct Rule {
    pub tool: &'static str,
    pub has: &'static str,
    pub kind: DoingKind,
}

const fn r(tool: &'static str, has: &'static str, kind: DoingKind) -> Rule {
    Rule { tool, has, kind }
}

use DoingKind::*;

/// The rules, in order (specific args first, then by name alone).
pub const RULES: &[Rule] = &[
    // publishing: a page or an artifact
    r("bash", "sb page publish", Publish),
    r("bash", "sb artifact add", Publish),
    // build and test runners, by their command
    r("bash", "heavy-run", Build),
    r("bash", "gate.sh", Build),
    r("bash", "run_all.sh", Build),
    r("bash", "cargo build", Build),
    r("bash", "cargo test", Build),
    r("bash", "cargo clippy", Build),
    r("bash", "cargo check", Build),
    r("bash", "cargo run", Build),
    r("bash", "pnpm test", Build),
    r("bash", "pnpm build", Build),
    r("bash", "pnpm check", Build),
    r("bash", "pnpm typecheck", Build),
    r("bash", "npm test", Build),
    r("bash", "npm run build", Build),
    r("bash", "pytest", Build),
    r("bash", "python3 tests/", Build),
    r("bash", "python3 -u tests/", Build),
    r("bash", "xcodebuild", Build),
    r("bash", "swift build", Build),
    r("bash", "go build", Build),
    r("bash", "go test", Build),
    r("bash", "bend check", Build),
    // a search in the shell
    r("bash", "rg ", Search),
    r("bash", "grep ", Search),
    // the sandbox: computer use, images
    r("run_typescript", "tools.computer.", Computer),
    r("run_typescript", "readImage", Image),
    // by name
    r("edit", "", Edit),
    r("write_file", "", Edit),
    r("write", "", Edit),
    r("apply_patch", "", Edit),
    r("multi_edit", "", Edit),
    r("read_file", "", Search),
    r("read", "", Search),
    r("view", "", Search),
    r("grep", "", Search),
    r("rg", "", Search),
    r("glob", "", Search),
    r("find", "", Search),
    r("search", "", Search),
    r("web_search", "", Search),
    r("search_tool_functions", "", Search),
    r("read_image", "", Image),
    r("generate_image", "", Image),
    r("image", "", Image),
];

impl DoingKind {
    /// The kind of a call to `name` with `args` (as its feed line gives
    /// them): the first of [`RULES`] that matches, else `Tool`. Total.
    pub fn of_call(name: &str, args: &str) -> DoingKind {
        RULES
            .iter()
            .find(|r| (r.tool == "*" || r.tool == name) && (r.has.is_empty() || has_word(args, r.has)))
            .map_or(Tool, |r| r.kind)
    }
}

/// `args` holds `w` at the start of a word: what comes before it is no
/// letter, digit, `_` or `-` (`rg ` is not in `--arg x`).
fn has_word(args: &str, w: &str) -> bool {
    args.match_indices(w).any(|(i, _)| {
        args[..i].chars().next_back().is_none_or(|c| !(c.is_alphanumeric() || c == '_' || c == '-'))
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::thread::ToolKind;

    /// Every line of fixtures/doing_calls.jsonl: {name, args, kind}.
    fn fixtures() -> Vec<(String, String, DoingKind)> {
        include_str!("../../fixtures/doing_calls.jsonl")
            .lines()
            .filter(|l| !l.trim().is_empty())
            .map(|l| {
                let v: serde_json::Value = serde_json::from_str(l).unwrap_or_else(|e| panic!("{e}: {l}"));
                let s = |k: &str| v[k].as_str().unwrap_or_else(|| panic!("{k}: {l}")).to_string();
                let kind = serde_json::from_value(v["kind"].clone()).unwrap_or_else(|e| panic!("{e}: {l}"));
                (s("name"), s("args"), kind)
            })
            .collect()
    }

    #[test]
    fn every_fixture_call_has_its_kind() {
        let fx = fixtures();
        assert!(fx.len() >= 20);
        for (name, args, kind) in fx {
            assert_eq!(DoingKind::of_call(&name, &args), kind, "{name} : {args}");
        }
    }

    /// Total: any name and args give a known kind, never Unknown (that
    /// one is only a newer hub's word), never a panic.
    #[test]
    fn of_call_is_total() {
        let names = ["", "bash", "run_typescript", "edit", "x", "mcp__github__get", "é", "tool #3"];
        let args = ["", "{}", "cargo test -p x", "\u{0}", "sb page publish a.html", "{\"file_path\":\"a\"}"];
        for n in names {
            for a in args {
                assert_ne!(DoingKind::of_call(n, a), Unknown, "{n} {a}");
            }
        }
        for rule in RULES {
            assert_ne!(rule.kind, Unknown, "a rule never says Unknown");
        }
    }

    /// No twin: the summary's ToolKind and of_call agree where both
    /// speak (an edit is an edit, a search tool a search).
    #[test]
    fn tool_kind_agrees_with_of_call() {
        for rule in RULES.iter().filter(|r| r.has.is_empty()) {
            match ToolKind::of(rule.tool) {
                ToolKind::Edit => assert_eq!(rule.kind, Edit, "{}", rule.tool),
                ToolKind::Search | ToolKind::Read => assert!(matches!(rule.kind, Search | Image), "{}", rule.tool),
                _ => {}
            }
        }
        for (name, _, kind) in fixtures() {
            if ToolKind::of(&name) == ToolKind::Edit {
                assert_eq!(kind, Edit, "{name}");
            }
        }
    }

    #[test]
    fn a_newer_kind_reads_as_unknown() {
        assert_eq!(serde_json::from_value::<DoingKind>(serde_json::json!("dance")).unwrap(), Unknown);
        let d = Doing { kind: Build, since_ms: 7 };
        assert_eq!(serde_json::to_value(d).unwrap(), serde_json::json!({"kind": "build", "since_ms": 7}));
        assert_eq!(serde_json::from_value::<Doing>(serde_json::json!({"kind": "build", "since_ms": 7})).unwrap(), d);
    }
}
