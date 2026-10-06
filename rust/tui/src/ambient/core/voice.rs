//! The core's voice and clock: main's words spoken, the ~30 Hz tick
//! (the mic to the listener, its words, the speaker's words and levels).

use super::*;

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
        self.tick_speech();
        self.poll_projects(false);
    }

    fn tick_talk(&mut self, now: Instant) {
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
                        evs.push(json!({"ev": "heard", "text": t.text.trim(), "final": false}));
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
        let late = t.ending.is_some_and(|e| now.duration_since(e) >= FINAL_WAIT);
        let ending = t.ending.is_some();
        let page = t.page.clone();
        // a note talk's words so far, live on the page
        if let (Some(p), true, None) = (&page, words, &failed) {
            let text = t.text.trim().to_string();
            self.hub.send(&json!({"op": "page_voice", "page": p, "phase": "heard", "text": text}));
        }
        self.out.extend(evs);
        if let Some(e) = failed {
            self.talk = None;
            if let Some(p) = page {
                self.error(&e);
                return self.page_voice_over(&p, "cancel", "");
            }
            if let Some(s) = self.shot.take() {
                self.forget(vec![s]);
            }
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
