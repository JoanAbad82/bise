//! Agent-made pages (docs/ambient-pages.md): the store ([`store`]), the
//! kit's lint ([`lint`], amb-kit's), the page server in the hub
//! ([`server`]). [`Pages`] is what the hub and the server share: the
//! store behind one lock, the server's port and token, the SSE
//! subscribers of each page, and the way back to the hub (the notes sent
//! from a page become the agent's input there).

pub mod lint;
pub mod questions;
pub mod server;
pub mod store;

use serde_json::{json, Value};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::mpsc::Sender;
use std::sync::{Arc, Mutex};
use store::{Meta, Publish, Store};

/// What the page server tells the hub.
#[derive(Debug, PartialEq)]
pub enum PageMsg {
    /// `send` on page `id`: `text` (the notes message) goes to `agent`
    /// (the page's), as from the user; the hub picks main when it is gone
    Sent { id: String, agent: String, text: String },
    /// the drafts of page `id` changed (its open notes count)
    Notes { id: String },
    /// the user answered question `block` of page `id` on the page
    /// (§4.2): `reply` goes to its card, as from the capsule
    Answer { id: String, block: String, reply: String },
}

/// How the server reaches the hub's loop.
pub type ToHub = Box<dyn Fn(PageMsg) + Send>;

pub struct Pages {
    pub store: Store,
    lock: Mutex<()>,
    pub port: u16,
    pub token: String,
    pub kit_dir: PathBuf,
    /// SSE streams of each page id ("" = the home list)
    subs: Mutex<HashMap<String, Vec<Sender<String>>>>,
    to_hub: Mutex<Option<ToHub>>,
}

/// 32 hex characters from the system's random source.
pub fn new_token() -> String {
    let mut b = [0u8; 16];
    let ok = std::fs::File::open("/dev/urandom").and_then(|mut f| std::io::Read::read_exact(&mut f, &mut b)).is_ok();
    if !ok {
        // never a fixed token: the time and the pid at least
        let t = crate::util::now_ms() as u128 * 1_000_003 + std::process::id() as u128;
        b = (t ^ (t << 64)).to_le_bytes();
    }
    b.iter().map(|x| format!("{x:02x}")).collect()
}

impl Pages {
    /// The pages of a hub whose state folder is `state`; `port` 0: none
    /// (tests of the store alone).
    pub fn new(state: &Path, port: u16, kit_dir: PathBuf) -> Pages {
        Pages {
            store: Store::new(state),
            lock: Mutex::new(()),
            port,
            token: new_token(),
            kit_dir,
            subs: Mutex::new(HashMap::new()),
            to_hub: Mutex::new(None),
        }
    }

    /// Where the hub hears the server.
    pub fn connect_hub(&self, f: ToHub) {
        if let Ok(mut s) = self.to_hub.lock() {
            *s = Some(f);
        }
    }

    pub(crate) fn tell_hub(&self, m: PageMsg) {
        if let Ok(s) = self.to_hub.lock() {
            if let Some(f) = s.as_ref() {
                f(m);
            }
        }
    }

    /// One writer at a time on the store.
    pub fn locked<R>(&self, f: impl FnOnce(&Store) -> R) -> R {
        let _g = self.lock.lock().unwrap_or_else(|e| e.into_inner());
        f(&self.store)
    }

    pub fn base(&self) -> String {
        format!("http://127.0.0.1:{}", self.port)
    }

    pub fn url(&self, id: &str) -> String {
        format!("{}/p/{}", self.base(), id)
    }

    /// `page_publish`: the lint, then the store. Err: the lint's lines
    /// (nothing stored) or the store's one line.
    pub fn publish(&self, p: &Publish, now: u64, gone: &dyn Fn(&str) -> bool) -> Result<(Meta, Vec<String>), Vec<String>> {
        if p.html.len() > 1_000_000 {
            return Err(vec![format!("the page is too big ({} bytes, 1 MB at most): split it", p.html.len())]);
        }
        let blocks = lint::lint(&p.html)?;
        let (meta, unknown) = self.locked(|s| s.publish(p, blocks, now, gone)).map_err(|e| vec![e])?;
        self.push(&meta.id, "version", &json!({"n": meta.version()}));
        self.push(&meta.id, "state", &json!({"state": meta.state}));
        self.push(&meta.id, "notes", &json!({"notes": self.store.notes(&meta.id)}));
        self.push("", "pages", &json!({"pages": self.list_json()}));
        Ok((meta, unknown))
    }

    /// A page's state changes (`updating` at a send, `ready` after).
    pub fn set_state(&self, id: &str, state: &str) -> Option<Meta> {
        let m = self.locked(|s| s.set_state(id, state)).ok().flatten()?;
        self.push(id, "state", &json!({"state": state}));
        self.push("", "pages", &json!({"pages": self.list_json()}));
        Some(m)
    }

