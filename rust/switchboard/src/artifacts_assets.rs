//! The files an .html artifact links (docs/artifacts.md, "an html file's
//! assets"): its images, styles, scripts and fonts beside it, so its copy
//! (`<id>/v<n>/<name>.html`) opens whole and not with every image broken.
//!
//! - [`refs_html`], [`refs_css`]: the relative references of a text
//!   (`src`, `href`, `poster`, `srcset`, `url(…)`, a css `@import`); pure.
//! - [`resolve`]: one reference, from the folder of the file that names
//!   it, as a path under the html's folder; pure.
//! - [`gather`]: the files an html file links, read from disk: the html's
//!   own references, then the references of each .css file it links
//!   (theirs too). Only files at or below the html's folder are kept; a
//!   missing one, or one outside it, is named in `unkept`.
//!
//! The store (artifacts.rs) copies `files` to `v<n>/<rel>` beside the
//! html's copy; the page server serves them from the version's path.

use std::collections::{BTreeSet, VecDeque};
use std::path::Path;

/// What an html file links that bise keeps, and what it does not.
#[derive(Clone, Debug, Default, PartialEq)]
pub struct Assets {
    /// Paths relative to the html's folder (`img/a.png`), sorted.
    pub files: Vec<String>,
    /// Each reference not kept, in words: `img/b.png (missing)`,
    /// `../logo.png (outside its folder)`.
    pub unkept: Vec<String>,
    /// It runs a script of its own (a kept .js, or `fetch(`/`import(` in
    /// the html): what a script loads at run time is not seen (architect
    /// m_25093), so the add says so.
    pub scripts: bool,
}

/// One reference, resolved.
#[derive(Debug, PartialEq)]
pub enum Resolved {
    /// A path under the html's folder.
    Under(String),
    /// A relative path that leaves the html's folder.
    Outside,
    /// Not a local file: a link, a `data:` url, an absolute path, a
    /// fragment, a template.
    Skip,
}

/// Whether a path is an html file (by its extension).
pub fn is_html(p: &Path) -> bool {
    p.is_file() && p.extension().and_then(|e| e.to_str()).is_some_and(|e| e.eq_ignore_ascii_case("html") || e.eq_ignore_ascii_case("htm"))
}

fn is_css(rel: &str) -> bool {
    rel.rsplit('.').next().is_some_and(|e| e.eq_ignore_ascii_case("css"))
}

/// The relative references of an html text: the values of its `src`,
/// `href`, `poster` and `srcset` attributes, and its inline `url(…)`s.
pub fn refs_html(text: &str) -> Vec<String> {
    let lower = text.to_ascii_lowercase();
    let b = lower.as_bytes();
    let mut out = Vec::new();
    for name in ["src", "href", "poster", "srcset"] {
        let mut from = 0;
        while let Some(i) = lower[from..].find(name).map(|i| i + from) {
            from = i + name.len();
            // a whole attribute name: after a space (or `xlink:`), before `=`
            let before = i.checked_sub(1).map(|j| b[j]);
            if !matches!(before, Some(b' ' | b'\t' | b'\n' | b'\r' | b':')) {
                continue;
            }
            let mut j = from;
            while j < b.len() && b[j].is_ascii_whitespace() {
                j += 1;
            }
            if j >= b.len() || b[j] != b'=' {
                continue;
            }
            j += 1;
            while j < b.len() && b[j].is_ascii_whitespace() {
                j += 1;
            }
            let Some(value) = attr_value(text, j) else { continue };
            if name == "srcset" {
                out.extend(value.split(',').filter_map(|c| c.split_whitespace().next()).map(String::from));
            } else {
                out.push(value.to_string());
            }
        }
    }
    out.extend(urls(text));
    out
}

/// A quoted or bare attribute value starting at byte `at`.
fn attr_value(text: &str, at: usize) -> Option<&str> {
    let rest = text.get(at..)?;
    match rest.as_bytes().first()? {
        q @ (b'"' | b'\'') => {
            let end = rest[1..].find(*q as char)?;
            Some(&rest[1..1 + end])
        }
        _ => {
            let end = rest.find(|c: char| c.is_ascii_whitespace() || c == '>').unwrap_or(rest.len());
            Some(&rest[..end])
        }
    }
}

/// Every `url(…)` of a text (css, or an html's style), unquoted.
fn urls(text: &str) -> Vec<String> {
    let lower = text.to_ascii_lowercase();
    let mut out = Vec::new();
    let mut from = 0;
    while let Some(i) = lower[from..].find("url(").map(|i| i + from) {
        let start = i + 4;
        let Some(end) = text[start..].find(')').map(|e| e + start) else { break };
        out.push(text[start..end].trim().trim_matches(|c| c == '"' || c == '\'').to_string());
        from = end;
    }
    out
}

