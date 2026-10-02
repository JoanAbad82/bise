//! The page store (docs/ambient-pages.md §2.1): `<state>/pages/<id>/`
//! holds `v<n>.html` (each version as published, never edited),
//! `meta.json` and `notes.json`. Plain functions over a directory; the
//! caller holds the lock ([`super::Pages`]) so the hub and the page
//! server never write a page at the same time.

use super::lint::Block;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::path::{Path, PathBuf};

#[derive(Clone, Debug, Default, PartialEq, Serialize, Deserialize)]
pub struct Version {
    pub n: u64,
    pub at_ms: u64,
    #[serde(default)]
    pub blocks: Vec<Block>,
}

#[derive(Clone, Debug, Default, PartialEq, Serialize, Deserialize)]
pub struct Meta {
    pub id: String,
    pub title: String,
    pub agent: String,
    pub created_ms: u64,
    #[serde(default)]
    pub versions: Vec<Version>,
    /// "ready" | "updating" | "writing"
    #[serde(default = "ready")]
    pub state: String,
    /// `sb page start --ask`: the user's words that asked for it
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ask: Option<String>,
    /// the newest version the user opened in a browser (0: none yet)
    #[serde(default)]
    pub opened_version: u64,
}

fn ready() -> String {
    "ready".into()
}

impl Meta {
    pub fn version(&self) -> u64 {
        self.versions.last().map_or(0, |v| v.n)
    }

    pub fn at_ms(&self) -> u64 {
        self.versions.last().map_or(self.created_ms, |v| v.at_ms)
    }
}

/// One note of the page (§2.1); the fields the store does not read are
/// kept as the note layer wrote them.
#[derive(Clone, Debug, Default, PartialEq, Serialize, Deserialize)]
pub struct Note {
    #[serde(default)]
    pub id: String,
    #[serde(default)]
    pub version: u64,
    #[serde(default)]
    pub block: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub quote: Option<String>,
    /// note, voice, edit, keep, drop, unsure, pick, approve, skip, tick
    #[serde(default)]
    pub kind: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub text: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub before: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub after: Option<String>,
    #[serde(default)]
    pub at_ms: u64,
    /// draft | sent | done | answered
    #[serde(default = "draft")]
    pub status: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub answer: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub sent_ms: Option<u64>,
    /// anything else the note layer keeps on a note
    #[serde(flatten)]
    pub extra: serde_json::Map<String, Value>,
}

fn draft() -> String {
    "draft".into()
}

impl Note {
    /// Not handled yet: a draft, or sent and not done or answered.
    pub fn open(&self) -> bool {
        matches!(self.status.as_str(), "draft" | "sent")
    }
}

/// What a publish asks (`sb page publish`, hub op `page_publish`).
#[derive(Clone, Debug, Default)]
pub struct Publish {
    pub agent: String,
    pub id: Option<String>,
    pub title: Option<String>,
    pub html: String,
    pub done: Vec<String>,
    pub answers: Vec<(String, String)>,
}

/// A page id: `[a-z0-9-]{1,40}`.
pub fn valid_id(id: &str) -> bool {
    (1..=40).contains(&id.len()) && id.bytes().all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'-')
}

/// The id a title gives: lowercase words joined by `-`, 40 chars at most.
pub fn slug(title: &str) -> String {
    let mut out = String::new();
    for c in title.chars().flat_map(|c| c.to_lowercase()) {
        if c.is_ascii_alphanumeric() {
            out.push(c);
        } else if !out.is_empty() && !out.ends_with('-') {
            out.push('-');
        }
        if out.len() >= 40 {
            break;
        }
    }
    out.trim_end_matches('-').to_string()
}

/// A title from an id: `weekly-update` → `weekly update`.
pub fn title_of(id: &str) -> String {
    id.replace('-', " ")
}

pub struct Store {
    pub dir: PathBuf,
}

fn read_json<T: serde::de::DeserializeOwned + Default>(p: &Path) -> T {
    std::fs::read_to_string(p).ok().and_then(|t| serde_json::from_str(&t).ok()).unwrap_or_default()
}

/// Write then rename: a reader never sees half a file.
fn write_json<T: Serialize>(p: &Path, v: &T) -> Result<(), String> {
    let tmp = p.with_extension("json.tmp");
    let text = serde_json::to_string_pretty(v).map_err(|e| e.to_string())?;
    std::fs::write(&tmp, text).map_err(|e| format!("{}: {e}", tmp.display()))?;
    std::fs::rename(&tmp, p).map_err(|e| format!("{}: {e}", p.display()))
}

