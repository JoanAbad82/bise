//! The hub connection of the ambient core: one reader thread that
//! connects (`hello` sent by the connector), forwards the hub's lines,
//! says when the hub went away, and reconnects (the socket path stays the
//! same across hub restarts and version switches, like the TUI's
//! `sb/client.rs hub_reader`). The writer half is shared with the core.

use std::io::{self, BufRead, Write};
use std::os::unix::net::UnixStream;
use std::sync::mpsc::Sender;
use std::sync::{Arc, Mutex};
use std::time::Duration;

/// Opens a connection to the hub, `{"op":"hello"}` already sent. Called
/// again after each loss (the first call may start the hub).
pub type Connect = Box<dyn FnMut() -> io::Result<UnixStream> + Send>;

/// What the reader thread tells the core.
#[derive(Debug, PartialEq)]
pub enum HubIn {
    /// one JSON line of the hub
    Line(String),
    /// connected (the hello replay follows, then `ready`)
    Up,
    /// lost, or not reachable yet: the thread keeps trying
    Down,
}

/// The writer half: None while the hub is away.
#[derive(Clone, Default)]
pub struct Hub {
    writer: Arc<Mutex<Option<UnixStream>>>,
}

impl Hub {
    /// Start the reader thread; every [`HubIn`] goes through `wrap` into
    /// `tx`. `retry`: the pause between two connection attempts.
    pub fn start<T: Send + 'static>(
        mut connect: Connect,
        tx: Sender<T>,
        wrap: fn(HubIn) -> T,
        retry: Duration,
    ) -> Hub {
        let hub = Hub::default();
        let writer = hub.writer.clone();
        std::thread::spawn(move || {
            // Down is said once per loss, not at each failed attempt
            let mut down_said = false;
            loop {
                let stream = match connect() {
                    Ok(s) => s,
                    Err(_) => {
                        if !down_said {
                            down_said = true;
                            if tx.send(wrap(HubIn::Down)).is_err() {
                                return;
                            }
                        }
                        std::thread::sleep(retry);
                        continue;
                    }
                };
                let Ok(w) = stream.try_clone() else {
                    std::thread::sleep(retry);
                    continue;
                };
                if let Ok(mut slot) = writer.lock() {
                    *slot = Some(w);
                }
                if tx.send(wrap(HubIn::Up)).is_err() {
                    return;
                }
                let mut r = io::BufReader::new(stream);
                let mut line = String::new();
                loop {
                    line.clear();
                    match r.read_line(&mut line) {
                        Ok(0) | Err(_) => break,
                        Ok(_) => {
                            if tx.send(wrap(HubIn::Line(line.trim_end().to_string()))).is_err() {
                                return;
                            }
                        }
                    }
                }
                if let Ok(mut slot) = writer.lock() {
                    *slot = None;
                }
                down_said = true;
                if tx.send(wrap(HubIn::Down)).is_err() {
                    return;
                }
                std::thread::sleep(retry);
            }
        });
        hub
    }

    /// One request line to the hub; false when it is away or the write
    /// failed (nothing was sent).
    pub fn send(&self, v: &serde_json::Value) -> bool {
        let Ok(mut slot) = self.writer.lock() else { return false };
        let Some(s) = slot.as_mut() else { return false };
        let mut line = v.to_string();
        line.push('\n');
        s.write_all(line.as_bytes()).is_ok()
    }
}
