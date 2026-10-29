//! `/debug completion`'s rows: the law that they are the body, byte for
//! byte, on a body of each family; how each part draws; no key in a row.

use super::*;

/// A body of each family, compact as the runtime prints them
/// (bend/vendor/json.bend's stringify: no space between tokens), with a
/// bash call, a run_typescript call, another call and their results.
fn bodies(key: &str) -> Vec<(Family, String)> {
    let bash = r#"{\"arg\":\"cargo test -p x\",\"description\":\"run the tests\"}"#;
    let ts = r#"{\"code\":\"return 1 + 1;\"}"#;
    let anth = format!(
        r#"{{"model":"claude-x","max_tokens":32000,"stream":true,"system":[{{"type":"text","text":"You are bise. Key: {key}"}}],"tools":[{{"name":"bash","input_schema":{{"type":"object"}}}}],"messages":[{{"role":"user","content":[{{"type":"text","text":"fix it é → ✓"}}]}},{{"role":"assistant","content":[{{"type":"text","text":"i'll look"}},{{"type":"tool_use","id":"t1","name":"bash","input":{{"arg":"cargo test -p x","description":"run the tests"}}}},{{"type":"tool_use","id":"t2","name":"run_typescript","input":{{"code":"return 1 + 1;"}}}},{{"type":"tool_use","id":"t3","name":"web_search","input":{{"query":"lcp"}}}}]}},{{"role":"user","content":[{{"type":"tool_result","tool_use_id":"t1","content":"ok: 3 passed"}},{{"type":"tool_result","tool_use_id":"t2","content":"[2]"}},{{"type":"tool_result","tool_use_id":"t3","is_error":true,"content":"token {key} refused"}}]}}]}}"#
    );
    let chat = format!(
        r#"{{"model":"gpt-x","stream":true,"messages":[{{"role":"system","content":"You are bise. Key: {key}"}},{{"role":"user","content":"fix it é → ✓"}},{{"role":"assistant","content":"i'll look","tool_calls":[{{"id":"c1","type":"function","function":{{"name":"bash","arguments":"{bash}"}}}},{{"id":"c2","type":"function","function":{{"name":"run_typescript","arguments":"{ts}"}}}}]}},{{"role":"tool","tool_call_id":"c1","content":"{{\"passed\":3}}"}},{{"role":"tool","tool_call_id":"c2","content":"token {key}"}}],"tools":[{{"type":"function","function":{{"name":"bash"}}}}]}}"#
    );
    let resp = format!(
        r#"{{"model":"gpt-r","instructions":"You are bise. Key: {key}","input":[{{"type":"message","role":"user","content":[{{"type":"input_text","text":"fix it é → ✓"}}]}},{{"type":"reasoning","summary":[],"encrypted_content":"abc"}},{{"type":"function_call","call_id":"f1","name":"bash","arguments":"{bash}"}},{{"type":"function_call_output","call_id":"f1","output":"3 passed, {key}"}},{{"type":"message","role":"assistant","content":[{{"type":"output_text","text":"done"}}]}}],"tools":[{{"type":"function","name":"bash"}}],"stream":true,"store":false}}"#
    );
    vec![(Family::Anthropic, anth), (Family::Chat, chat), (Family::Responses, resp)]
}

const KEY: &str = "sk-test-0123456789abcdefKEY";

/// Law (architect m_34601): every top-level key is in exactly one row,
/// and the rows' slices, put back together, are the body byte for byte,
/// on each family (before any redaction).
#[test]
fn the_rows_are_the_body_byte_for_byte() {
    for (fam, body) in bodies(KEY) {
        let s = split(&body).unwrap();
        assert_eq!(s.family, fam, "{body}");
        assert_eq!(rebuild(&s), body, "{fam:?}");
        for k in &s.keys {
            let rows: std::collections::BTreeSet<u64> = s.slices.iter().filter(|x| &x.key == k).map(|x| x.n).collect();
            let one = s.list.as_deref() == Some(k.as_str()) || rows.len() == 1;
            assert!(one, "{fam:?}: {k} is in rows {rows:?}");
        }
        let n: Vec<u64> = rows(&s, &Redactor::default()).iter().map(|r| r.n).collect();
        assert_eq!(n, (0..n.len() as u64).collect::<Vec<_>>(), "{fam:?}: rows in order");
    }
}

