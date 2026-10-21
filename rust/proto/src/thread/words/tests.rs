/// page-answer-row: his answer on a page reads as a card answer, his
/// words alone; a note, a tick, an edit, a start in their own words.
#[test]
fn a_page_answer_reads_as_his_words() {
    use super::*;
    use crate::parts::{PageNote, PageSaid};
    let w = |s: &str| s.chars().count();
    let note = |kind: &str, text: &str, quote: &str| PageNote { block: "b".into(), kind: kind.into(), text: text.into(), quote: quote.into(), ..PageNote::default() };
    let said = |notes: &[PageNote]| page_answer(&PageSaid { to: "main", title: "efforts", notes }, &w);
    // his pick on a question that had a card: the card answer's row
    let pick = PageNote { card: 516, asked: "Est-ce que bise lit les listes dans l'API ?".into(), ..note("pick", "la table maintenant, la lecture de l'API juste après", "") };
    assert_eq!(said(std::slice::from_ref(&pick)), ("you answered main".into(), "Est-ce que bise lit les listes dans l'API ?".into(), "la table maintenant, la lecture de l'API juste après".into()));
    let short = PageNote { text: "xhigh".into(), ..pick };
    assert_eq!(said(std::slice::from_ref(&short)).0, "you answered main: xhigh");
    // a drawn pick's option (notif-artifact): you picked its name, what it asked beside
    let drawn = PageNote { text: "A · a pink border and a clear label".into(), asked: "which composer look?".into(), ..short };
    assert_eq!(said(std::slice::from_ref(&drawn)), ("you picked A".into(), "which composer look?".into(), String::new()));
    // his answer with an image (card-image-parts, designer m_36256): the
    // head names the question, his words in the bubble, never on the line
    let img = crate::parts::Part::Image { name: "[Image #1]".into(), source: "/u/a.png".into(), mime: "image/png".into(), b64_file: "/h/a.b64".into(), caption: String::new() };
    let shot = PageNote { text: "the walls look fake".into(), parts: vec![img, crate::parts::Part::Text { text: " the walls look fake".into() }], ..drawn.clone() };
    assert_eq!(said(&[shot]), ("you answered main".into(), "which composer look?".into(), "the walls look fake".into()));
    // a note, a tick, an edit, a keep: the page named, his words one per line
    let notes = [note("note", "shorter", "Revenue grew"), note("tick", "done", ""), note("edit", "Q3", "Q2"), note("keep", "", "")];
    assert_eq!(said(&notes[..1]).0, "you sent main a note on ↗ efforts");
    assert_eq!(said(&notes), ("you sent main 4 notes on ↗ efforts".into(), String::new(), "\"Revenue grew\": shorter\n✓ done\n\"Q2\" → \"Q3\"\n♡ keep".into()));
    // a start: he asked for an agent
    assert_eq!(said(&[note("start", "do it", "ideas")]).0, "you asked main for an agent on ↗ efforts");
    // never the hub's template
    assert!(!said(&notes).2.contains("sb page publish"));
}

