//! Dictation (bar I, core/dictate.rs): the composer's mic on the fake
//! mic and listener. Laws: the whole text in each event (the last one is
//! the composer's text), exactly one final, never a hub op or a main
//! phase, cancel, one mic user (fn wins), the time limit.

use super::*;
use super::super::core::DICTATE_MAX;
use crate::voice::TRANSCRIBE_TIMEOUT;

fn dictations(out: &[Value]) -> Vec<Value> {
    out.iter().filter(|v| v["ev"] == "dictation").cloned().collect()
}

/// The core wrote nothing to the hub (no input, no op).
fn hub_quiet(t: &mut T) {
    t.hub.r.get_ref().set_read_timeout(Some(Duration::from_millis(100))).unwrap();
    let mut more = String::new();
    loop {
        more.clear();
        match t.hub.r.read_line(&mut more) {
            Ok(n) if n > 0 => {
                let v: Value = serde_json::from_str(more.trim()).unwrap();
                assert!(v["op"] == "hello" || v["cmd"] == "hello", "the core wrote to the hub: {more}");
            }
            _ => break,
        }
    }
    t.hub.r.get_ref().set_read_timeout(Some(Duration::from_secs(3))).unwrap();
}

fn start(t: &mut T, id: &str) -> std::sync::mpsc::Sender<Heard> {
    let n = t.fakes.listen.lock().unwrap().len();
    t.cmd(Cmd::DictateStart { id: id.into() });
    let s = t.fakes.listen.lock().unwrap();
    assert_eq!(s.len(), n + 1, "no listener for {id}: {:#?}", t.out);
    s[n].heard.clone()
}

/// Law (architect m_10537): each partial carries the whole text so far,
/// the final replaces it, the composer's text is the last event's;
/// exactly one final; nothing to the hub, no capsule phase.
#[test]
fn dictation_partials_then_one_final_whole_text_never_to_main() {
    let mut t = T::new();
    t.ready();
    let heard = start(&mut t, "d1");
    assert_eq!(t.fakes.mic.lock().unwrap().opened, 1);
    heard.send(Heard::Text(" fix the".into())).unwrap();
    t.until(|o| dictations(o).iter().any(|v| v["text"] == "fix the"));
    heard.send(Heard::Text(" login".into())).unwrap();
    t.until(|o| dictations(o).iter().any(|v| v["text"] == "fix the login"));
    t.cmd(Cmd::DictateStop { id: "d1".into() });
    let audio: Vec<ListenMsg> = t.fakes.listen.lock().unwrap()[0].audio.try_iter().collect();
    assert_eq!(audio, vec![ListenMsg::Flush]);
    heard.send(Heard::Text(" test".into())).unwrap();
    heard.send(Heard::Flushed).unwrap();
    t.until(|o| dictations(o).iter().any(|v| v["final"] == true));
    // late events after the final change nothing
    heard.send(Heard::Text(" again".into())).ok();
    for _ in 0..5 {
        t.until(|_| true);
    }
    let out = t.take();
    let d = dictations(&out);
    assert_eq!(
        d,
        vec![
            json!({"ev": "dictation", "id": "d1", "text": "fix the", "final": false}),
            json!({"ev": "dictation", "id": "d1", "text": "fix the login", "final": false}),
            json!({"ev": "dictation", "id": "d1", "text": "fix the login test", "final": true}),
        ]
    );
    assert!(phases(&out).is_empty(), "a dictation shows no capsule phase: {out:#?}");
    assert!(!has(&out, "heard") && !has(&out, "sent"), "{out:#?}");
    hub_quiet(&mut t);
}

#[test]
fn dictation_cancel_is_one_cancelled_final_and_the_mic_off() {
    let mut t = T::new();
    t.ready();
    let heard = start(&mut t, "d1");
    heard.send(Heard::Text(" never mind".into())).unwrap();
    t.until(|o| !dictations(o).is_empty());
    t.take();
    // another window's id stops nothing
    t.cmd(Cmd::DictateCancel { id: "other".into() });
    t.cmd(Cmd::DictateStop { id: "other".into() });
    assert!(dictations(&t.take()).is_empty());
    t.cmd(Cmd::DictateCancel { id: "d1".into() });
    assert_eq!(dictations(&t.take()), vec![json!({"ev": "dictation", "id": "d1", "text": "", "final": true, "cancelled": true})]);
    // the listener's session is over (its audio sender dropped)
    let gone = matches!(t.fakes.listen.lock().unwrap()[0].audio.try_recv(), Err(std::sync::mpsc::TryRecvError::Disconnected));
    assert!(gone, "the dictation still holds the listener");
    // the mic is free again
    start(&mut t, "d2");
    assert_eq!(t.fakes.mic.lock().unwrap().opened, 2);
    hub_quiet(&mut t);
}

