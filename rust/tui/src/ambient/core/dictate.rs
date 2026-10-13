//! Dictation (bar I): the composer's mic. The window sends
//! `dictate_start {id}`; the core opens the mic with the talk's own ports
//! (the voice role's listener job, his languages) and sends the words
//! back as `dictation {id, text, final}` for that window only (the app's
//! main routes them by id). Never a hub op: nothing reaches main or a
//! journal, and no log line carries the words.
//!
//! Each `dictation` carries the WHOLE text so far (replace, never
//! append), and exactly one `final: true` ends a dictation: stop (after
//! the listener's flush, at most [`TRANSCRIBE_TIMEOUT`]), the time limit
//! ([`DICTATE_MAX`]: no silent hot mic), fn's talk (the mic is his talk's
//! now), a listener failure (`error`, the words heard so far), cancel
//! (`cancelled`, an empty text), or a refused start (`error`: the mic is
//! busy, no mic, no voice model). One mic user at a time: a dictate_start
//! while a talk or a dictation holds the mic is refused; fn wins over a
//! dictation. A stopped take no longer holds the mic: its words come at
//! the listener's flush, however long that takes (up to the TUI's
//! [`TRANSCRIBE_TIMEOUT`]), while the next take records. It was 1.5 s:
//! a batch listener sends every word at the flush, after one HTTP request
//! (two with the language guard); a slower one ended the take with no
//! words and the listener threw them away, one take in two (m_22120).
//!
//! core.log gets one line per step of a take (start, refused and why,
//! stop, final with its length, its time after the stop and its error),
//! never its words.

use super::*;
use crate::voice::TRANSCRIBE_TIMEOUT;

/// A dictation left running (the window lost focus, he forgot) stops by
/// itself after this long, its final out.
pub const DICTATE_MAX: Duration = Duration::from_secs(120);

/// The composer's mic: the mic, the listener, the words so far.
pub(super) struct Dictation {
    id: String,
    /// None once stopped (the mic is off)
    stream: Option<Box<dyn MicStream>>,
    blocks: Receiver<MicBlock>,
    audio: Sender<ListenMsg>,
    heard: Receiver<Heard>,
    cancel: Arc<AtomicBool>,
    text: String,
    started: Instant,
    /// stopped at
    ending: Option<Instant>,
}

impl Drop for Dictation {
    fn drop(&mut self) {
        self.cancel.store(true, Ordering::SeqCst);
    }
}

/// What one tick of a take says.
#[derive(Debug, PartialEq)]
enum Step {
    Quiet,
    /// new words while the mic is on: a partial
    Words,
    /// its final, with what went wrong
    Over(Option<String>),
}

impl Dictation {
    /// The mic's blocks to the listener, its words in. A stopped take is
    /// over at the listener's flush (or failure), or after
    /// [`TRANSCRIBE_TIMEOUT`]: never before its words came.
    fn step(&mut self, now: Instant) -> Step {
        while let Ok(b) = self.blocks.try_recv() {
            let _ = self.audio.send(ListenMsg::Audio(b.pcm));
        }
        let mut words = false;
        loop {
            match self.heard.try_recv() {
                Ok(Heard::Text(w)) => {
                    self.text.push_str(&w);
                    words = true;
                }
                Ok(Heard::Flushed) if self.ending.is_some() => return Step::Over(None),
                Ok(Heard::Flushed) => {}
                Ok(Heard::Failed(e)) => return Step::Over(Some(e)),
                Err(TryRecvError::Empty) => break,
                Err(TryRecvError::Disconnected) if self.ending.is_some() => return Step::Over(None),
                Err(TryRecvError::Disconnected) => break,
            }
        }
        if self.ending.is_some_and(|e| now.duration_since(e) >= TRANSCRIBE_TIMEOUT) {
            return Step::Over(Some("the transcription timed out.".into()));
        }
        if words && self.ending.is_none() {
            Step::Words
        } else {
            Step::Quiet
        }
    }
}

impl Core {
    fn dictation_ev(&mut self, id: &str, text: &str, done: bool, cancelled: bool) {
        let mut v = json!({"ev": "dictation", "id": id, "text": text.trim(), "final": done});
        if cancelled {
            v["cancelled"] = json!(true);
        }
        self.emit(v);
    }

    /// The dictation's one final, with what went wrong.
    fn dictate_error(&mut self, id: &str, text: &str, error: &str) {
        self.emit(json!({"ev": "dictation", "id": id, "text": text.trim(), "final": true, "error": error}));
    }

    /// Refused: one line in core.log (why, never words), one final.
    fn dictate_refused(&mut self, id: &str, why: &str, error: &str) {
        eprintln!("ambient-core: dictate {id}: refused ({why})");
        self.dictate_error(id, "", error);
    }

