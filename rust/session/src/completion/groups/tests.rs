//! The parts of each row (architect m_41684): they sum to the row's tokens
//! on a body of each family, both views; a result is named through its
//! call's id; the envelopes classify by their writers' constants.

use super::*;
use crate::completion::{raw_rows, rows, split};
use bise_proto::log::CompRow;

/// A body of each family with a bash call (env vars, cd &&), a
/// run_typescript call, an orphan result, notifications and a summary.
fn bodies() -> Vec<(Family, String)> {
    let bash = r#"{\"arg\":\"cd rust && RUST_LOG=1 cargo test -p x | tail\"}"#;
    let ts = r#"{\"code\":\"const r = await tools.slack.search({}); return r;\"}"#;
    let anth = r#"{"model":"claude-x","system":[{"type":"text","text":"You are bise."}],"tools":[{"name":"bash","input_schema":{"type":"object"}},{"name":"edit","input_schema":{}}],"messages":[{"role":"user","content":[{"type":"text","text":"Summary of the earlier conversation:\n<summary>x</summary>"}]},{"role":"user","content":[{"type":"text","text":"<user_message id=\"m_1\">\nfix it\n</user_message>"},{"type":"text","text":"<bise_state>\nboard\n</bise_state>"}]},{"role":"assistant","content":[{"type":"thinking","thinking":"hm","signature":"s"},{"type":"text","text":"i'll look"},{"type":"tool_use","id":"t1","name":"bash","input":{"arg":"cd rust && RUST_LOG=1 cargo test -p x | tail"}},{"type":"tool_use","id":"t2","name":"run_typescript","input":{"code":"await tools.slack.search({})"}}]},{"role":"user","content":[{"type":"tool_result","tool_use_id":"t1","content":"ok"},{"type":"tool_result","tool_use_id":"t2","content":"[]"},{"type":"tool_result","tool_use_id":"zz","content":"?"},{"type":"text","text":"<agent_message from=\"main\" relation=\"parent\" id=\"m_2\">\ngo\n</agent_message>"}]}]}"#.to_string();
    let chat = format!(
        r#"{{"model":"gpt-x","messages":[{{"role":"system","content":"You are bise."}},{{"role":"user","content":"<user_message id=\"m_1\">\nfix it\n</user_message>"}},{{"role":"assistant","content":"i'll look","tool_calls":[{{"id":"c1","type":"function","function":{{"name":"bash","arguments":"{bash}"}}}},{{"id":"c2","type":"function","function":{{"name":"run_typescript","arguments":"{ts}"}}}}]}},{{"role":"tool","tool_call_id":"c1","content":"ok"}},{{"role":"tool","tool_call_id":"c2","content":"[]"}},{{"role":"system","content":"mid"}}],"tools":[{{"type":"function","function":{{"name":"bash"}}}}]}}"#
    );
    let resp = format!(
        r#"{{"model":"gpt-r","instructions":"You are bise.","input":[{{"type":"message","role":"user","content":[{{"type":"input_text","text":"[bise] resumed"}}]}},{{"type":"reasoning","summary":[],"encrypted_content":"abc"}},{{"type":"function_call","call_id":"f1","name":"bash","arguments":"{bash}"}},{{"type":"function_call_output","call_id":"f1","output":"3 passed"}},{{"type":"function_call_output","call_id":"nope","output":"?"}},{{"type":"message","role":"assistant","content":[{{"type":"output_text","text":"done"}}]}}],"tools":[{{"type":"function","name":"bash"}}],"stream":true}}"#
    );
    vec![(Family::Anthropic, anth), (Family::Chat, chat), (Family::Responses, resp)]
}

fn sums(rs: &[CompRow]) {
    for r in rs {
        assert!(!r.parts.is_empty(), "row {} has no parts", r.n);
        assert_eq!(r.parts.iter().map(|p| p.tokens).sum::<u64>(), r.tokens, "row {}: {:?}", r.n, r.parts);
    }
}

/// Law: every row has parts and they sum to its tokens, drawn and raw.
#[test]
fn the_parts_sum_to_the_row() {
    for (fam, body) in bodies() {
        let s = split(&body).unwrap();
        assert_eq!(s.family, fam);
        let red = Redactor::default();
        sums(&rows(&s, &red));
        sums(&raw_rows(&s, &red));
        assert_eq!(rows(&s, &red).iter().map(|r| &r.parts).collect::<Vec<_>>(), raw_rows(&s, &red).iter().map(|r| &r.parts).collect::<Vec<_>>(), "{fam:?}");
    }
}

