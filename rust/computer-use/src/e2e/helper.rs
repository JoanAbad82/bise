//! The helper app's start (C5) end to end: where the broker finds it, how
//! often it opens it. The opener is a fake (`/usr/bin/false`): nothing
//! opens on the user's screen.

use super::*;

/// A broker started again on the paths of one just shut down. Its lock's
/// flock can outlive the shutdown for a moment: a child another test forks
/// (a spawn with `pre_exec`, plutil, sips) holds a copy of every open fd
/// between its fork and its exec, the lock's too, so a start then is
/// `Running` (release-37: 1 red, 40 tests at load 20+). Waits for the lock
/// to be free, 10 s at most.
fn start_again(o: Opts) -> Handle {
    let t0 = Instant::now();
    loop {
        match broker::start(o.clone()) {
            Err(broker::StartError::Running) if t0.elapsed() < Duration::from_secs(10) => std::thread::sleep(Duration::from_millis(20)),
            r => return r.unwrap(),
        }
    }
}

/// The broker outlives its version dir (cu-helper, 14 Oct): an update
/// prunes the version it started from, the helper app inside it with it.
/// Before, it kept opening the gone path (`apps`: no_helper "doesn't
/// answer", status: helper "stopped") until restarted; now it looks again
/// and opens the helper of the version in use.
#[test]
fn a_pruned_helper_path_is_found_again() {
    let (d, p) = paths();
    let pruned = p.home.join("versions/a/bise Computer Use.app");
    let now = p.home.join("versions/b/bise Computer Use.app");
    std::fs::create_dir_all(&now).unwrap();
    let o = Opts {
        launch_helper: true,
        helper_app: Some(pruned.clone()),
        find_helper: |home| Some(home.join("versions/b/bise Computer Use.app")),
        ..opts(&p)
    };
    let h = broker::start(o).unwrap();
    let mut a = agent(&p, "bt-bot", &d.join("t"));
    // the fake opener starts nothing: the helper still doesn't answer...
    assert_eq!(code(&mut a, "apps", json!({}))["code"], "no_helper");
    // ...but it was the version in use that the broker opened
    assert_eq!(h.helper_launched(), vec![now.clone()]);
    assert_eq!(cli::control(&p, "status", &json!({})).unwrap()["helper_app"], json!(now));
    h.shutdown();
    // nothing anywhere: said so, not "doesn't answer"
    let o = Opts { launch_helper: true, helper_app: Some(pruned), find_helper: |_| None, ..opts(&p) };
    let h = start_again(o);
    let mut a = agent(&p, "bt-bot", &d.join("t"));
    assert!(code(&mut a, "apps", json!({}))["message"].as_str().unwrap().contains("isn't installed"));
    assert_eq!(ok(&mut a, "status", json!({}))["apps"]["helper"], "absent");
    assert!(h.helper_launched().is_empty());
    h.shutdown();
    let _ = std::fs::remove_dir_all(&d);
}

/// setup-check's apps rows (m_3897): a 1 s poll never relaunches the
/// helper (one `open -g` per 20 s at most), sees a helper that comes back
/// by itself at once (a plain connect each poll), and reads its grants.
#[test]
fn setup_check_polls_permissions_without_relaunching() {
    let (d, p) = paths();
    // a path that doesn't exist, found again the same (the opener opens nothing)
    let app = p.home.join("no such helper.app");
    let o = Opts { launch_helper: true, helper_app: Some(app.clone()), find_helper: |home| Some(home.join("no such helper.app")), ..opts(&p) };
    let brokers: Brokers = Default::default();
    let start = starter(o, brokers.clone());
    for _ in 0..5 {
        let v = cli::setup_check(&p, Some(&app), Some(&*start));
        assert_eq!(v["rows"][3]["state"], "checking", "{v}");
        std::thread::sleep(Duration::from_millis(1000));
    }
    assert_eq!(brokers.lock().unwrap()[0].helper_launches(), 1);
    // the helper comes back (macOS reopened it): the next poll sees it
    let _helper = FakeHelper::start(&p, jpeg(&d));
    let v = cli::setup_check(&p, Some(&app), Some(&*start));
    assert_eq!(v["rows"][3]["id"], "accessibility");
    assert_ne!(v["rows"][3]["state"], "checking", "{v}");
    assert_eq!(brokers.lock().unwrap()[0].helper_launches(), 1);
    for h in brokers.lock().unwrap().drain(..) {
        h.shutdown();
    }
    let _ = std::fs::remove_dir_all(&d);
}