/// The relative references of a css text: its `url(…)`s and its quoted
/// `@import`s.
pub fn refs_css(text: &str) -> Vec<String> {
    let mut out = urls(text);
    let lower = text.to_ascii_lowercase();
    let mut from = 0;
    while let Some(i) = lower[from..].find("@import").map(|i| i + from) {
        from = i + 7;
        let rest = text[from..].trim_start();
        if let Some(v) = attr_value(rest, 0).filter(|_| rest.starts_with(['"', '\''])) {
            out.push(v.to_string());
        }
    }
    out
}

/// One reference, named by a file in folder `dir` (relative to the
/// html's folder, `""` for the html's own), as a path under the html's
/// folder. Its query and fragment are dropped, `%xx` decoded.
pub fn resolve(dir: &str, r: &str) -> Resolved {
    let r = r.trim().replace("&amp;", "&");
    let r = r.split(['?', '#']).next().unwrap_or("");
    let head = r.split('/').next().unwrap_or("");
    if r.is_empty() || r.starts_with('/') || r.starts_with('\\') || head.contains(':') || r.contains("{{") || r.contains("${") || r.contains('<') {
        return Resolved::Skip;
    }
    let mut parts: Vec<String> = dir.split('/').filter(|s| !s.is_empty()).map(String::from).collect();
    for seg in decode(r).split('/') {
        match seg {
            "" | "." => {}
            ".." => {
                if parts.pop().is_none() {
                    return Resolved::Outside;
                }
            }
            s => parts.push(s.to_string()),
        }
    }
    if parts.is_empty() || r.ends_with('/') {
        return Resolved::Skip;
    }
    Resolved::Under(parts.join("/"))
}

/// `%xx` decoded (a name with a space, `a%20b.png`); bytes that are not
/// UTF-8 after it: the text as it was.
pub fn decode(s: &str) -> String {
    let b = s.as_bytes();
    let mut out = Vec::with_capacity(b.len());
    let mut i = 0;
    while i < b.len() {
        let hex = |c: u8| (c as char).to_digit(16);
        if b[i] == b'%' && i + 2 < b.len() {
            if let (Some(h), Some(l)) = (hex(b[i + 1]), hex(b[i + 2])) {
                out.push((h * 16 + l) as u8);
                i += 3;
                continue;
            }
        }
        out.push(b[i]);
        i += 1;
    }
    String::from_utf8(out).unwrap_or_else(|_| s.to_string())
}

/// The files the html file at `html` links (at most `max` of them), read
/// from disk: its references, then those of each .css file among them.
pub fn gather(html: &Path, max: usize) -> Assets {
    let Some(root) = html.parent() else { return Assets::default() };
    let own = html.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default();
    let mut files = BTreeSet::new();
    let mut unkept = BTreeSet::new();
    let text = std::fs::read(html).map(|b| String::from_utf8_lossy(&b).to_string()).unwrap_or_default();
    let mut queue: VecDeque<(String, Vec<String>)> = VecDeque::from([(String::new(), refs_html(&text))]);
    while let Some((dir, refs)) = queue.pop_front() {
        for r in refs {
            match resolve(&dir, &r) {
                Resolved::Skip => {}
                Resolved::Outside => {
                    unkept.insert(format!("{} (outside its folder)", r.trim()));
                }
                Resolved::Under(rel) if rel == own || files.contains(&rel) => {}
                Resolved::Under(rel) => {
                    let p = root.join(&rel);
                    if p.is_dir() {
                        continue;
                    }
                    // a link that leaves the folder (a symlink) is outside it too
                    match p.canonicalize() {
                        Ok(c) if c.is_file() && root.canonicalize().is_ok_and(|r| c.starts_with(r)) => {}
                        Ok(_) => {
                            unkept.insert(format!("{} (outside its folder)", rel));
                            continue;
                        }
                        Err(_) => {
                            unkept.insert(format!("{} (missing)", rel));
                            continue;
                        }
                    }
                    if files.len() >= max {
                        continue;
                    }
                    if is_css(&rel) {
                        let css = std::fs::read(&p).map(|b| String::from_utf8_lossy(&b).to_string()).unwrap_or_default();
                        let d = rel.rsplit_once('/').map_or(String::new(), |(d, _)| d.to_string());
                        queue.push_back((d, refs_css(&css)));
                    }
                    files.insert(rel);
                }
            }
        }
    }
    let lower = text.to_ascii_lowercase();
    let scripts = files.iter().any(|f| f.ends_with(".js") || f.ends_with(".mjs")) || lower.contains("fetch(") || lower.contains("import(");
    Assets { files: files.into_iter().collect(), unkept: unkept.into_iter().collect(), scripts }
}