impl Store {
    pub fn new(state: &Path) -> Store {
        Store { dir: state.join("pages") }
    }

    fn page_dir(&self, id: &str) -> PathBuf {
        self.dir.join(id)
    }

    pub fn meta(&self, id: &str) -> Option<Meta> {
        if !valid_id(id) {
            return None;
        }
        let p = self.page_dir(id).join("meta.json");
        p.exists().then(|| read_json::<Meta>(&p)).filter(|m| !m.id.is_empty())
    }

    pub fn save_meta(&self, m: &Meta) -> Result<(), String> {
        write_json(&self.page_dir(&m.id).join("meta.json"), m)
    }

    pub fn notes(&self, id: &str) -> Vec<Note> {
        if !valid_id(id) {
            return Vec::new();
        }
        read_json(&self.page_dir(id).join("notes.json"))
    }

    pub fn save_notes(&self, id: &str, notes: &[Note]) -> Result<(), String> {
        write_json(&self.page_dir(id).join("notes.json"), &notes)
    }

    /// The page's question blocks and their cards (§4.2).
    pub fn questions(&self, id: &str) -> Vec<super::questions::Question> {
        if !valid_id(id) {
            return Vec::new();
        }
        read_json(&self.page_dir(id).join("questions.json"))
    }

    pub fn save_questions(&self, id: &str, q: &[super::questions::Question]) -> Result<(), String> {
        write_json(&self.page_dir(id).join("questions.json"), &q)
    }

    /// Version `n`'s fragment.
    pub fn html(&self, id: &str, n: u64) -> Option<String> {
        if !valid_id(id) {
            return None;
        }
        std::fs::read_to_string(self.page_dir(id).join(format!("v{n}.html"))).ok()
    }

    /// Every page, newest first.
    pub fn list(&self) -> Vec<Meta> {
        let mut out: Vec<Meta> = std::fs::read_dir(&self.dir)
            .into_iter()
            .flatten()
            .flatten()
            .filter_map(|e| self.meta(&e.file_name().to_string_lossy()))
            .collect();
        out.sort_by(|a, b| b.at_ms().cmp(&a.at_ms()).then(a.id.cmp(&b.id)));
        out
    }

    /// A new version of a page. `blocks`: the lint's (the caller ran
    /// it). `gone`: whether an agent is gone (main may take a gone
    /// agent's page over). Ok: the page's meta, and the note ids the
    /// publish named that the page does not have (said back, not fatal).
    pub fn publish(&self, p: &Publish, blocks: Vec<Block>, now: u64, gone: &dyn Fn(&str) -> bool) -> Result<(Meta, Vec<String>), String> {
        let id = match (&p.id, &p.title) {
            (Some(id), _) => id.clone(),
            (None, Some(t)) => slug(t),
            (None, None) => return Err("give the page an id (--id weekly-update) or a title (--title \"weekly update\")".into()),
        };
        if !valid_id(&id) {
            return Err(format!("{id:?} is not a page id: use a-z, 0-9 and -, at most 40 characters"));
        }
        let mut meta = match self.meta(&id) {
            Some(m) if m.agent != p.agent => {
                if p.agent == "main" && gone(&m.agent) {
                    Meta { agent: "main".into(), ..m }
                } else {
                    return Err(format!("{id} is {}'s page: publish under another --id", m.agent));
                }
            }
            Some(m) => m,
            None => Meta {
                id: id.clone(),
                title: String::new(),
                agent: p.agent.clone(),
                created_ms: now,
                versions: Vec::new(),
                state: ready(),
                ask: None,
                opened_version: 0,
            },
        };
        if let Some(t) = p.title.as_ref().map(|t| t.trim()).filter(|t| !t.is_empty()) {
            meta.title = t.to_string();
        }
        if meta.title.is_empty() {
            meta.title = title_of(&id);
        }
        let n = meta.version() + 1;
        std::fs::create_dir_all(self.page_dir(&id)).map_err(|e| format!("{}: {e}", self.page_dir(&id).display()))?;
        std::fs::write(self.page_dir(&id).join(format!("v{n}.html")), &p.html).map_err(|e| e.to_string())?;
        meta.versions.push(Version { n, at_ms: now, blocks });
        meta.state = ready();
        let mut notes = self.notes(&id);
        let mut unknown = Vec::new();
        for d in &p.done {
            match notes.iter_mut().find(|x| &x.id == d) {
                Some(x) => x.status = "done".into(),
                None => unknown.push(d.clone()),
            }
        }
        for (a, text) in &p.answers {
            match notes.iter_mut().find(|x| &x.id == a) {
                Some(x) => {
                    x.status = "answered".into();
                    x.answer = Some(text.clone());
                }
                None => unknown.push(a.clone()),
            }
        }
        self.save_notes(&id, &notes)?;
        self.save_meta(&meta)?;
        Ok((meta, unknown))
    }

