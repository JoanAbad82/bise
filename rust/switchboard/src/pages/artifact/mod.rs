//! The page server's artifact routes beyond a copy's own file
//! (office-artifacts plan §8: one file per chunk, this dispatch made by
//! office-viewer). server.rs calls [`route`] once, before its `/a/<id>/<v>/<file>`
//! arm; what is not ours falls through to it.
//!
//! - `GET /a/<id>/view`, `GET /a/<id>/<v>/view`: bise's viewer of an xlsx,
//!   pptx or docx ([`view`]), the newest version or version `v`;
//! - `GET /kit/office/office.js`, `/kit/office/office-view.js`: the office
//!   SDK's bundles, read from `office/dist` in the app root (one copy, never
//!   in `kit/`, architect m_23781); the renderers beside them
//!   (`kit/office/*.js`) are kit files.

pub mod view;

use super::server::Response;
use super::store::valid_id;
use super::Pages;

/// The bundles the viewer loads, from `Pages::office_dir`.
const BUNDLES: &[&str] = &["office.js", "office-view.js"];

/// The response for `segs` (the path's segments), or None: not an
/// artifact route of this module.
pub fn route(pages: &Pages, segs: &[&str]) -> Option<Response> {
    Some(match segs {
        ["kit", "office", f] if BUNDLES.contains(f) => bundle(pages, f),
        ["a", id, "view"] if valid_id(id) => view::serve(pages, id, None),
        ["a", id, v, "view"] if valid_id(id) => match v.parse() {
            Ok(n) => view::serve(pages, id, Some(n)),
            Err(_) => Response::missing(&format!("no such version: a/{id}/{v}/view")),
        },
        _ => return None,
    })
}

fn bundle(pages: &Pages, f: &str) -> Response {
    match std::fs::read(pages.office_dir.join(f)) {
        Ok(body) => Response { status: 200, ctype: "text/javascript; charset=utf-8", body, csp: super::server::CSP },
        Err(_) => Response::missing(&format!("no such file: kit/office/{f} (office/dist in the app root)")),
    }
}

#[cfg(test)]
mod tests {
    use super::super::server::{route, Request};
    use super::*;
    use serde_json::json;

    fn get(p: &Pages, path: &str) -> Response {
        route(p, &Request { method: "GET".into(), path: path.into(), headers: vec![("Host".into(), format!("127.0.0.1:{}", p.port))], body: vec![] })
    }

    fn text(r: &Response) -> String {
        String::from_utf8_lossy(&r.body).to_string()
    }

