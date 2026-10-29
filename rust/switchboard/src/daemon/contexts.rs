//! The shell's side of the agents' contexts (crate::contexts, send-fast,
//! architect m_35501): the pending contexts are built and written
//! ([`Shell::contexts_now`]) before any line the shell writes to a REPL
//! (`repl_write`, a steer, a switched REPL's missed lines, the resume
//! say, a reload) and before a REPL starts, so no REPL takes an input on
//! a context older than it; else by the loop at most every
//! `crate::contexts::CONTEXT_MS` ([`Shell::contexts_tick`]), and at the
//! stop. Each written atomically to the agent's `context.txt`.

use super::Shell;
use crate::util::now_ms;

impl Shell {
    /// The pending contexts, built and written now.
    pub(super) fn contexts_now(&mut self) {
        for e in self.hub.contexts_flush(now_ms()) {
            if let crate::core::Effect::Context { agent, text } = e {
                self.context_write(&agent, &text);
            }
        }
        self.context_gate.sent(now_ms());
    }

    /// The loop's turn (daemon/dispatch.rs): an input since the last
    /// build makes the gate pending; built when it is due.
    pub(super) fn contexts_tick(&mut self) {
        if self.hub.contexts_pending() {
            self.context_gate.changed();
        }
        if self.context_gate.due(now_ms()) {
            self.contexts_now();
        }
    }

    /// One agent's context, to its `context.txt` (tmp + rename: the REPL
    /// never reads half of it).
    pub(super) fn context_write(&mut self, agent: &str, text: &str) {
        if let Some(dir) = self.dir_of(agent) {
            let d = self.opts.paths.agent_dir(&dir);
            let _ = std::fs::create_dir_all(&d);
            let tmp = d.join("context.txt.tmp");
            if std::fs::write(&tmp, text).is_ok() {
                let _ = std::fs::rename(&tmp, d.join("context.txt"));
            }
        }
    }
}

#[cfg(test)]
mod tests {
    /// Law (architect m_35501): every line the shell writes to a REPL
    /// (its socket, its steer file) and every REPL start goes after the
    /// pending contexts: each such write's function calls
    /// `contexts_now()` before it. A new writer without it turns red.
    #[test]
    fn every_repl_writer_builds_the_contexts_first() {
        let files = [
            ("daemon.rs", include_str!("../daemon.rs")),
            ("daemon/dispatch.rs", include_str!("dispatch.rs")),
            ("daemon/repl_starts.rs", include_str!("repl_starts.rs")),
        ];
        // a REPL's socket, its steer file, a start
        let writers = ["stream.write_all(", ".open(&r.steer)", "fn spawn_on("];
        let mut seen = 0;
        for (name, src) in files {
            let code = src.split("#[cfg(test)]").next().unwrap_or(src);
            for w in writers {
                for (at, _) in code.match_indices(w) {
                    seen += 1;
                    let before = &code[..at];
                    // from the start of the enclosing fn to the write (a
                    // start: the first lines of its body)
                    let fn_at = ["\n    fn ", "\n    pub(super) fn ", "\nfn ", "\npub fn "].iter().filter_map(|p| before.rfind(p)).max().unwrap_or(0);
                    let body = if w == "fn spawn_on(" { &code[at..(at + 600).min(code.len())] } else { &code[fn_at..at] };
                    let line = before.matches('\n').count() + 1;
                    assert!(body.contains("contexts_now()"), "{name}:{line}: a write to a REPL ({w}) with no contexts_now() before it in its fn");
                }
            }
        }
        assert!(seen >= 7, "the scan found the REPL writers: {seen}");
    }
}
