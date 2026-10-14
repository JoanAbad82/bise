//! The inbox's history, the hub's side (inbox-record, architect m_24257).
//!
//! - [`Answers::index`]: `bise_proto::inbox::Index`, derived state: rebuilt
//!   from the journal at boot (`answers_replayed`), then fed each line
//!   sb-core journals (`answers_journaled`). A record that changed goes to
//!   every typed connection as `inbox_recorded`.
//! - his answer's position: sb-core cannot know transcript positions, so
//!   when the hub appends a card's route line to its asker's thread
//!   (`answers_line`, from `buffer_lines`) it keeps (card, agent, pos) and,
//!   once the step's effects ran (`answers_flush`), tells sb-core
//!   (`answer_pos`), which journals it once per card it closed with his
//!   answer (law answer_pos_once). Never during the effects: the
//!   position's line must follow the close's.
//! - `inbox_history`: one page of the index (`Index::page`).

use super::*;
use bise_proto::hub::HubEv;
use bise_proto::inbox::{HistoryParams, Index};

/// The index and the positions to tell sb-core.
pub(super) struct Answers {
    index: Index,
    due: Vec<(u64, String, u64)>,
}

impl Answers {
    pub(super) fn new(project: String) -> Answers {
        Answers { index: Index::new(project), due: Vec::new() }
    }
}

/// The card a feed line answers in `name`'s thread: the route line of
/// his answer to card N, in its asker's own feed (`who` is the thread's
/// agent; main's twin line in main's feed names the asker).
pub(super) fn answer_card(name: &str, line: &str) -> Option<u64> {
    let rest = line.strip_prefix("sb route :: ")?;
    let v: Value = serde_json::from_str(rest).ok()?;
    let card = v.get("card")?.as_u64()?;
    (v.get("who")?.as_str()? == name).then_some(card)
}

impl Shell {
    /// Boot: the journal, as read for sb-core's replay.
    pub(super) fn answers_replayed(&mut self, events: &[Value]) {
        self.answers.index.read_all(events);
    }

    /// A line sb-core journaled (stamped `ts` as the file has it): its
    /// record, when it made or changed one, to every typed connection.
    pub(super) fn answers_journaled(&mut self, ev: &Value) {
        let mut ev = ev.clone();
        if ev.get("ts").is_none() {
            ev["ts"] = json!(now_ms());
        }
        let Some(card) = self.answers.index.read(&ev) else { return };
        let Some(r) = self.answers.index.get(card).cloned() else { return };
        let ids = self.typed_ids();
        if !ids.is_empty() {
            self.proto_note(&ids, &HubEv::InboxRecorded { project: self.project(), record: Box::new(r) });
        }
    }

    /// A feed line entered `name`'s transcript at `pos`.
    pub(super) fn answers_line(&mut self, name: &str, pos: usize, line: &str) {
        if let Some(card) = answer_card(name, line) {
            self.answers.due.push((card, name.to_string(), pos as u64));
        }
    }

    /// After a step's effects: the positions written, to sb-core.
    pub(super) fn answers_flush(&mut self) {
        for (card, agent, pos) in std::mem::take(&mut self.answers.due) {
            self.step(Input::AnswerPos { card, agent, pos });
        }
    }

    /// `inbox_history`: one page, newest first.
    pub(super) fn inbox_history_ev(&self, q: &HistoryParams) -> HubEv {
        HubEv::InboxHistory { project: self.project(), page: self.answers.index.page(&q.query()) }
    }
}

#[cfg(test)]
mod tests {
    use super::answer_card;

    #[test]
    fn the_route_line_of_his_answer_in_its_askers_thread() {
        let l = r#"sb route :: {"v":1,"who":"perf","card":7,"said":"2"}"#;
        assert_eq!(answer_card("perf", l), Some(7));
        // main's twin of an agent's card: not the asker's thread
        assert_eq!(answer_card("main", l), None);
        // his words without a card, another line
        assert_eq!(answer_card("perf", r#"sb route :: {"who":"perf","said":"hi"}"#), None);
        assert_eq!(answer_card("perf", "sb you :: hi"), None);
    }
}
