//! The front window's still on a message to main (spot-shot, architect
//! m_31929): one rule for its parts ([`with_shot`]), used by a fn talk's
//! send (`send_via`) and by the spotlight's typed send, which names the
//! still it showed (`send {shot: id}`). The `shot` field is the core's:
//! it never reaches the hub.

use super::*;
use bise_proto::parts::Part;

/// The words said when a spotlight send names a still that is gone (a
/// newer one replaced it, it was dropped): the send goes without it.
pub const SHOT_GONE: &str = "the screenshot was gone: your message went without it.";

/// His message's parts with the still first: his own parts when he sent
/// some, else his words as one text part (none when empty). Pure.
pub(super) fn with_shot(shot: Part, words: &str, parts: Vec<Part>) -> Vec<Part> {
    let mut out = vec![shot];
    if !parts.is_empty() {
        out.extend(parts);
    } else if !words.trim().is_empty() {
        out.push(Part::Text { text: words.trim().to_string() });
    }
    out
}

impl Core {
    /// A window's `send` that names a still (`shot: id`, the spotlight's):
    /// that still becomes its first image part, his words or parts after
    /// it (the text then empty: the hub renders it from the parts), and
    /// it moves to the sent ones; another id or none pending: the send
    /// goes as he wrote it and [`SHOT_GONE`] says so. Without `shot`: `v`
    /// as is.
    pub(super) fn send_shot(&mut self, mut v: Value) -> Value {
        let Some(want) = v.as_object_mut().and_then(|o| o.remove("shot")) else { return v };
        let Some(id) = want.as_u64() else { return v };
        let Some(s) = self.shot.take_if(|s| s.id == id) else {
            eprintln!("ambient-core: shot: send names shot {id}, gone");
            let project = v["project"].clone();
            self.emit(json!({"ev": "notice", "project": project, "text": SHOT_GONE}));
            return v;
        };
        let words = v["text"].as_str().unwrap_or("").to_string();
        let parts: Vec<Part> = serde_json::from_value(v["parts"].clone()).unwrap_or_default();
        v["parts"] = json!(with_shot(s.part(), &words, parts));
        v["text"] = json!("");
        self.emit(voice::shot_ev(None));
        self.sent_shots.push(s);
        v
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn img() -> Part {
        Part::Image { name: "[Image #1]".into(), source: "/i/a.png".into(), mime: String::new(), b64_file: String::new(), caption: "Safari · x".into() }
    }

    #[test]
    fn the_still_goes_first_then_his_words_or_his_parts() {
        let text = |t: &str| Part::Text { text: t.into() };
        assert_eq!(with_shot(img(), "  why red?  ", vec![]), vec![img(), text("why red?")]);
        assert_eq!(with_shot(img(), "", vec![]), vec![img()]);
        // his parts win over the words (the window sent text '' beside them)
        assert_eq!(with_shot(img(), "", vec![text("a"), text("b")]), vec![img(), text("a"), text("b")]);
    }
}
