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
//! A final that failed, timed out or came back empty says `kept`: the
//! core keeps that take's sound, in memory only (the last
//! [`KEPT_TAKES`], [`KEPT_MAX`] each, the oldest sound goes), and
//! `dictate_retry {id}` transcribes it again with a fresh listener: one
//! final, no partials. The sound goes on a retry that gives words, on
//! `dictate_cancel`, and with the core (architect m_22168).
//!
//! core.log gets one line per step of a take (start, refused and why,
//! stop, final with its length, its time after the stop and its error,
//! kept, retry), never its words.

use super::*;
use crate::voice::{SAMPLE_RATE, TRANSCRIBE_TIMEOUT};
use std::collections::VecDeque;

/// A dictation left running (the window lost focus, he forgot) stops by
/// itself after this long, its final out.
pub const DICTATE_MAX: Duration = Duration::from_secs(120);

/// How many takes' sound the core keeps for `dictate_retry`.
pub const KEPT_TAKES: usize = 3;
/// The most sound kept per take: past it, the oldest goes.
pub const KEPT_MAX: Duration = Duration::from_secs(600);
const KEPT_SAMPLES: usize = KEPT_MAX.as_secs() as usize * SAMPLE_RATE as usize;
/// A retry feeds the listener the sound as the mic would: 100 ms blocks.
const RETRY_BLOCK: usize = SAMPLE_RATE as usize / 10;

/// A take's sound, kept after a final with no words, for a retry.
pub(super) struct Kept {
    id: String,
    pcm: VecDeque<i16>,
}

/// The take's sound, its oldest gone past [`KEPT_MAX`].
fn record(pcm: &mut VecDeque<i16>, block: &[i16]) {
    pcm.extend(block.iter().copied());
    let over = pcm.len().saturating_sub(KEPT_SAMPLES);
    pcm.drain(..over);
}