#[test]
fn one_mic_user_and_fn_wins_over_a_dictation() {
    let mut t = T::new();
    t.ready();
    // a talk still listening (fn up missed): his press in the window ends
    // it as at fn up (its words go to main) and the take gets the mic,
    // never 'the mic is busy.' (amb-tools' repro, m_22196)
    t.cmd(Cmd::TalkStart);
    let talk = t.fakes.listen.lock().unwrap().last().unwrap().heard.clone();
    t.take();
    let heard = start(&mut t, "d0");
    let out = t.take();
    assert!(!dictations(&out).iter().any(|v| v["final"] == true), "{out:#?}");
    assert_eq!(t.fakes.mic.lock().unwrap().opened, 2);
    talk.send(Heard::Text(" is it green".into())).unwrap();
    talk.send(Heard::Flushed).unwrap();
    t.until(|o| has(o, "sent"));
    assert_eq!(t.hub.next()["text"], "is it green");
    heard.send(Heard::Text(" the take".into())).unwrap();
    t.cmd(Cmd::DictateStop { id: "d0".into() });
    heard.send(Heard::Flushed).unwrap();
    t.until(|o| dictations(o).iter().any(|v| v["final"] == true));
    assert_eq!(dictations(&t.take()).last().unwrap(), &json!({"ev": "dictation", "id": "d0", "text": "the take", "final": true}));
    // a dictation holds it: a second one is refused
    let heard = start(&mut t, "d1");
    t.cmd(Cmd::DictateStart { id: "d2".into() });
    assert!(t.take().contains(&json!({"ev": "dictation", "id": "d2", "text": "", "final": true, "error": "the mic is busy."})));
    heard.send(Heard::Text(" half a".into())).unwrap();
    t.until(|o| !dictations(o).is_empty());
    t.take();
    // fn: the dictation ends with its words, then the talk starts
    t.cmd(Cmd::TalkStart);
    let out = t.take();
    let i = out.iter().position(|v| v == &json!({"ev": "dictation", "id": "d1", "text": "half a", "final": true})).expect("the dictation's final");
    let j = out.iter().position(|v| v["ev"] == "phase" && v["phase"] == "listening").expect("the talk");
    assert!(i < j, "{out:#?}");
    // its stop afterwards says nothing more
    t.cmd(Cmd::DictateStop { id: "d1".into() });
    assert!(dictations(&t.take()).is_empty());
}

/// Law (architect m_10537): no silent hot mic: a dictation left running
/// stops by itself after DICTATE_MAX, its final out.
#[test]
fn a_forgotten_dictation_stops_by_itself() {
    let mut t = T::new();
    t.ready();
    let Some(long_ago) = Instant::now().checked_sub(DICTATE_MAX + Duration::from_secs(1)) else { return };
    t.core.cmd(Cmd::DictateStart { id: "d1".into() }, long_ago);
    let heard = t.fakes.listen.lock().unwrap()[0].heard.clone();
    heard.send(Heard::Text(" left on".into())).unwrap();
    let listen = t.fakes.listen.clone();
    t.until(move |_| listen.lock().unwrap()[0].audio.try_iter().any(|m| m == ListenMsg::Flush));
    heard.send(Heard::Flushed).unwrap();
    t.until(|o| dictations(o).iter().any(|v| v["final"] == true));
    let d = dictations(&t.take());
    assert_eq!(d.last().unwrap(), &json!({"ev": "dictation", "id": "d1", "text": "left on", "final": true}));
    assert_eq!(d.iter().filter(|v| v["final"] == true).count(), 1);
}

/// His hot cut (m_22120): a batch listener sends every word at the flush,
/// after an HTTP request. A flush slower than the old 1.5 s (FINAL_WAIT)
/// ended the take with '' and the listener threw the words away. Now the
/// final waits for the words, however long the request takes.
#[test]
fn a_slow_transcription_keeps_its_words() {
    let mut t = T::new();
    t.ready();
    let heard = start(&mut t, "d1");
    // stopped 10 s ago: far past the old 1.5 s, the request still running
    let Some(ago) = Instant::now().checked_sub(Duration::from_secs(10)) else { return };
    t.core.cmd(Cmd::DictateStop { id: "d1".into() }, ago);
    for _ in 0..20 {
        t.until(|_| true);
    }
    assert!(dictations(&t.take()).is_empty(), "a final before the words came");
    heard.send(Heard::Text(" ship the login fix".into())).unwrap();
    heard.send(Heard::Flushed).unwrap();
    t.until(|o| dictations(o).iter().any(|v| v["final"] == true));
    assert_eq!(dictations(&t.take()), vec![json!({"ev": "dictation", "id": "d1", "text": "ship the login fix", "final": true})]);
}

