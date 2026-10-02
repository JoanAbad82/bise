//! The page server (docs/ambient-pages.md §2.4), inside the hub: HTTP/1.1
//! on 127.0.0.1 only, one thread per connection, a small hand parser
//! (no crate). Every response carries the CSP (no inline, no outside);
//! a Host other than the server's own is refused (DNS rebinding), and
//! `/api/*` needs the session token (`X-Bise-Token`, in the shell's
//! `<meta name="bise-token">`) and the server's own `Origin`.

use super::store::valid_id;
use super::{PageMsg, Pages};
use serde_json::{json, Value};
use std::io::{BufRead, BufReader, Write};
use std::net::{TcpListener, TcpStream};
use std::sync::mpsc;
use std::sync::Arc;
use std::time::Duration;

pub const CSP: &str = "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'";
const MAX_HEAD: usize = 64 * 1024;
const MAX_BODY: usize = 2 * 1024 * 1024;
/// An SSE stream's keep-alive comment.
const PING: Duration = Duration::from_secs(15);

/// Accept connections on their own thread.
pub fn serve(listener: TcpListener, pages: Arc<Pages>) {
    std::thread::spawn(move || {
        for conn in listener.incoming() {
            let Ok(stream) = conn else { continue };
            let pages = pages.clone();
            std::thread::spawn(move || handle(stream, &pages));
        }
    });
}

#[derive(Debug, Default, PartialEq)]
pub struct Request {
    pub method: String,
    pub path: String,
    pub headers: Vec<(String, String)>,
    pub body: Vec<u8>,
}

impl Request {
    pub fn header(&self, name: &str) -> Option<&str> {
        self.headers.iter().find(|(k, _)| k.eq_ignore_ascii_case(name)).map(|(_, v)| v.as_str())
    }
}

/// One request off the stream; None: closed, malformed or too big.
pub fn read_request(r: &mut impl BufRead) -> Option<Request> {
    let mut line = String::new();
    r.read_line(&mut line).ok()?;
    let mut parts = line.split_whitespace();
    let method = parts.next()?.to_string();
    let target = parts.next()?;
    let path = target.split(['?', '#']).next().unwrap_or("/").to_string();
    let mut headers = Vec::new();
    let mut size = line.len();
    loop {
        let mut h = String::new();
        let n = r.read_line(&mut h).ok()?;
        size += n;
        if n == 0 || size > MAX_HEAD {
            return None;
        }
        let h = h.trim_end();
        if h.is_empty() {
            break;
        }
        let (k, v) = h.split_once(':')?;
        headers.push((k.trim().to_string(), v.trim().to_string()));
    }
    let mut req = Request { method, path, headers, body: Vec::new() };
    let len: usize = req.header("content-length").and_then(|v| v.parse().ok()).unwrap_or(0);
    if len > MAX_BODY {
        return None;
    }
    let mut body = vec![0u8; len];
    r.read_exact(&mut body).ok()?;
    req.body = body;
    Some(req)
}

pub struct Response {
    pub status: u16,
    pub ctype: &'static str,
    pub body: Vec<u8>,
}

fn reason(status: u16) -> &'static str {
    match status {
        200 => "OK",
        400 => "Bad Request",
        403 => "Forbidden",
        404 => "Not Found",
        405 => "Method Not Allowed",
        409 => "Conflict",
        _ => "Error",
    }
}

impl Response {
    fn json(status: u16, v: &Value) -> Response {
        Response { status, ctype: "application/json", body: v.to_string().into_bytes() }
    }
    fn html(body: String) -> Response {
        Response { status: 200, ctype: "text/html; charset=utf-8", body: body.into_bytes() }
    }
    fn err(status: u16, why: &str) -> Response {
        Response::json(status, &json!({"error": why}))
    }

