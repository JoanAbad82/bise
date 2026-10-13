//! Harness A's fake voice (fake.rs) and the off-screen run's mic rule
//! (mod.rs voice_of, architect m_22483): the fake's words reach main
//! through the real talk path; his normal run refuses fake_words; an
//! off-screen run gets the fake or no mic, never the real one.

use super::*;

#[test]
fn the_fake_voice_talks_to_main_through_the_real_talk_path() {
    // harness A (lead m_7976): no mic, no STT, no sound; the same events
    // and the same input to main as his voice
    let dir = temp_dir();
    let words = crate::ambient::fake::Words::new(dir.join("voice.txt"));
    std::fs::write(words.file(), "what is running now").unwrap();
    let mut t = T::fake_voice(words.clone());
    t.ready();
    t.cmd(Cmd::TalkStart);
    assert!(!words.file().exists(), "read and removed at talk_start");
    t.until(|o| o.iter().any(|v| v["ev"] == "level" && v["who"] == "you" && v["v"].as_f64().unwrap_or(0.0) > 0.2));
    t.until(|o| o.iter().any(|v| v["ev"] == "heard" && v["final"] == false && v["text"] == "what"));
    t.cmd(Cmd::TalkEnd);
    t.until(|o| o.iter().any(|v| v["ev"] == "heard" && v["final"] == true));
    let out = t.take();
    assert!(out.iter().any(|v| v["ev"] == "heard" && v["final"] == true && v["text"] == "what is running now"), "{out:?}");
    assert!(out.iter().any(|v| v["ev"] == "sent" && v["voice"] == true));
    assert_eq!(t.hub.sent(), json!({"cmd": "send", "agent": "main", "text": "what is running now", "via": "capsule"}));
    // main answers: said through the silent speaker, word by word, done
    t.main_turn("two agents work.");
    t.until(|o| phase_is(o, "speaking"));
    t.until(|o| has(o, "word") && phase_is(o, "done"));
    // the fake_words cmd: the next talk's words, the file not needed
    t.cmd(Cmd::FakeWords { text: "stop perf".into() });
    t.cmd(Cmd::TalkStart);
    t.cmd(Cmd::TalkEnd);
    t.until(|o| o.iter().any(|v| v["ev"] == "heard" && v["final"] == true && v["text"] == "stop perf"));
    assert_eq!(t.hub.next()["text"], "stop perf");
    let _ = std::fs::remove_dir_all(dir);
}

#[test]
fn fake_words_is_refused_in_his_normal_run() {
    let mut t = T::new();
    t.ready();
    t.cmd(Cmd::parse(r#"{"cmd":"fake_words","text":"hi"}"#).unwrap());
    assert!(has(&t.take(), "error"));
}

/// The core is the one owner of the off-screen mic rule (architect
/// m_22483): off-screen, the fake voice when its canonical rule allows
/// it, else no mic; never the real one. His run keeps the real mic.
#[test]
fn an_off_screen_run_never_opens_the_real_mic() {
    use crate::ambient::{voice_of, Voice};
    let f = PathBuf::from("/w/voice.txt");
    assert_eq!(voice_of(Ok(None), false), Voice::Live);
    assert_eq!(voice_of(Err("refused".into()), false), Voice::Live);
    assert_eq!(voice_of(Ok(Some(f.clone())), false), Voice::Fake(f.clone()));
    assert_eq!(voice_of(Ok(Some(f.clone())), true), Voice::Fake(f.clone()));
    assert_eq!(voice_of(Ok(None), true), Voice::NoMic);
    assert_eq!(voice_of(Err("refused".into()), true), Voice::NoMic);
    // BISE_HOME a symlink to his ~/.bise: the fake is refused (canonical
    // paths), so an off-screen run gets no mic, not his
    let d = temp_dir();
    let his = d.join("home");
    std::fs::create_dir_all(his.join(".bise")).unwrap();
    let link = d.join("link");
    std::os::unix::fs::symlink(his.join(".bise"), &link).unwrap();
    let env = [("BISE_HOME", link.to_string_lossy().into_owned()), ("HOME", his.to_string_lossy().into_owned())];
    let get = |k: &str| env.iter().find(|(n, _)| *n == k).map(|(_, v)| v.clone());
    let fake = crate::ambient::fake::words_file(Some(f.to_string_lossy().into_owned()), &get);
    assert!(fake.is_err(), "{fake:?}");
    assert_eq!(voice_of(fake, true), Voice::NoMic);
    let _ = std::fs::remove_dir_all(d);
}
