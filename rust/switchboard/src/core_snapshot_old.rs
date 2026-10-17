//! The snapshot's older builder, test-only (issue 30 sha 1): the
//! `serde_json::json!` builder Hub::snapshot was before it returned the
//! typed `Snapshot`, kept here only to prove `to_value(new) == old` on
//! every core_tests state that reads a snapshot (`snapshot_checked`) and
//! on the journal-shaped corpus (core_snapshot_tests.rs). Deleted with the
//! untyped readers in the next change; the goldens stay as the pin.

use super::*;
use crate::snapshot_rows::{role_of, RowIn};

impl Hub {
    /// The snapshot as the older builder made it (its rows built fresh,
    /// from the inputs of the last [`crate::snapshot_rows::Rows::mail`]).
    pub(crate) fn snapshot_old(&self, now: u64) -> Value {
        let mut agents: Vec<Value> = Vec::with_capacity(self.st.order.len());
        for a in self.st.order.iter().filter_map(|n| self.st.agents.get(n)) {
            let role = self.roles.get(&a.dir).and_then(|r| r.line.as_deref());
            let i = self.rows.input(a, role, now, self.st.wakes.watching(&a.name), self.doing.get(&a.name).copied());
            agents.push(build(&i));
        }
        let cards: Vec<Value> = self
            .st
            .open_cards()
            .map(|c| {
                json!({
                    "id": c.id,
                    "kind": c.kind,
                    "agent": c.agent,
                    "text": c.text,
                    "for_msg": c.for_msg,
                    "age_ms": now.saturating_sub(c.created_ms),
                    "note": match c.kind.as_str() {
                        "merge" => self.merge_note(c),
                        update_card::KIND => self.update_note(c),
                        signin_card::KIND => self.signin_note(),
                        _ => self.card_note_old(c),
                    },
                    "waiting": if c.kind == signin_card::KIND { Some(self.signin_waiting()) } else { None },
                    "link": if c.kind == update_card::KIND { self.update_link(c) } else { None },
                    "place": c.place,
                    "pr": c.pr,
                })
            })
            .collect();
        let places = crate::place::places(&self.st, &self.prs);
        let (mut lids, stale) = self.pr_views_old(now);
        for (id, l) in &self.feature_lids {
            lids.entry(id.clone()).or_insert_with(|| l.clone());
        }
        let places = crate::place::views(&places, &lids, &self.landing, &stale, &self.trying);
        json!({"ev": "state", "agents": agents, "cards": cards, "places": places,
               "flow": self.flow.map(|f| f.as_str())})
    }

    /// The typed snapshot as JSON, asserted equal, key for key, to the
    /// older builder's on the same state.
    pub(crate) fn snapshot_checked(&mut self, now: u64) -> Value {
        let new = serde_json::to_value(self.snapshot(now)).unwrap();
        let old = self.snapshot_old(now);
        assert_eq!(new, old, "typed snapshot != older builder's");
        new
    }

    fn card_note_old(&self, c: &Card) -> Option<String> {
        if c.kind != "question" || c.agent == MAIN {
            return None;
        }
        let m = self
            .st
            .msgs()
            .values()
            .rev()
            .take_while(|m| m.created_ms >= c.created_ms)
            .find(|m| m.from == MAIN && m.to == c.agent && m.reply_to != c.for_msg)?;
        Some(format!("@main wrote to @{} since then (m_{}): {}", c.agent, m.id, clip(&one_line(&m.text), 120)))
    }

    fn pr_views_old(&self, now: u64) -> (BTreeMap<String, String>, BTreeMap<String, u64>) {
        let mut lids = crate::land_queue::lids(&self.landing);
        let no_pr = if self.flow == Some(crate::flow::FlowMode::Trunk) { &BTreeMap::new() } else { &self.pr_lids };
        for (id, l) in no_pr {
            let asked = self.pr_ok_ms.contains_key(id) || self.detached_private(id);
            if !self.prs.contains_key(id) && asked {
                lids.entry(id.clone()).or_insert_with(|| l.clone());
            }
        }
        let stale = self
            .prs
            .keys()
            .filter_map(|id| {
                let age = now.saturating_sub(*self.pr_ok_ms.get(id)?);
                (self.pr_late.is_some() || age > PR_STALE_MS).then(|| (id.clone(), age))
            })
            .collect();
        (lids, stale)
    }
}

/// A row from its inputs.
fn build(i: &RowIn) -> Value {
    let a = i.agent;
    json!({
        "name": a.name,
        "main": a.is_main,
        "status": a.status().as_str(),
        "objective": a.description(),
        // what it is doing now, one line (BISE-126); "" for main
        "role": role_of(a, i.role),
        "parent": a.parent,
        "mode": match a.ws.mode { Mode::Worktree => "worktree", Mode::Shared => "shared" },
        "path": a.ws.path,
        "branch": a.ws.branch,
        "dropped": a.ws.dropped,
        // BISE-136: a private worktree (gate.sh new), else null
        "place": a.place,
        // dev-flow §3.1: the id of the place it is in (`places`)
        // (BISE-136: its private worktree's, `pt:<path>`; a
        // feature's agent: its feature's, dev-flow §5.1)
        "place_id": crate::place::view_id(a),
        "created_ms": a.created_ms,
        // its folder under agents/ and its former names (S2 C:
        // view.json carries them for sb history --project)
        "dir": a.dir,
        "aliases": a.aliases,
        "note": a.declared.as_ref().map(|(_, n)| n.clone()).unwrap_or_default(),
        // the status it declared (done, blocked, working; null: none):
        // les bims' growth counts the done ones, archived too (the
        // archive keeps it; an auto turn report replaces report_kind)
        "declared": a.declared.as_ref().map(|(d, _)| *d),
        "report": a.last_report.as_ref().map(|r| clip(&one_line(&r.summary), 200)),
        // when it last reported (an archived task: about when it stopped)
        "report_ms": a.last_report.as_ref().map(|r| r.at_ms),
        // S10: followed, and its progress step (`--step n/m`)
        "follow": a.follow,
        "report_kind": a.last_report.as_ref().map(|r| r.kind.clone()),
        "step": a.last_report.as_ref().and_then(|r| r.step),
        "of": a.last_report.as_ref().and_then(|r| r.of),
        "queued": i.queued,
        // the user's queued inputs waiting for the turn's end
        // (the window's "send queued"): [{id, text, created_ms}]
        "queued_inputs": i.queued_inputs,
        // BISE-299: main's inbox, the agents' questions waiting
        // for main (the user sees a quiet count, never asked)
        "inbox": i.inbox,
        "turn_ms": i.turn_ms,
        // issue 22: its ended turns, from the same sb-core
        // view as its status (the agents row's `turns`)
        "turns": a.turns_ended,
        // who it waits on (`sb wait` / `sb ask`), for `waits {name}`
        "waiting_on": a.waiting_on.as_ref().filter(|_| a.waiting),
        // event-wake: the events it waits for (the agents
        // row's `watching`, wake-ui)
        "watching": i.watching,
        // les bims: what it is doing now, only while its turn runs (or
        // paused on a backgrounded command: a build)
        "doing": crate::doing::row(a.run == crate::model::Run::Busy, i.doing, &i.watching),
    })
}