    pub fn bytes(&self) -> Vec<u8> {
        let mut out = format!(
            "HTTP/1.1 {} {}\r\nContent-Type: {}\r\nContent-Length: {}\r\nContent-Security-Policy: {CSP}\r\nX-Content-Type-Options: nosniff\r\nReferrer-Policy: no-referrer\r\nCache-Control: no-store\r\nConnection: close\r\n\r\n",
            self.status,
            reason(self.status),
            self.ctype,
            self.body.len()
        )
        .into_bytes();
        out.extend_from_slice(&self.body);
        out
    }
}

fn handle(stream: TcpStream, pages: &Pages) {
    let _ = stream.set_read_timeout(Some(Duration::from_secs(10)));
    let Ok(read) = stream.try_clone() else { return };
    let mut r = BufReader::new(read);
    let Some(req) = read_request(&mut r) else { return };
    let mut w = stream;
    if let Some(id) = events_route(&req) {
        if host_ok(pages, &req) {
            return events(&mut w, pages, &id);
        }
    }
    let resp = route(pages, &req);
    let _ = w.write_all(&resp.bytes());
}

/// `GET /p/<id>/events` (or `/events` for the home list): the page id.
fn events_route(req: &Request) -> Option<String> {
    if req.method != "GET" {
        return None;
    }
    if req.path == "/events" {
        return Some(String::new());
    }
    let id = req.path.strip_prefix("/p/")?.strip_suffix("/events")?;
    valid_id(id).then(|| id.to_string())
}

/// The Host is the server's own (127.0.0.1 or localhost, its port).
fn host_ok(pages: &Pages, req: &Request) -> bool {
    let p = pages.port;
    matches!(req.header("host"), Some(h) if h == format!("127.0.0.1:{p}") || h == format!("localhost:{p}"))
}

fn origin_ok(pages: &Pages, req: &Request) -> bool {
    let p = pages.port;
    matches!(req.header("origin"), Some(o) if o == format!("http://127.0.0.1:{p}") || o == format!("http://localhost:{p}"))
}

/// Compare without stopping at the first difference.
fn same(a: &str, b: &str) -> bool {
    a.len() == b.len() && a.bytes().zip(b.bytes()).fold(0u8, |acc, (x, y)| acc | (x ^ y)) == 0
}

/// Everything but the SSE streams.
pub fn route(pages: &Pages, req: &Request) -> Response {
    if !host_ok(pages, req) {
        return Response::err(403, "not this server");
    }
    let segs: Vec<&str> = req.path.trim_start_matches('/').split('/').collect();
    if segs.first() == Some(&"api") {
        if req.method != "POST" {
            return Response::err(405, "POST only");
        }
        let token_ok = req.header("x-bise-token").is_some_and(|t| same(t, &pages.token));
        if !token_ok || !origin_ok(pages, req) {
            return Response::err(403, "no token or another origin");
        }
        return match segs.as_slice() {
            ["api", "p", id, "notes"] if valid_id(id) => post_notes(pages, id, &req.body),
            ["api", "p", id, "send"] if valid_id(id) => post_send(pages, id),
            ["api", "p", id, "answer"] if valid_id(id) => post_answer(pages, id, &req.body),
            _ => Response::err(404, "no such route"),
        };
    }
    if req.method != "GET" {
        return Response::err(405, "GET only");
    }
    match segs.as_slice() {
        [""] => Response::html(home(pages)),
        ["kit", rest @ ..] if !rest.is_empty() => kit_file(pages, &rest.join("/")),
        ["p", id] if valid_id(id) => page(pages, id, None, false),
        ["p", id, "meta"] if valid_id(id) => meta(pages, id),
        ["p", id, "versions"] if valid_id(id) => versions(pages, id),
        ["p", id, "v", n] if valid_id(id) => n.parse().map_or_else(|_| Response::err(404, "no such version"), |n| page(pages, id, Some(n), false)),
        ["p", id, "v", n, "body"] if valid_id(id) => n.parse().map_or_else(|_| Response::err(404, "no such version"), |n| page(pages, id, Some(n), true)),
        _ => Response::err(404, "no such page"),
    }
}

