//! The new-release item (update-card): an installed bise tells the user,
//! in the inbox, that a newer release is out, with its notes, and
//! installs it on one key. Kind `update`, for the user only, a quiet
//! item (it never takes the focus).
//!
//! The offer is the machine's, not this hub's (update-flow): every hub
//! gets the same [`bise_home::release_offer::Offer`], planned there from
//! the machine's files; this module only shows it and answers the item.
//!
//! - Every 30 s the daemon reads those files (the channel's manifest
//!   itself is fetched at most once an hour for the whole machine:
//!   `bise update --manifest`) and gives the hub the offer as
//!   `Input::Release` ([`ReleaseCheck`]); never in bise's source tree
//!   (not an install), never with `BISE_NO_UPDATE=1`.
//! - Ready, installing or updating: ONE item, `place` = `release:<id>`,
//!   its note `updating to v…` while it installs or switches. Anything
//!   else closes it, with its word: `updated` (this hub runs it),
//!   `later` (said in any project), `replaced by a newer release`,
//!   `update failed` (this hub's switch rolled back), `up to date`.
//! - `1` (`Effect::Update`): the daemon installs the release once for
//!   the machine (`bise update`), then writes `update-go`; the answer
//!   comes back as `Input::Updated`. From then on every hub still on an
//!   older version is `switch_me`: this hub asks for its switch
//!   (`Effect::ReleaseSwitch`; the daemon waits for no turn running and
//!   the machine's switch lock: one hub at a time). A failed install
//!   closes the item and says why in main's thread.
//! - `2 later`: closes it here, and in every project at their next look
//!   (`Effect::UpdateLater`: the daemon writes `update-later`); the next
//!   release asks again.
//! - `3 release notes ↗`: the TUI opens the release page (the `link` of
//!   the snapshot); the item stays.
//! - `/update` asks the channel now (and forgets `later`): the item,
//!   opened in that TUI (the user asked: the focus is fine, designer);
//!   else `you're on the latest bise, v…`.

use super::*;
use bise_home::release_offer::{Latest, Offer, State};

pub const KIND: &str = "update";