    /// The note layer's drafts (docs/ambient-pages.md §2.7): the list
    /// given replaces every draft (a draft left out is deleted); sent,
    /// done and answered notes never change here. A note without a
    /// usable id gets the next `n<k>`. The notes after.
    pub fn set_drafts(&self, id: &str, given: &[Value], version: u64, now: u64) -> Result<Vec<Note>, String> {
        let mut notes: Vec<Note> = self.notes(id).into_iter().filter(|x| x.status != "draft").collect();
        for g in given {
            let mut n: Note = serde_json::from_value(g.clone()).map_err(|e| format!("a note: {e}"))?;
            if n.id.is_empty() || !n.id.bytes().all(|b| b.is_ascii_alphanumeric() || b == b'-' || b == b'_') || n.id.len() > 40 {
                n.id = next_id(&notes);
            }
            if notes.iter().any(|x| x.id == n.id) {
                return Err(format!("note {} is sent already, or twice in the list", n.id));
            }
            n.status = "draft".into();
            n.answer = None;
            n.sent_ms = None;
            if n.version == 0 {
                n.version = version;
            }
            if n.at_ms == 0 {
                n.at_ms = now;
            }
            notes.push(n);
        }
        self.save_notes(id, &notes)?;
        Ok(notes)
    }

    /// `send`: the drafts become sent. The sent ones (empty: nothing to
    /// send) and every note after.
    pub fn send(&self, id: &str, now: u64) -> Result<Vec<Note>, String> {
        let mut notes = self.notes(id);
        let mut sent = Vec::new();
        for x in notes.iter_mut().filter(|x| x.status == "draft") {
            x.status = "sent".into();
            x.sent_ms = Some(now);
            sent.push(x.clone());
        }
        if !sent.is_empty() {
            self.save_notes(id, &notes)?;
        }
        Ok(sent)
    }

    /// `sb page start` (the page shows at once, its first publish is v1):
    /// a page with no version yet, `agent` writing it. An existing page
    /// of the same agent (or a gone one's, for main) is writing again.
    pub fn start(&self, id: &str, title: Option<&str>, ask: Option<&str>, agent: &str, now: u64, gone: &dyn Fn(&str) -> bool) -> Result<Meta, String> {
        if !valid_id(id) {
            return Err(format!("{id:?} is not a page id: use a-z, 0-9 and -, at most 40 characters"));
        }
        let mut meta = match self.meta(id) {
            Some(m) if m.agent != agent && !(agent == "main" && gone(&m.agent)) => {
                return Err(format!("{id} is {}'s page: start another --id", m.agent));
            }
            Some(m) => Meta { agent: agent.to_string(), ..m },
            None => Meta { id: id.to_string(), title: String::new(), agent: agent.to_string(), created_ms: now, versions: Vec::new(), state: ready(), ask: None, opened_version: 0 },
        };
        if let Some(t) = title.map(str::trim).filter(|t| !t.is_empty()) {
            meta.title = t.to_string();
        }
        if let Some(a) = ask.map(str::trim).filter(|a| !a.is_empty()) {
            meta.ask = Some(a.to_string());
        }
        if meta.title.is_empty() {
            meta.title = title_of(id);
        }
        meta.state = "writing".into();
        std::fs::create_dir_all(self.page_dir(id)).map_err(|e| format!("{}: {e}", self.page_dir(id).display()))?;
        self.save_meta(&meta)?;
        Ok(meta)
    }

    /// A pick on question `block` with no open card (ambient-lead
    /// m_5343): a note of kind `pick`, sent at once. The note.
    pub fn add_pick(&self, id: &str, block: &str, reply: &str, version: u64, now: u64) -> Result<Note, String> {
        let mut notes = self.notes(id);
        let n = Note {
            id: next_id(&notes),
            version,
            block: block.to_string(),
            kind: "pick".into(),
            text: Some(reply.to_string()),
            at_ms: now,
            status: "sent".into(),
            sent_ms: Some(now),
            ..Note::default()
        };
        notes.push(n.clone());
        self.save_notes(id, &notes)?;
        Ok(n)
    }

