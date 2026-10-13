//! The `/computer-use` rows from a setup-check (pure): what each step
//! says, its numbered steps under it, what ⏎ does and what `c` copies.
//! The TUI's screen and the desktop's computer-use page both draw them.
//!
//! Every step that isn't done says exactly what to do and acts on ⏎
//! (Benjamin's report, 13 Oct): the Load unpacked steps name the folder
//! to pick; the two "for apps" rows act even while the helper app
//! doesn't answer yet (⏎ opens their System Settings pane, [`pane_url`]).

use super::{Busy, Row, St};
use crate::theme;
use serde_json::Value;

/// A setup-check row state as drawn.
pub(crate) fn st_of(s: &str) -> St {
    match s {
        "done" => St::Done,
        "waits" => St::Waits,
        "checking" => St::Checking,
        "failed" => St::Failed,
        _ => St::NotYet,
    }
}

pub(crate) fn str_at<'a>(v: &'a Value, k: &str) -> &'a str {
    v.get(k).and_then(Value::as_str).unwrap_or("")
}

/// A path as the user reads it (`~/...`).
pub(crate) fn tilde(p: &str) -> String {
    match std::env::var("HOME") {
        Ok(h) if !h.is_empty() && p.starts_with(&h) => format!("~{}", &p[h.len()..]),
        _ => p.to_string(),
    }
}

/// A failure line with contractions (m_3904): `did not` → `didn't`.
fn contract(t: &str) -> String {
    [("did not", "didn't"), ("does not", "doesn't"), ("is not", "isn't"), ("cannot", "can't"), ("could not", "couldn't")]
        .iter()
        .fold(t.to_string(), |acc, (a, b)| acc.replace(a, b))
}

/// The System Settings pane of a "for apps" row (`accessibility`,
/// `screen_recording`): Privacy & Security, at that list.
pub(crate) fn pane_url(id: &str) -> Option<&'static str> {
    match id {
        "accessibility" => Some("x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility"),
        "screen_recording" => Some("x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture"),
        _ => None,
    }
}

/// The extension's folder (where Load unpacked points), as setup-check
/// gives it; None: unknown.
pub(crate) fn extension_dir(check: &Value) -> Option<String> {
    check.get("extension").map(|e| str_at(e, "dir")).filter(|d| !d.is_empty()).map(String::from)
}

/// The helper app's path (what `+` picks in System Settings); None: not
/// installed.
pub(crate) fn helper_app(check: &Value) -> Option<String> {
    Some(str_at(check, "helper")).filter(|d| !d.is_empty()).map(String::from)
}