pub fn esc(s: &str) -> String {
    s.replace('&', "&amp;").replace('<', "&lt;").replace('>', "&gt;").replace('"', "&quot;").replace('\'', "&#39;")
}

/// The shell around a fragment (§2.5): the kit, the token, the page's ids.
fn shell(pages: &Pages, title: &str, main_attrs: &str, inner: &str) -> String {
    format!(
        "<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<meta name=\"bise-token\" content=\"{}\">\n<title>{}</title>\n<link rel=\"stylesheet\" href=\"/kit/tokens.css\">\n<link rel=\"stylesheet\" href=\"/kit/kit.css\">\n<link rel=\"stylesheet\" href=\"/kit/notes.css\">\n<script src=\"/kit/kit.js\" defer></script>\n<script src=\"/kit/pearl.js\" defer></script>\n<script src=\"/kit/notes.js\" defer></script>\n</head>\n<body>\n<main {main_attrs}>\n{inner}\n</main>\n</body>\n</html>\n",
        pages.token,
        esc(title)
    )
}

fn page(pages: &Pages, id: &str, n: Option<u64>, body_only: bool) -> Response {
    let Some(m) = pages.store.meta(id) else { return Response::err(404, "no such page") };
    let n = n.unwrap_or(m.version());
    // `sb page start`'s placeholder: no version yet, an empty body (the
    // kit shows the agent writing, with its progress lines)
    let html = match pages.store.html(id, n) {
        Some(h) => h,
        None if n == 0 && m.version() == 0 => String::new(),
        None => return Response::err(404, "no such version"),
    };
    if body_only {
        return Response::html(html);
    }
    // the user opened it in a browser (ambient-lead m_5129): the
    // capsule's unopened count follows, wherever he opened it from
    if n > 0 && pages.locked(|s| s.opened(id, n)).ok().flatten().is_some() {
        pages.push("", "pages", &json!({"pages": pages.list_json()}));
        pages.tell_hub(PageMsg::Opened { id: id.to_string() });
    }
    // amb-kit's writing view (m_5105): when it started, what the user asked
    let ask = m.ask.as_deref().map(|a| format!(" data-ask=\"{}\"", esc(a))).unwrap_or_default();
    let attrs = format!(
        "id=\"bise-page\" data-page=\"{}\" data-version=\"{n}\" data-latest=\"{}\" data-agent=\"{}\" data-title=\"{}\" data-state=\"{}\" data-started=\"{}\"{ask}",
        esc(&m.id),
        m.version(),
        esc(&m.agent),
        esc(&m.title),
        esc(&m.state),
        m.created_ms
    );
    Response::html(shell(pages, &m.title, &attrs, &html))
}

/// "for you": the list of pages, newest first.
fn home(pages: &Pages) -> String {
    let items: Vec<String> = pages
        .store
        .list()
        .iter()
        .map(|m| {
            let open = pages.store.notes(&m.id).iter().filter(|n| n.open()).count();
            // amb-kit's home list (m_4884): the meta line, an open question
            let kicker = pages.kicker(m).map(|k| format!(" data-kicker=\"{}\"", esc(&k))).unwrap_or_default();
            let asking = if pages.asking(&m.id) { " data-asking" } else { "" };
            format!(
                "<li data-page=\"{}\" data-agent=\"{}\" data-version=\"{}\" data-state=\"{}\" data-at=\"{}\" data-open-notes=\"{open}\"{kicker}{asking}><a href=\"/p/{}\">{}</a></li>",
                esc(&m.id),
                esc(&m.agent),
                m.version(),
                esc(&m.state),
                m.at_ms(),
                esc(&m.id),
                esc(&m.title)
            )
        })
        .collect();
    let inner = format!("<section data-kit=\"pages\" data-id=\"pages\">\n<ul>\n{}\n</ul>\n</section>", items.join("\n"));
    shell(pages, "for you", "id=\"bise-home\" data-home", &inner)
}

