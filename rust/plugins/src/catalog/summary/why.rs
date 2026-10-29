//! Why the band proposes each suggestion ([`Why`]): what bise saw on
//! this Mac first ([`crate::signals::Evidence`], an app's config, a login
//! or a server that waits), else a generic why from the words catalog
//! (`plugins_why_<tool>`), else the start of its own description.

use crate::signals::{family, Evidence, Seen};
use bise_proto::app_rows::{Plugin, Why, WhySource, WHERE_CAP};
use bise_proto::words::settings;

/// A why's text at most this many characters (a generic one is shorter).
pub const WHY_CAP: usize = 60;

/// A connector's why: its evidence, its generic why, its description.
pub fn connector(p: &Plugin, evidence: &[Evidence]) -> Why {
    let name = p.id.strip_prefix("mistral:").unwrap_or(&p.id);
    if let Some(e) = evidence_of(name, evidence) {
        return seen_in(e);
    }
    if let Some(text) = generic(name) {
        return Why { text: text.to_string(), source: WhySource::Generic, places: Vec::new() };
    }
    described(p).unwrap_or_else(|| Why { text: settings::plugins_why_mistral.to_string(), source: WhySource::Generic, places: Vec::new() })
}

/// The evidence for this connector name, if any: its family's.
pub fn evidence_of<'a>(name: &str, evidence: &'a [Evidence]) -> Option<&'a Evidence> {
    let f = family(name)?;
    evidence.iter().find(|e| e.family == f)
}

/// Seen in his projects: 'SENTRY_DSN in 2 of your projects', where: the
/// first [`WHERE_CAP`] projects.
fn seen_in(e: &Evidence) -> Why {
    let thing = match &e.seen {
        Seen::Host(h) => settings::plugins_why_remote(h),
        Seen::File(f) | Seen::Env(f) => f.clone(),
    };
    let text = match e.places.len() {
        1 => settings::plugins_why_seen_one(thing),
        n => settings::plugins_why_seen(thing, n),
    };
    Why { text, source: WhySource::Seen, places: e.places.iter().take(WHERE_CAP).cloned().collect() }
}

/// Something bise saw that is not a project's (an app's config, a login
/// that waits, a server's error line).
pub fn seen(text: String) -> Why {
    Why { text: cut(&text), source: WhySource::Seen, places: Vec::new() }
}

/// Its description's first sentence, cut at [`WHY_CAP`] on a word.
pub fn described(p: &Plugin) -> Option<Why> {
    let what = p.what.as_deref()?.trim();
    let first = first_sentence(what);
    (!first.is_empty()).then(|| Why { text: cut(first), source: WhySource::Description, places: Vec::new() })
}

/// The generic why of a connector name (an exact name first, then the
/// one it starts with: `datadog_eu` is datadog's).
pub fn generic(name: &str) -> Option<&'static str> {
    GENERIC
        .iter()
        .find(|(names, _)| names.contains(&name))
        .or_else(|| GENERIC.iter().find(|(names, _)| names.iter().any(|n| name.strip_prefix(n).is_some_and(|r| r.starts_with('_')))))
        .map(|(_, t)| *t)
}

/// Connector names and their generic why (the words are designer's, in
/// the catalog; this only picks).
pub(super) const GENERIC: &[(&[&str], &str)] = &[
    (&["linear"], settings::plugins_why_linear),
    (&["github"], settings::plugins_why_github),
    (&["gitlab"], settings::plugins_why_gitlab),
    (&["atlassian"], settings::plugins_why_atlassian),
    (&["jira"], settings::plugins_why_jira),
    (&["confluence"], settings::plugins_why_confluence),
    (&["notion"], settings::plugins_why_notion),
    (&["slack"], settings::plugins_why_slack),
    (&["gmail"], settings::plugins_why_gmail),
    (&["outlook", "outlook_mail"], settings::plugins_why_outlook),
    (&["google_drive", "gdrive", "drive"], settings::plugins_why_drive),
    (&["google_calendar", "outlook_calendar", "calendar"], settings::plugins_why_calendar),
    (&["figma"], settings::plugins_why_figma),
    (&["sentry"], settings::plugins_why_sentry),
    (&["datadog"], settings::plugins_why_datadog),
    (&["airtable"], settings::plugins_why_airtable),
    (&["hubspot"], settings::plugins_why_hubspot),
    (&["stripe"], settings::plugins_why_stripe),
];

/// Up to its first '. ' (or line end).
fn first_sentence(s: &str) -> &str {
    let line = s.lines().next().unwrap_or("");
    let end = line.find(". ").map(|i| i + 1).unwrap_or(line.len());
    line[..end].trim().trim_end_matches('.')
}

/// At most [`WHY_CAP`] characters, cut after a whole word with '…'.
pub fn cut(s: &str) -> String {
    let s = s.trim();
    if s.chars().count() <= WHY_CAP {
        return s.to_string();
    }
    let head: String = s.chars().take(WHY_CAP - 1).collect();
    // the next char starts a word: the head ends on a whole one
    let next_is_space = s.chars().nth(WHY_CAP - 1).is_some_and(char::is_whitespace);
    let kept = if next_is_space { head.as_str() } else { head.rsplit_once(char::is_whitespace).map(|(a, _)| a).unwrap_or(head.as_str()) };
    format!("{}…", kept.trim_end().trim_end_matches([',', ';', ':']))
}
