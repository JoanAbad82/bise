//! His lines to the hub: what he typed goes through `command/run` (the
//! hub's one parser), now or queued for the turn's end (issue 23: the
//! hub holds a queued one, sb/queued.rs). Moved out of sb.rs.

use super::*;

impl Sb {
    /// A line typed to the agent in focus (the hub interprets it).
    pub(super) fn send_input(&mut self, text: String) {
        let focus = self.focus.clone();
        self.send_input_to(&focus, text);
    }

    /// What the user typed, for `agent` (in view or not).
    pub(super) fn send_input_to(&mut self, agent: &str, text: String) {
        // computer use: the hub resumes a stopped or paused agent before
        // his words reach it (Shell::resume_computer_use)
        // msg-parts: his parts ride with the line that is their text (the
        // hub keeps them on his message; an older hub ignores them)
        let parts = std::mem::take(&mut self.parts_out);
        let mut params = json!({"agent": agent, "line": text});
        if !parts.is_empty() && text.ends_with(&bise_proto::parts::render(&parts)) {
            params["parts"] = json!(parts);
        }
        self.call("command/run", params, rpc::Then::Line);
    }

    /// `text` (its `parts`, msg-parts) to `agent` as a queued message:
    /// the hub holds it until the turn ends (sb-core's `Msg.queued`, the
    /// window's `send {mode: queued}` makes the same).
    pub(crate) fn send_queued(&mut self, agent: &str, text: String, parts: Vec<bise_proto::parts::Part>) {
        let mut params = json!({"agent": agent, "line": text, "mode": "queued"});
        if !parts.is_empty() {
            params["parts"] = json!(parts);
        }
        self.call("command/run", params, rpc::Then::Line);
    }
}
