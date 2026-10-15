//! His queued messages, held by the hub (issue 23): the terminal's doors
//! to sb-core's queue, the window's same ones. `tab` during a turn sends
//! the composer as `command/run {mode: queued}` (sb-core's `Msg.queued`,
//! said at the turn's end with the others, in order, in one batch: law
//! user_queued_said_at_idle). `↑` in an empty composer moves into the
//! drawer (queue.rs draws it, designer m_25146): on a row `⏎` says it now
//! (`turn/steerQueued`, sb-core's steer_queued), `e` takes it back into
//! the composer with its chips (`turn/unqueue`, chips_back.rs), `d` takes
//! it back for good, `u` queues it again for 4 s. The rows come with the
//! agent's hub row (`rows::Agent.queued`). Nothing here decides when a
//! message goes: the hub does; [`Drawer`] is view state only.

use super::*;
use std::time::{Duration, Instant};

/// How long `deleted · u undo` stays (designer: 4 s).
pub(crate) const UNDO_FOR: Duration = Duration::from_secs(4);

/// The drawer's view state.
#[derive(Default)]
pub(crate) struct Drawer {
    /// his queued messages asked back (`turn/unqueue`) whose answer has
    /// not come: a second `↑`/`e`/`d` takes another, the drawer no
    /// longer draws them
    pub(crate) taking: std::collections::BTreeSet<u64>,
    /// the focused row (oldest first), the drawer has the keys; None:
    /// the composer has them
    pub(crate) focus: Option<usize>,
    /// the last delete, its words for `u undo`
    pub(crate) deleted: Option<Deleted>,
    /// where the head drew `u undo` (queue.rs), its click twin
    pub(crate) undo_at: Option<ratatui::layout::Rect>,
}

/// A deleted queued message, as the hub gave it back.
pub(crate) struct Deleted {
    pub(crate) agent: String,
    pub(crate) text: String,
    pub(crate) parts: Vec<bise_proto::parts::Part>,
    pub(crate) at: Instant,
}

/// What a take-back is for.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub(crate) enum Take {
    /// `e` (or the old `↑`): into the composer
    Edit,
    /// `d`: kept for `u undo`, then gone
    Delete,
}

impl Sb {
    /// His messages the hub holds for `name`'s turn's end (its row's
    /// `queued`), oldest first, but the ones being taken back.
    pub(crate) fn queued_for(&self, name: &str) -> Vec<&bise_proto::draft::Queued> {
        self.agent(name).map_or(Vec::new(), |a| a.mine_queued.iter().filter(|q| !self.queue.taking.contains(&q.id)).collect())
    }

    /// The focused row of the agent in view, clamped to its rows (they
    /// leave by the hub's events); None out of the drawer or with none.
    pub(crate) fn queue_focus(&self) -> Option<usize> {
        let n = self.queued_for(&self.focus).len();
        self.queue.focus.filter(|_| n > 0).map(|i| i.min(n - 1))
    }

    /// A delete less than [`UNDO_FOR`] ago, for the agent in view.
    pub(crate) fn undo_shown(&self) -> bool {
        self.queue.deleted.as_ref().is_some_and(|d| d.agent == self.focus && d.at.elapsed() < UNDO_FOR)
    }
}

/// `tab` during a turn: the composer's text (its chips as parts) goes to
/// the hub as a queued message, the composer empties. False when there is
/// nothing to queue (empty, or a command: a command never waits).
pub(crate) fn queue(app: &mut App) -> bool {
    let text = app.ed.text.trim().to_string();
    if text.is_empty() || text.starts_with('/') {
        return false;
    }
    app.ed.take();
    let said = crate::attach::expand(app, &text);
    let agent = app.sb.focus.clone();
    app.sb.send_queued(&agent, said.text, said.parts);
    true
}

