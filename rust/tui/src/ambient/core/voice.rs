//! The core's voice and clock: main's words spoken, the ~30 Hz tick
//! (the mic to the listener, its words, the speaker's words and levels).

use super::*;
use crate::voice::TRANSCRIBE_TIMEOUT;

impl Core {
    /// Main's message aloud. False: no voice (no TTS, no speaker,
    /// nothing to say); the text shows anyway.
    pub(super) fn say_main(&mut self) -> bool {
        if self.main_text.is_empty() {
            return false;
        }
        let job = match (self.ports.say_job)() {
            Ok(j) => j,
            Err(_) => {
                self.error("main can't speak: no voice model is set up.");
                return false;
            }
        };
        if self.speaker.is_none() {
            match (self.ports.open_speaker)() {
                Ok(s) => self.speaker = Some(s),
                Err(e) => {
                    self.error(&e);
                    return false;
                }
            }
        }
        self.stop_voice();
        let lang = self.ports.language.clone();
        let Some(sp) = Speech::new(self.turn, &self.main_text, lang.as_deref(), job, self.next_utt) else {
            return false;
        };
        self.next_utt += sp.utts();
        self.speech = Some(sp);
        true
    }

    // ---- the clock ----

    /// ~30 Hz: the mic to the listener, its words, the voice and its
    /// words, the levels.
    pub fn tick(&mut self, now: Instant) {
        self.tick_talk(now);
        self.tick_dictation(now);
        self.tick_voice_mode(now);
        self.tick_picks();
        self.tick_speech();
        self.tick_projects(now);
        self.poll_projects(false);
        self.tick_index(now);
        self.setup_tick();
        self.tick_computer(now);
    }

    fn tick_talk(&mut self, now: Instant) {
        // a talk still listening with no talk_end (fn up missed, the
        // capsule hidden): its mic would refuse every dictation after it
        // (ambient-lead m_22196). Past the mic's time limit it ends like
        // fn up: his words go, the mic is free.
        if self.talk.as_ref().is_some_and(|t| t.ending.is_none() && now.duration_since(t.started) >= DICTATE_MAX) {
            eprintln!("ambient-core: talk: the time limit, no talk_end in {} s", DICTATE_MAX.as_secs());
            self.talk_end(now);
        }
        let Some(t) = self.talk.as_mut() else { return };
        while let Ok(b) = t.blocks.try_recv() {
            let _ = t.audio.send(ListenMsg::Audio(b.pcm));
        }
        let mut evs = Vec::new();
        let mut flushed = false;
        let mut failed = None;
        let mut words = false;
        loop {
            match t.heard.try_recv() {
                Ok(Heard::Text(w)) => {
                    t.text.push_str(&w);
                    words = true;
                    if t.ending.is_none() {
                        evs.push(heard(t.text.trim(), false));
                    }
                }
                Ok(Heard::Flushed) => {
                    flushed = true;
                    break;
                }
                Ok(Heard::Failed(e)) => {
                    failed = Some(e);
                    break;
                }
                Err(TryRecvError::Empty) => break,
                Err(TryRecvError::Disconnected) => {
                    flushed = t.ending.is_some();
                    break;
                }
            }
        }
        if let Some(s) = &t.stream {
            evs.push(json!({"ev": "level", "who": "you", "v": s.level()}));
        }
        // fn up: his words come at the listener's flush, however long a
        // batch request takes (the TUI's wait; it was 1.5 s and a slower
        // request lost them, m_22120); past it, what was heard goes, and
        // nothing heard is said as a failure, never a silent idle
        let late = t.ending.is_some_and(|e| now.duration_since(e) >= TRANSCRIBE_TIMEOUT);
        let timed_out = late && !flushed && failed.is_none() && t.text.trim().is_empty();
        let ending = t.ending.is_some();
        let page = t.page.clone();
        // a note talk's words so far, live on the page
        if let (Some(p), true, None) = (&page, words, &failed) {
            let text = t.text.trim().to_string();
            self.home_call("page/voice", json!({"page": p, "phase": "heard", "text": text}));
        }
        self.out.extend(evs);
        let failed = failed.or_else(|| timed_out.then(|| "the transcription timed out.".to_string()));
        if let Some(e) = failed {
            eprintln!("ambient-core: talk: the listener: {e}");
            self.talk = None;
            if let Some(p) = page {
                self.error(&e);
                return self.page_voice_over(&p, "cancel", "");
            }
            self.drop_shot();
            self.error(&e);
            return self.set_phase(Phase::Failed, None);
        }
        if ending && (flushed || late) {
            self.finish_talk();
        }
    }