#[test]
fn the_waiting_words_are_designers() {
    use super::*;
    use crate::rows::WatchKind;
    use crate::thread::{WakeEv, WakeFold};
    // what a watch waits for, after `continues when` / `if`; a note says it itself
    assert_eq!(watch_event(WatchKind::Bg, "cargo bench", false), "cargo bench ends");
    assert_eq!(watch_event(WatchKind::File, "build.rc", false), "build.rc appears");
    assert_eq!(watch_event(WatchKind::Reply, "search", false), "search answers");
    assert_eq!(watch_event(WatchKind::File, "the nightly gate goes red", true), "the nightly gate goes red");
    let f = |ev, kind, what: &str, rc, after_ms| WakeFold { id: 1, ev, kind, what: what.into(), noted: false, rc, after_ms, tail: Vec::new(), msg: None, agent: String::new() };
    let n = |ev| WakeFold { noted: true, ..f(ev, WatchKind::File, "the reindex", Some(101), 0) };
    let head_n = |x: &WakeFold| wake_head(x).into_iter().map(|(t, _)| t).collect::<Vec<_>>().join(" · ");
    assert_eq!(head_n(&n(WakeEv::Ended)), "the reindex ended · rc 101 · after 0s");
    assert_eq!(head_n(&n(WakeEv::Stopped)), "stopped waiting for the reindex");
    let head = |f: &WakeFold| wake_head(f).into_iter().map(|(t, _)| t).collect::<Vec<_>>().join(" · ");
    assert_eq!(head(&f(WakeEv::Ended, WatchKind::Bg, "cargo test", Some(0), 124_000)), "cargo test ended · rc 0 · after 2m04s");
    let red = f(WakeEv::Ended, WatchKind::Bg, "cargo test", Some(101), 190_000);
    assert_eq!(wake_head(&red)[1], ("rc 101".to_string(), true), "only a non-zero rc is red");
    assert!(!wake_head(&f(WakeEv::Ended, WatchKind::Bg, "x", Some(0), 1))[1].1);
    assert_eq!(head(&f(WakeEv::Ended, WatchKind::File, "build.rc", Some(1), 5_000)), "build.rc appeared · rc 1 · after 5s");
    assert_eq!(head(&f(WakeEv::Ended, WatchKind::Pid, "pid 4242", None, 5_000)), "pid 4242 ended · after 5s");
    assert_eq!(head(&f(WakeEv::Still, WatchKind::Pid, "the reindex", None, 3_600_000)), "the reindex still running after 1h00m");
    assert_eq!(head(&f(WakeEv::Stopped, WatchKind::Pid, "the reindex", None, 9)), "stopped waiting for the reindex");
    assert_eq!(head(&f(WakeEv::Expired, WatchKind::Bg, "npm run dev", None, 86_400_000)), "stopped waiting for npm run dev after 24h");
    let mut t = f(WakeEv::Ended, WatchKind::Bg, "x", Some(0), 1);
    assert_eq!(wake_tail(&t), None);
    t.tail = vec!["a".into(), "b".into(), "c".into()];
    assert_eq!(wake_tail(&t).as_deref(), Some("its last 3 lines"));
}

use super::*;

/// The switch's status line per phase (architect m_20569, amb-home
/// m_20570): the window draws these words, never its own.
#[test]
fn a_switch_says_one_line_per_phase() {
    use crate::rows::{SwitchPhase::*, SwitchRow};
    let r = |phase, reason: Option<&str>| SwitchRow { phase, to: "f7178b72".into(), from: Some("2065c746".into()), reason: reason.map(String::from), at_ms: 1 };
    assert_eq!(switch_line(&r(Reloading, None)), Some(("reloading bise on f7178b72".into(), NoticeLevel::Info)));
    assert_eq!(switch_line(&r(Up, None)), Some(("✓ reloaded on f7178b72".into(), NoticeLevel::Info)));
    assert_eq!(switch_line(&r(Passed, None)), Some(("✓ reloaded on f7178b72".into(), NoticeLevel::Info)));
    assert_eq!(switch_line(&r(RolledBack, Some("the hub died"))), Some(("▲ couldn't reload: the hub died".into(), NoticeLevel::Warn)));
    assert_eq!(switch_line(&r(Unknown, None)), None);
}

#[test]
fn a_plan_swap_is_one_info_notice() {
    // chatgpt-default: the runtime's swap line folds into one info notice,
    // the ids without their provider; a line off its shape stays Other
    let o = lines::obs("model_swapped: chatgpt/gpt-6.1-sol chatgpt/gpt-6-luna");
    assert_eq!(o, lines::Obs::ModelSwapped { from: "chatgpt/gpt-6.1-sol".into(), to: "chatgpt/gpt-6-luna".into() });
    let n = obs_notice(&o, &|_, k| k.to_string()).unwrap();
    assert_eq!(n.level, NoticeLevel::Info);
    assert_eq!(n.text, "gpt-6.1-sol isn't on your ChatGPT plan: using gpt-6-luna · /model to pick another");
    for odd in ["model_swapped: one", "model_swapped:  b", "model_swapped: a b c"] {
        assert!(matches!(lines::obs(odd), lines::Obs::Other(_)), "{odd}");
    }
}

