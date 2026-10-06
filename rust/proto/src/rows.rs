//! The rows a hub lists: its agents and its open cards (the `agents` and
//! `cards` events; S1's `view.json` reuses them), and the split of a
//! question's trailing numbered options.

use crate::Project;
use serde::{Deserialize, Serialize};

/// An agent's status as every view shows it (the hub's words mapped:
/// starting is working, stopped is done; archived is a flag).
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
#[serde(rename_all = "snake_case")]
pub enum Status {
    Working,
    Idle,
    Waiting,
    Blocked,
    Done,
    Failed,
}

impl Status {
    /// The hub's status word (`model::Status::as_str`): the status and
    /// whether the agent is archived (an archived one shows done).
    pub fn of_hub(word: &str) -> (Status, bool) {
        match word {
            "starting" | "working" => (Status::Working, false),
            "waiting" => (Status::Waiting, false),
            "blocked" => (Status::Blocked, false),
            "failed" => (Status::Failed, false),
            "done" | "stopped" => (Status::Done, false),
            "archived" => (Status::Done, true),
            _ => (Status::Idle, false),
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
#[serde(rename_all = "snake_case")]
pub enum ReportKind {
    Progress,
    Done,
    Failed,
    Blocked,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct Report {
    pub kind: ReportKind,
    pub text: String,
    pub at_ms: u64,
}

/// One agent of a hub.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct Agent {
    pub name: String,
    pub main: bool,
    pub status: Status,
    pub archived: bool,
    /// what it says it does now, else its last report, else its
    /// objective: one line (the TUI's title)
    pub title: String,
    /// its objective's first line
    pub purpose: String,
    /// since when it has this status
    pub since_ms: u64,
    /// his open cards from it
    pub waits: u32,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub parent: Option<String>,
    /// its worktree's branch (none: it works in the shared checkout)
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub branch: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub worktree: Option<String>,
    /// how long its turn has run (working only)
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub turn_ms: Option<u64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub report: Option<Report>,
    /// draft (not frozen until the hub sends it, amb-hub's queued inputs):
    /// his messages waiting for its turn to end, oldest first
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub queued: Vec<crate::draft::Queued>,
    /// its folder in the hub's `agents/` (its name but after a rename):
    /// where `sb history --project` reads its thread on disk (S2 C);
    /// none in a view written before this field (read as the name)
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub dir: Option<String>,
    /// its former names (a rename), which `sb history --agent` takes too
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub aliases: Vec<String>,
}

/// A numbered option of a card.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct Opt {
    pub n: u32,
    pub label: String,
}

/// Where a card points on a page (a question block, a step of a plan).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct CardPage {
    pub id: String,
    pub url: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub block: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub item: Option<String>,
}

/// One open card: what waits on him.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct Card {
    pub id: u64,
    pub project: Project,
    /// the hub's kind (`question`, `confirm`, `merge`, …): an open set
    pub kind: String,
    pub agent: String,
    /// the question without its options
    pub question: String,
    pub options: Vec<Opt>,
    /// it holds running work now (a tool call waiting for a yes)
    pub urgent: bool,
    pub since_ms: u64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub page: Option<CardPage>,
    /// it acts or leaves (a tool call's yes, a merge, a release...): only
    /// one of its options answers it, never typed words (the composer
    /// rule, lead m_8777); false: a question, words answer it
    #[serde(default, skip_serializing_if = "crate::is_false")]
    pub approval: bool,
}

impl Card {
    /// A kind answered only by one of its options: every kind but
    /// `question` and `drop` (sb-core keeps yes/no words there, and a drop
    /// never reaches a window: bise's bookkeeping): the hub's `confirm`,
    /// `merge`, `feature_try`, `feature_merge`, `update`, `signin`, and any
    /// newer one (a kind nobody taught the clients is safer picked than
    /// typed). sb-core's refusal of words says the same (amb-hub's
    /// agreement test, architect m_8848).
    pub fn approval_kind(kind: &str) -> bool {
        !matches!(kind, "question" | "drop")
    }
}

/// A commit that reached the project's trunk today (the changes tab's
/// "merged today", amb-web m_8974).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct Merged {
    /// the full sha
    pub sha: String,
    /// its subject line
    pub title: String,
    /// the agent whose land brought it (sb land, the merge path); absent:
    /// not landed through bise (his own commit), or not known
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub by: Option<String>,
    /// its commit time
    pub at_ms: u64,
}

/// A server an agent runs in the background (`pnpm dev`, a local
/// grafana): its job listening on a port, or a known server command not
/// listening yet (no port, no url).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct DevServer {
    pub agent: String,
    /// what it is ("dev server", "http server")
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    /// `http://localhost:<port>` once it listens
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub port: Option<u16>,
    /// the job's command line
    pub cmd: String,
    /// its job runs
    pub up: bool,
}

/// A worktree of the project's repo: an agent's, or one of his own (the
/// main checkout included).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct Worktree {
    pub path: String,
    /// its branch ("" when detached)
    pub branch: String,
    /// the full sha it sits at ("detached at e0f3df5", amb-web m_8951)
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub head: Option<String>,
    /// the agent working there (none: his own)
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub agent: Option<String>,
    /// changes not committed, untracked files included
    pub dirty: bool,
    /// commits ahead of and behind the trunk
    pub ahead: u32,
    pub behind: u32,
}