/// A key the redactor knows is in no row, drawn or raw; the split
/// itself (the law above) runs on the bytes as sent.
#[test]
fn a_key_is_in_no_row() {
    let red = Redactor::new(vec![("TEST_KEY".into(), KEY.into())]);
    for (fam, body) in bodies(KEY) {
        let s = split(&body).unwrap();
        for r in rows(&s, &red).iter().chain(raw_rows(&s, &red).iter()) {
            let j = serde_json::to_string(r).unwrap();
            assert!(!j.contains(KEY), "{fam:?}: the key leaked in row {}: {j}", r.n);
        }
    }
}

fn kinds(r: &CompRow) -> Vec<String> {
    r.blocks
        .iter()
        .map(|b| format!("{}:{:?}{}", b.label.as_deref().unwrap_or("-"), b.body.kind, b.body.lang.as_deref().map(|l| format!(" {l}")).unwrap_or_default()))
        .collect()
}

/// Designer's debug-views v2: bash as its command, run_typescript as its
/// code, another call as JSON, texts as markdown, a result as JSON when
/// it parses, else text; row 0 the params and the tools.
#[test]
fn each_part_draws_as_its_kind() {
    let red = Redactor::default();
    let all = bodies("k");
    let r = rows(&split(&all[0].1).unwrap(), &red);
    assert_eq!((r[0].role.as_str(), r[0].head.as_str()), ("request", "anthropic · claude-x · 1 tools"));
    assert_eq!(kinds(&r[0]), ["params:Code json", "tools · 1:Code json"]);
    assert_eq!((r[1].role.as_str(), kinds(&r[1])), ("system", vec!["-:Md".to_string()]));
    assert_eq!(r[2].head, "fix it é → ✓");
    assert_eq!(
        kinds(&r[3]),
        ["-:Md", "tool_use · bash:Code bash", "tool_use · run_typescript:Code ts", "tool_use · web_search:Code json"]
    );
    assert_eq!(r[3].blocks[1].body.text, "cargo test -p x");
    assert_eq!(r[3].blocks[2].body.text, "return 1 + 1;");
    assert_eq!(kinds(&r[4]), ["result:Plain", "result:Code json", "result · failed:Plain"]);

    let c = rows(&split(&all[1].1).unwrap(), &red);
    assert_eq!(c.iter().map(|r| r.role.as_str()).collect::<Vec<_>>(), ["request", "system", "user", "assistant", "tool", "tool"]);
    assert_eq!(kinds(&c[3]), ["-:Md", "tool_use · bash:Code bash", "tool_use · run_typescript:Code ts"]);
    assert_eq!(kinds(&c[4]), ["result:Code json"]);
    assert_eq!(c[3].head, "i'll look");

    let p = rows(&split(&all[2].1).unwrap(), &red);
    assert_eq!(
        p.iter().map(|r| r.role.as_str()).collect::<Vec<_>>(),
        ["request", "system", "user", "reasoning", "function_call", "function_call_output", "assistant"]
    );
    assert_eq!(p[4].head, "run the tests");
    assert_eq!(kinds(&p[4]), ["tool_use · bash:Code bash"]);
    assert_eq!(p[0].head, "openai-responses · gpt-r · 1 tools");
}

/// An image goes as a line, never its base64; the raw view shortens it
/// too, and the split keeps every byte.
#[test]
fn an_image_is_a_line() {
    let b64 = "A".repeat(9000);
    let body = format!(
        r#"{{"model":"m","system":"s","messages":[{{"role":"user","content":[{{"type":"image","source":{{"type":"base64","media_type":"image/png","data":"{b64}"}}}}]}}]}}"#
    );
    let s = split(&body).unwrap();
    assert_eq!(rebuild(&s), body);
    let red = Redactor::default();
    let r = rows(&s, &red);
    assert_eq!(r[2].blocks[0].body.text, "image png · 8.8 KB");
    let raw = raw_rows(&s, &red);
    assert!(!raw[2].blocks[0].body.text.contains(&b64) && raw[2].blocks[0].body.text.contains("of base64"));
    assert_eq!(raw[2].bytes as usize, s.slices[2].raw.len());
}

#[test]
fn not_an_object_is_an_error() {
    assert!(split("[1,2]").is_err());
    assert!(split("not json").is_err());
}
