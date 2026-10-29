//! Answers by voice on the inbox's items (voice mode, design §5), split
//! out of cards.rs (its line limit).

use super::*;

// ---- answers by voice (voice mode, design §5) ----
//
// In voice mode the turn after a question or an approval is matched
// first (`voicemode::answers`): a match shows `heard "the first one" →
// 1 smaller` on the item for 1.5 s (esc undoes), then counts.
// (allow(dead_code) on the entry points until voice mode's integration
// calls them; voicemode/mod.rs has the same.)

thread_local! {
    /// The item an answer was heard for, the line, and since when.
    static HEARD: RefCell<Option<(u64, String, std::time::Instant)>> = const { RefCell::new(None) };
}

/// What voice mode can answer: the item in the view (else the top one),
/// an approval or not, its options' words.
#[allow(dead_code)]
#[derive(Clone, Debug, PartialEq, Eq)]
pub(crate) struct VoiceQuestion {
    pub(crate) id: u64,
    pub(crate) approval: bool,
    pub(crate) options: Vec<String>,
}

#[allow(dead_code)]
pub(crate) fn voice_question(app: &App) -> Option<VoiceQuestion> {
    let c = app.sb.current_card()?;
    let s = shape(c);
    (!s.options.is_empty()).then(|| VoiceQuestion { id: c.id, approval: c.kind == "approval", options: s.options })
}

/// `heard "…" → 1 smaller` on item `id` from `now` for
/// [`crate::voicemode::answers::HEARD_FOR`].
#[allow(dead_code)]
pub(crate) fn show_heard(id: u64, line: String, now: std::time::Instant) {
    HEARD.with(|h| *h.borrow_mut() = Some((id, line, now)));
}

/// esc: the heard answer does not count.
#[allow(dead_code)]
pub(crate) fn undo_heard() {
    HEARD.with(|h| *h.borrow_mut() = None);
}

/// The heard line on item `id`, while it shows.
pub(crate) fn heard_on(id: u64, now: std::time::Instant) -> Option<String> {
    HEARD.with(|h| {
        h.borrow().as_ref().and_then(|(at_id, line, at)| {
            (*at_id == id && now.saturating_duration_since(*at) < crate::voicemode::answers::HEARD_FOR).then(|| line.clone())
        })
    })
}

/// The heard answer counts: option `i` of item `id`, as a key would
/// pick it; the line goes.
#[allow(dead_code)]
pub(crate) fn answer_by_voice(app: &mut App, id: u64, i: usize) -> bool {
    undo_heard();
    pick(app, id, i)
}

/// The item's shape with the heard line under its body, while it shows.
pub(super) fn with_heard(c: &Card, mut s: Shape) -> Shape {
    if let Some(line) = heard_on(c.id, std::time::Instant::now()) {
        s.parts.push(Part::Note(line));
    }
    s
}