    pub(super) fn dictate_start(&mut self, id: String, now: Instant) {
        // a fn talk still listening: his press in the window is the newer
        // act (a stuck talk, fn up missed, refused every take after it:
        // amb-tools' repro, m_22196). The talk ends as at fn up, its words
        // go; then this take has the mic. A talk past fn up holds no mic.
        if self.talk.as_ref().is_some_and(|t| t.ending.is_none()) {
            eprintln!("ambient-core: dictate {id}: a fn talk was listening: it ends as at fn up");
            self.talk_end(now);
        }
        let holder = if self.dictation.is_some() {
            Some("a take has the mic")
        } else if self.voice_on.is_some() {
            Some("voice mode has the mic")
        } else {
            None
        };
        if let Some(why) = holder {
            return self.dictate_refused(&id, why, "the mic is busy.");
        }
        // he dictates while main speaks: the voice stops, its text stays
        if self.stop_voice() {
            self.set_phase(Phase::Done, None);
        }
        let job = match (self.ports.listen_job)() {
            Ok(j) => j,
            Err(e) => return self.dictate_refused(&id, "no listener", &e),
        };
        let (btx, blocks) = mpsc::channel();
        let stream = match self.ports.mic.open(btx) {
            Ok(s) => s,
            Err(e) => return self.dictate_refused(&id, &format!("the mic: {e}"), &e),
        };
        let flushing = self.dictations_ending.len();
        eprintln!("ambient-core: dictate {id}: start{}", if flushing > 0 { format!(" ({flushing} take(s) still transcribing)") } else { String::new() });
        let (audio, arx) = mpsc::channel();
        let (htx, heard) = mpsc::channel();
        let cancel = Arc::new(AtomicBool::new(false));
        (self.ports.listener)(&job).start(job, arx, htx, cancel.clone());
        self.dictation = Some(Dictation { id, stream: Some(stream), blocks, audio, heard, cancel, text: String::new(), started: now, ending: None });
    }

    /// The mic off now, free for the next take; this take's final comes
    /// at the listener's flush.
    pub(super) fn dictate_stop(&mut self, id: &str, now: Instant) {
        let Some(mut d) = self.dictation.take_if(|d| d.id == id) else {
            if !self.dictations_ending.iter().any(|d| d.id == id) {
                eprintln!("ambient-core: dictate {id}: stop with no such take: ignored");
            }
            return;
        };
        while let Ok(b) = d.blocks.try_recv() {
            let _ = d.audio.send(ListenMsg::Audio(b.pcm));
        }
        d.stream = None;
        let _ = d.audio.send(ListenMsg::Flush);
        d.ending = Some(now);
        eprintln!("ambient-core: dictate {id}: stop after {} ms, transcribing", now.duration_since(d.started).as_millis());
        self.dictations_ending.push(d);
        self.emit(json!({"ev": "level", "who": "you", "v": 0.0}));
    }

    pub(super) fn dictate_cancel(&mut self, id: &str) {
        let held = self.dictation.take_if(|d| d.id == id).is_some();
        let before = self.dictations_ending.len();
        self.dictations_ending.retain(|d| d.id != id);
        if !held && self.dictations_ending.len() == before {
            return;
        }
        eprintln!("ambient-core: dictate {id}: cancelled{}", if held { "" } else { " while transcribing" });
        if held {
            self.emit(json!({"ev": "level", "who": "you", "v": 0.0}));
        }
        self.dictation_ev(id, "", true, true);
    }

    /// fn down during a dictation: the mic is his talk's now. The take
    /// holding the mic ends with the words it has (no flush wait); a
    /// stopped take still transcribing goes on.
    pub(super) fn dictate_yield(&mut self) {
        let Some(d) = self.dictation.take() else { return };
        let (id, text) = (d.id.clone(), d.text.clone());
        drop(d);
        eprintln!("ambient-core: dictate {id}: fn took the mic, final with {} chars", text.trim().chars().count());
        self.dictation_ev(&id, &text, true, false);
    }

    /// A take's one final, and its line in core.log (length, time after
    /// the stop, error: never its words).
    fn dictate_final(&mut self, d: Dictation, error: Option<String>, now: Instant) {
        let (id, text) = (d.id.clone(), d.text.clone());
        let after = d.ending.map(|e| format!(", {} ms after the stop", now.duration_since(e).as_millis())).unwrap_or_default();
        drop(d);
        let n = text.trim().chars().count();
        match error {
            Some(e) => {
                eprintln!("ambient-core: dictate {id}: final with {n} chars{after}, error: {e}");
                self.dictate_error(&id, &text, &e);
            }
            None => {
                eprintln!("ambient-core: dictate {id}: final with {n} chars{after}");
                self.dictation_ev(&id, &text, true, false);
            }
        }
    }

    /// The clock: the mic to the listener, its words to the window, the
    /// time limit, the final.
    pub(super) fn tick_dictation(&mut self, now: Instant) {
        if self.dictation.as_ref().is_some_and(|d| now.duration_since(d.started) >= DICTATE_MAX) {
            let id = self.dictation.as_ref().map(|d| d.id.clone()).unwrap_or_default();
            eprintln!("ambient-core: dictate {id}: the time limit");
            self.dictate_stop(&id, now);
        }
        // the take holding the mic: its level, its words, a failure
        if let Some(d) = self.dictation.as_mut() {
            let step = d.step(now);
            let level = d.stream.as_ref().map(|s| s.level());
            let (id, text) = (d.id.clone(), d.text.clone());
            if let Some(v) = level {
                self.emit(json!({"ev": "level", "who": "you", "v": v}));
            }
            match step {
                Step::Words => self.dictation_ev(&id, &text, false, false),
                Step::Over(error) => {
                    // what was heard stays in his composer
                    if let Some(d) = self.dictation.take() {
                        self.emit(json!({"ev": "level", "who": "you", "v": 0.0}));
                        self.dictate_final(d, error, now);
                    }
                }
                Step::Quiet => {}
            }
        }
        // the stopped takes: each final at its own flush
        let mut i = 0;
        while i < self.dictations_ending.len() {
            match self.dictations_ending[i].step(now) {
                Step::Over(error) => {
                    let d = self.dictations_ending.remove(i);
                    self.dictate_final(d, error, now);
                }
                Step::Words | Step::Quiet => i += 1,
            }
        }
    }
}