/// The add's line about what it links and did not keep (one line, five
/// named at most): `▲ 2 files it links are not kept: img/b.png (missing),
/// ../logo.png (outside its folder)`.
pub fn unkept_line(unkept: &[String]) -> Option<String> {
    if unkept.is_empty() {
        return None;
    }
    let n = unkept.len();
    let what = if n == 1 { "1 file it links is not kept".to_string() } else { format!("{n} files it links are not kept") };
    let mut named = unkept.iter().take(5).cloned().collect::<Vec<_>>().join(", ");
    if n > 5 {
        named.push_str(&format!(" and {} more", n - 5));
    }
    Some(format!("▲ {what}: {named}"))
}

/// The add's line when the html runs scripts of its own.
pub const SCRIPTS_LINE: &str = "▲ files its scripts load at run time are not seen: check it opens whole";

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn an_html_names_its_files_by_src_href_poster_srcset_and_url() {
        let html = r#"<link rel="stylesheet" href="css/site.css"><img src='a.png' alt=x>
<IMG SRC=b.png><video poster="v/p.jpg"></video><img srcset="s1.png 480w, s2.png 2x">
<div style="background: url( 'bg.png' )"></div><a href="https://x.dev">x</a><img data-src="no.png">"#;
        assert_eq!(refs_html(html), ["a.png", "b.png", "css/site.css", "https://x.dev", "v/p.jpg", "s1.png", "s2.png", "bg.png"]);
        assert_eq!(refs_css(r#"@import "base.css"; @import url(more.css); .a{background:url("../img/c.png")}"#), ["more.css", "../img/c.png", "base.css"]);
    }

    #[test]
    fn a_reference_resolves_under_the_folder_or_is_outside_or_skipped() {
        use Resolved::*;
        assert_eq!(resolve("", "./img/a.png?v=2#x"), Under("img/a.png".into()));
        assert_eq!(resolve("css", "../img/a%20b.png"), Under("img/a b.png".into()));
        assert_eq!(resolve("", "../logo.png"), Outside);
        assert_eq!(resolve("css", "../../logo.png"), Outside);
        for skip in ["https://x.dev/a.png", "data:image/png;base64,AA", "/abs.png", "//cdn/x.js", "#top", "mailto:a@b", "{{ src }}", "", "sub/"] {
            assert_eq!(resolve("", skip), Skip, "{skip}");
        }
    }

    #[test]
    fn gather_follows_css_and_names_what_it_cannot_keep() {
        let d = std::env::temp_dir().join(format!("sb-art-assets-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&d);
        let site = d.join("site");
        std::fs::create_dir_all(site.join("css")).unwrap();
        std::fs::create_dir_all(site.join("img")).unwrap();
        std::fs::write(d.join("logo.png"), b"L").unwrap();
        std::fs::write(site.join("img/a.png"), b"A").unwrap();
        std::fs::write(site.join("img/bg.png"), b"B").unwrap();
        std::fs::write(site.join("css/site.css"), ".x{background:url(../img/bg.png)} @import 'more.css';").unwrap();
        std::fs::write(site.join("css/more.css"), ".y{background:url(../img/a.png)}").unwrap();
        std::fs::write(
            site.join("index.html"),
            r#"<link href="css/site.css" rel=stylesheet><img src="img/a.png"><img src="img/gone.png"><img src="../logo.png"><a href="index.html#top">top</a><a href="https://bise.dev">b</a>"#,
        )
        .unwrap();
        let a = gather(&site.join("index.html"), 100);
        assert_eq!(a.files, ["css/more.css", "css/site.css", "img/a.png", "img/bg.png"]);
        assert_eq!(a.unkept, ["../logo.png (outside its folder)", "img/gone.png (missing)"]);
        assert_eq!(unkept_line(&a.unkept).unwrap(), "▲ 2 files it links are not kept: ../logo.png (outside its folder), img/gone.png (missing)");
        assert!(!a.scripts, "no script of its own");
        assert_eq!(gather(&site.join("index.html"), 1).files.len(), 1, "never more than the cap");
        std::fs::write(site.join("app.js"), "fetch('data.json')").unwrap();
        std::fs::write(site.join("index.html"), r#"<script src="app.js"></script>"#).unwrap();
        let js = gather(&site.join("index.html"), 100);
        assert!(js.scripts && js.files == ["app.js"], "{js:?}");
        let _ = std::fs::remove_dir_all(d);
    }
}
