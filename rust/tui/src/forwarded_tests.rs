//! A forwarded message's level-3 rows (forwarded.rs, designer m_41546):
//! the note, the `↪` line, the original quoted with its chips, never the
//! header or a tag.

use super::*;
use crate::wire::Ev;

fn parts() -> Vec<Part> {
    serde_json::from_value(serde_json::json!([
        {"kind": "text", "text": "please look\n\n"},
        {"kind": "forwarded", "id": 3, "from": "user", "to": "main", "at": "2026-10-25 12:26 UTC", "by": "main"},
        {"kind": "quote", "from": "t1", "text": "the quoted line"},
        {"kind": "text", "text": "look at this "},
        {"kind": "image", "name": "[Image #1]", "source": "/x/shot.png", "mime": "image/png", "b64_file": "/x/1.b64"},
        {"kind": "text", "text": " and "},
        {"kind": "file", "path": "/x/notes.csv", "name": "[File #1]"},
        {"kind": "paste", "n": 1, "text": "pasted line 1\npasted line 2"}
    ]))
    .unwrap()
}

fn shown(open: bool, parts: Vec<Part>) -> Vec<String> {
    let text = parts::render(&parts);
    let ev = Ev::AgentMsg { from: "main".into(), to: String::new(), text, level: 3, id: "m_5".into(), parts, open, fold: false };
    crate::render::ev_rows(&ev, 0, 100).iter().map(|l| l.spans.iter().map(|s| s.content.as_ref()).collect::<String>()).collect()
}

#[test]
fn a_forward_draws_its_note_its_line_and_the_original_quoted() {
    let rows = shown(true, parts());
    let all = rows.join("\n");
    assert!(rows[1].contains("please look"), "the note under the chip: {rows:#?}");
    let line = thread::forwarded_from(thread::forwarded_you, "main", &crate::running::clock(bise_proto::thread::when::utc_ms("2026-10-25 12:26 UTC").unwrap()));
    assert_eq!(rows[2].trim(), line, "{rows:#?}");
    assert!(rows[3..].iter().all(|r| r.starts_with("  │ ")), "the original quoted: {rows:#?}");
    assert!(all.contains("❝ the quoted line") && all.contains("shot.png") && all.contains("notes.csv"), "{all}");
    for raw in ["[forwarded m_3", "<selection", "<pasted", "<image", "<file", "sb show"] {
        assert!(!all.contains(raw), "no header or tag ({raw}): {all}");
    }
}

#[test]
fn closed_it_keeps_the_line_and_the_originals_first_rows() {
    let mut p = parts();
    p.push(Part::Text { text: "\nline two\nline three".into() });
    assert!(shown(true, p.clone()).len() > 3 + CLOSED_ROWS + 1, "open, it has more rows");
    let rows = shown(false, p);
    assert!(rows[2].contains("↪"), "{rows:#?}");
    assert_eq!(rows.len(), 3 + CLOSED_ROWS, "{rows:#?}");
    assert!(rows.last().unwrap().ends_with(&format!("{} {}", crate::theme::ellipsis(), crate::theme::glyph(crate::theme::G_CLOSED))), "{rows:#?}");
}

#[test]
fn no_note_opens_on_the_line_and_an_agent_wrote_it() {
    let mut p = parts();
    p.remove(0);
    if let Part::Forwarded { from, .. } = &mut p[0] {
        *from = "t1".into();
    }
    let rows = shown(true, p);
    assert!(rows[1].trim().starts_with(&thread::forwarded_from_untimed("t1", "main")), "{rows:#?}");
}

#[test]
fn a_time_that_doesnt_read_leaves_it_out() {
    let p = parts();
    let f = of(&p).unwrap();
    assert_eq!(line(&Fwd { at: "", ..f }, |_| "never".into()), thread::forwarded_from_untimed(thread::forwarded_you, "main"));
}

#[test]
fn a_message_without_a_forwarded_part_is_no_forward() {
    let p: Vec<Part> = parts().into_iter().filter(|p| !matches!(p, Part::Forwarded { .. })).collect();
    assert_eq!(of(&p), None);
}