/// A question and its options: the trailing numbered lines (`1. v1`,
/// `1) v1`, `1 - v1`, `1 v1`, two to nine, numbered from 1) or a list
/// inline at the end of its last line (`Que fais-tu ? 1. a 2. b`). None
/// found: the text as is and no options. A copy of the TUI's
/// `sb/cards.rs split_choices` (bend-tui tests that they agree); the
/// TUI takes this one at the ambient merge.
pub fn split_choices(text: &str) -> (String, Vec<String>) {
    let lines: Vec<&str> = text.trim_end().lines().collect();
    let choice = |l: &str| -> Option<(u32, String)> {
        let l = l.trim();
        let digits: String = l.chars().take_while(|c| c.is_ascii_digit()).collect();
        let n: u32 = digits.parse().ok()?;
        let rest = &l[digits.len()..];
        let label = rest
            .strip_prefix(". ")
            .or_else(|| rest.strip_prefix(") "))
            .or_else(|| rest.strip_prefix(" - "))
            .or_else(|| rest.strip_prefix(" – "))
            .or_else(|| rest.strip_prefix(' ').filter(|r| !r.starts_with(['-', '–', ' '])))?
            .trim();
        (!label.is_empty()).then(|| (n, label.to_string()))
    };
    let mut tail: Vec<(u32, String)> = Vec::new();
    for l in lines.iter().rev() {
        match choice(l) {
            Some(c) => tail.push(c),
            None => break,
        }
    }
    tail.reverse();
    let numbered = tail.iter().enumerate().all(|(i, (n, _))| *n as usize == i + 1);
    if tail.len() < 2 || tail.len() > 9 || !numbered {
        return split_inline(text).unwrap_or_else(|| (text.to_string(), Vec::new()));
    }
    let body = lines[..lines.len() - tail.len()].join("\n").trim_end().to_string();
    (body, tail.into_iter().map(|(_, l)| l).collect())
}

fn split_inline(text: &str) -> Option<(String, Vec<String>)> {
    let t = text.trim_end();
    let line_at = t.rfind('\n').map_or(0, |i| i + 1);
    let line = &t[line_at..];
    for sep in [". ", ") "] {
        let mut at: Vec<(usize, usize)> = Vec::new();
        let mut from = 0;
        for n in 1..=9 {
            let m = format!("{n}{sep}");
            let found = line[from..].match_indices(&m).map(|(i, _)| from + i).find(|&i| i == 0 || line[..i].ends_with(' '));
            match found {
                Some(i) => {
                    at.push((i, i + m.len()));
                    from = i + m.len();
                }
                None => break,
            }
        }
        if at.len() < 2 {
            continue;
        }
        let options: Vec<String> = at
            .iter()
            .enumerate()
            .map(|(k, &(_, start))| {
                let end = at.get(k + 1).map_or(line.len(), |&(i, _)| i);
                line[start..end].trim().trim_end_matches([',', ';']).trim().to_string()
            })
            .collect();
        if options.iter().any(|o| o.is_empty()) {
            continue;
        }
        let body = format!("{}{}", &t[..line_at], line[..at[0].0].trim_end()).trim_end().to_string();
        return Some((body, options));
    }
    None
}

/// A question's text as a card shows it: the body and its options.
pub fn question(text: &str) -> (String, Vec<Opt>) {
    let (body, options) = split_choices(text);
    let opts = options.into_iter().enumerate().map(|(i, label)| Opt { n: i as u32 + 1, label }).collect();
    (body.trim().to_string(), opts)
}

/// An artifact of a project (what an agent made for him), the
/// `artifacts` event's row.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct Artifact {
    pub id: String,
    pub kind: String,
    pub title: String,
    pub agent: String,
    pub version: u32,
    pub at_ms: u64,
    pub url: String,
    /// made or changed since he last looked
    pub new: bool,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn hub_words_map_to_statuses() {
        assert_eq!(Status::of_hub("starting"), (Status::Working, false));
        assert_eq!(Status::of_hub("stopped"), (Status::Done, false));
        assert_eq!(Status::of_hub("archived"), (Status::Done, true));
        assert_eq!(Status::of_hub("idle"), (Status::Idle, false));
    }

    #[test]
    fn a_question_loses_its_options() {
        let (q, o) = question("keep the banner?\n1. yes\n2. no");
        assert_eq!((q.as_str(), o.len(), o[1].label.as_str(), o[1].n), ("keep the banner?", 2, "no", 2));
        let (q, o) = question("Que fais-tu ? 1. regarde le diff 2. arrête-le 3. laisse-le finir");
        assert_eq!((q.as_str(), o[2].label.as_str()), ("Que fais-tu ?", "laisse-le finir"));
        let (q, o) = question("how should agents ship?\n1 a PR per task\n2 straight to main");
        assert_eq!((q.as_str(), o[0].label.as_str()), ("how should agents ship?", "a PR per task"));
        assert_eq!(question("plain"), ("plain".to_string(), vec![]));
    }
}