    fn tick_speech(&mut self) {
        let (Some(sp), Some(spk)) = (self.speech.as_mut(), self.speaker.as_mut()) else { return };
        let step = sp.step(self.ports.synth.as_ref(), spk.as_mut());
        let (turn, level) = (sp.turn, spk.level());
        match step {
            Step::Playing { word } => {
                if let Some(i) = word {
                    self.emit(json!({"ev": "word", "turn": turn, "i": i}));
                }
                self.emit(json!({"ev": "level", "who": "main", "v": level}));
            }
            Step::Over { word } => {
                self.speech = None;
                if let Some(i) = word {
                    self.emit(json!({"ev": "word", "turn": turn, "i": i}));
                }
                self.emit(json!({"ev": "level", "who": "main", "v": 0.0}));
                if self.talk.is_none() {
                    self.set_phase(Phase::Done, None);
                }
            }
            Step::Failed(e) => {
                self.speech = None;
                self.emit(json!({"ev": "level", "who": "main", "v": 0.0}));
                self.error(&e);
                self.set_phase(Phase::Done, None);
            }
        }
    }
}

// ---- his talk: fn held, a note talk on a page, a window shot ----

impl Core {
    /// fn let go without words (or escaped): nothing goes to main.
    pub(super) fn talk_cancel(&mut self) {
        if let Some(page) = self.talk.as_ref().and_then(|t| t.page.clone()) {
            self.talk = None;
            return self.page_voice_over(&page, "cancel", "");
        }
        if self.talk.take().is_some() {
            // the shot and context of fn down were for these words
            self.fn_ctx = None;
            self.drop_shot();
            self.set_phase(Phase::Idle, None);
        }
    }

    pub(super) fn talk_start(&mut self, page: Option<String>, now: Instant) {
        // each fn talk on receipt, in core.log (ambient-lead m_21884: did it reach the core?)
        eprintln!("ambient-core: talk_start{}", page.as_deref().map(|p| format!(" (note on page {p})")).unwrap_or_default());
        // a home hub the connector gave up restarting is tried again now
        super::super::talked();
        if let Some(t) = &self.talk {
            // never silent in core.log (his fn stuck on 'thinking…', main m_21882)
            // its age says a double fn down (ms) from a lost talk_end (s)
            // (ambient-lead m_22266); the sender is only known in the app
            eprintln!(
                "ambient-core: talk: talk_start while a talk runs ({}, started {} ms ago): ignored",
                if t.ending.is_some() { "ending" } else { "listening" },
                now.duration_since(t.started).as_millis()
            );
            return;
        }
        // one mic owner: voice mode has it (ambient-lead m_11168)
        if let Some(why) = self.voice_mode_busy() {
            eprintln!("ambient-core: talk: {why}");
            return self.emit(json!({"ev": "error", "cmd": "talk_start", "text": why}));
        }
        // fn wins over the composer's mic: the dictation ends first
        self.dictate_yield();
        // fn down while main speaks: the voice stops (the app sends
        // cut_in first; a talk_start alone does the same)
        self.stop_voice();
        let job = match (self.ports.listen_job)() {
            Ok(j) => j,
            Err(e) => {
                self.error(&e);
                return self.set_phase(Phase::Failed, None);
            }
        };
        let (btx, blocks) = mpsc::channel();
        let stream = match self.ports.mic.open(btx) {
            Ok(s) => s,
            Err(e) => {
                eprintln!("ambient-core: talk: the mic: {e}");
                self.error(&e);
                return self.set_phase(Phase::Failed, None);
            }
        };
        let (audio, arx) = mpsc::channel();
        let (htx, heard) = mpsc::channel();
        let cancel = Arc::new(AtomicBool::new(false));
        (self.ports.listener)(&job).start(job, arx, htx, cancel.clone());
        self.talk = Some(Talk { stream: Some(stream), blocks, audio, heard, cancel, text: String::new(), started: now, ending: None, page: page.clone() });
        let Some(id) = page else { return self.set_phase(Phase::Listening, None) };
        // a note talk: the page shows the words at its mouse, the
        // capsule says where they go
        self.home_call("page/voice", json!({"page": id, "phase": "start", "text": ""}));
        let title = match self.page_titles.iter().find(|(i, _)| *i == id) {
            Some((_, t)) if !t.trim().is_empty() => t.clone(),
            _ => id.replace('-', " "),
        };
        self.phase = Phase::Listening;
        self.emit(json!({"ev": "phase", "phase": "listening", "page": {"id": id, "title": title}}));
    }