fn kinds(body: &str) -> Vec<(CompRole, CompKind, Vec<String>)> {
    let s = split(body).unwrap();
    rows(&s, &Redactor::default()).into_iter().flat_map(|r| r.parts).map(|p| (p.role, p.kind, p.names)).collect()
}

fn has(ks: &[(CompRole, CompKind, Vec<String>)], role: CompRole, kind: CompKind, names: &[&str]) -> bool {
    ks.iter().any(|(r, k, n)| *r == role && *k == kind && n.iter().map(String::as_str).eq(names.iter().copied()))
}

#[test]
fn each_part_has_its_group() {
    use CompKind as K;
    use CompRole as R;
    let b = bodies();
    let a = kinds(&b[0].1);
    for (role, kind, names) in [
        (R::System, K::Prompt, &[][..]),
        (R::System, K::Tools, &["bash"][..]),
        (R::System, K::Tools, &["edit"][..]),
        (R::System, K::Params, &[][..]),
        (R::User, K::Summary, &[][..]),
        (R::User, K::Words, &[][..]),
        (R::User, K::BiseState, &[][..]),
        (R::User, K::AgentMessage, &["main"][..]),
        (R::Assistant, K::Thinking, &[][..]),
        (R::Assistant, K::Text, &[][..]),
        (R::ToolCall, K::Tool, &["bash", "cargo"][..]),
        (R::ToolCall, K::Tool, &["run_typescript", "slack"][..]),
        (R::ToolResult, K::Tool, &["bash", "cargo"][..]),
        (R::ToolResult, K::Tool, &["run_typescript", "slack"][..]),
        (R::ToolResult, K::Other, &[][..]),
    ] {
        assert!(has(&a, role, kind, names), "anthropic: no {role:?} {kind:?} {names:?} in {a:?}");
    }
    let c = kinds(&b[1].1);
    for (role, kind, names) in [
        (R::System, K::Prompt, &[][..]),
        (R::System, K::Mid, &[][..]),
        (R::User, K::Words, &[][..]),
        (R::ToolCall, K::Tool, &["bash", "cargo"][..]),
        (R::ToolResult, K::Tool, &["run_typescript", "slack"][..]),
    ] {
        assert!(has(&c, role, kind, names), "chat: no {role:?} {kind:?} {names:?} in {c:?}");
    }
    let r = kinds(&b[2].1);
    for (role, kind, names) in [
        (R::System, K::Prompt, &[][..]),
        (R::User, K::Note, &[][..]),
        (R::Assistant, K::Thinking, &[][..]),
        (R::ToolResult, K::Tool, &["bash", "cargo"][..]),
        (R::ToolResult, K::Other, &[][..]),
        (R::Assistant, K::Text, &[][..]),
    ] {
        assert!(has(&r, role, kind, names), "responses: no {role:?} {kind:?} {names:?} in {r:?}");
    }
}

/// Best effort: env vars, cd &&, a pipe, a path; nothing that reads is none.
#[test]
fn a_command_names_its_program() {
    for (cmd, want) in [
        ("cargo test -p x", Some("cargo")),
        ("FOO=1 BAR=x git status", Some("git")),
        ("cd rust && cargo clippy", Some("cargo")),
        ("cd a; rg -n x | head", Some("rg")),
        ("/usr/bin/sed -n 1,2p f", Some("sed")),
        ("(cd x && make)", None),
        ("(cd x && make -j4)", Some("make")),
        ("", None),
        ("   ", None),
        ("cd only", None),
        ("$(which python3) x.py", None),
    ] {
        assert_eq!(program(cmd).as_deref(), want, "{cmd:?}");
    }
    assert_eq!(ts_group("const a = await tools.gmail.search({}); tools.slack.x()").as_deref(), Some("gmail"));
    assert_eq!(ts_group("return 1 + 1;"), None);
}

/// The summary's prefixes are the runtime's own (the writer is Bend).
#[test]
fn the_summary_prefixes_are_the_runtimes() {
    let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../bend");
    let history = std::fs::read_to_string(root.join("core/history.bend")).unwrap();
    assert!(history.contains(&format!("\"{}", env::SUMMARY_PREFIX)), "bend/core/history.bend no longer writes {:?}", env::SUMMARY_PREFIX);
    let main = std::fs::read_to_string(root.join("runtime/main-pure.bend")).unwrap();
    assert!(main.contains(&format!("\"{}", env::COMPACTED_PREFIX)), "bend/runtime/main-pure.bend no longer writes {:?}", env::COMPACTED_PREFIX);
    assert_eq!(text_kind(&format!("{}\n<summary>", env::SUMMARY_PREFIX)).0, CompKind::Summary);
    assert_eq!(text_kind(env::COMPACTED_PREFIX).0, CompKind::Summary);
}