    /// The repo's office fixtures (office/fixtures, made by office/fixtures/make.mjs).
    fn fixture(name: &str) -> Vec<u8> {
        std::fs::read(std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../office/fixtures").join(name)).unwrap()
    }

    /// office-artifacts plan §4: an xlsx, pptx or docx artifact's row is
    /// framed at `/a/<id>/view`, which serves the viewer's shell under its
    /// CSP, pointing at the copy's bytes, which are served too; an older
    /// version at `/a/<id>/<v>/view`; anything else there is a 404 in words.
    #[test]
    fn an_office_artifact_opens_in_the_viewer() {
        let d = std::env::temp_dir().join(format!("sb-office-view-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&d);
        let work = d.join("work");
        std::fs::create_dir_all(work.join("dist")).unwrap();
        std::fs::create_dir_all(d.join("office/dist")).unwrap();
        std::fs::write(d.join("office/dist/office.js"), "export const sheets = {};").unwrap();
        let p = Pages::new(&d, 47123, &d);
        let arts = crate::artifacts::Store::new(&d);
        let add = |file: &str, at: u64| {
            let a = crate::artifacts::Add { target: file.into(), title: None, kind: None, agent: "office-lead".into(), by: "office-lead".into(), cwd: work.to_string_lossy().to_string(), known_only: false };
            arts.add(&a, at).unwrap().meta
        };
        std::fs::write(work.join("q3.xlsx"), fixture("tiny.xlsx")).unwrap();
        let xlsx = add("q3.xlsx", 10);
        std::fs::write(work.join("q3.xlsx"), [fixture("tiny.xlsx"), b"more".to_vec()].concat()).unwrap();
        add("q3.xlsx", 20);
        std::fs::write(work.join("deck.pptx"), fixture("tiny.pptx")).unwrap();
        std::fs::write(work.join("memo.docx"), fixture("tiny.docx")).unwrap();
        std::fs::write(work.join("r.html"), "<h1>r</h1>").unwrap();
        for f in ["deck.pptx", "memo.docx", "r.html"] {
            add(f, 30);
        }

        let rows = arts.rows(&|a: &str| Some((a.to_string(), false)), work.to_str().unwrap());
        let base = format!("http://127.0.0.1:{}", p.port);
        let items = crate::proto_view::artifacts(&json!({"ev": "artifacts", "rows": rows, "seen_ms": 0}), |_| None, Some(&base));
        let frame = |id: &str| items.iter().find(|a| a.id == id).and_then(|a| a.frame_url.clone()).unwrap_or_default();
        assert_eq!(frame(&xlsx.id), format!("{base}/a/{}/view", xlsx.id), "the newest, with no version in it");
        for (name, kind) in [("deck", "pptx"), ("memo", "docx")] {
            let a = items.iter().find(|a| a.title.starts_with(name)).unwrap();
            let r = get(&p, frame(&a.id).strip_prefix(&base).unwrap());
            assert_eq!(r.status, 200);
            assert!(text(&r).contains(&format!("data-kind=\"{kind}\"")), "{}", text(&r));
        }
        let html = items.iter().find(|a| a.title.starts_with("r.html")).unwrap();
        assert!(frame(&html.id).ends_with("/r.html"), "any other file is framed as itself");

        let r = get(&p, &format!("/a/{}/view", xlsx.id));
        assert_eq!((r.status, r.csp), (200, view::VIEW_CSP));
        let shell = text(&r);
        assert!(shell.contains("data-version=\"2\" data-latest=\"2\" data-follows"), "{shell}");
        let file = format!("/a/{}/2/q3.xlsx", xlsx.id);
        assert!(shell.contains(&format!("data-file=\"{file}\"")), "{shell}");
        let bytes = get(&p, &file);
        assert_eq!((bytes.status, bytes.ctype), (200, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        assert!(bytes.body.starts_with(b"PK"), "the copy's bytes");

        let old = text(&get(&p, &format!("/a/{}/1/view", xlsx.id)));
        assert!(old.contains("data-version=\"1\" data-latest=\"2\"") && !old.contains("data-follows"), "{old}");
        assert!(old.contains(&format!("data-file=\"/a/{}/1/q3.xlsx\"", xlsx.id)));

        for (path, why) in [
            (format!("/a/{}/9/view", xlsx.id), "no such version"),
            (format!("/a/{}/x/view", xlsx.id), "no such version"),
            ("/a/nope/view".to_string(), "no such artifact"),
            (format!("/a/{}/view", html.id), "not an xlsx, pptx or docx"),
        ] {
            let r = get(&p, &path);
            assert_eq!((r.status, r.ctype), (404, "text/plain; charset=utf-8"), "{path}");
            assert!(text(&r).starts_with(why), "{path}: {}", text(&r));
        }

        let js = get(&p, "/kit/office/office.js");
        assert_eq!((js.status, js.ctype, text(&js).as_str()), (200, "text/javascript; charset=utf-8", "export const sheets = {};"), "from office/dist in the app root");
        let none = get(&p, "/kit/office/office-view.js");
        assert_eq!(none.status, 404, "a bundle not shipped says so");
        assert!(text(&none).contains("office/dist"));
        let _ = std::fs::remove_dir_all(d);
    }
}