    /// The user opened version `n` in a browser: the newest he opened
    /// goes up (an older one opened leaves it). Some: it changed.
    pub fn opened(&self, id: &str, n: u64) -> Result<Option<Meta>, String> {
        let Some(mut m) = self.meta(id) else { return Ok(None) };
        if n <= m.opened_version {
            return Ok(None);
        }
        m.opened_version = n;
        self.save_meta(&m)?;
        Ok(Some(m))
    }

    pub fn set_state(&self, id: &str, state: &str) -> Result<Option<Meta>, String> {
        let Some(mut m) = self.meta(id) else { return Ok(None) };
        if m.state == state {
            return Ok(None);
        }
        m.state = state.into();
        self.save_meta(&m)?;
        Ok(Some(m))
    }
}

fn next_id(notes: &[Note]) -> String {
    let max = notes.iter().filter_map(|n| n.id.strip_prefix('n')?.parse::<u64>().ok()).max().unwrap_or(0);
    format!("n{}", max + 1)
}

/// The quote shown for a note: one line, cut at 60 chars with `…`.
fn short(s: &str) -> String {
    let one: String = s.split_whitespace().collect::<Vec<_>>().join(" ");
    if one.chars().count() <= 60 {
        one
    } else {
        format!("{}…", one.chars().take(59).collect::<String>())
    }
}

/// One note as a line of the message (§2.6).
fn note_line(n: &Note) -> String {
    let what = match n.kind.as_str() {
        "edit" => {
            let (b, a) = (n.before.as_deref().unwrap_or(""), n.after.as_deref().unwrap_or(""));
            return format!("on {}, you changed \"{}\" → \"{}\"", n.block, short(b), short(a));
        }
        "keep" => "♡ keep".to_string(),
        "drop" => "✗ drop".to_string(),
        "unsure" => "~ not sure".to_string(),
        "approve" => "approve".to_string(),
        "skip" => "skip".to_string(),
        "tick" => "✓ tick".to_string(),
        "pick" => format!("pick: {}", n.text.as_deref().unwrap_or("")),
        "voice" => format!("(said) {}", n.text.as_deref().unwrap_or("")),
        _ => n.text.clone().unwrap_or_default(),
    };
    match n.quote.as_deref().filter(|q| !q.trim().is_empty()) {
        Some(q) => format!("on \"{}\" ({}): {}", short(q), n.block, what.trim()),
        None => format!("on {}: {}", n.block, what.trim()),
    }
}

