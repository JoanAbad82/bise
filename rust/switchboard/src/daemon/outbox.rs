//! A peer's writer (hub-stall): the loop never writes to a socket itself.
//! On 2026-10-14 his hub's loop sat 27 min (20:09:45 → 20:36:58) in one
//! blocking `write_all` to a peer that read nothing (a macOS unix socket
//! holds ~8 KB): no sb answer, no REPL line, until that peer went.
//! Reproduced on his build: a hub.sock client that reads nothing froze
//! the loop at its second event, and it ran again 0.13 s after the client
//! closed.
//!
//! - [`Outbox`]: a long-lived peer (a client, a REPL): its own writer
//!   thread and a queue bounded in bytes. The loop only queues. A full
//!   queue is a peer that reads nothing: [`Sent::Full`], and the caller
//!   decides (a client is closed, a REPL's line not sent).
//! - [`reply`]: one reply to a one-request peer (an `sb` CLI, another
//!   hub, an older terminal), written on a thread with a write timeout,
//!   then the connection closes.
//!
//! The queue's rule is pure ([`Queue`], unit tests below); the threads
//! only run it.

use std::collections::VecDeque;
use std::io::Write;
use std::sync::{Arc, Condvar, Mutex};
use std::time::Duration;

/// What a client may have waiting before it counts as reading nothing: a
/// few full states (view.json is ~1 MB on his hub).
pub(super) const CLIENT_MAX: usize = 32 << 20;
/// A REPL reads its `say`s at a turn's end; this is far past any turn's.
pub(super) const REPL_MAX: usize = 8 << 20;
/// A one-request peer that reads nothing loses its reply after this.
const REPLY_TIMEOUT: Duration = Duration::from_secs(30);
/// The end of a line on every hub connection.
const EOL: u8 = 10;

/// What [`Outbox::send`] did.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(super) enum Sent {
    Queued,
    /// The peer reads nothing: `max` bytes wait already. Not queued.
    Full,
    /// The peer is gone (a write failed, or closed). Not queued.
    Closed,
}

/// The bytes waiting for one peer (pure).
#[derive(Debug, Default)]
pub(super) struct Queue {
    lines: VecDeque<Vec<u8>>,
    bytes: usize,
    closed: bool,
}

impl Queue {
    /// Queue `line` unless the peer is gone or `max` bytes would wait.
    /// One line alone always fits (a state bigger than `max` still goes
    /// to a peer that keeps up).
    pub(super) fn push(&mut self, line: Vec<u8>, max: usize) -> Sent {
        if self.closed {
            return Sent::Closed;
        }
        if !self.lines.is_empty() && self.bytes + line.len() > max {
            return Sent::Full;
        }
        self.bytes += line.len();
        self.lines.push_back(line);
        Sent::Queued
    }

    pub(super) fn pop(&mut self) -> Option<Vec<u8>> {
        let l = self.lines.pop_front()?;
        self.bytes -= l.len();
        Some(l)
    }

    pub(super) fn close(&mut self) {
        self.closed = true;
        self.lines.clear();
        self.bytes = 0;
    }

    pub(super) fn waiting(&self) -> usize {
        self.bytes
    }
}

fn line_bytes(line: &str) -> Vec<u8> {
    let mut b = Vec::with_capacity(line.len() + 1);
    b.extend_from_slice(line.as_bytes());
    b.push(EOL);
    b
}

struct Shared {
    q: Mutex<Queue>,
    cv: Condvar,
}

/// One peer's writer thread and its queue. Dropped: closed (its socket
/// shut, so a write blocked in the thread fails at once).
pub(super) struct Outbox {
    sh: Arc<Shared>,
    max: usize,
    shut: Box<dyn Fn() + Send>,
}

