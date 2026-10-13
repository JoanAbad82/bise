//! What a connector call does to the user's accounts, read from the
//! tool's name (`slack.slack_send_message` → a send). The Mistral
//! connectors gateway runs every call it gets and never asks for a
//! confirmation (it ignores a connector's `requires_confirmation`), so in
//! `auto` the hub asks: a write is always a card, with no checker; a read
//! runs at once; any other name goes to the checker.
//!
//! The name is all the hub has: the gate line carries the tool and its
//! arguments, and the connector index (bootstrap) keeps no
//! `requires_confirmation` and no MCP annotations (`readOnlyHint`,
//! `destructiveHint`). So a miss must never read as a read: Read is
//! narrow (the name's first word is a read verb and no other word could
//! be a write), anything unclear is Unknown. One table of words, here.

/// What a connector tool does, by the words of its name.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Act {
    /// It writes on the user's account: a card, always.
    Write(Write),
    /// It only reads: it runs at once.
    Read,
    /// Not said for sure: the checker decides.
    Unknown,
}

/// The kind of write, for the card's sentence.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Write {
    Send,
    Schedule,
    Delete,
    Change,
}

use Write::{Change as C, Delete as D, Schedule as S, Send as M};

/// Verbs that write wherever they are in the name, with their kind.
const WRITES: &[(&str, Write)] = &[
    ("delete", D), ("remove", D), ("trash", D), ("cancel", D), ("archive", D), ("purge", D), ("revoke", D),
    ("unsubscribe", D), ("destroy", D), ("erase", D), ("wipe", D),
    ("reschedule", S),
    ("send", M), ("forward", M), ("publish", M), ("submit", M), ("notify", M), ("react", M),
    ("create", C), ("update", C), ("edit", C), ("write", C), ("save", C), ("add", C), ("move", C), ("upload", C),
    ("merge", C), ("rename", C), ("assign", C), ("unassign", C), ("insert", C), ("modify", C), ("approve", C),
    ("deny", C), ("accept", C), ("decline", C), ("grant", C), ("pay", C), ("respond", C), ("upsert", C), ("put", C),
    ("patch", C), ("execute", C), ("trigger", C), ("deploy", C), ("restart", C), ("install", C), ("uninstall", C),
    ("enable", C), ("disable", C), ("import", C), ("replace", C), ("reset", C), ("duplicate", C), ("subscribe", C),
    ("follow", C), ("unfollow", C), ("mute", C), ("unmute", C), ("push", C), ("fork", C), ("restore", C),
    ("retire", C), ("unlabel", C), ("unshare", C), ("resolve", C), ("reopen", C), ("toggle", C), ("invoke", C),
    ("rsvp", C), ("unpin", C), ("unstar", C), ("rerun", C), ("revert", C), ("kill", C), ("apply", C), ("attach", C),
    ("detach", C), ("dismiss", C), ("snooze", C), ("sign", C), ("connect", C), ("disconnect", C), ("authorize", C),
    ("register", C), ("enroll", C), ("unlock", C), ("convert", C), ("rotate", C), ("provision", C),
];
/// Words that are a verb or a noun (`label_message` writes, `get_label`
/// reads): first, they write; elsewhere, the name is not a sure read.
const EITHER: &[(&str, Write)] = &[
    ("schedule", S),
    ("post", M), ("reply", M), ("share", M), ("invite", M), ("email", M), ("dm", M), ("message", M), ("comment", M),
    ("review", M), ("mention", M),
    ("mark", C), ("label", C), ("tag", C), ("pin", C), ("star", C), ("like", C), ("block", C), ("drop", C), ("copy", C),
    ("reaction", C), ("draft", C), ("flag", C), ("vote", C), ("rate", C), ("watch", C), ("track", C), ("order", C),
    ("pause", C), ("resume", C), ("run", C), ("start", C), ("stop", C), ("close", C), ("clear", C), ("lock", C),
    ("request", C), ("commit", C), ("transfer", C), ("book", C), ("sync", C), ("log", C), ("set", C), ("join", C),
    ("leave", C), ("complete", C), ("generate", C), ("transcribe", C), ("translate", C), ("scale", C),
];
/// Never a sure read, never a sure write (`open_url` reads a page,
/// `open_pull_request` writes): the checker.
const UNSURE: &[&str] = &["open"];
/// Verbs that read, as the name's first word.
const READ: &[&str] = &[
    "get", "list", "search", "read", "find", "fetch", "query", "describe", "show", "view", "lookup", "count", "retrieve",
    "inspect", "browse", "preview", "explore", "download", "export", "summarize", "compare", "diagnose", "infer", "probe",
    "extract", "crawl", "map", "research", "whoami", "check",
];

