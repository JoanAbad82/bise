//! JSON lines whose bytes are all ASCII, for a peer that reads its socket
//! with Bend's `TCP.recv`: it decodes each recv on its own, so a multi-byte
//! UTF-8 char cut by a recv boundary became U+FFFD (sb-core's 64 KB reads:
//! ~14 chars of his journal's message text lost at every boot, issue 36).
//! Every char past ASCII is written `\uXXXX` (a surrogate pair past
//! U+FFFF), which any JSON reader, sb-core's J.parse included, reads back
//! as that char: the value is the same, only its bytes change.

use serde_json::Value;
use std::fmt::Write;

/// `v` as one JSON text with no byte >= 0x80.
pub fn ascii_json(v: &Value) -> String {
    ascii_of(&v.to_string())
}

/// A JSON text with each non-ASCII char escaped. Valid JSON keeps its
/// non-ASCII chars inside strings only, where `\uXXXX` means that char.
pub fn ascii_of(json: &str) -> String {
    if json.is_ascii() {
        return json.to_string();
    }
    let mut out = String::with_capacity(json.len() + json.len() / 4);
    for c in json.chars() {
        if c.is_ascii() {
            out.push(c);
        } else {
            let mut units = [0u16; 2];
            for u in c.encode_utf16(&mut units) {
                let _ = write!(out, "\\u{:04x}", u);
            }
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn a_line_has_no_byte_past_ascii_and_reads_back_the_same() {
        let v = json!({"text": "é─😀 \"quoted\"\nnew line \\u00e9 literal", "ключ": ["ü", 1, null], "n": 3});
        let line = ascii_json(&v);
        assert!(line.bytes().all(|b| b < 0x80), "{line}");
        assert_eq!(serde_json::from_str::<Value>(&line).unwrap(), v);
    }

    #[test]
    fn an_astral_char_is_a_surrogate_pair() {
        assert_eq!(ascii_json(&json!("😀")), "\"\\ud83d\\ude00\"");
        assert_eq!(ascii_json(&json!("é")), "\"\\u00e9\"");
    }

    #[test]
    fn an_ascii_line_is_unchanged() {
        let v = json!({"t": "ping", "pad": "plain \\ text"});
        assert_eq!(ascii_json(&v), v.to_string());
    }
}