#[test]
fn a_retry_says_the_next_attempt() {
    assert_eq!(provider_retry("2/10 · provider 529 (transient) · retry in 4s"), "model call failed (attempt 2/10): provider 529 (transient) · retry 3/10 in 4s");
    assert_eq!(provider_retry("odd"), "model call failed: odd");
    // H9: the words now come from lines::retry's struct; the runtime's
    // own line (bend LAWS provider_retry_line) reads as it did before
    assert_eq!(provider_retry("1/10 · provider 529 (transient) · retry in 1s"), "model call failed (attempt 1/10): provider 529 (transient) · retry 2/10 in 1s");
    let r = lines::retry("1/10 · provider 529 (transient) · retry in 1s").unwrap();
    assert_eq!((r.attempt, r.max, r.why.as_str(), r.wait_ms, r.end), (1, 10, "provider 529 (transient)", 1_000, None));
    // not that shape: no data, the words say the line as it came
    for odd in ["odd", "2/10 · a · b · retry in 4s", "x/10 · 529 · retry in 4s", "2/10 · 529 · retry soon"] {
        assert_eq!(lines::retry(odd), None, "{odd}");
        assert_eq!(provider_retry(odd), format!("model call failed: {odd}"));
    }
    let n = obs_notice(&lines::Obs::ProviderRetry("2/10 · 529 · retry in 4s".into()), &|_, k| k.to_string()).unwrap();
    assert_eq!(n.retry.map(|r| r.attempt), Some(2), "the notice carries its data");
}

#[test]
fn a_missing_key_names_its_provider() {
    let name = |id: &str, var: &str| if id.is_empty() { format!("<{var}>") } else { id.to_uppercase() };
    assert_eq!(no_key("no openrouter key yet (OPENROUTER_API_KEY is not set): /provider sets it up", &name).as_deref(), Some("turn stopped: no OPENROUTER key yet. /provider sets it up."));
    assert_eq!(no_key("MISTRAL_API_KEY is not set", &name).as_deref(), Some("turn stopped: no <MISTRAL_API_KEY> key yet. /provider sets it up."));
    assert_eq!(no_key("the network is down", &name), None);
    assert!(is_plan_line("your ChatGPT sign-in expired. run /provider") && is_expired_line("your ChatGPT sign-in expired."));
}

/// designer m_15602: a label, not the question: the first words up to
/// the first `:`, `?`, `(`…, no tag, no agent name, path, flag or
/// quote, never `…` (the user's screenshot's instructions).
#[test]
fn a_timer_without_a_name_gets_a_label_from_its_words() {
    let f = timer_fallback;
    assert_eq!(f("check /Users/g/.bise/hubs/h/agents/art-seen/tmp/res and rc (tui_artifacts repro)", "art-seen"), "check and rc");
    assert_eq!(f("amb-win: read /Users/g/tmp/b1land.out (test:land f...", "amb-win"), "read");
    assert_eq!(f("amb-core: streaming bench: queue empty? (pgrep -fl 'heavy-run|lockf'; uptime", "amb-core"), "streaming bench");
    assert_eq!(f("standing rule (main m_7436, m_9222), battery mode", "ambient-lead"), "standing rule");
    assert_eq!(f("bise desktop drive: check designer (desktop-ds), ambient-lead's plan", "main"), "bise desktop drive");
    assert_eq!(f("answer-line build check every run", "answer-line"), "build check every run", "its agent's name goes");
    // designer m_15921: wherever it sits, with the `for` / `on` before it
    assert_eq!(f("check the build for answer-line", "answer-line"), "check the build");
    assert_eq!(f("run the bench on amb-core then report", "amb-core"), "run the bench then report");
    assert_eq!(f("check the build for answer-line", ""), "check the build for answer-line", "no agent: kept");
    assert_eq!(f("is the queue empty? then run it", ""), "is the queue empty");
    assert_eq!(f("/a/b /c", ""), "/a/b /c", "nothing left: the instruction's own first line");
    assert_eq!(f("supercalifragilisticexpialidocious-and-more-words-here", ""), "supercalifragilisticexpialidocio", "a first word past 32: cut, the only way");
    for s in ["ship it", "x"] {
        assert_eq!(f(s, "w"), s);
    }
    for s in ["check /Users/g/x and rc (repro)", "amb-core: streaming bench: queue empty? (pgrep"] {
        let n = f(s, "amb-core");
        assert!(!n.contains(['…', '?', '(', ':']) && n.split(' ').count() <= 5, "{n}");
    }
}

