use super::*;
use crate::thread::lines::split_thinking;
use crate::thread::{fold, Ctx};

#[test]
fn a_spans_signature_line_never_reaches_the_text() {
    assert_eq!(unsigned("plan\\nBENDSIG::CAQSowk+/="), "plan");
    assert_eq!(unsigned("a\\nb\\nBENDSIG::s"), "a\\nb");
    // a span that is only its signature: nothing was said
    assert_eq!(unsigned("BENDSIG::s"), "");
    // only the LAST line, and only when it starts with the mark: a
    // thinking that mentions it stays whole
    assert_eq!(unsigned("the BENDSIG:: prefix\\nmarks it"), "the BENDSIG:: prefix\\nmarks it");
    assert_eq!(unsigned("BENDSIG::s\\nthen more"), "BENDSIG::s\\nthen more");
    assert_eq!(unsigned("plan\\n BENDSIG::s"), "plan\\n BENDSIG::s");
    assert_eq!(unsigned("plain"), "plain");
    // every span of a reply loses its own, the reply stays
    let (think, vis) = split_thinking("<think>a\\nBENDSIG::s1</think>\\n<think>b\\nBENDSIG::s2</think>\\nok").unwrap();
    assert_eq!((think.as_str(), vis.as_str()), ("a\\nb", "ok"));
}

/// The runtime's own form (D10, the runtime → transcript seam): a signed
/// span as the session fixture holds it (tests/fixtures/session, written
/// by the runtime's projection), carried on a feed line as the hub reads
/// it. A change of the mark on the Bend side reddens this.
#[test]
fn a_runtime_signed_span_folds_to_its_words_alone() {
    let fixture = include_str!("../../../../tests/fixtures/session/15-migrated/projection.txt");
    let start = fixture.find("<think>").expect("the fixture has a thinking");
    let end = start + fixture[start..].find("</think>").expect("closed");
    let span = &fixture[start..end + "</think>".len()];
    // the projection keeps the span's lines escaped, as the feed carries them
    assert!(span.contains(&format!("\\n{SIG_MARK}")), "the runtime signs on the span's last line: {span}");
    let line = format!("  obs: assistant: {span}On it.");
    let ctx = Ctx { open_cards: &[], page: &|_| None, provider: &|_, k| k.to_string(), width: &|s| s.chars().count(), offset: &|_| 0, attached: &crate::thread::Attached::plain };
    let e = fold(&[(1, 1_000, "  obs: turn_started".to_string()), (2, 13_000, line)], &ctx);
    let th = e[0].thinking.as_ref().expect("its thinking rides on the reply");
    assert_eq!((th.text.as_str(), e[0].text.as_str()), ("Look first.", "On it."));
    assert!(!format!("{e:?}").contains(SIG_MARK), "no entry carries the signature");
}
