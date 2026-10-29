//! Saves in one turn (office-artifacts plan §6, architect m_23701 §9.4):
//! an agent that saves a file 30 times in one turn makes one version, not
//! 30 rows. A save by the same agent in the same turn as the newest
//! version replaces that version's copy: `v` stays n, its `rev` grows, and
//! each rev keeps what it changed (the writer's list, plan §9b).
//!
//! The user's edits in the viewer's grid (page xlsx-univer, architect
//! m_37328) follow the same rule with another author: his saves in one
//! sitting (one edit session of the viewer, [`Sitting`]) make one version.
//!
//! Pure: the turn ([`Turn`]) is stamped by the hub at its door from
//! sb-core's fact (the agent's `turn_ms`, `daemon/art.rs`), never from the
//! request; a sitting's id comes from the viewer (pages/artifact/save.rs).
//! `artifacts.rs` only calls [`place`], [`place_sitting`] and [`merged`].

use bise_proto::anchor::Anchor;
use serde::{Deserialize, Serialize};

/// The turn a save came in: the agent, and when sb-core says its turn
/// started. None for a save outside a turn (the user's add, a process
/// still writing after the turn ended): always a new version.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Turn {
    pub agent: String,
    pub started_ms: u64,
}

/// A sitting of the user's edits in the viewer: who (`you`), the viewer's
/// edit session, and the newest save of it applied (`seq`, counted by the
/// viewer from 1: a retry of one already applied writes nothing).
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Sitting {
    pub by: String,
    pub session: String,
    #[serde(default)]
    pub seq: u64,
}

impl Sitting {
    /// The same sitting (who and session; `seq` is where it is in it).
    pub fn same(&self, other: &Sitting) -> bool {
        self.by == other.by && self.session == other.session
    }
}

/// One save of a version: its number in the version (1, 2, …), when, and
/// what it changed as the writer said it (None: the add said nothing,
/// `sb artifact add` or an older `bise office run`).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct Rev {
    pub rev: u32,
    pub at_ms: u64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub changed: Option<Vec<Anchor>>,
}

/// Where a save goes.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Place {
    /// a new version, n + 1
    New,
    /// the newest version again: its copy replaced, its rev grows
    Same,
}

/// The rule: the same agent in the same turn as the newest version's
/// first save replaces it; anything else (no turn on either side, another
/// agent, another turn, no version yet) is a new version.
pub fn place(last: Option<&Turn>, now: Option<&Turn>) -> Place {
    match (last, now) {
        (Some(a), Some(b)) if a == b => Place::Same,
        _ => Place::New,
    }
}

/// The same rule for a save of his in the viewer: the newest version made
/// in the same sitting is replaced; a version by an agent, another
/// sitting, or none, is a new version.
pub fn place_sitting(last: Option<&Sitting>, now: Option<&Sitting>) -> Place {
    match (last, now) {
        (Some(a), Some(b)) if a.same(b) => Place::Same,
        _ => Place::New,
    }
}

/// The most anchors a version (or a rev) keeps: a short list, for the
/// marks and the words; past it the words count what is kept.
pub const CHANGED_CAP: usize = 24;

/// What a version changed: its revs' lists together, each anchor once, in
/// the order first seen, at most [`CHANGED_CAP`]. None when a rev has no
/// list (that save said nothing: the version shows no detail) or there is
/// no rev.
pub fn merged(revs: &[Rev]) -> Option<Vec<Anchor>> {
    if revs.is_empty() {
        return None;
    }
    let mut out: Vec<Anchor> = Vec::new();
    for r in revs {
        for a in r.changed.as_ref()? {
            if out.len() < CHANGED_CAP && !out.contains(a) {
                out.push(a.clone());
            }
        }
    }
    Some(out)
}

/// The live words of an artifact whose newest version is `v`
/// (`bise_proto::office::live_words`): `maker_turn` is when the turn of
/// the agent that made it started, now (sb-core's fact; None: idle).
/// Its turn still runs when that is the version's own turn.
pub fn live(v: &crate::artifacts::Version, maker_turn: Option<u64>) -> Option<bise_proto::rows::ArtifactLive> {
    let working = v.turn.as_ref().is_some_and(|t| Some(t.started_ms) == maker_turn);
    let rev_changed = v.revs.last().and_then(|r| r.changed.clone());
    let changed = v.changed();
    bise_proto::office::live_words(&bise_proto::office::LiveState {
        agent: v.turn.as_ref().map_or("", |t| t.agent.as_str()),
        working,
        v: v.v as u32,
        rev_changed: rev_changed.as_deref(),
        changed: changed.as_deref(),
    })
}