#[test]
fn an_unknown_tag_is_tagged_with_its_name() {
    assert_eq!(text_kind("<page-notes>\nx</page-notes>"), (CompKind::Tagged, vec!["page-notes".to_string()]));
    assert_eq!(text_kind("plain words"), (CompKind::Text, vec![]));
    assert_eq!(text_kind("<user_messages>"), (CompKind::Tagged, vec!["user_messages".to_string()]));
}

/// A PNG's head (its signature and IHDR) of that size, as base64.
fn png(w: u32, h: u32) -> String {
    let mut b = vec![0x89, b'P', b'N', b'G', 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, b'I', b'H', b'D', b'R'];
    b.extend(w.to_be_bytes());
    b.extend(h.to_be_bytes());
    b.extend([8, 6, 0, 0, 0, 0, 0, 0, 0]);
    b.extend(std::iter::repeat_n(0u8, 3000));
    bend_images::base64_encode(&b)
}

/// Gabriel (main m_41815): an image counts as its provider counts it,
/// from its size, not as its base64's bytes.
#[test]
fn an_image_counts_as_its_provider_counts_it() {
    let anth = |w, h| image_tokens(Family::Anthropic, &serde_json::json!({"type":"image","source":{"type":"base64","media_type":"image/png","data":png(w, h)}}));
    assert_eq!(anth(1000, 500), Some(667));
    // resized to 1.15 megapixels first: 1238 x 929
    assert_eq!(anth(4000, 3000), Some(1534));
    let url = |w, h, detail: &str| serde_json::json!({"type":"image_url","image_url":{"url":format!("data:image/png;base64,{}", png(w, h)),"detail":detail}});
    // 1024 square: 768 on the short side, 2 x 2 tiles
    assert_eq!(image_tokens(Family::Chat, &url(1024, 1024, "high")), Some(765));
    assert_eq!(image_tokens(Family::Chat, &url(1024, 1024, "low")), Some(85));
    let resp = serde_json::json!({"type":"input_image","image_url":format!("data:image/png;base64,{}", png(512, 512))});
    assert_eq!(image_tokens(Family::Responses, &resp), Some(255));
    assert_eq!(image_tokens(Family::Anthropic, &serde_json::json!({"type":"image","source":{"data":"bm90IGFuIGltYWdl"}})), None);
}

/// A screenshot in a tool result is its own part (tool result › image ›
/// its tool), his image too; the row's tokens are the parts' sum.
#[test]
fn an_image_is_its_own_part() {
    let img = png(1000, 500);
    let body = format!(
        r#"{{"model":"claude-x","system":"x","messages":[{{"role":"user","content":[{{"type":"text","text":"<user_message id=\"m_1\">\nlook\n</user_message>"}},{{"type":"image","source":{{"type":"base64","media_type":"image/png","data":"{img}"}}}}]}},{{"role":"assistant","content":[{{"type":"tool_use","id":"t1","name":"computer","input":{{"action":"screenshot"}}}}]}},{{"role":"user","content":[{{"type":"tool_result","tool_use_id":"t1","content":[{{"type":"text","text":"done"}},{{"type":"image","source":{{"type":"base64","media_type":"image/png","data":"{img}"}}}}]}}]}}]}}"#
    );
    let s = split(&body).unwrap();
    let rs = rows(&s, &Redactor::default());
    sums(&rs);
    let ks: Vec<_> = rs.iter().flat_map(|r| r.parts.clone()).map(|p| (p.role, p.kind, p.names, p.tokens)).collect();
    assert!(ks.contains(&(CompRole::User, CompKind::Image, vec![], 667)), "{ks:?}");
    assert!(ks.contains(&(CompRole::ToolResult, CompKind::Image, vec!["computer".to_string()], 667)), "{ks:?}");
    assert!(ks.iter().any(|(r, k, n, _)| *r == CompRole::ToolResult && *k == CompKind::Tool && n == &vec!["computer".to_string()]), "{ks:?}");
    let last = rs.last().unwrap();
    assert!(last.tokens < last.bytes / 4, "the row counts its image as the provider does: {} tokens for {} bytes", last.tokens, last.bytes);
    assert_eq!(rs.iter().map(|r| &r.parts).collect::<Vec<_>>(), raw_rows(&s, &Redactor::default()).iter().map(|r| &r.parts).collect::<Vec<_>>());
}
