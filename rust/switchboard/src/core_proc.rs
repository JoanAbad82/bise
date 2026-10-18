//! One sb-core process and its line (moved out of core.rs, hub-loop):
//! started on a free port, one JSON line in, one out; killed with it.
//! `Hub::call` (core_link.rs) restarts it when it dies.

use crate::util::clip;
use serde_json::Value;
use std::io::{BufRead, BufReader, Write};
use std::net::TcpStream;
use std::path::Path;
use std::process::{Child, ChildStdout, Command, Stdio};

/// One sb-core process and its connection.
pub struct CoreLink {
    pub(crate) child: Child,
    _out: BufReader<ChildStdout>,
    w: TcpStream,
    r: BufReader<TcpStream>,
}

impl CoreLink {
    /// Start sb-core on a free port. A port taken meanwhile (parallel
    /// hubs) is retried on another one.
    pub fn start(bin: &Path) -> std::io::Result<CoreLink> {
        let mut last = None;
        for _ in 0..5 {
            match CoreLink::try_start(bin) {
                Ok(l) => return Ok(l),
                Err(e) => last = Some(e),
            }
        }
        Err(last.unwrap())
    }

    fn try_start(bin: &Path) -> std::io::Result<CoreLink> {
        let port = std::net::TcpListener::bind("127.0.0.1:0")?
            .local_addr()?
            .port();
        let mut cmd = Command::new(bin);
        bise_home::env::for_child(bise_home::env::Child::Core, [("SB_CORE_PORT", port.to_string())]).apply(&mut cmd);
        cmd.stdin(Stdio::null())
            .stdout(Stdio::piped())
            .stderr(Stdio::null());
        // it lives as long as the hub: a pipe of a concurrent spawn must
        // not stay open in it (BISE-291)
        crate::procs::no_leaked_fds(&mut cmd);
        let mut child = cmd.spawn()?;
        let mut out = BufReader::new(child.stdout.take().expect("stdout"));
        let mut banner = String::new();
        out.read_line(&mut banner)?;
        let conn = if banner.starts_with("sb-core on") {
            TcpStream::connect(("127.0.0.1", port))
        } else {
            Err(std::io::Error::other(format!("sb-core did not start: {:?}", banner)))
        };
        let w = match conn {
            Ok(w) => w,
            Err(e) => {
                let _ = child.kill();
                let _ = child.wait();
                return Err(e);
            }
        };
        w.set_nodelay(true)?;
        let r = BufReader::new(w.try_clone()?);
        Ok(CoreLink {
            child,
            _out: out,
            w,
            r,
        })
    }

    /// One input line, one answer line; an error when sb-core is gone
    /// (or answers something that is not JSON).
    pub fn call(&mut self, v: &Value) -> std::io::Result<Value> {
        let mut line = v.to_string();
        line.push('\n');
        self.w.write_all(line.as_bytes())?;
        let mut back = String::new();
        if self.r.read_line(&mut back)? == 0 {
            return Err(std::io::Error::new(std::io::ErrorKind::UnexpectedEof, "its connection closed"));
        }
        serde_json::from_str(&back)
            .map_err(|e| std::io::Error::other(format!("a bad answer {:?}: {}", clip(&back, 200), e)))
    }

    /// Tests only: kill sb-core under the hub.
    #[cfg(test)]
    pub fn kill(&mut self) {
        let _ = self.child.kill();
        let _ = self.child.wait();
    }
}

impl Drop for CoreLink {
    fn drop(&mut self) {
        let _ = self.child.kill();
        let _ = self.child.wait();
    }
}
