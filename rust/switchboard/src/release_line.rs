//! A newer bise is out: this hub's side of the machine's offer
//! (update-flow). The offer is the machine's, not this hub's: every hub
//! gets the same [`bise_home::release_offer::Offer`], planned there from
//! the machine's files; this module turns it into the row the clients
//! show (`hub/bise_update`: the TUI's status line, the window's status
//! pill through the desktop core's fold) and runs `update now`. Never an
//! inbox card: the `update` kind is retired (sb-core's cardkind.bend
//! closes an older journal's open one at boot, `moved to the status
//! line`).
//!
//! - Every 30 s the daemon reads the machine's files (the channel's
//!   manifest itself is fetched at most once an hour for the whole
//!   machine: `bise update --manifest`) and gives the hub the offer as
//!   `Input::Release` ([`ReleaseCheck`]); never in bise's source tree
//!   (not an install), never with `BISE_NO_UPDATE=1`. A changed row goes
//!   to the clients (`Effect::BiseUpdate`).
//! - `update now` (`bise/update`, his click on the pill or the line, or
//!   `/update`; with `Update automatically` on, the offer's
//!   `install_me`): `Effect::Update`: the daemon installs the release once
//!   for the machine (`bise update`), then writes `update-go`; the answer
//!   comes back as `Input::Updated`. From then on every hub still on an
//!   older version is `switch_me`: this hub asks for its switch
//!   (`Effect::ReleaseSwitch`; the daemon waits for no turn running and
//!   the machine's switch lock: one hub at a time). A failed install
//!   says why in main's thread.
//! - `/update` asks the channel now: a newer release updates now; else
//!   `you're on the latest bise, v…`.

use super::*;
use bise_home::release_offer::{Offer, State};
use bise_proto::rows::{BiseUpdate, BiseUpdateState};

/// The retired card kind (an older journal's open ones close at boot).
pub const KIND: &str = "update";

/// One look at the machine's offer, for the hub.
#[derive(Clone, Debug, Default, PartialEq)]
pub struct ReleaseCheck {
    /// None: no manifest known (never fetched, or unreadable)
    pub offer: Option<Offer>,
    /// the running version: its id, and its name when known
    pub running_id: String,
    pub running: String,
    /// `/update` from this client: it gets an answer, and a newer
    /// release updates now
    pub asked: Option<ClientId>,
    /// the fetch failed (offline): said to `asked`
    pub error: Option<String>,
}

/// A release's name as the user reads it: `v2026.10.2-5`; an id as is.
pub fn shown(version: &str) -> String {
    if version.starts_with(|c: char| c.is_ascii_digit()) && version.contains('.') {
        format!("v{version}")
    } else {
        version.to_string()
    }
}

/// The row the clients show, from a hub's offer: None when there is
/// nothing to show (on it, or nothing newer).
pub fn row(o: &Offer, running: &str) -> Option<BiseUpdate> {
    let (state, why) = match &o.state {
        State::Ready => (BiseUpdateState::Ready, String::new()),
        State::Installing => (BiseUpdateState::Installing, String::new()),
        State::Updating => (BiseUpdateState::Updating, String::new()),
        State::Failed { why } => (BiseUpdateState::Failed, reason(why)),
        State::UpToDate => return None,
    };
    Some(BiseUpdate {
        id: o.release.id.clone(),
        version: shown(&o.release.version),
        notes: o.release.notes.clone(),
        url: o.release.url.clone(),
        running: shown(running),
        state,
        why,
        waiting: Vec::new(),
    })
}

/// Why an update failed, short (designer): a URL or a path becomes its
/// file name, cut at a word with `…` past REASON_MAX columns.
pub fn reason(e: &str) -> String {
    let words: Vec<String> = one_line(e)
        .split_whitespace()
        .map(|w| {
            let core = w.trim_matches(|c: char| matches!(c, '(' | ')' | ',' | ';' | ':' | '\'' | '"'));
            if core.contains("://") || (core.starts_with('/') && core.len() > 1) || core.starts_with("~/") {
                let name = core.trim_end_matches('/').rsplit('/').next().unwrap_or(core);
                w.replace(core, name)
            } else {
                w.to_string()
            }
        })
        .collect();
    let mut out = String::new();
    for w in &words {
        if !out.is_empty() && out.chars().count() + 1 + w.chars().count() > REASON_MAX {
            return format!("{}…", out.trim_end_matches(['.', ',', ':', ';']));
        }
        if !out.is_empty() {
            out.push(' ');
        }
        out.push_str(w);
    }
    out.trim_end_matches('.').to_string()
}

const REASON_MAX: usize = 80;

/// The hub's side of the offer (runtime).
#[derive(Debug, Default)]
pub struct Updates {
    /// The last look's offer.
    news: Option<Offer>,
    /// The running version's name, for the words.
    running_name: String,
    /// `update now` sent from this hub, not answered yet: no second one.
    asked: bool,
    /// The row the clients have.
    sent: Option<BiseUpdate>,
}