    /// A note talk is over: its last words to the page, the capsule idle
    /// (no `sent`, no main phases: main never hears a note talk).
    pub(super) fn page_voice_over(&mut self, page: &str, phase: &str, text: &str) {
        self.home_call("page/voice", json!({"page": page, "phase": phase, "text": text}));
        self.emit(json!({"ev": "level", "who": "you", "v": 0.0}));
        self.set_phase(Phase::Idle, None);
    }

    pub(super) fn talk_end(&mut self, now: Instant) {
        eprintln!("ambient-core: talk_end");
        let Some(t) = self.talk.as_mut() else {
            eprintln!("ambient-core: talk: talk_end with no talk: ignored");
            return;
        };
        if t.ending.is_some() {
            return;
        }
        while let Ok(b) = t.blocks.try_recv() {
            let _ = t.audio.send(ListenMsg::Audio(b.pcm));
        }
        // the mic goes off now (the macOS mic indicator too)
        t.stream = None;
        let _ = t.audio.send(ListenMsg::Flush);
        t.ending = Some(now);
        let note = t.page.is_some();
        self.emit(json!({"ev": "level", "who": "you", "v": 0.0}));
        // a note talk never shows main's phases
        if !note {
            self.set_phase(Phase::Sending, None);
        }
    }

    /// The talk's words are all in (or waited for long enough): to main.
    pub(super) fn finish_talk(&mut self) {
        let Some(t) = self.talk.take() else { return };
        let words = t.text.trim().to_string();
        self.emit(heard(&words, true));
        if let Some(page) = &t.page {
            // nothing heard: no note; the word "send" alone sends the
            // page's notes (§4.1)
            let phase = match send_word(&words) {
                _ if words.is_empty() => "cancel",
                true => "send",
                false => "end",
            };
            return self.page_voice_over(page, phase, &words);
        }
        if words.is_empty() {
            self.fn_ctx = None;
            self.drop_shot();
            return self.set_phase(Phase::Idle, None);
        }
        // bar N14: words that answer the card in view don't go to main
        if self.voice_answer(&words) {
            self.fn_ctx = None;
            return self.set_phase(Phase::Idle, None);
        }
        self.send_to_main(words, true);
    }

    pub(super) fn take_shot(&mut self, path: &Path, app: String, title: String) {
        let stored = (self.ports.store_image)(path);
        // the app's PNG goes at once, stored or not
        let _ = std::fs::remove_file(path);
        match stored {
            Ok(stored) => {
                if let Some(old) = self.shot.replace(Shot { stored, app, title }) {
                    self.forget(vec![old]);
                }
                let ev = shot_ev(self.shot.as_ref());
                self.emit(ev);
            }
            Err(_) => self.error("main can't see this window: the screenshot didn't save."),
        }
    }

    /// The talk's still goes unsent (his ✕ on it: `shot_drop`, a cancel,
    /// a talk with no words, a failed talk): forgotten, and the app told
    /// (`shot {file: null}`); the talk itself goes on.
    pub(super) fn drop_shot(&mut self) {
        if let Some(s) = self.shot.take() {
            self.forget(vec![s]);
            self.emit(shot_ev(None));
        }
    }
}

/// fn's talk's still as the app reads it: bise-proto's CoreEv::Shot
/// (ambient-lead m_21912): its stored file, front app and window, or
/// `file: null` once it went.
pub(super) fn shot_ev(shot: Option<&Shot>) -> Value {
    let some = |s: &str| Some(s.trim().to_string()).filter(|s| !s.is_empty());
    let ev = match shot {
        Some(s) => bise_proto::draft::CoreEv::Shot { file: Some(s.stored.file.display().to_string()), app: some(&s.app), title: some(&s.title) },
        None => bise_proto::draft::CoreEv::Shot { file: None, app: None, title: None },
    };
    serde_json::to_value(ev).unwrap_or_default()
}

/// fn's talk words as the app reads them: bise-proto's CoreEv::Heard, its
/// one owner (architect m_11629), the whole text so far or, `done`, all of it.
fn heard(text: &str, done: bool) -> Value {
    serde_json::to_value(bise_proto::draft::CoreEv::Heard { text: text.to_string(), is_final: done }).unwrap_or_default()
}