/// The words of a tool's function name, lowercase, without the
/// connector's name repeated in front (`slack.slack_sendMessage` → `send
/// message`); a name that is only the connector's keeps its words.
fn words(tool: &str) -> Vec<String> {
    let (svc, f) = tool.rsplit_once('.').unwrap_or(("", tool));
    let ws = split(f);
    let prefix = split(svc);
    if !prefix.is_empty() && ws.len() > prefix.len() && ws[..prefix.len()] == prefix[..] {
        return ws[prefix.len()..].to_vec();
    }
    ws
}

/// snake, kebab and camel case into lowercase words.
fn split(s: &str) -> Vec<String> {
    let mut out: Vec<String> = Vec::new();
    let mut cur = String::new();
    let mut prev_lower = false;
    for c in s.chars() {
        if !c.is_ascii_alphanumeric() {
            if !cur.is_empty() {
                out.push(std::mem::take(&mut cur));
            }
            prev_lower = false;
            continue;
        }
        if c.is_ascii_uppercase() && prev_lower && !cur.is_empty() {
            out.push(std::mem::take(&mut cur));
        }
        prev_lower = c.is_ascii_lowercase() || c.is_ascii_digit();
        cur.push(c.to_ascii_lowercase());
    }
    if !cur.is_empty() {
        out.push(cur);
    }
    out
}

fn kind_in(table: &[(&str, Write)], w: &str) -> Option<Write> {
    table.iter().find(|(t, _)| *t == w).map(|(_, k)| *k)
}

/// What the tool does. A write verb anywhere makes it a write (the
/// strongest kind: delete, schedule, send, change); a verb-or-noun
/// first makes it one too (`message_user` sends); a read needs a read
/// verb first and nothing after it that could write.
pub fn act(tool: &str) -> Act {
    let ws = words(tool);
    let kinds: Vec<Write> = ws.iter().filter_map(|w| kind_in(WRITES, w)).collect();
    for k in [D, S, M, C] {
        if kinds.contains(&k) {
            return Act::Write(k);
        }
    }
    let Some(first) = ws.first().map(String::as_str) else { return Act::Unknown };
    if let Some(k) = kind_in(EITHER, first) {
        return Act::Write(k);
    }
    let unsure = ws.iter().any(|w| UNSURE.contains(&w.as_str()) || kind_in(EITHER, w).is_some());
    if READ.contains(&first) && !unsure {
        return Act::Read;
    }
    Act::Unknown
}

/// The connector's name as the user knows it: `gmail.send_email` →
/// Gmail, `outlook_calendar.x` → Outlook Calendar.
pub fn service(tool: &str) -> String {
    let svc = tool.split('.').next().unwrap_or(tool).to_ascii_lowercase();
    let known = match svc.as_str() {
        "gmail" => Some("Gmail"),
        "outlook" | "outlook_mail" => Some("Outlook"),
        "outlook_calendar" => Some("Outlook Calendar"),
        "kit" => Some("Kit"),
        "slack" => Some("Slack"),
        "linear" => Some("Linear"),
        "github" | "github_app" => Some("GitHub"),
        "google_drive" | "google_drive_mcp" => Some("Google Drive"),
        "google_calendar" => Some("Google Calendar"),
        "notion" => Some("Notion"),
        "granola" => Some("Granola"),
        "x" => Some("X"),
        _ => None,
    };
    if let Some(k) = known {
        return k.into();
    }
    let mut out = String::new();
    for (i, w) in svc.split('_').filter(|w| !w.is_empty()).enumerate() {
        if i > 0 {
            out.push(' ');
        }
        let mut cs = w.chars();
        if let Some(c) = cs.next() {
            out.push(c.to_ascii_uppercase());
            out.extend(cs);
        }
    }
    out
}

/// The card's sentence for a write (designer m_21125). A delete's is the
/// card's warning: the card text gives it a `warn: ` line, drawn with ▲ in
/// the warn tone ([`warns`]).
pub fn reason(tool: &str, w: Write) -> String {
    let s = service(tool);
    match w {
        Write::Send => format!("it sends from your {s} account, as you."),
        Write::Schedule => format!("it schedules a send from your {s} account, as you."),
        Write::Delete => format!("it deletes from your {s} account. it may not be undone."),
        Write::Change => format!("it changes your {s} account."),
    }
}

/// The card's sentence is a warning: the tool deletes.
pub fn warns(tool: &str) -> bool {
    tool.contains('.') && act(tool) == Act::Write(Write::Delete)
}

#[cfg(test)]
pub(super) fn words_of(tool: &str) -> Vec<String> {
    words(tool)
}