/// The drawer's keys (input.rs, before the composer's). Out of it: `↑`
/// in an empty composer moves in, on the newest row; `u` there undoes a
/// fresh delete. In it: `↑`/`↓` move (`↓` past the newest and `esc` go
/// back), `⏎` now, `e` edit, `d`/`⌫` delete, `u` undo; any other key
/// goes back to the composer and does its work there. True: taken.
pub(crate) fn key(app: &mut App, k: &crossterm::event::KeyEvent) -> bool {
    let n = app.sb.queued_for(&app.sb.focus).len();
    let plain = k.modifiers.difference(KeyModifiers::SHIFT).is_empty();
    let Some(at) = app.sb.queue_focus() else {
        app.sb.queue.focus = None;
        let empty = app.ed.text.is_empty();
        return match k.code {
            KeyCode::Up if empty && n > 0 && k.modifiers.is_empty() => {
                app.sb.queue.focus = Some(n - 1);
                true
            }
            KeyCode::Char('u') if empty && plain && app.sb.undo_shown() => undo(app),
            _ => false,
        };
    };
    if !plain {
        app.sb.queue.focus = None;
        return false;
    }
    match k.code {
        KeyCode::Up => app.sb.queue.focus = Some(at.saturating_sub(1)),
        KeyCode::Down if at + 1 < n => app.sb.queue.focus = Some(at + 1),
        KeyCode::Down | KeyCode::Esc => app.sb.queue.focus = None,
        KeyCode::Enter => steer(app, at),
        KeyCode::Char('e') => edit(app, at),
        KeyCode::Char('d') | KeyCode::Backspace | KeyCode::Delete => take(app, at, Take::Delete),
        KeyCode::Char('u') => {
            undo(app);
        }
        _ => {
            app.sb.queue.focus = None;
            return false;
        }
    }
    true
}

/// `⏎` on a row: said now (`turn/steerQueued`); the row leaves with the
/// hub's agents event, a refusal shows the hub's words.
fn steer(app: &mut App, at: usize) {
    let agent = app.sb.focus.clone();
    let Some(id) = app.sb.queued_for(&agent).get(at).map(|q| q.id) else { return };
    app.sb.call("turn/steerQueued", json!({"agent": agent, "id": id}), rpc::Then::Shown);
}

/// `e` on a row: back into the composer, which must be empty (designer:
/// 'empty the composer to edit it'); the composer has the keys again.
fn edit(app: &mut App, at: usize) {
    if !app.ed.text.is_empty() {
        crate::input::flash(app, "empty the composer to edit it".into());
        return;
    }
    take(app, at, Take::Edit);
    app.sb.queue.focus = None;
}

/// Row `at` of the agent in view asked back (`turn/unqueue`) for `why`.
fn take(app: &mut App, at: usize, why: Take) {
    let agent = app.sb.focus.clone();
    let Some(id) = app.sb.queued_for(&agent).get(at).map(|q| q.id) else { return };
    app.sb.queue.taking.insert(id);
    app.sb.call("turn/unqueue", json!({"agent": agent, "id": id}), rpc::Then::Taken(id, why));
}

/// A click on the head's `u undo` (designer: every key has a click
/// twin). True: taken.
pub(crate) fn click(app: &mut App, m: &crossterm::event::MouseEvent) -> bool {
    let hit = app.sb.undo_shown() && app.sb.queue.undo_at.is_some_and(|r| r.contains((m.column, m.row).into()));
    hit && undo(app)
}

/// `u` within 4 s of a delete: its words and parts queued again (at the
/// end: the hub gives a new id).
fn undo(app: &mut App) -> bool {
    let Some(d) = app.sb.queue.deleted.take() else { return false };
    app.sb.send_queued(&d.agent, d.text, d.parts);
    true
}