impl Hub {
    /// A look at the machine's offer (the daemon's, or `/update`).
    pub(super) fn release_in(&mut self, fx: &mut Fx, c: ReleaseCheck) {
        if c.offer.is_some() {
            self.updates.news = c.offer;
            self.updates.running_name = c.running;
        }
        let Some(offer) = self.updates.news.clone() else {
            if let Some(client) = c.asked {
                let why = c.error.unwrap_or_else(|| "no release channel known".into());
                fx.push(notice(client, &format!("couldn't check for a new release: {}", clip(&one_line(&why), 160))));
            }
            return;
        };
        let now = self.release_row();
        if now != self.updates.sent {
            self.updates.sent = now.clone();
            fx.push(Effect::BiseUpdate { update: now });
        }
        if offer.install_me {
            self.update_now(fx);
        }
        if offer.switch_me {
            fx.push(Effect::ReleaseSwitch { id: offer.release.id.clone() });
        }
        let Some(client) = c.asked else { return };
        let name = shown(&offer.release.version);
        match offer.state {
            State::Ready => {
                self.update_now(fx);
                fx.push(notice(client, &format!("updating to {name}… your agents keep working.")));
            }
            State::Installing | State::Updating => fx.push(notice(client, &format!("updating to {name}… your agents keep working."))),
            State::Failed { why } => fx.push(notice(
                client,
                &format!("couldn't update to {name}, you're still on {}: {}", shown(&self.updates.running_name), reason(&why)),
            )),
            State::UpToDate => fx.push(notice(client, &format!("you're on the latest bise, {}.", shown(&self.updates.running_name)))),
        }
    }

    /// `update now` (his click, `/update`, or `Update automatically`): the
    /// daemon installs the release the machine offers, once.
    pub(super) fn update_now(&mut self, fx: &mut Fx) {
        let Some(o) = self.updates.news.as_ref().filter(|o| o.state == State::Ready) else { return };
        if self.updates.asked {
            return;
        }
        self.updates.asked = true;
        fx.push(Effect::Update { id: o.release.id.clone(), version: shown(&o.release.version) });
    }

    /// The end of `update now` (`Effect::Update`): Ok, the release is
    /// installed and every project switches to it, one at a time; Err,
    /// main's thread says why.
    pub(super) fn updated(&mut self, fx: &mut Fx, version: &str, res: Result<(), String>) {
        self.updates.asked = false;
        match res {
            Ok(()) => fx.push(feed(
                MAIN,
                Feed::info(format!("installed {version}. every project switches to it, one at a time; your agents keep working.")),
            )),
            Err(e) => {
                let on = Some(&self.updates.running_name).filter(|n| !n.is_empty()).map(|n| shown(n)).unwrap_or_else(|| "the same version".into());
                // designer: the reason last, so its cut never breaks the sentence
                fx.push(feed(MAIN, Feed::warn(format!("couldn't update to {version}, you're still on {on}: {}", reason(&e)))));
            }
        }
    }

    /// The row the clients show now (hub/bise_update, the TUI's line).
    pub(crate) fn release_row(&self) -> Option<BiseUpdate> {
        let o = self.updates.news.as_ref()?;
        let mut r = row(o, &self.updates.running_name)?;
        // his `update now` from here, before the install lock says so
        if self.updates.asked && r.state == BiseUpdateState::Ready {
            r.state = BiseUpdateState::Installing;
        }
        Some(r)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use bise_home::release_offer::Latest;

    fn offer(state: State) -> Offer {
        Offer {
            release: Latest {
                id: "bbb".into(),
                version: "2026.10.2-5".into(),
                notes: vec!["the inbox keeps your place".into()],
                url: "https://github.com/gvergnaud/bise/releases/tag/v2026.10.2-5".into(),
            },
            state,
            switch_me: false,
            install_me: false,
        }
    }

    #[test]
    fn the_row_says_where_the_update_is_and_nothing_when_on_it() {
        let r = row(&offer(State::Ready), "2026.10.2-4").unwrap();
        assert_eq!((r.version.as_str(), r.running.as_str(), r.state), ("v2026.10.2-5", "v2026.10.2-4", BiseUpdateState::Ready));
        assert_eq!(r.notes, ["the inbox keeps your place"]);
        assert_eq!(row(&offer(State::Installing), "x").unwrap().state, BiseUpdateState::Installing);
        assert_eq!(row(&offer(State::Updating), "x").unwrap().state, BiseUpdateState::Updating);
        let f = row(&offer(State::Failed { why: "the hub died.".into() }), "x").unwrap();
        assert_eq!((f.state, f.why.as_str()), (BiseUpdateState::Failed, "the hub died"));
        assert_eq!(row(&offer(State::UpToDate), "x"), None);
    }

    #[test]
    fn a_failure_reason_is_short() {
        let sha = "a".repeat(64);
        let e = format!("checksum mismatch for file:///tmp/uc-rel/bise-c1-r3-darwin-arm64.tar.gz (want {sha} got {sha})");
        let r = reason(&e);
        assert!(r.starts_with("checksum mismatch for bise-c1-r3-darwin-arm64.tar.gz (want"), "{r}");
        assert!(r.ends_with('…') && r.chars().count() <= REASON_MAX + 1, "{r}");
        assert_eq!(reason("cannot reach github.com."), "cannot reach github.com");
        assert_eq!(reason("no such file /Users/me/.local/share/bise/versions/x"), "no such file x");
    }
}