/// A take still transcribing no longer holds the mic: the next take
/// starts at once (never 'the mic is busy.'), and both finals come, each
/// with its own words.
#[test]
fn a_take_started_while_the_last_one_transcribes_gets_the_mic_and_both_keep_their_words() {
    let mut t = T::new();
    t.ready();
    let one = start(&mut t, "d1");
    t.cmd(Cmd::DictateStop { id: "d1".into() });
    let two = start(&mut t, "d2");
    assert_eq!(t.fakes.mic.lock().unwrap().opened, 2);
    assert!(!dictations(&t.take()).iter().any(|v| v["error"].is_string()), "the second take was refused");
    two.send(Heard::Text(" and the tests".into())).unwrap();
    t.until(|o| dictations(o).iter().any(|v| v["id"] == "d2" && v["text"] == "and the tests"));
    one.send(Heard::Text(" fix the login".into())).unwrap();
    one.send(Heard::Flushed).unwrap();
    t.until(|o| dictations(o).iter().any(|v| v["id"] == "d1" && v["final"] == true));
    // d1's stop again, or its late words, change nothing
    t.cmd(Cmd::DictateStop { id: "d1".into() });
    t.cmd(Cmd::DictateStop { id: "d2".into() });
    two.send(Heard::Flushed).unwrap();
    t.until(|o| dictations(o).iter().any(|v| v["id"] == "d2" && v["final"] == true));
    let d = dictations(&t.take());
    let finals: Vec<&Value> = d.iter().filter(|v| v["final"] == true).collect();
    assert_eq!(
        finals,
        [
            &json!({"ev": "dictation", "id": "d1", "text": "fix the login", "final": true}),
            &json!({"ev": "dictation", "id": "d2", "text": "and the tests", "final": true}),
        ]
    );
    // fn during a flush: the flushing take goes on, fn gets the mic
    let three = start(&mut t, "d3");
    t.cmd(Cmd::DictateStop { id: "d3".into() });
    t.cmd(Cmd::TalkStart);
    assert!(!dictations(&t.take()).iter().any(|v| v["id"] == "d3"), "fn ended a take that no longer had the mic");
    three.send(Heard::Text(" later".into())).unwrap();
    three.send(Heard::Flushed).unwrap();
    t.until(|o| dictations(o).iter().any(|v| v["id"] == "d3" && v["final"] == true && v["text"] == "later"));
}

/// A request that never answers: the take ends after TRANSCRIBE_TIMEOUT
/// with an error (said in his composer), never a silent ''.
#[test]
fn a_transcription_that_never_answers_ends_with_an_error() {
    let mut t = T::new();
    t.ready();
    start(&mut t, "d1");
    let Some(ago) = Instant::now().checked_sub(TRANSCRIBE_TIMEOUT + Duration::from_secs(1)) else { return };
    t.core.cmd(Cmd::DictateStop { id: "d1".into() }, ago);
    t.until(|o| dictations(o).iter().any(|v| v["final"] == true));
    assert_eq!(dictations(&t.take()), vec![json!({"ev": "dictation", "id": "d1", "text": "", "final": true, "error": "the transcription timed out."})]);
    // a cancel of a take still transcribing: one cancelled final
    start(&mut t, "d2");
    t.cmd(Cmd::DictateStop { id: "d2".into() });
    t.cmd(Cmd::DictateCancel { id: "d2".into() });
    assert_eq!(dictations(&t.take()), vec![json!({"ev": "dictation", "id": "d2", "text": "", "final": true, "cancelled": true})]);
}

#[test]
fn dictate_cmds_need_an_id() {
    assert_eq!(Cmd::parse(r#"{"cmd":"dictate_start","id":"w1-3"}"#), Ok(Cmd::DictateStart { id: "w1-3".into() }));
    assert_eq!(Cmd::parse(r#"{"cmd":"dictate_stop","id":"w1-3"}"#), Ok(Cmd::DictateStop { id: "w1-3".into() }));
    assert_eq!(Cmd::parse(r#"{"cmd":"dictate_cancel","id":"w1-3"}"#), Ok(Cmd::DictateCancel { id: "w1-3".into() }));
    assert!(Cmd::parse(r#"{"cmd":"dictate_start","id":" "}"#).is_err());
    assert!(Cmd::parse(r#"{"cmd":"dictate_start"}"#).is_err());
}