fn meta(pages: &Pages, id: &str) -> Response {
    let Some(m) = pages.store.meta(id) else { return Response::err(404, "no such page") };
    // flat (docs/ambient-pages.md §2.4): meta.json's fields, the url, the notes
    let mut v = serde_json::to_value(&m).unwrap_or_default();
    v["url"] = json!(pages.url(id));
    v["notes"] = json!(pages.store.notes(id));
    Response::json(200, &v)
}

/// The frame's version list (§4.4), newest first: each version, when,
/// its read-only URL and the blocks it changed (their hash differs from
/// the version before, or they are new; the first changes them all).
fn versions(pages: &Pages, id: &str) -> Response {
    let Some(m) = pages.store.meta(id) else { return Response::err(404, "no such page") };
    let mut list: Vec<Value> = Vec::new();
    for (i, v) in m.versions.iter().enumerate() {
        let before = i.checked_sub(1).map(|j| &m.versions[j].blocks);
        let changed: Vec<&str> = v
            .blocks
            .iter()
            .filter(|b| before.is_none_or(|bs| !bs.iter().any(|o| o.id == b.id && o.hash == b.hash)))
            .map(|b| b.id.as_str())
            .collect();
        list.push(json!({"n": v.n, "at_ms": v.at_ms, "url": format!("/p/{}/v/{}", m.id, v.n), "changed": changed, "latest": v.n == m.version()}));
    }
    list.reverse();
    Response::json(200, &json!({"id": m.id, "versions": list}))
}

/// A pick or words on a question block (§4.2): `{block, option}` (the
/// 1-based option) or `{block, text}`; the hub answers its card.
fn post_answer(pages: &Pages, id: &str, body: &[u8]) -> Response {
    if pages.store.meta(id).is_none() {
        return Response::err(404, "no such page");
    }
    let Ok(v) = serde_json::from_slice::<Value>(body) else { return Response::err(400, "not JSON") };
    let block = v.get("block").and_then(Value::as_str).unwrap_or("");
    let qs = pages.store.questions(id);
    let Some(q) = qs.iter().find(|q| q.block == block) else { return Response::err(404, "no such question on this page") };
    if q.reply.is_some() {
        return Response::err(409, "answered already");
    }
    let reply = match (v.get("option").and_then(Value::as_u64), v.get("text").and_then(Value::as_str)) {
        (Some(n), _) => match q.option(n as usize) {
            Some(o) => o.to_string(),
            None => return Response::err(400, "no such option"),
        },
        (None, Some(t)) if !t.trim().is_empty() => t.trim().to_string(),
        _ => return Response::err(400, "an option or words"),
    };
    pages.tell_hub(PageMsg::Answer { id: id.to_string(), block: block.to_string(), reply: reply.clone() });
    Response::json(200, &json!({"ok": true, "reply": reply}))
}

fn kit_file(pages: &Pages, rel: &str) -> Response {
    let ok = !rel.split('/').any(|s| s.is_empty() || s.starts_with('.'))
        && rel.bytes().all(|b| b.is_ascii_alphanumeric() || matches!(b, b'.' | b'-' | b'_' | b'/'));
    if !ok {
        return Response::err(404, "no such file");
    }
    let ctype = match rel.rsplit('.').next() {
        Some("css") => "text/css; charset=utf-8",
        Some("js") => "text/javascript; charset=utf-8",
        Some("svg") => "image/svg+xml",
        Some("png") => "image/png",
        Some("woff2") => "font/woff2",
        Some("json") => "application/json",
        Some("html") => "text/html; charset=utf-8",
        _ => return Response::err(404, "no such file"),
    };
    match std::fs::read(pages.kit_dir.join(rel)) {
        Ok(body) => Response { status: 200, ctype, body },
        Err(_) => Response::err(404, "no such file"),
    }
}