#[test]
fn a_name_never_repeats_its_agent() {
    assert_eq!(name_without_agent("answer-line build check", "answer-line"), "build check");
    assert_eq!(name_without_agent("amb-core: streaming bench", "amb-core"), "streaming bench");
    assert_eq!(name_without_agent("amb-core", "amb-core"), "amb-core", "only its name: kept");
    assert_eq!(name_without_agent("amb-corebench", "amb-core"), "amb-corebench", "a word that starts the same: kept");
    assert_eq!(name_without_agent("build check", ""), "build check");
}

#[test]
fn a_name_is_cut_at_a_word() {
    assert_eq!(name_fit("amb-core streaming bench"), "amb-core streaming bench");
    assert_eq!(name_fit("check the desktop drive and the plan of ambient-lead"), "check the desktop drive and the");
    assert!(name_fit("check the desktop drive and the plan of ambient-lead").chars().count() <= NAME_MAX);
    assert_eq!(name_fit("  two\n words "), "two words");
}

#[test]
fn one_line_and_the_summary() {
    assert_eq!(summary(&[]), "");
    assert_eq!(one_line("  \nabcdef", 4), "abc…");
}

/// desktop-status-line: the wait's words, read from the fixture the
/// desktop's TS twin (thread/wake.test.ts) reads too (architect m_22744).
#[test]
fn wait_words_follow_the_fixture() {
    use super::*;
    let fx: serde_json::Value = serde_json::from_str(include_str!("../../../fixtures/wait_words.json")).unwrap();
    let n = |v: &serde_json::Value, k: &str| v[k].as_u64().unwrap();
    let o = |v: &serde_json::Value, k: &str| v[k].as_i64().unwrap() as i32;
    let s = |v: &serde_json::Value, k: &str| v[k].as_str().unwrap().to_string();
    for c in fx["len"].as_array().unwrap() {
        assert_eq!(wait_len(n(c, "ms"), false), s(c, "long"), "{}", c["ms"]);
        assert_eq!(wait_len(n(c, "ms"), true), s(c, "short"), "{}", c["ms"]);
    }
    for (key, f) in [("ahead", clock_ahead as fn(u64, i32, u64, i32) -> String), ("past", clock_past)] {
        for c in fx[key].as_array().unwrap() {
            assert_eq!(f(n(c, "at_ms"), o(c, "at_off_s"), n(c, "now_ms"), o(c, "now_off_s")), s(c, "clock"), "{key}: {}", c["why"]);
        }
    }
    // an agent row from the fixture's few fields, the rest an idle agent's
    let agent = |v: &serde_json::Value| -> crate::rows::Agent {
        let mut a = serde_json::json!({"name": "main", "main": false, "status": "idle", "archived": false, "title": "", "purpose": "", "since_ms": 0, "waits": 0, "watching": []});
        for (k, x) in v.as_object().unwrap() {
            a[k] = x.clone();
        }
        serde_json::from_value(a).unwrap()
    };
    for c in fx["pauses"].as_array().unwrap() {
        let got = pause_line(&agent(&c["agent"]), n(c, "now_ms"), c["short"].as_bool().unwrap());
        let want = (!c["want"].is_null()).then(|| {
            let w = &c["want"];
            PauseLine { state: s(w, "state"), note: s(w, "note"), who: s(w, "who"), more: s(w, "more"), dur: s(w, "dur"), len: s(w, "len"), title: s(w, "title") }
        });
        assert_eq!(got, want, "{}", c["why"]);
    }
    for c in fx["alarms"].as_array().unwrap() {
        let off = o(c, "off_s");
        let got = alarms(&agent(&c["agent"]), n(c, "now_ms"), &|_| off);
        let want: Vec<Alarm> = c["want"].as_array().unwrap().iter().map(|w| Alarm { id: n(w, "id"), note: s(w, "note"), end: s(w, "end"), title: s(w, "title") }).collect();
        assert_eq!(got, want, "{}", c["why"]);
    }
}