    /// The pages for `state` and the capsule, newest first.
    pub fn list_json(&self) -> Vec<Value> {
        self.store.list().iter().map(|m| self.page_json(m)).collect()
    }

    pub fn page_json(&self, m: &Meta) -> Value {
        let open = self.store.notes(&m.id).iter().filter(|n| n.open()).count();
        let mut v = json!({
            "id": m.id, "title": m.title, "agent": m.agent, "version": m.version(),
            "url": self.url(&m.id), "at_ms": m.at_ms(), "state": m.state, "open_notes": open,
        });
        if let Some(k) = self.kicker(m) {
            v["kicker"] = json!(k);
        }
        if self.asking(&m.id) {
            v["asking"] = json!(true);
        }
        v
    }

    /// The meta line of the latest version's first heading block.
    pub fn kicker(&self, m: &Meta) -> Option<String> {
        questions::kicker(&self.store.html(&m.id, m.version())?)
    }

    /// The page holds a question whose card is open (§4.2).
    pub fn asking(&self, id: &str) -> bool {
        self.store.questions(id).iter().any(|q| q.card != 0 && q.reply.is_none())
    }

    /// The hub's `page` event.
    pub fn page_ev(&self, m: &Meta) -> Value {
        json!({
            "ev": "page", "id": m.id, "title": m.title, "agent": m.agent, "version": m.version(),
            "url": self.url(&m.id), "at_ms": m.at_ms(), "state": m.state,
        })
    }

    /// The pages `agent` is updating (sent notes not answered by a
    /// publish yet).
    pub fn updating_of(&self, agent: &str) -> Vec<String> {
        self.store.list().into_iter().filter(|m| m.state == "updating" && m.agent == agent).map(|m| m.id).collect()
    }

    /// An SSE event to every stream of page `id` (a closed one is dropped).
    pub fn push(&self, id: &str, event: &str, data: &Value) {
        let frame = format!("event: {event}\ndata: {data}\n\n");
        if let Ok(mut subs) = self.subs.lock() {
            if let Some(list) = subs.get_mut(id) {
                list.retain(|tx| tx.send(frame.clone()).is_ok());
            }
        }
    }

    pub(crate) fn subscribe(&self, id: &str, tx: Sender<String>) {
        if let Ok(mut subs) = self.subs.lock() {
            subs.entry(id.to_string()).or_default().push(tx);
        }
    }
}

/// The page server's port of a workspace: the one kept in
/// `<state>/pages.port` when it is free, else the first free one from a
/// hash of the workspace id in 47100-47899 (ports-plan.md), kept.
pub fn pick_port(state: &Path, workspace_id: &str, free: &dyn Fn(u16) -> bool) -> Option<u16> {
    let file = state.join("pages.port");
    if let Some(p) = std::fs::read_to_string(&file).ok().and_then(|t| t.trim().parse::<u16>().ok()) {
        if (47100..47900).contains(&p) && free(p) {
            return Some(p);
        }
    }
    let mut h: u32 = 0x811c_9dc5;
    for b in workspace_id.bytes() {
        h = (h ^ b as u32).wrapping_mul(0x0100_0193);
    }
    let start = (h % 800) as u16;
    let p = (0..800u16).map(|k| 47100 + (start + k) % 800).find(|p| free(*p))?;
    let _ = std::fs::write(&file, p.to_string());
    Some(p)
}

/// Start the page server of a hub: the port, the listener, its thread.
pub fn start(state: &Path, workspace_id: &str, kit_dir: PathBuf) -> std::io::Result<Arc<Pages>> {
    let free = |p: u16| std::net::TcpListener::bind(("127.0.0.1", p)).is_ok();
    let port = pick_port(state, workspace_id, &free).ok_or_else(|| std::io::Error::other("no free port in 47100-47899"))?;
    let listener = std::net::TcpListener::bind(("127.0.0.1", port))?;
    let pages = Arc::new(Pages::new(state, port, kit_dir));
    server::serve(listener, pages.clone());
    Ok(pages)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_port_is_stable_and_kept() {
        let d = std::env::temp_dir().join(format!("sb-port-{}", std::process::id()));
        std::fs::create_dir_all(&d).unwrap();
        let p = pick_port(&d, "harness-1234abcd", &|_| true).unwrap();
        assert!((47100..47900).contains(&p));
        assert_eq!(std::fs::read_to_string(d.join("pages.port")).unwrap(), p.to_string());
        // kept, even when the hash would give another
        assert_eq!(pick_port(&d, "other-ws", &|_| true), Some(p));
        // taken: the next free one from the hash
        let q = pick_port(&d, "harness-1234abcd", &|x| x != p).unwrap();
        assert_ne!(q, p);
        let _ = std::fs::remove_dir_all(d);
    }

    #[test]
    fn tokens_are_random_hex() {
        let (a, b) = (new_token(), new_token());
        assert_eq!(a.len(), 32);
        assert!(a.bytes().all(|c| c.is_ascii_hexdigit()));
        assert_ne!(a, b);
    }
}