/// `turn/unqueue`'s answer for message `id`: taken for an edit, its words
/// and chips go at the end of the composer; for a delete, kept for the
/// undo; refused (it went meanwhile), the hub's words show as any
/// refusal.
pub(super) fn taken(app: &mut App, id: u64, why: Take, answer: Result<Value, String>) {
    app.sb.queue.taking.remove(&id);
    let ev = answer.and_then(|v| bise_proto::rpc::ev_of_result("turn/unqueue", v));
    match ev {
        Ok(Some(bise_proto::hub::HubEv::QueuedTaken { agent, text, parts, .. })) if why == Take::Delete => {
            app.sb.queue.deleted = Some(Deleted { agent, text, parts, at: Instant::now() });
        }
        Ok(Some(bise_proto::hub::HubEv::QueuedTaken { text, parts, .. })) => {
            let first = crate::attach::next_number(app);
            let (text, atts) = crate::chips_back::of(&parts, &text, first);
            if !app.ed.text.is_empty() && !app.ed.text.ends_with(char::is_whitespace) {
                app.ed.insert(" ");
            }
            app.ed.insert(&text);
            app.attachments.extend(atts);
        }
        Ok(_) => {}
        Err(e) => rpc::refused(app, &e),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::sb::bench::{hub_sent as sent, test_app_hub};

    /// Law (issue 23): tab sends the composer to the hub at once, queued;
    /// nothing stays in the terminal.
    #[test]
    fn tab_sends_it_queued_to_the_hub() {
        let (mut app, mut hub) = test_app_hub();
        app.ed.insert("also check logout");
        assert!(queue(&mut app));
        assert_eq!(app.ed.text, "");
        let r = sent(&mut hub).pop().unwrap();
        assert_eq!((r["method"].as_str(), &r["params"]["line"], &r["params"]["mode"]), (Some("command/run"), &json!("also check logout"), &json!("queued")));
        // nothing to queue: empty, or a command
        assert!(!queue(&mut app));
        app.ed.insert("/help");
        assert!(!queue(&mut app));
    }

    fn press(app: &mut App, code: KeyCode) -> bool {
        key(app, &crossterm::event::KeyEvent::new(code, KeyModifiers::NONE))
    }

    /// designer m_25146: ↑ in an empty composer moves into the drawer on
    /// the newest row; ↑/↓ move, ↓ past the newest and esc go back; any
    /// other key goes back to the composer and does its work there.
    #[test]
    fn the_arrow_moves_into_the_drawer() {
        let (mut app, mut hub) = test_app_hub();
        assert!(!press(&mut app, KeyCode::Up), "nothing queued: ↑ is the composer's");
        crate::sb::bench::queued_rows(&mut app, "main", &["one", "two", "three"]);
        app.ed.insert("draft");
        assert!(!press(&mut app, KeyCode::Up), "a draft: ↑ moves in it");
        app.ed.take();
        assert!(press(&mut app, KeyCode::Up));
        assert_eq!(app.sb.queue_focus(), Some(2));
        assert_eq!(crate::keybar::mode(&app), crate::keybar::Mode::Queued);
        assert!(press(&mut app, KeyCode::Up) && press(&mut app, KeyCode::Up) && press(&mut app, KeyCode::Up));
        assert_eq!(app.sb.queue_focus(), Some(0), "the oldest stops it");
        assert!(press(&mut app, KeyCode::Down));
        assert_eq!(app.sb.queue_focus(), Some(1));
        assert!(press(&mut app, KeyCode::Esc));
        assert_eq!(app.sb.queue_focus(), None);
        assert!(press(&mut app, KeyCode::Up) && press(&mut app, KeyCode::Down));
        assert_eq!(app.sb.queue_focus(), None, "↓ past the newest: back");
        assert!(press(&mut app, KeyCode::Up));
        assert!(!press(&mut app, KeyCode::Char('x')), "a letter goes to the composer");
        assert_eq!(app.sb.queue_focus(), None);
        assert!(sent(&mut hub).is_empty(), "moving asks the hub nothing");
    }

    /// ⏎ on a row: turn/steerQueued with its id (the hub's agents event
    /// takes the row out).
    #[test]
    fn enter_sends_it_now() {
        let (mut app, mut hub) = test_app_hub();
        crate::sb::bench::queued_rows(&mut app, "main", &["one", "two"]);
        press(&mut app, KeyCode::Up);
        press(&mut app, KeyCode::Up);
        assert!(press(&mut app, KeyCode::Enter));
        let r = sent(&mut hub).pop().unwrap();
        assert_eq!((r["method"].as_str(), &r["params"]["id"], &r["params"]["agent"]), (Some("turn/steerQueued"), &json!(1), &json!("main")));
    }

    /// e: taken back into the composer; with a draft there, it says to
    /// empty it and asks nothing.
    #[test]
    fn e_edits_it_in_the_composer() {
        let (mut app, mut hub) = test_app_hub();
        crate::sb::bench::queued_rows(&mut app, "main", &["one", "two"]);
        press(&mut app, KeyCode::Up);
        assert!(press(&mut app, KeyCode::Char('e')));
        assert_eq!(app.sb.queue_focus(), None, "the composer has the keys again");
        let r = sent(&mut hub).pop().unwrap();
        assert_eq!((r["method"].as_str(), &r["params"]["id"]), (Some("turn/unqueue"), &json!(2)));
        assert_eq!(app.sb.queued_for("main").len(), 1, "the row leaves at once");
        taken(&mut app, 2, Take::Edit, Ok(json!({"project": "p", "agent": "main", "id": 2, "text": "two"})));
        assert_eq!(app.ed.text, "two");
        // a draft: no edit
        press(&mut app, KeyCode::Esc);
        app.sb.queue.focus = Some(0);
        assert!(press(&mut app, KeyCode::Char('e')));
        assert!(sent(&mut hub).is_empty());
        assert_eq!(app.flash.as_ref().map(|f| f.0.as_str()), Some("empty the composer to edit it"));
    }

    /// d: taken back, no confirm; 'deleted · u undo' for 4 s, u queues
    /// its words and parts again; a refusal shows the hub's words.
    #[test]
    fn d_deletes_and_u_undoes() {
        let (mut app, mut hub) = test_app_hub();
        crate::sb::bench::queued_rows(&mut app, "main", &["one", "two"]);
        press(&mut app, KeyCode::Up);
        assert!(press(&mut app, KeyCode::Char('d')));
        assert_eq!(sent(&mut hub).pop().unwrap()["params"]["id"], json!(2));
        assert_eq!(app.sb.queue_focus(), Some(0), "the focus stays in the drawer, on the row before");
        taken(&mut app, 2, Take::Delete, Ok(json!({"project": "p", "agent": "main", "id": 2, "text": "two"})));
        assert_eq!(app.ed.text, "", "a delete never reaches the composer");
        assert!(app.sb.undo_shown());
        assert!(press(&mut app, KeyCode::Char('u')));
        let r = sent(&mut hub).pop().unwrap();
        assert_eq!((r["method"].as_str(), &r["params"]["line"], &r["params"]["mode"]), (Some("command/run"), &json!("two"), &json!("queued")));
        assert!(!app.sb.undo_shown(), "one undo");
        // from the empty composer too, and only for 4 s
        app.sb.queue.focus = None;
        app.sb.queue.deleted = Some(Deleted { agent: "main".into(), text: "x".into(), parts: Vec::new(), at: std::time::Instant::now() - UNDO_FOR });
        assert!(!press(&mut app, KeyCode::Char('u')), "too late: u types");
        let n = app.events.len();
        taken(&mut app, 1, Take::Delete, Err("m_1 already reached @main: it can't be taken back".into()));
        assert!(app.events.len() > n, "the refusal shows");
    }

    /// Law: e on the newest, then e on the one before; refused (it went
    /// meanwhile), the hub's words show and the composer keeps what came.
    #[test]
    fn edits_take_the_rows_back_in_turn() {
        let (mut app, mut hub) = test_app_hub();
        crate::sb::bench::queued_rows(&mut app, "main", &["one", "two"]);
        press(&mut app, KeyCode::Up);
        press(&mut app, KeyCode::Char('e'));
        press(&mut app, KeyCode::Up);
        press(&mut app, KeyCode::Char('e'));
        assert!(!press(&mut app, KeyCode::Up), "nothing left to take");
        let asked: Vec<Value> = sent(&mut hub).iter().map(|r| r["params"]["id"].clone()).collect();
        assert_eq!(asked, [json!(2), json!(1)]);
        taken(&mut app, 2, Take::Edit, Ok(json!({"project": "p", "agent": "main", "id": 2, "text": "two"})));
        let n = app.events.len();
        taken(&mut app, 1, Take::Edit, Err("m_1 already reached @main: it can't be taken back".into()));
        assert_eq!(app.ed.text, "two", "the composer keeps what came");
        assert!(app.events.len() > n, "the refusal shows");
        assert!(app.sb.queue.taking.is_empty());
    }
}
