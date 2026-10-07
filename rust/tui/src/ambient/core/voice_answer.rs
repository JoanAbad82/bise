//! Answering the card in view by voice (bar N14/L8, architect m_10930).
//! The focused window says which card is in front of him (`card_in_view`,
//! the ⌘I inbox's current item; none when it blurs, closes or leaves the
//! inbox); when fn's talk ends, its words are tried against that card
//! with the TUI's own rule (voicemode/answers.rs `decide`: `pick` for a
//! question, only "allow" for an approval). A match sends `voice_answer`
//! (the window shows the heard line for `ms`, esc undoes, then answers
//! through the hub's one answer path) and the words don't go to main; a
//! card that closed meanwhile, or no match: the words go to main as
//! before. Owner: amb-home.

use super::*;
use crate::voicemode::answers;

impl Core {
    /// True: `words` answered the card in view (`voice_answer` sent).
    pub(super) fn voice_answer(&mut self, words: &str) -> bool {
        let Some((project, id)) = self.in_view.clone() else { return false };
        let card = self.project_rows().into_iter().filter(|(p, _, _)| *p == project).flat_map(|(_, _, cards)| cards).find(|c| c.id == id);
        let Some(card) = card else { return false };
        let labels: Vec<String> = card.options.iter().map(|o| o.label.clone()).collect();
        let Some((i, line)) = answers::decide(words, card.approval, &labels) else { return false };
        let Some(opt) = card.options.get(i) else { return false };
        self.emit(json!({"ev": "voice_answer", "project": project, "card": id, "n": opt.n, "line": line, "ms": answers::HEARD_FOR.as_millis() as u64}));
        true
    }
}