/// The next rev of a version that has `revs` (1 for a new version).
pub fn next_rev(revs: &[Rev]) -> u32 {
    revs.last().map_or(1, |r| r.rev + 1)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn turn(agent: &str, at: u64) -> Turn {
        Turn { agent: agent.into(), started_ms: at }
    }

    fn slide(n: u32) -> Anchor {
        Anchor::Slide { slide: n, rect: None }
    }

    fn rev(rev: u32, changed: Option<Vec<Anchor>>) -> Rev {
        Rev { rev, at_ms: rev as u64 * 10, changed }
    }

    /// The law: same agent, same turn -> the same version; every other
    /// pair -> a new one.
    #[test]
    fn only_the_same_agent_in_the_same_turn_replaces() {
        let t = turn("deck", 100);
        assert_eq!(place(Some(&t), Some(&turn("deck", 100))), Place::Same);
        assert_eq!(place(Some(&t), Some(&turn("deck", 200))), Place::New, "its next turn");
        assert_eq!(place(Some(&t), Some(&turn("sheet", 100))), Place::New, "another agent");
        assert_eq!(place(Some(&t), None), Place::New, "a save outside a turn (the user's add)");
        assert_eq!(place(None, Some(&t)), Place::New, "after a version made outside a turn");
        assert_eq!(place(None, None), Place::New, "two adds outside a turn never merge");
    }

    fn sitting(session: &str, seq: u64) -> Sitting {
        Sitting { by: "you".into(), session: session.into(), seq }
    }

    /// His sitting replaces its own version only: another sitting, an
    /// agent's version, or a save with no sitting is a new version.
    #[test]
    fn only_his_same_sitting_replaces() {
        let a = sitting("s1", 1);
        assert_eq!(place_sitting(Some(&a), Some(&sitting("s1", 2))), Place::Same);
        assert_eq!(place_sitting(Some(&a), Some(&sitting("s2", 1))), Place::New, "another sitting");
        assert_eq!(place_sitting(None, Some(&a)), Place::New, "after an agent's version");
        assert_eq!(place_sitting(Some(&a), None), Place::New, "a save that is not his edit");
        assert_eq!(place_sitting(Some(&a), Some(&Sitting { by: "agent".into(), ..sitting("s1", 2) })), Place::New);
    }

    #[test]
    fn revs_count_from_one() {
        assert_eq!(next_rev(&[]), 1);
        assert_eq!(next_rev(&[rev(1, None), rev(2, None)]), 3);
    }

    /// A version's list is its revs' together, each anchor once, in order.
    #[test]
    fn a_turns_revs_merge_into_one_list() {
        let revs = [rev(1, Some(vec![slide(2)])), rev(2, Some(vec![slide(3), slide(2)])), rev(3, Some(vec![]))];
        assert_eq!(merged(&revs), Some(vec![slide(2), slide(3)]));
        assert_eq!(merged(&[rev(1, Some(vec![]))]), Some(vec![]), "a save that changed nothing it can name");
    }

    /// A save that said nothing (sb artifact add) makes the whole version
    /// show no detail: a partial list would lie.
    #[test]
    fn a_rev_without_a_list_leaves_the_version_without_one() {
        assert_eq!(merged(&[rev(1, Some(vec![slide(1)])), rev(2, None)]), None);
        assert_eq!(merged(&[]), None);
    }

    /// The strip while the turn that made the version runs, the line
    /// after it, nothing for v1 at rest or a turn that is not its own.
    #[test]
    fn live_words_follow_the_makers_turn() {
        let v = crate::artifacts::Version {
            v: 3,
            turn: Some(turn("deck", 100)),
            revs: vec![rev(1, Some(vec![slide(5)])), rev(2, Some(vec![slide(2)]))],
            ..Default::default()
        };
        let strip = live(&v, Some(100)).unwrap();
        assert_eq!(strip.strip.as_deref(), Some("∿ deck is updating · slide 2"), "the newest save's place");
        let line = live(&v, None).unwrap();
        assert_eq!((line.line.as_deref(), line.back.map(|b| b.v)), (Some("v3 · 2 slides changed"), Some(2)));
        assert_eq!(live(&v, Some(900)).unwrap().strip, None, "its next turn is not this version's");
        assert_eq!(live(&crate::artifacts::Version { v: 1, ..v.clone() }, None), None);
        let added = crate::artifacts::Version { v: 2, ..Default::default() };
        assert_eq!(live(&added, None).unwrap().line.as_deref(), Some("v2"), "sb artifact add: no detail");
    }

    #[test]
    fn the_merged_list_is_capped() {
        let many: Vec<Anchor> = (1..=40).map(slide).collect();
        let m = merged(&[rev(1, Some(many[..20].to_vec())), rev(2, Some(many[20..].to_vec()))]).unwrap();
        assert_eq!(m.len(), CHANGED_CAP);
        assert_eq!(m[0], slide(1));
        assert_eq!(m[CHANGED_CAP - 1], slide(CHANGED_CAP as u32));
    }
}