fn post_notes(pages: &Pages, id: &str, body: &[u8]) -> Response {
    let Some(m) = pages.store.meta(id) else { return Response::err(404, "no such page") };
    let Ok(v) = serde_json::from_slice::<Value>(body) else { return Response::err(400, "not JSON") };
    let Some(list) = v.get("notes").and_then(Value::as_array) else { return Response::err(400, "no notes") };
    let now = crate::util::now_ms();
    match pages.locked(|s| s.set_drafts(id, list, m.version(), now)) {
        Ok(notes) => {
            pages.push(id, "notes", &json!({"notes": notes}));
            pages.tell_hub(PageMsg::Notes { id: id.to_string() });
            Response::json(200, &json!({"notes": notes}))
        }
        Err(e) => Response::err(409, &e),
    }
}

fn post_send(pages: &Pages, id: &str) -> Response {
    let Some(m) = pages.store.meta(id) else { return Response::err(404, "no such page") };
    let now = crate::util::now_ms();
    let sent = match pages.locked(|s| s.send(id, now)) {
        Ok(s) => s,
        Err(e) => return Response::err(409, &e),
    };
    if sent.is_empty() {
        return Response::json(200, &json!({"sent": 0}));
    }
    let text = super::store::notes_message(&m, &pages.url(id), &sent);
    pages.push(id, "notes", &json!({"notes": pages.store.notes(id)}));
    pages.tell_hub(PageMsg::Sent { id: id.to_string(), agent: m.agent.clone(), text });
    Response::json(200, &json!({"sent": sent.len(), "agent": m.agent}))
}

/// What a new stream of page `id` gets at once besides its version and
/// state: its items' agents (the last `agent` frame of each) and where
/// its text went (`went`, when it went somewhere).
fn connect_frames(pages: &Pages, id: &str) -> String {
    if id.is_empty() {
        return String::new();
    }
    let mut out = String::new();
    for f in pages.store.agent_frames(id).values() {
        out.push_str(&format!("event: agent\ndata: {f}\n\n"));
    }
    if let Some(m) = pages.store.meta(id) {
        if !m.went.is_empty() {
            out.push_str(&format!("event: went\ndata: {}\n\n", json!({"went": m.went})));
        }
        if let Some(w) = &m.watch {
            out.push_str(&format!("event: watch\ndata: {w}\n\n"));
        }
        if let Some(t) = &m.taste {
            out.push_str(&format!("event: taste\ndata: {t}\n\n"));
        }
    }
    out
}