/// The message the page's agent gets on `send` (§2.6), as from the user.
pub fn notes_message(m: &Meta, url: &str, sent: &[Note]) -> String {
    let count = if sent.len() == 1 { "1 note".to_string() } else { format!("{} notes", sent.len()) };
    let mut out = format!("you sent {count} on your page \"{}\" ({} v{}, {url}):\n", m.title, m.id, m.version());
    for (i, n) in sent.iter().enumerate() {
        out.push_str(&format!("{}. {}\n", i + 1, note_line(n)));
    }
    let ids: Vec<&str> = sent.iter().map(|n| n.id.as_str()).collect();
    let first = ids.first().copied().unwrap_or("n1");
    out.push_str(&format!(
        "answer with: sb page publish <file> --id {} --notes-done {} (or --note-answer {first}=\"…\")\n",
        m.id,
        ids.join(",")
    ));
    let data = serde_json::to_string(sent).unwrap_or_else(|_| "[]".into());
    out.push_str(&format!("<page-notes page=\"{}\" version=\"{}\">{data}</page-notes>", m.id, m.version()));
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn temp() -> PathBuf {
        static N: std::sync::atomic::AtomicUsize = std::sync::atomic::AtomicUsize::new(0);
        let d = std::env::temp_dir().join(format!("sb-pages-{}-{}", std::process::id(), N.fetch_add(1, std::sync::atomic::Ordering::SeqCst)));
        std::fs::create_dir_all(&d).unwrap();
        d
    }

    fn publish(agent: &str, id: Option<&str>, title: Option<&str>) -> Publish {
        Publish { agent: agent.into(), id: id.map(String::from), title: title.map(String::from), html: "<section data-kit=\"prose\" data-id=\"p1\"><p>hi</p></section>".into(), ..Publish::default() }
    }

    #[test]
    fn ids_and_slugs() {
        assert!(valid_id("weekly-update") && valid_id("a") && !valid_id("") && !valid_id("A") && !valid_id("../x"));
        assert!(!valid_id(&"a".repeat(41)));
        assert_eq!(slug("Weekly update: Slack & Linear!"), "weekly-update-slack-linear");
        assert_eq!(title_of("weekly-update"), "weekly update");
    }

    #[test]
    fn publish_versions_owner_and_takeover() {
        let d = temp();
        let s = Store::new(&d);
        let none = |_: &str| false;
        let (m, _) = s.publish(&publish("t1", None, Some("Weekly update")), vec![], 10, &none).unwrap();
        assert_eq!((m.id.as_str(), m.title.as_str(), m.agent.as_str(), m.version()), ("weekly-update", "Weekly update", "t1", 1));
        let (m, _) = s.publish(&publish("t1", Some("weekly-update"), None), vec![], 20, &none).unwrap();
        assert_eq!((m.version(), m.title.as_str()), (2, "Weekly update"));
        assert!(s.html("weekly-update", 1).is_some() && s.html("weekly-update", 2).is_some());
        // another agent's page
        let e = s.publish(&publish("t2", Some("weekly-update"), None), vec![], 30, &none).unwrap_err();
        assert!(e.contains("t1's page"), "{e}");
        // main takes over a gone agent's page
        let (m, _) = s.publish(&publish("main", Some("weekly-update"), None), vec![], 40, &|a| a == "t1").unwrap();
        assert_eq!((m.agent.as_str(), m.version()), ("main", 3));
        assert!(s.publish(&publish("t1", None, None), vec![], 50, &none).is_err());
        assert_eq!(s.list().len(), 1);
        let _ = std::fs::remove_dir_all(d);
    }

    #[test]
    fn notes_draft_send_and_outcomes() {
        let d = temp();
        let s = Store::new(&d);
        s.publish(&publish("t1", Some("w"), None), vec![], 10, &|_| false).unwrap();
        let notes = s
            .set_drafts("w", &[json!({"block": "t1", "quote": "Revenue", "kind": "note", "text": "use the March numbers"}), json!({"block": "p2", "kind": "drop", "x": 1})], 1, 11)
            .unwrap();
        assert_eq!(notes.iter().map(|n| n.id.as_str()).collect::<Vec<_>>(), vec!["n1", "n2"]);
        assert_eq!(notes[1].extra.get("x"), Some(&json!(1)), "the layer's own fields are kept");
        // the whole draft list again: n1 edited, n2 left out (deleted), an edit added
        s.set_drafts("w", &[json!({"id": "n1", "block": "t1", "quote": "Revenue", "kind": "note", "text": "use March"}), json!({"block": "p4", "kind": "edit", "before": "Q2", "after": "Q3"})], 1, 12)
            .unwrap();
        let sent = s.send("w", 13).unwrap();
        assert_eq!(sent.iter().map(|n| (n.id.as_str(), n.status.as_str())).collect::<Vec<_>>(), vec![("n1", "sent"), ("n2", "sent")]);
        assert!(s.send("w", 14).unwrap().is_empty(), "nothing left to send");
        // a sent note can't be edited as a draft
        assert!(s.set_drafts("w", &[json!({"id": "n1", "text": "x"})], 1, 15).is_err());
        // an empty list clears the drafts, never the sent ones
        assert_eq!(s.set_drafts("w", &[], 1, 16).unwrap().len(), 2);
        let m = s.meta("w").unwrap();
        let msg = notes_message(&m, "http://127.0.0.1:47100/p/w", &sent);
        assert!(msg.starts_with("you sent 2 notes on your page \"w\" (w v1, http://127.0.0.1:47100/p/w):\n1. on \"Revenue\" (t1): use March\n2. on p4, you changed \"Q2\" → \"Q3\"\nanswer with: sb page publish <file> --id w --notes-done n1,n2 (or --note-answer n1=\"…\")\n<page-notes page=\"w\" version=\"1\">[{"), "{msg}");
        // the next version's outcomes
        let (_, unknown) = s
            .publish(&Publish { done: vec!["n1".into(), "n9".into()], answers: vec![("n2".into(), "kept: Marc asked".into())], ..publish("t1", Some("w"), None) }, vec![], 20, &|_| false)
            .unwrap();
        assert_eq!(unknown, vec!["n9"]);
        let notes = s.notes("w");
        assert_eq!(notes.iter().map(|n| n.status.as_str()).collect::<Vec<_>>(), vec!["done", "answered"]);
        assert_eq!(notes[1].answer.as_deref(), Some("kept: Marc asked"));
        let _ = std::fs::remove_dir_all(d);
    }
}