impl Outbox {
    /// Start the writer of `w`; `shut` ends the connection (it makes a
    /// blocked write fail).
    pub(super) fn start<W: Write + Send + 'static>(mut w: W, max: usize, shut: impl Fn() + Send + 'static) -> Outbox {
        let sh = Arc::new(Shared { q: Mutex::new(Queue::default()), cv: Condvar::new() });
        let t = sh.clone();
        std::thread::spawn(move || loop {
            let line = {
                let mut q = t.q.lock().unwrap_or_else(|e| e.into_inner());
                loop {
                    if q.closed {
                        return;
                    }
                    if let Some(l) = q.pop() {
                        break l;
                    }
                    q = t.cv.wait(q).unwrap_or_else(|e| e.into_inner());
                }
            };
            if w.write_all(&line).and_then(|()| w.flush()).is_err() {
                t.q.lock().unwrap_or_else(|e| e.into_inner()).close();
                return;
            }
        });
        Outbox { sh, max, shut: Box::new(shut) }
    }

    /// Queue one line (its end of line added); never blocks on the peer.
    pub(super) fn send(&self, line: &str) -> Sent {
        let got = self.sh.q.lock().unwrap_or_else(|e| e.into_inner()).push(line_bytes(line), self.max);
        if got == Sent::Queued {
            self.sh.cv.notify_one();
        }
        got
    }

    /// Queue bytes as they are (a REPL's lines carry their own end of
    /// line): the `TcpStream` calls the REPL code made, never blocking.
    /// An error when the peer reads nothing (`WouldBlock`) or is gone.
    pub(super) fn write_all(&self, b: &[u8]) -> std::io::Result<()> {
        let got = self.sh.q.lock().unwrap_or_else(|e| e.into_inner()).push(b.to_vec(), self.max);
        match got {
            Sent::Queued => {
                self.sh.cv.notify_one();
                Ok(())
            }
            Sent::Full => Err(std::io::Error::new(std::io::ErrorKind::WouldBlock, format!("it reads nothing: {} bytes wait", self.waiting()))),
            Sent::Closed => Err(std::io::ErrorKind::BrokenPipe.into()),
        }
    }

    /// The connection ends (as `TcpStream::shutdown`).
    pub(super) fn shutdown(&self, _how: std::net::Shutdown) -> std::io::Result<()> {
        self.close();
        Ok(())
    }

    /// Bytes waiting for the peer (hub.log's words when it is closed).
    pub(super) fn waiting(&self) -> usize {
        self.sh.q.lock().unwrap_or_else(|e| e.into_inner()).waiting()
    }

    /// No more writes: the queue dropped, the connection shut.
    pub(super) fn close(&self) {
        self.sh.q.lock().unwrap_or_else(|e| e.into_inner()).close();
        self.sh.cv.notify_one();
        (self.shut)();
    }
}

impl Drop for Outbox {
    fn drop(&mut self) {
        self.close();
    }
}

/// An outbox on a unix socket (a client).
pub(super) fn of_unix(s: &std::os::unix::net::UnixStream, max: usize) -> std::io::Result<Outbox> {
    let (w, shut) = (s.try_clone()?, s.try_clone()?);
    Ok(Outbox::start(w, max, move || {
        let _ = shut.shutdown(std::net::Shutdown::Both);
    }))
}

/// An outbox on a TCP socket (a REPL).
pub(super) fn of_tcp(s: &std::net::TcpStream, max: usize) -> std::io::Result<Outbox> {
    let (w, shut) = (s.try_clone()?, s.try_clone()?);
    Ok(Outbox::start(w, max, move || {
        let _ = shut.shutdown(std::net::Shutdown::Both);
    }))
}

/// One reply line to a one-request peer, off the loop: written on its own
/// thread (at most [`REPLY_TIMEOUT`] on a peer that reads nothing), then
/// the connection closes. False: the stream could not be handed over.
pub(super) fn reply(stream: &std::os::unix::net::UnixStream, line: &str) -> bool {
    let Ok(mut s) = stream.try_clone() else { return false };
    let b = line_bytes(line);
    std::thread::spawn(move || {
        let _ = s.set_write_timeout(Some(REPLY_TIMEOUT));
        let _ = s.write_all(&b);
    });
    true
}