/// An SSE stream: the page's version and state now, then every event of
/// it, a ping comment every 15 s; ends when the browser goes.
fn events(w: &mut TcpStream, pages: &Pages, id: &str) {
    let head = format!(
        "HTTP/1.1 200 OK\r\nContent-Type: text/event-stream\r\nCache-Control: no-store\r\nContent-Security-Policy: {CSP}\r\nX-Content-Type-Options: nosniff\r\nConnection: keep-alive\r\n\r\n"
    );
    if w.write_all(head.as_bytes()).is_err() {
        return;
    }
    let (tx, rx) = mpsc::channel::<String>();
    let first = if id.is_empty() {
        format!("event: pages\ndata: {}\n\n", json!({"pages": pages.list_json()}))
    } else {
        match pages.store.meta(id) {
            Some(m) => format!("event: version\ndata: {}\n\nevent: state\ndata: {}\n\n", json!({"n": m.version()}), json!({"state": m.state})),
            None => String::new(),
        }
    };
    // the writer's last progress lines: a reload keeps the list
    let first = first + &pages.progress_frames(id) + &connect_frames(pages, id);
    pages.subscribe(id, tx);
    if w.write_all(first.as_bytes()).and_then(|_| w.flush()).is_err() {
        return;
    }
    loop {
        let frame = match rx.recv_timeout(PING) {
            Ok(f) => f,
            Err(mpsc::RecvTimeoutError::Timeout) => ": ping\n\n".to_string(),
            Err(mpsc::RecvTimeoutError::Disconnected) => return,
        };
        if w.write_all(frame.as_bytes()).and_then(|_| w.flush()).is_err() {
            return;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::pages::store::Publish;

    fn pages() -> (Pages, std::path::PathBuf) {
        static N: std::sync::atomic::AtomicUsize = std::sync::atomic::AtomicUsize::new(0);
        let d = std::env::temp_dir().join(format!("sb-srv-{}-{}", std::process::id(), N.fetch_add(1, std::sync::atomic::Ordering::SeqCst)));
        std::fs::create_dir_all(d.join("kit")).unwrap();
        std::fs::write(d.join("kit/kit.css"), "main{}").unwrap();
        (Pages::new(&d, 47123, d.join("kit")), d)
    }

    fn get(p: &Pages, path: &str) -> Response {
        let req = Request { method: "GET".into(), path: path.into(), headers: vec![("Host".into(), format!("127.0.0.1:{}", p.port))], body: vec![] };
        route(p, &req)
    }

    fn post(p: &Pages, path: &str, token: Option<&str>, origin: Option<&str>, body: Value) -> Response {
        let mut headers = vec![("Host".into(), format!("127.0.0.1:{}", p.port))];
        if let Some(t) = token {
            headers.push(("X-Bise-Token".into(), t.into()));
        }
        if let Some(o) = origin {
            headers.push(("Origin".into(), o.into()));
        }
        route(p, &Request { method: "POST".into(), path: path.into(), headers, body: body.to_string().into_bytes() })
    }

    fn text(r: &Response) -> String {
        String::from_utf8_lossy(&r.body).to_string()
    }

    const FRAG: &str = "<section data-kit=\"prose\" data-id=\"p1\"><p>hello</p></section>";

    #[test]
    fn parses_a_request() {
        let raw = b"POST /api/p/w/notes?x=1 HTTP/1.1\r\nHost: 127.0.0.1:47123\r\nContent-Length: 2\r\nX-Bise-Token: t\r\n\r\n{}";
        let r = read_request(&mut BufReader::new(&raw[..])).unwrap();
        assert_eq!((r.method.as_str(), r.path.as_str(), r.body.as_slice()), ("POST", "/api/p/w/notes", &b"{}"[..]));
        assert_eq!(r.header("x-bise-token"), Some("t"));
        assert!(read_request(&mut BufReader::new(&b""[..])).is_none());
    }

    #[test]
    fn a_page_opened_in_the_browser_counts_its_newest_version() {
        let (p, _d) = pages();
        let pb = Publish { agent: "t1".into(), id: Some("w".into()), html: FRAG.into(), ..Default::default() };
        p.publish(&pb, 1, &|_| false).unwrap();
        p.publish(&pb, 2, &|_| false).unwrap();
        let opened = |p: &Pages| p.list_json()[0]["opened_version"].as_u64();
        assert_eq!(opened(&p), Some(0));
        // the body alone (the frame's diff) and the API never count
        get(&p, "/p/w/v/2/body");
        get(&p, "/p/w/meta");
        assert_eq!(opened(&p), Some(0));
        get(&p, "/p/w/v/1");
        assert_eq!(opened(&p), Some(1));
        get(&p, "/p/w");
        assert_eq!(opened(&p), Some(2));
        // an older one opened after leaves it
        get(&p, "/p/w/v/1");
        assert_eq!(opened(&p), Some(2));
    }

    #[test]
    fn serves_the_page_in_its_shell_with_the_csp() {
        let (p, d) = pages();
        p.publish(&Publish { agent: "t1".into(), id: Some("w".into()), title: Some("weekly <update>".into()), html: FRAG.into(), ..Default::default() }, 1, &|_| false).unwrap();
        let r = get(&p, "/p/w");
        assert_eq!(r.status, 200);
        let t = text(&r);
        assert!(t.contains(&format!("<meta name=\"bise-token\" content=\"{}\">", p.token)));
        assert!(t.contains("<title>weekly &lt;update&gt;</title>"));
        assert!(t.contains("<main id=\"bise-page\" data-page=\"w\" data-version=\"1\" data-latest=\"1\" data-agent=\"t1\""));
        assert!(t.contains(FRAG) && t.contains("/kit/kit.js") && t.contains("/kit/notes.js") && t.contains("/kit/tokens.css"));
        let order: Vec<usize> = ["tokens.css", "kit.css", "notes.css", "kit.js", "pearl.js", "notes.js"].iter().map(|f| t.find(f).unwrap()).collect();
        assert!(order.windows(2).all(|w| w[0] < w[1]), "the shell's order: tokens, kit, notes css, then kit.js, pearl.js, notes.js");
        assert!(String::from_utf8_lossy(&r.bytes()).contains(&format!("Content-Security-Policy: {CSP}\r\n")));
        assert_eq!(text(&get(&p, "/p/w/v/1/body")), FRAG);
        assert_eq!(get(&p, "/p/w/v/2").status, 404);
        assert_eq!(get(&p, "/p/nope").status, 404);
        let meta: Value = serde_json::from_slice(&get(&p, "/p/w/meta").body).unwrap();
        assert_eq!((meta["id"].as_str(), meta["versions"][0]["n"].as_u64()), (Some("w"), Some(1)));
        assert!(meta["notes"].is_array());
        // for you
        let home = text(&get(&p, "/"));
        assert!(home.contains("<main id=\"bise-home\" data-home>") && home.contains("<a href=\"/p/w\">weekly &lt;update&gt;</a>"), "{home}");
        // the kit, nothing outside it
        assert_eq!(text(&get(&p, "/kit/kit.css")), "main{}");
        assert_eq!(get(&p, "/kit/../meta.json").status, 404);
        assert_eq!(get(&p, "/kit/.hidden.css").status, 404);
        // another Host: refused
        let r = route(&p, &Request { method: "GET".into(), path: "/".into(), headers: vec![("Host".into(), "evil.example:47123".into())], body: vec![] });
        assert_eq!(r.status, 403);
        let _ = std::fs::remove_dir_all(d);
    }

    #[test]
    fn the_api_needs_the_token_and_the_origin_then_send_tells_the_hub() {
        let (p, d) = pages();
        p.publish(&Publish { agent: "t1".into(), id: Some("w".into()), html: FRAG.into(), ..Default::default() }, 1, &|_| false).unwrap();
        let (tx, rx) = mpsc::channel();
        let tx = std::sync::Mutex::new(tx);
        p.connect_hub(Box::new(move |m| {
            let _ = tx.lock().unwrap().send(m);
        }));
        let origin = "http://127.0.0.1:47123";
        let note = json!({"notes": [{"block": "p1", "kind": "note", "text": "shorter"}]});
        let tok = p.token.clone();
        assert_eq!(post(&p, "/api/p/w/notes", None, Some(origin), note.clone()).status, 403);
        assert_eq!(post(&p, "/api/p/w/notes", Some("wrong"), Some(origin), note.clone()).status, 403);
        assert_eq!(post(&p, "/api/p/w/notes", Some(&tok), Some("http://evil.example"), note.clone()).status, 403);
        assert_eq!(post(&p, "/api/p/w/notes", Some(&tok), None, note.clone()).status, 403);
        let r = post(&p, "/api/p/w/notes", Some(&tok), Some(origin), note);
        assert_eq!(r.status, 200, "{}", text(&r));
        assert_eq!(rx.try_recv().unwrap(), PageMsg::Notes { id: "w".into() });
        let r = post(&p, "/api/p/w/send", Some(&tok), Some("http://localhost:47123"), json!({}));
        assert_eq!(r.status, 200);
        match rx.try_recv().unwrap() {
            PageMsg::Sent { id, agent, text } => {
                assert_eq!((id.as_str(), agent.as_str()), ("w", "t1"));
                assert!(text.starts_with("you sent 1 note on your page \"w\" (w v1, http://127.0.0.1:47123/p/w):\n1. on p1: shorter\n"), "{text}");
            }
            m => panic!("{m:?}"),
        }
        // nothing left: nothing told
        assert_eq!(text(&post(&p, "/api/p/w/send", Some(&tok), Some(origin), json!({}))), "{\"sent\":0}");
        assert!(rx.try_recv().is_err());
        assert_eq!(get(&p, "/api/p/w/send").status, 405);
        let _ = std::fs::remove_dir_all(d);
    }

    #[test]
    fn versions_list_what_changed() {
        let (p, d) = pages();
        let pb = |html: &str| Publish { agent: "t1".into(), id: Some("w".into()), html: html.into(), ..Default::default() };
        let two = "<section data-kit=\"prose\" data-id=\"p1\"><p>a</p></section><section data-kit=\"prose\" data-id=\"p2\"><p>b</p></section>";
        let two_b = "<section data-kit=\"prose\" data-id=\"p1\"><p>a</p></section><section data-kit=\"prose\" data-id=\"p2\"><p>b, changed</p></section>";
        p.publish(&pb(two), 1, &|_| false).unwrap();
        p.publish(&pb(two_b), 2, &|_| false).unwrap();
        let v: Value = serde_json::from_slice(&get(&p, "/p/w/versions").body).unwrap();
        assert_eq!(v["versions"][0], json!({"n": 2, "at_ms": 2, "url": "/p/w/v/2", "changed": ["p2"], "latest": true}));
        assert_eq!(v["versions"][1]["changed"], json!(["p1", "p2"]));
        let _ = std::fs::remove_dir_all(d);
    }

    #[test]
    fn an_answer_on_the_page_goes_to_the_hub() {
        let (p, d) = pages();
        let q = "<section data-kit=\"question\" data-id=\"q1\"><p>which one?</p><ol><li>Le Moulin</li><li>Les Pins</li></ol></section>";
        p.publish(&Publish { agent: "t1".into(), id: Some("w".into()), html: q.into(), ..Default::default() }, 1, &|_| false).unwrap();
        p.store.save_questions("w", &crate::pages::questions::of_fragment(q)).unwrap();
        let (tx, rx) = mpsc::channel();
        let tx = std::sync::Mutex::new(tx);
        p.connect_hub(Box::new(move |m| {
            let _ = tx.lock().unwrap().send(m);
        }));
        let (tok, o) = (p.token.clone(), "http://127.0.0.1:47123");
        assert_eq!(post(&p, "/api/p/w/answer", None, Some(o), json!({"block": "q1", "option": 2})).status, 403);
        assert_eq!(post(&p, "/api/p/w/answer", Some(&tok), Some(o), json!({"block": "q9", "option": 2})).status, 404);
        assert_eq!(post(&p, "/api/p/w/answer", Some(&tok), Some(o), json!({"block": "q1", "option": 5})).status, 400);
        assert_eq!(post(&p, "/api/p/w/answer", Some(&tok), Some(o), json!({"block": "q1", "option": 2})).status, 200);
        assert_eq!(rx.try_recv().unwrap(), PageMsg::Answer { id: "w".into(), block: "q1".into(), reply: "Les Pins".into() });
        assert_eq!(post(&p, "/api/p/w/answer", Some(&tok), Some(o), json!({"block": "q1", "text": "  neither  "})).status, 200);
        assert_eq!(rx.try_recv().unwrap(), PageMsg::Answer { id: "w".into(), block: "q1".into(), reply: "neither".into() });
        let _ = std::fs::remove_dir_all(d);
    }

    #[test]
    fn sse_subscribers_get_the_events_of_their_page() {
        let (p, d) = pages();
        let (tx, rx) = mpsc::channel();
        p.subscribe("w", tx);
        p.publish(&Publish { agent: "t1".into(), id: Some("w".into()), html: FRAG.into(), ..Default::default() }, 1, &|_| false).unwrap();
        let got: Vec<String> = rx.try_iter().collect();
        assert_eq!(got[0], "event: version\ndata: {\"n\":1}\n\n");
        assert!(got.iter().any(|f| f.starts_with("event: state\ndata: {\"state\":\"ready\"}")));
        p.set_state("w", "updating");
        assert_eq!(rx.try_iter().next().unwrap(), "event: state\ndata: {\"state\":\"updating\"}\n\n");
        let _ = std::fs::remove_dir_all(d);
    }
}
