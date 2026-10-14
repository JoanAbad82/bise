//! His queued messages, held by the hub (issue 23): the terminal's three
//! doors to sb-core's queue, the window's same ones. `tab` during a turn
//! sends the composer as `command/run {mode: queued}` (sb-core's
//! `Msg.queued`, said at the turn's end with the others, in order, in one
//! batch: law user_queued_said_at_idle); `↑` in an empty composer takes
//! the newest back with `turn/unqueue` and its answer puts it in the
//! composer with its chips (chips_back.rs); the rows come with the
//! agent's hub row (`rows::Agent.queued`, queue.rs draws them). Nothing
//! here decides when a message goes: the hub does.

use super::*;

impl Sb {
    /// His messages the hub holds for `name`'s turn's end (its row's
    /// `queued`), oldest first, but the ones ↑ is taking back.
    pub(crate) fn queued_for(&self, name: &str) -> Vec<&bise_proto::draft::Queued> {
        self.agent(name).map_or(Vec::new(), |a| a.mine_queued.iter().filter(|q| !self.taking.contains(&q.id)).collect())
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

/// `↑` in an empty composer: the newest queued message of the agent in
/// view asked back (`turn/unqueue`); [`taken`] puts it in the composer.
/// False with nothing queued (or the composer not empty).
pub(crate) fn take_newest(app: &mut App) -> bool {
    if !app.ed.text.is_empty() {
        return false;
    }
    let agent = app.sb.focus.clone();
    let Some(id) = app.sb.queued_for(&agent).last().map(|q| q.id) else { return false };
    app.sb.taking.insert(id);
    app.sb.call("turn/unqueue", json!({"agent": agent, "id": id}), rpc::Then::Taken(id));
    true
}

/// `turn/unqueue`'s answer for message `id`: taken, its words and chips
/// go at the end of the composer; refused (it went meanwhile), the hub's
/// words show as any refusal.
pub(super) fn taken(app: &mut App, id: u64, answer: Result<Value, String>) {
    app.sb.taking.remove(&id);
    let ev = answer.and_then(|v| bise_proto::rpc::ev_of_result("turn/unqueue", v));
    match ev {
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

    /// Law: ↑ asks the newest back, a second ↑ the one before it; the
    /// answer puts his words in the composer, a refusal shows why.
    #[test]
    fn the_arrow_takes_the_newest_back() {
        let (mut app, mut hub) = test_app_hub();
        crate::sb::bench::queued_rows(&mut app, "main", &["one", "two"]);
        assert!(take_newest(&mut app));
        assert!(take_newest(&mut app));
        assert!(!take_newest(&mut app), "nothing left to take");
        let asked: Vec<Value> = sent(&mut hub).iter().map(|r| r["params"]["id"].clone()).collect();
        assert_eq!(asked, [json!(2), json!(1)]);
        let v = json!({"project": "p", "agent": "main", "id": 2, "text": "two"});
        taken(&mut app, 2, Ok(v));
        assert_eq!(app.ed.text, "two");
        assert!(!app.sb.taking.contains(&2));
        let n = app.events.len();
        taken(&mut app, 1, Err("m_1 already reached @main: it can't be taken back".into()));
        assert_eq!(app.ed.text, "two", "the composer keeps what came");
        assert!(app.events.len() > n, "the refusal shows");
        assert!(app.sb.taking.is_empty());
    }

    /// Not while the composer has text (↑ moves in it then).
    #[test]
    fn the_arrow_waits_for_an_empty_composer() {
        let (mut app, _hub) = test_app_hub();
        crate::sb::bench::queued_rows(&mut app, "main", &["one"]);
        app.ed.insert("draft");
        assert!(!take_newest(&mut app));
    }
}
