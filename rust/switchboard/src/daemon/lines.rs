//! A feed's lines as they enter: each one gets the agent's next position,
//! goes into the memory buffer (the last BUFFER_LINES), into the text the
//! transcript appends at once, and into its `line` event. Moved out of
//! Shell::feed unchanged (architect m_12280).

use super::*;

impl Shell {
    /// The lines of one feed entry (its context line too, fn_ctx_lines),
    /// stamped `ts`: (the transcript text to append, the events to send).
    pub(super) fn buffer_lines(&mut self, name: &str, path: &Path, lines: Vec<String>, ts: u64) -> (String, Vec<Value>) {
        let mut out = String::new();
        let mut events = Vec::new();
        for line in lines {
            let pos = match self.positions.get(name) {
                Some(p) => p + 1,
                None => transcript_len(path) + 1,
            };
            self.positions.insert(name.to_string(), pos);
            let b = self.buffers.entry(name.to_string()).or_default();
            b.push_back((pos, ts, line.clone()));
            while b.len() > BUFFER_LINES {
                b.pop_front();
            }
            out.push_str(&format!("{ts}\t{line}\n"));
            events.push(line_event(name, pos, ts, &line));
        }
        (out, events)
    }

    /// A `partial` line of `name`: the delta onto its live answer, the
    /// whole text so far to every client (`partial` event; typed
    /// connections subscribed to it get HubEv::Partial). A delta whose
    /// offset doesn't match drops the block (one hub.log line).
    pub(super) fn on_partial(&mut self, name: &str, line: &str) {
        use bise_proto::thread::lines::{read, PartialStep, Rec};
        let Rec::Partial { call, off, text } = read(line) else { return };
        let p = self.partials.entry(name.to_string()).or_default();
        match p.step(&call, off, &text) {
            PartialStep::Text(t) => self.broadcast(&partial_event(name, &call, &t)),
            PartialStep::Mismatch { call, off, have } => {
                log_line(&self.opts.paths, &format!("partial of {name} #{call} dropped: offset {off}, the hub has {have}"));
                // a client keeps no stale text meanwhile
                self.broadcast(&partial_event(name, &call, ""));
            }
            PartialStep::Drop => {}
        }
    }

    /// The `sb kept` line to write before `line` when `line` ends the
    /// turn without its answer (lines::keeps_partial: a failure, a stall,
    /// a harness restart) while `name` has text streamed in: what he read
    /// stays in the thread, dim, above the failure (designer m_13334).
    pub(super) fn partial_kept(&self, name: &str, line: &str) -> Option<String> {
        use bise_proto::thread::lines::{keeps_partial, read};
        let p = self.partials.get(name)?;
        if !keeps_partial(&read(line)) {
            return None;
        }
        p.kept_line()
    }

    /// A feed line that ends `name`'s live answer (its entry, the turn's
    /// end, a stop, a restart: lines::clears_partial, one rule): cleared
    /// once, "" to every client.
    pub(super) fn partial_clear(&mut self, name: &str, line: &str) {
        use bise_proto::thread::lines::{clears_partial, read};
        if !self.partials.contains_key(name) || !clears_partial(&read(line)) {
            return;
        }
        if let Some(p) = self.partials.remove(name) {
            self.broadcast(&partial_event(name, &p.call, ""));
        }
    }
}

/// The `partial` event (C2): the whole text so far, "" when it ended.
pub(super) fn partial_event(agent: &str, call: &str, text: &str) -> Value {
    json!({"ev": "partial", "agent": agent, "call": call, "text": text})
}