/// The rows from a setup-check and what runs now.
pub(crate) fn rows(check: &Value, busy: &Busy) -> Vec<Row> {
    let browser = str_at(check, "browser");
    let browser = if browser.is_empty() { "Chrome" } else { browser };
    // brand names keep their case in the label column (m_3904)
    let low = browser.to_string();
    let min = check.get("min_major").and_then(Value::as_u64).unwrap_or(116);
    let mut out: Vec<Row> = Vec::new();
    let Some(list) = check.get("rows").and_then(Value::as_array) else { return out };
    // no helper app: no "for apps" rows at all (m_3896)
    let helper = list.iter().any(|r| str_at(r, "id") == "accessibility" && str_at(r, "fix") != "install_helper");
    let app = helper_app(check);
    for r in list {
        let id = str_at(r, "id");
        let mut st = st_of(str_at(r, "state"));
        let given = str_at(r, "detail").to_string();
        let mut fix = r.get("fix").and_then(Value::as_str).map(String::from);
        let mut copy: Option<String> = None;
        let prev = out.last().map(|p: &Row| p.label.clone()).unwrap_or_default();
        let after = || if prev.is_empty() { String::new() } else { format!("after {prev}") };
        let o = |s: &str| Some(s.to_string());
        let (label, detail, help, action, apps): (String, String, Vec<String>, Option<String>, bool) = match id {
            "browser" => {
                let (d, h, a) = match (st, fix.as_deref()) {
                    (St::Done, _) => (given, vec![], None),
                    (_, Some("install_browser")) => (format!("{browser} isn't installed"), vec![format!("install it, i'll wait")], o("open its download page")),
                    (_, Some("update_browser")) => (format!("{given} is too old. bise needs {min}"), vec![], o("open chrome://settings/help")),
                    (_, Some("open_browser")) => (format!("{browser} isn't open. open it, i'll wait"), vec![], Some(format!("open {browser}"))),
                    _ => (given, vec![], None),
                };
                (low.clone(), d, h, a, false)
            }
            "extension" => {
                let label = format!("{low} extension");
                let (d, h, a) = match (st, fix.as_deref()) {
                    (St::Done, _) => (given, vec![], None),
                    (St::NotYet, _) => (after(), vec![], None),
                    (_, Some("add_extension")) => {
                        let dir = extension_dir(check);
                        copy = dir.clone();
                        (format!("add bise to {browser}"), load_unpacked(dir.as_deref().map(tilde).as_deref()), o("open chrome://extensions"))
                    }
                    (_, Some("repair")) => ("the extension can't reach bise".to_string(), vec!["⏎ rewrites the native host".to_string()], o("repair it")),
                    // a newer build is in its folder and Chrome didn't reload it
                    (_, Some("reload_extension")) => (
                        "an update is ready".to_string(),
                        vec![format!("⏎ opens chrome://extensions · click ↻ on bise computer use"), "i'll see it here".to_string()],
                        o("open chrome://extensions"),
                    ),
                    _ => (given, vec![], None),
                };
                (label, d, h, a, false)
            }
            "live_test" => {
                if busy.live_test {
                    st = St::Checking;
                }
                let (d, a) = match st {
                    St::Checking => (format!("opening a tab in the background{}", theme::ellipsis()), None),
                    St::Done => ("opened a tab, clicked a button. all set".to_string(), None),
                    St::Failed => (contract(&given), o("try again")),
                    St::Waits => ("opens a tab in the background and clicks".to_string(), o("run it")),
                    St::NotYet => ("last".to_string(), None),
                };
                ("live test".to_string(), d, vec![], a, false)
            }
            "accessibility" | "screen_recording" if helper => {
                let rec = id == "screen_recording";
                if rec && busy.reopening.is_some() && st != St::Done {
                    st = St::Checking;
                }
                let (d, h, a) = if st == St::Done {
                    let d = if rec { "bise can see app windows" } else { "bise can click and type in apps" };
                    (d.to_string(), vec![], None)
                } else if rec && busy.reopening.is_some() {
                    (format!("bise Computer Use reopens{}", theme::ellipsis()), vec![], None)
                } else {
                    // ⏎ acts whatever the helper says: while it doesn't
                    // answer (checking) the pane still opens
                    fix = Some(format!("request_{id}"));
                    copy = app.clone();
                    let d = match (st, rec) {
                        (St::Checking, _) => format!("waiting for bise Computer Use to answer{}", theme::ellipsis()),
                        (_, true) => "optional · for screenshots of apps".to_string(),
                        (_, false) => "lets agents click and type in apps".to_string(),
                    };
                    (d, grant_steps(rec, app.is_some()), o("open System Settings"))
                };
                ((if rec { "screen recording" } else { "accessibility" }).to_string(), d, h, a, true)
            }
            _ => continue,
        };
        out.push(Row { id: id.to_string(), label, st, detail, help, action, fix, apps, copy });
    }
    out
}

/// The Load unpacked steps (`dir`: the folder as the user reads it).
fn load_unpacked(dir: Option<&str>) -> Vec<String> {
    let mut h = vec!["1  ⏎ opens chrome://extensions and copies bise's folder".to_string(), "2  turn on Developer mode, top right".to_string()];
    match dir {
        Some(d) => {
            h.push("3  click Load unpacked, then cmd+shift+g, cmd+v, return and Select".to_string());
            h.push(format!("   the folder: {d}"));
        }
        None => h.push("3  click Load unpacked, then pick bise's extension folder".to_string()),
    }
    h.push("4  i'll see it here, no key needed".to_string());
    h
}

/// A permission's steps in System Settings (`rec`: Screen Recording;
/// `app`: its path is known, `+` can add it).
fn grant_steps(rec: bool, app: bool) -> Vec<String> {
    let pane = if rec { "Screen Recording" } else { "Accessibility" };
    let mut h = vec![format!("1  ⏎ opens Privacy & Security › {pane}")];
    h.push(if rec { "2  turn on bise Computer Use. macOS reopens it, i'll wait" } else { "2  turn on bise Computer Use" }.to_string());
    if app {
        h.push("   not in the list? click +, then cmd+shift+g, cmd+v, return, Open".to_string());
    }
    h.push("3  i'll see it here".to_string());
    h
}

/// The browser, extension and live test are all `✓`.
pub(crate) fn ready(rows: &[Row]) -> bool {
    let web: Vec<&Row> = rows.iter().filter(|r| !r.apps).collect();
    !web.is_empty() && web.iter().all(|r| r.st == St::Done)
}