/// The peer of a one-request connection closed its end: an `sb` that
/// gave up waiting (its timeout) before the loop took its request. Its
/// request is then not run late (hub-stall: two sends that waited 27 min
/// were both delivered). A peer that only waits for its reply: false.
pub(super) fn peer_gone(stream: &std::os::unix::net::UnixStream) -> bool {
    use std::os::fd::AsRawFd;
    let mut b = [0u8; 1];
    // SAFETY: recv on a descriptor we own, into a 1-byte buffer, peeking
    // without waiting: nothing is consumed
    let n = unsafe { libc::recv(stream.as_raw_fd(), b.as_mut_ptr().cast(), 1, libc::MSG_PEEK | libc::MSG_DONTWAIT) };
    n == 0
}

#[cfg(test)]
mod tests {
    #[test]
    fn a_peer_that_closed_is_gone_and_one_that_waits_is_not() {
        let (ours, theirs) = UnixStream::pair().unwrap();
        assert!(!peer_gone(&ours));
        drop(theirs);
        assert!(peer_gone(&ours));
    }

    use super::*;
    use std::os::unix::net::UnixStream;
    use std::time::Instant;

    #[test]
    fn a_full_queue_says_so_and_queues_nothing_more() {
        let mut q = Queue::default();
        assert_eq!(q.push(vec![0; 6], 10), Sent::Queued);
        assert_eq!(q.push(vec![0; 4], 10), Sent::Queued);
        assert_eq!(q.push(vec![0; 1], 10), Sent::Full);
        assert_eq!(q.waiting(), 10);
        assert_eq!(q.pop().map(|l| l.len()), Some(6));
        assert_eq!(q.push(vec![0; 5], 10), Sent::Queued);
        q.close();
        assert_eq!((q.push(vec![0; 1], 10), q.waiting()), (Sent::Closed, 0));
    }

    #[test]
    fn one_line_bigger_than_the_bound_still_goes_to_a_peer_that_keeps_up() {
        let mut q = Queue::default();
        assert_eq!(q.push(vec![0; 50], 10), Sent::Queued);
        assert_eq!(q.push(vec![0; 1], 10), Sent::Full);
    }

    /// The day's stall: a peer that reads nothing. The sends return at
    /// once, the queue fills to Full, and closing ends the writer thread
    /// blocked in its write.
    #[test]
    fn a_peer_that_reads_nothing_never_blocks_the_sender() {
        let (ours, theirs) = UnixStream::pair().unwrap();
        let o = of_unix(&ours, 1 << 20).unwrap();
        let t0 = Instant::now();
        let line = "x".repeat(64 << 10);
        let full = (0..64).any(|_| o.send(&line) == Sent::Full);
        assert!(full, "1 MB queued for a peer that reads nothing is Full");
        assert!(t0.elapsed() < Duration::from_secs(1), "sends took {:?}", t0.elapsed());
        o.close();
        assert_eq!(o.send("after"), Sent::Closed);
        drop(theirs);
    }

    #[test]
    fn a_peer_that_reads_gets_every_line_in_order() {
        use std::io::BufRead;
        let (ours, theirs) = UnixStream::pair().unwrap();
        let o = of_unix(&ours, 1 << 20).unwrap();
        for i in 0..200 {
            assert_eq!(o.send(&format!("line {i} {}", "y".repeat(500))), Sent::Queued);
        }
        let r = std::io::BufReader::new(theirs);
        let got: Vec<String> = r.lines().take(200).map(|l| l.unwrap()).collect();
        assert!(got.iter().enumerate().all(|(i, l)| l.starts_with(&format!("line {i} "))));
    }

    #[test]
    fn a_reply_to_a_peer_that_reads_nothing_returns_at_once() {
        let (ours, _theirs) = UnixStream::pair().unwrap();
        let t0 = Instant::now();
        let big = "z".repeat(256 << 10);
        for _ in 0..4 {
            assert!(reply(&ours, &big));
        }
        assert!(t0.elapsed() < Duration::from_millis(500));
    }
}