/// One look at the machine's offer, for the hub.
#[derive(Clone, Debug, Default, PartialEq)]
pub struct ReleaseCheck {
    /// None: no manifest known (never fetched, or unreadable)
    pub offer: Option<Offer>,
    /// the running version: its id, and its name when known
    pub running_id: String,
    pub running: String,
    /// `/update` from this client: it gets an answer
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

pub fn place_of(id: &str) -> String {
    format!("release:{id}")
}

/// The item's text (designer): the head, the notes, the running version
/// (the TUI shows it dim), then the options.
///
/// ```text
/// bise v2026.10.2-5 is out
/// the inbox keeps your place when a card closes
/// /update installs a new release from any thread
/// you're on v2026.10.2-4
///
/// 1. update now · your agents keep running
/// 2. later
/// 3. release notes ↗
/// ```
pub fn text(n: &Latest, running: &str) -> String {
    let mut out = format!("bise {} is out\n", shown(&n.version));
    for l in &n.notes {
        out.push_str(l);
        out.push('\n');
    }
    out.push_str(&format!("you're on {}\n", shown(running)));
    out.push_str("\n1. update now · your agents keep running\n2. later\n3. release notes ↗");
    out
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

/// What the hub does with a check: the open items (card id, place) to
/// close with their words, and whether to open one for the release.
pub fn plan(offer: &Offer, running_id: &str, open: &[(u64, String)]) -> (Vec<(u64, &'static str)>, bool) {
    let want = offer.shown().then(|| place_of(&offer.release.id));
    let mut close = Vec::new();
    let mut have = false;
    for (id, place) in open {
        if Some(place) == want.as_ref() && !have {
            have = true;
        } else if *place == place_of(running_id) {
            close.push((*id, "updated"));
        } else if want.is_some() {
            close.push((*id, "replaced by a newer release"));
        } else {
            close.push((
                *id,
                match offer.state {
                    State::Later => "later",
                    State::Failed { .. } => "update failed",
                    _ => "up to date",
                },
            ));
        }
    }
    (close, want.is_some() && !have)
}

/// The hub's side of the item (runtime).
#[derive(Debug, Default)]
pub struct Updates {
    /// The last look's offer.
    news: Option<Offer>,
    /// The running version's id and name, for the words.
    running_id: String,
    running_name: String,
    /// `1` sent, by card id: the update runs.
    running: BTreeSet<u64>,
    /// `2 later` in this run, by release id: a check that read the
    /// daemon's file before it was written does not ask again.
    later: BTreeSet<String>,
}

impl Updates {
    /// The items whose `1` runs (the update): `Hub::running_cards`.
    pub(crate) fn running(&self) -> impl Iterator<Item = u64> + '_ {
        self.running.iter().copied()
    }
}

impl Hub {
    /// A check of the release channel (the daemon's, or `/update`).
    pub(super) fn release_in(&mut self, fx: &mut Fx, env: &mut dyn Env, c: ReleaseCheck) {
        if c.offer.is_some() {
            self.updates.news = c.offer;
            self.updates.running_id = c.running_id;
            self.updates.running_name = c.running;
        }
        let Some(mut offer) = self.updates.news.clone() else {
            if let Some(client) = c.asked {
                let why = c.error.unwrap_or_else(|| "no release channel known".into());
                fx.push(notice(client, &format!("couldn't check for a new release: {}", clip(&one_line(&why), 160))));
            }
            return;
        };
        // `2 later` here, before the daemon's file was read
        if offer.state == State::Ready && self.updates.later.contains(&offer.release.id) {
            offer.state = State::Later;
        }
        let open: Vec<(u64, String)> =
            self.st.open_cards().filter(|x| x.kind == KIND).map(|x| (x.id, x.place.clone().unwrap_or_default())).collect();
        let (close, open_new) = plan(&offer, &self.updates.running_id, &open);
        for (id, res) in close {
            self.updates.running.remove(&id);
            self.close_card(fx, env, id, res);
        }
        if open_new {
            let body = text(&offer.release, &self.updates.running_name);
            let item = merge::HubItem { kind: KIND, agent: MAIN, text: &body, place: &place_of(&offer.release.id), pr: None };
            self.open_card(fx, env, item);
            self.dirty = true;
        }
        if offer.switch_me {
            fx.push(Effect::ReleaseSwitch { id: offer.release.id.clone() });
        }
        let Some(client) = c.asked else { return };
        let place = place_of(&offer.release.id);
        let card = self.st.open_cards().filter(|x| x.kind == KIND && x.place.as_deref() == Some(place.as_str())).map(|x| x.id).max();
        match card {
            // `/update` with a newer release: its item opens in that TUI
            // (the state first, so the TUI knows the item)
            Some(id) => {
                fx.push(Effect::State);
                fx.push(Effect::ToClient { client, body: json!({"ev": "open_card", "id": id}) });
            }
            None => fx.push(notice(client, &format!("you're on the latest bise, {}.", shown(&self.updates.running_name)))),
        }
    }

    /// The offer when it is still `place`'s release and shown.
    fn offer_at(&self, place: Option<&str>) -> Option<&Offer> {
        self.updates.news.as_ref().filter(|o| o.shown() && place == Some(place_of(&o.release.id).as_str()))
    }

    /// The user's digit on an update item.
    pub(super) fn update_choice(&mut self, fx: &mut Fx, env: &mut dyn Env, card: u64, place: Option<String>, choice: &str) {
        let news = self.offer_at(place.as_deref()).map(|o| o.release.clone());
        match choice {
            "1" => {
                if self.updates.running.contains(&card) {
                    return;
                }
                let Some(n) = news else {
                    return self.close_card(fx, env, card, "withdrawn: not the latest release");
                };
                self.updates.running.insert(card);
                self.dirty = true;
                fx.push(Effect::Update { card, id: n.id, version: shown(&n.version) });
            }
            "2" => {
                let id = place.as_deref().and_then(|p| p.strip_prefix("release:")).unwrap_or("").to_string();
                if !id.is_empty() {
                    self.updates.later.insert(id.clone());
                    fx.push(Effect::UpdateLater { id });
                }
                self.close_card(fx, env, card, "later");
            }
            // the TUI opened the release page: the item stays
            _ => {}
        }
    }

    /// The end of `1` (`Effect::Update`): Ok, the release is installed
    /// and every project switches to it, one at a time (the item stays,
    /// `updating…`, until this hub's new version closes it); Err, the
    /// item closes and main's thread says why.
    pub(super) fn updated(&mut self, fx: &mut Fx, env: &mut dyn Env, card: u64, version: &str, res: Result<(), String>) {
        self.dirty = true;
        match res {
            Ok(()) => fx.push(feed(
                MAIN,
                Feed::info(format!("installed {version}. every project switches to it, one at a time; your agents keep running.")),
            )),
            Err(e) => {
                self.updates.running.remove(&card);
                let on = Some(&self.updates.running_name).filter(|n| !n.is_empty()).map(|n| shown(n)).unwrap_or_else(|| "the same version".into());
                // designer: the reason last, so its cut never breaks the sentence
                fx.push(feed(MAIN, Feed::warn(format!("couldn't update to {version}, you're still on {on}: {}", reason(&e)))));
                self.close_card(fx, env, card, "update failed");
            }
        }
    }

    /// The view's note on an update item: updating now, from a `1` here
    /// or in any project (the machine installs or switches it).
    pub(super) fn update_note(&self, c: &Card) -> Option<String> {
        let offer = self.offer_at(c.place.as_deref());
        let busy = offer.is_some_and(|o| matches!(o.state, State::Installing | State::Updating));
        if !busy && !self.updates.running.contains(&c.id) {
            return None;
        }
        let v = c.place.as_deref().and_then(|p| p.strip_prefix("release:")).unwrap_or("");
        let name = offer.map(|o| shown(&o.release.version)).unwrap_or_else(|| v.to_string());
        Some(format!("updating to {name}…"))
    }

    /// The release page an update item's `3` opens.
    pub(super) fn update_link(&self, c: &Card) -> Option<String> {
        let n = &self.updates.news.as_ref()?.release;
        (c.place.as_deref() == Some(place_of(&n.id).as_str()) && !n.url.is_empty()).then(|| n.url.clone())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn latest(id: &str) -> Latest {
        Latest {
            id: id.into(),
            version: "2026.10.2-5".into(),
            notes: vec!["the inbox keeps your place".into()],
            url: "https://github.com/gvergnaud/bise/releases/tag/v2026.10.2-5".into(),
        }
    }

    fn offer(id: &str, state: State) -> Offer {
        Offer { release: latest(id), state, switch_me: false }
    }

    #[test]
    fn a_shown_offer_opens_one_item() {
        for s in [State::Ready, State::Installing, State::Updating] {
            assert_eq!(plan(&offer("bbb", s.clone()), "aaa", &[]), (vec![], true));
            // already open: not again
            assert_eq!(plan(&offer("bbb", s), "aaa", &[(4, "release:bbb".into())]), (vec![], false));
        }
        // two open (a restart's race): one goes
        let (close, open) = plan(&offer("bbb", State::Ready), "aaa", &[(4, "release:bbb".into()), (5, "release:bbb".into())]);
        assert_eq!((close.len(), open), (1, false));
    }

    #[test]
    fn the_running_release_closes_its_item_as_updated() {
        assert_eq!(plan(&offer("aaa", State::UpToDate), "aaa", &[]), (vec![], false));
        assert_eq!(plan(&offer("aaa", State::UpToDate), "aaa", &[(4, "release:aaa".into())]), (vec![(4, "updated")], false));
    }

    #[test]
    fn later_or_a_failed_switch_anywhere_closes_the_item_here() {
        // `later` said in another project: this one's item closes too
        assert_eq!(plan(&offer("bbb", State::Later), "aaa", &[(4, "release:bbb".into())]), (vec![(4, "later")], false));
        let failed = State::Failed { why: "the hub died".into() };
        assert_eq!(plan(&offer("bbb", failed), "aaa", &[(4, "release:bbb".into())]), (vec![(4, "update failed")], false));
    }

    #[test]
    fn a_newer_release_replaces_the_open_item() {
        assert_eq!(
            plan(&offer("ccc", State::Ready), "aaa", &[(4, "release:bbb".into())]),
            (vec![(4, "replaced by a newer release")], true)
        );
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

    #[test]
    fn the_text_has_the_notes_and_the_options() {
        let t = text(&latest("bbb"), "2026.10.2-4");
        assert_eq!(
            t,
            "bise v2026.10.2-5 is out\nthe inbox keeps your place\nyou're on v2026.10.2-4\n\n1. update now · your agents keep running\n2. later\n3. release notes ↗"
        );
        let mut n = latest("bbb");
        n.notes.clear();
        assert!(text(&n, "aaa").starts_with("bise v2026.10.2-5 is out\nyou're on aaa\n\n1."));
    }
}
