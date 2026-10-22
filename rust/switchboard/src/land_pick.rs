//! The facts of what `sb land` takes (issue 12): a place's changes
//! against its tip ([`Change`], read by `land::changes`) and the git
//! conflict blocks in a file ([`conflict_blocks`]). What a land takes,
//! names and refuses is sb-core's (bend/hub/land.bend `decide`, issue 37
//! #3): rust/proto/fixtures/land_pick.jsonl pins it to the Rust pick it
//! replaced, line for line (the test below steps sb-core on each).

/// sb-core's sweep limit (land.bend SWEEP_MAX), for the tests' trees.
#[cfg(test)]
pub(crate) const SWEEP_MAX: usize = 200;

/// One entry of `git status` against the tip.
#[derive(Clone, Debug, PartialEq)]
pub(crate) struct Change {
    /// Relative to the place's folder; a nested repo ends with `/`.
    pub path: String,
    /// A staged rename's (or copy's) old path: the two go together.
    pub from: Option<String>,
    /// Written since the agent started (a deleted file, an unknown time:
    /// yes).
    pub recent: bool,
}

/// The 1-based line numbers of git conflict blocks in `text`: a line
/// starting with `<<<<<<< `, then a line exactly `=======`, then a line
/// starting with `>>>>>>> `, in that order, outside a ``` fence. A lone
/// marker (a setext heading, a doc that quotes one line) or a block shown
/// in a markdown code fence is not a conflict. Each hit: the `<<<<<<<`
/// line and its `>>>>>>>` line.
pub(crate) fn conflict_blocks(text: &str) -> Vec<(usize, usize)> {
    let mut out = Vec::new();
    let (mut fence, mut open, mut mid) = (false, None::<usize>, false);
    for (i, raw) in text.lines().enumerate() {
        let line = raw.strip_suffix('\r').unwrap_or(raw);
        if line.trim_start().starts_with("```") {
            fence = !fence;
            open = None;
            continue;
        }
        if fence {
            continue;
        }
        if line.starts_with("<<<<<<< ") {
            (open, mid) = (Some(i + 1), false);
        } else if line == "=======" && open.is_some() {
            mid = true;
        } else if line.starts_with(">>>>>>> ") {
            if let (Some(o), true) = (open, mid) {
                out.push((o, i + 1));
            }
            (open, mid) = (None, false);
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn conflict_blocks_only_full_blocks_outside_fences() {
        let text = |ls: &[&str], end: &str| -> String { ls.iter().map(|l| format!("{l}{end}")).collect() };
        let lf = char::from(10).to_string();
        let crlf = format!("{}{}", char::from(13), lf);
        let block = ["a", "<<<<<<< Updated upstream", "x", "=======", "y", ">>>>>>> Stashed changes", "b"];
        let real = text(&block, &lf);
        assert_eq!(conflict_blocks(&real), vec![(2, 6)]);
        assert_eq!(conflict_blocks(&text(&block, &crlf)), vec![(2, 6)]);
        // lone markers: a setext heading, one quoted line, an unordered block
        assert!(conflict_blocks(&text(&["Title", "======="], &lf)).is_empty());
        assert!(conflict_blocks(&text(&["<<<<<<< HEAD", "only"], &lf)).is_empty());
        assert!(conflict_blocks(&text(&[">>>>>>> x", "=======", "<<<<<<< y"], &lf)).is_empty());
        assert!(conflict_blocks(&text(&["<<<<<<< a", ">>>>>>> b"], &lf)).is_empty());
        // a block shown in a markdown fence
        assert!(conflict_blocks(&text(&["```", "<<<<<<< a", "=======", ">>>>>>> b", "```"], &lf)).is_empty());
    }

    /// issue 37 #3: sb-core's pick (bend/hub/land.bend `decide`) gives
    /// today's Rust pick's answer on every line of
    /// rust/proto/fixtures/land_pick.jsonl (blessed from it before it
    /// went: its mine, left_out and words, byte-equal).
    #[test]
    fn sb_cores_pick_is_the_fixtures_line_for_line() {
        use bise_proto::core::input as ci;
        use serde_json::{json, Value};
        let path = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../proto/fixtures/land_pick.jsonl");
        let text = std::fs::read_to_string(&path).expect("the fixture");
        let line = crate::land_line::local::line();
        let mut n = 0;
        for l in text.lines().filter(|l| !l.is_empty()) {
            let v: Value = serde_json::from_str(l).expect("a fixture line");
            let (i, want) = (&v["in"], &v["out"]);
            let p = ci::LandPick {
                changes: i["changes"].clone(),
                files: i["files"].clone(),
                add: i["add"].clone(),
                others: i["others"].clone(),
                conflicts: json!([]),
                alone: i["alone"] == true,
                worktree: true,
                here: true,
                pr_mode: false,
                message: "m".into(),
            };
            let got = match line.pick(p) {
                Ok(p) => json!({"ok": true, "mine": p.mine, "left_out": p.left_out, "why": ""}),
                Err(e) => json!({"ok": false, "mine": [], "left_out": [], "why": e}),
            };
            // `here` with nothing of its own is refused after the pick: the
            // fixture's pick alone said ok with an empty mine
            let want_ok_empty = want["ok"] == true && want["mine"].as_array().is_some_and(|m| m.is_empty());
            if want_ok_empty {
                assert_eq!(got["ok"], false, "{l}");
                assert!(got["why"].as_str().unwrap_or("").starts_with("nothing of yours to land"), "{l}: {got}");
            } else {
                assert_eq!(&got, want, "{l}");
            }
            n += 1;
        }
        assert_eq!(n, 33, "every line of the fixture");
    }
}