fn seconds(pcm: &VecDeque<i16>) -> f32 {
    pcm.len() as f32 / SAMPLE_RATE as f32
}

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
    /// the sound sent to the listener, kept if the final has no words
    pcm: VecDeque<i16>,
    /// the listener's line about the words (the model fell back): the
    /// final's `note`
    note: Option<String>,
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
    /// The mic's blocks to the listener, and to the take's sound.
    fn pump(&mut self) {
        while let Ok(b) = self.blocks.try_recv() {
            record(&mut self.pcm, &b.pcm);
            let _ = self.audio.send(ListenMsg::Audio(b.pcm));
        }
    }

    /// The mic's blocks to the listener, its words in. A stopped take is
    /// over at the listener's flush (or failure), or after
    /// [`TRANSCRIBE_TIMEOUT`]: never before its words came.
    fn step(&mut self, now: Instant) -> Step {
        self.pump();
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
                Ok(Heard::Note(line)) => self.note = Some(line),
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
        if let voice::TalkRule::End(by) = voice::talk_rule(self.talk.as_ref().map(Talk::state), voice::TalkEv::DictateStart, now) {
            eprintln!("ambient-core: dictate {id}: a fn talk was listening: it ends as at fn up");
            self.talk_end_by(now, by);
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
        self.dictation = Some(Dictation { id, stream: Some(stream), blocks, audio, heard, cancel, text: String::new(), started: now, ending: None, pcm: VecDeque::new(), note: None });
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
        d.pump();
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
        // his cancel drops the kept sound too
        if let Some(i) = self.dictations_kept.iter().position(|k| k.id == id) {
            self.dictations_kept.remove(i);
            eprintln!("ambient-core: dictate {id}: its kept sound dropped");
        }
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
        let Some(mut d) = self.dictation.take() else { return };
        d.pump();
        let (id, text, pcm) = (d.id.clone(), d.text.clone(), std::mem::take(&mut d.pcm));
        drop(d);
        eprintln!("ambient-core: dictate {id}: fn took the mic, final with {} chars", text.trim().chars().count());
        self.dictation_final_ev(&id, &text, None, pcm);
    }

    /// A take's one final, and its line in core.log (length, time after
    /// the stop, error: never its words).
    fn dictate_final(&mut self, mut d: Dictation, error: Option<String>, now: Instant) {
        let (id, text, pcm, note) = (d.id.clone(), d.text.clone(), std::mem::take(&mut d.pcm), d.note.take());
        let after = d.ending.map(|e| format!(", {} ms after the stop", now.duration_since(e).as_millis())).unwrap_or_default();
        drop(d);
        let n = text.trim().chars().count();
        let err = error.as_deref().map(|e| format!(", error: {e}")).unwrap_or_default();
        let said = note.as_deref().map(|l| format!(", note: {l}")).unwrap_or_default();
        eprintln!("ambient-core: dictate {id}: final with {n} chars{after}{err}{said}");
        self.dictation_final_note(&id, &text, error.as_deref(), pcm, note.as_deref());
    }

    /// The final `dictation`: with no words (an error, or nothing heard)
    /// the take's sound is kept for a retry and the final says `kept`.
    fn dictation_final_ev(&mut self, id: &str, text: &str, error: Option<&str>, pcm: VecDeque<i16>) {
        self.dictation_final_note(id, text, error, pcm, None)
    }

    /// [`Self::dictation_final_ev`] with the listener's `note`: the one
    /// line the window shows with the words (their model fell back).
    fn dictation_final_note(&mut self, id: &str, text: &str, error: Option<&str>, pcm: VecDeque<i16>, note: Option<&str>) {
        let kept = (error.is_some() || text.trim().is_empty()) && self.dictate_keep(id, pcm);
        let mut v = json!({"ev": "dictation", "id": id, "text": text.trim(), "final": true});
        if let Some(e) = error {
            v["error"] = json!(e);
        }
        if let Some(n) = note {
            v["note"] = json!(n);
        }
        if kept {
            v["kept"] = json!(true);
        }
        self.emit(v);
    }

    /// Keeps a take's sound (memory only): the newest [`KEPT_TAKES`].
    /// False: no sound to keep.
    fn dictate_keep(&mut self, id: &str, pcm: VecDeque<i16>) -> bool {
        if pcm.is_empty() {
            return false;
        }
        self.dictations_kept.retain(|k| k.id != id);
        eprintln!("ambient-core: dictate {id}: its sound kept ({:.1} s) for a retry", seconds(&pcm));
        self.dictations_kept.push(Kept { id: id.to_string(), pcm });
        while self.dictations_kept.len() > KEPT_TAKES {
            let old = self.dictations_kept.remove(0);
            eprintln!("ambient-core: dictate {}: its kept sound dropped ({KEPT_TAKES} newer kept)", old.id);
        }
        true
    }

    /// `dictate_retry`: the kept sound to a fresh listener, as a stopped
    /// take (no mic, no partials): its one final comes at the flush, kept
    /// again if it has no words, the sound freed if it has.
    pub(super) fn dictate_retry(&mut self, id: String, now: Instant) {
        let Some(i) = self.dictations_kept.iter().position(|k| k.id == id) else {
            eprintln!("ambient-core: dictate {id}: retry with nothing kept");
            return self.dictate_error(&id, "", "nothing to try again.");
        };
        let pcm = self.dictations_kept.remove(i).pcm;
        let job = match (self.ports.listen_job)() {
            Ok(j) => j,
            Err(e) => {
                eprintln!("ambient-core: dictate {id}: retry refused (no listener)");
                return self.dictation_final_ev(&id, "", Some(&e), pcm);
            }
        };
        eprintln!("ambient-core: dictate {id}: retry, {:.1} s of sound", seconds(&pcm));
        let (audio, arx) = mpsc::channel();
        let (htx, heard) = mpsc::channel();
        let cancel = Arc::new(AtomicBool::new(false));
        (self.ports.listener)(&job).start(job, arx, htx, cancel.clone());
        let flat: Vec<i16> = pcm.iter().copied().collect();
        for block in flat.chunks(RETRY_BLOCK) {
            let _ = audio.send(ListenMsg::Audio(block.to_vec()));
        }
        let _ = audio.send(ListenMsg::Flush);
        // no mic: an empty, closed block channel
        let (_, blocks) = mpsc::channel();
        self.dictations_ending.push(Dictation { id, stream: None, blocks, audio, heard, cancel, text: String::new(), started: now, ending: Some(now), pcm, note: None });
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

#[cfg(test)]
mod tests {
    use super::*;

    /// A take longer than KEPT_MAX keeps its last KEPT_MAX: the oldest goes.
    #[test]
    fn the_kept_sound_is_capped_its_oldest_gone() {
        let mut pcm = VecDeque::new();
        record(&mut pcm, &[1; 5]);
        record(&mut pcm, &vec![2; KEPT_SAMPLES]);
        assert_eq!(pcm.len(), KEPT_SAMPLES);
        assert!(pcm.iter().all(|&s| s == 2));
        record(&mut pcm, &[3; 3]);
        assert_eq!(pcm.len(), KEPT_SAMPLES);
        assert_eq!(pcm.back(), Some(&3));
    }
}
