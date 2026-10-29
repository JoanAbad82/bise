//! A link pasted over selected words keeps them as its label:
//! `[words](url)` (Benjamin's ask, Gabriel « Oui ! », page ben-feedback).
//! Only one http(s) URL over a selection of words on one line; anything
//! else pastes as before (input.rs). The desktop's composer/linkpaste.ts
//! keeps the same rule; both read rust/proto/fixtures/paste_link.json.

/// The text that replaces the selection, and the cursor in it (a char
/// index, after the `)`).
#[derive(Debug, PartialEq, Eq)]
pub(crate) struct LinkPaste {
    pub(crate) text: String,
    pub(crate) caret: usize,
}

/// One http(s) URL with a host; no whitespace, no `<` or `>`.
fn is_url(s: &str) -> bool {
    let lower = s.get(..8).unwrap_or(s).to_ascii_lowercase();
    let rest = if lower.starts_with("https://") {
        &s[8..]
    } else if lower.starts_with("http://") {
        &s[7..]
    } else {
        return false;
    };
    let host = rest.split(['/', '?', '#']).next().unwrap_or("");
    !host.is_empty() && !s.chars().any(|c| c.is_whitespace() || c == '<' || c == '>')
}

/// Every `(` closed in order: a destination markdown reads bare; else
/// it goes in `<...>`.
fn balanced(url: &str) -> bool {
    let mut depth = 0i32;
    for c in url.chars() {
        match c {
            '(' => depth += 1,
            ')' => {
                depth -= 1;
                if depth < 0 {
                    return false;
                }
            }
            _ => {}
        }
    }
    depth == 0
}

/// `[selected](pasted)` when `pasted` is one URL and `selected` words on
/// one line, not a URL themselves; the spaces and tabs around the words
/// stay outside the link. None: paste as before. Pure.
pub(crate) fn link_paste(selected: &str, pasted: &str) -> Option<LinkPaste> {
    let url = pasted.trim();
    if !is_url(url) || selected.contains(['\n', '\r']) {
        return None;
    }
    let words = selected.trim_matches([' ', '\t']);
    if words.is_empty() || is_url(words) {
        return None;
    }
    let lead = &selected[..selected.len() - selected.trim_start_matches([' ', '\t']).len()];
    let trail = &selected[lead.len() + words.len()..];
    let mut label = String::with_capacity(words.len());
    for c in words.chars() {
        if matches!(c, '\\' | '[' | ']') {
            label.push('\\');
        }
        label.push(c);
    }
    let dest = if balanced(url) { url.to_string() } else { format!("<{url}>") };
    let link = format!("{lead}[{label}]({dest})");
    let caret = link.chars().count();
    Some(LinkPaste { text: link + trail, caret })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_shared_table() {
        let cases: Vec<serde_json::Value> =
            serde_json::from_str(include_str!("../../proto/fixtures/paste_link.json")).unwrap();
        for c in cases {
            let got = link_paste(c["selected"].as_str().unwrap(), c["pasted"].as_str().unwrap());
            match c["text"].as_str() {
                None => assert_eq!(got, None, "{c}"),
                Some(text) => {
                    let got = got.unwrap_or_else(|| panic!("{c}"));
                    assert_eq!(got.text, text, "{c}");
                    let before: String = got.text.chars().take(got.caret).collect();
                    assert_eq!(before, c["caret_after"].as_str().unwrap(), "{c}");
                }
            }
        }
    }

    /// The composer holds `text`, the chars [a, b) selected.
    fn composer(text: &str, a: usize, b: usize) -> crate::app::App {
        let mut app = crate::sb::bench::test_app();
        app.ed.paste(text);
        app.ed.anchor = Some(a);
        app.ed.cursor = b;
        app
    }

    #[test]
    fn a_url_over_words_links_them_and_one_undo_gives_them_back() {
        let mut app = composer("read the docs now", 9, 13);
        crate::input::on_paste(&mut app, "https://bise.dev/docs\n");
        let link = "read the [docs](https://bise.dev/docs)";
        assert_eq!(app.ed.text, format!("{link} now"));
        assert_eq!((app.ed.cursor, app.ed.selection()), (link.chars().count(), None));
        app.ed.undo();
        assert_eq!(app.ed.text, "read the docs now");
        assert_eq!(app.ed.selection(), Some((9, 13)));
    }

    #[test]
    fn no_selection_other_text_or_a_chip_paste_as_before() {
        let mut app = composer("see ", 4, 4);
        crate::input::on_paste(&mut app, "https://bise.dev");
        assert_eq!(app.ed.text, "see https://bise.dev");
        let mut app = composer("see this", 4, 8);
        crate::input::on_paste(&mut app, "that one");
        assert_eq!(app.ed.text, "see that one");
        let mut app = composer("see [Image #1] it", 4, 14);
        crate::input::on_paste(&mut app, "https://bise.dev");
        assert_eq!(app.ed.text, "see https://bise.dev it");
    }
}
